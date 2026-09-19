#!/usr/bin/env python3
"""Reproduce the national married-spouse summary from the official 2021 PUMF.

Python standard library only. Raw records never enter the public output.
See docs/METHODOLOGY.md before changing the universe or thresholds.
"""
import argparse
import csv
import hashlib
import io
import json
import math
import urllib.request
import zipfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

URL = 'https://www150.statcan.gc.ca/n1/pub/98m0001x/2023001/cen21_hier_98M0001X_rec21_hier.zip'
CATALOGUE = 'https://www150.statcan.gc.ca/n1/en/catalogue/98M0001X2021002'
NAMES = [
    ('Legislative & senior management', 'Legislative and senior management occupations'),
    ('Business, finance & administration', 'Business, finance and administration occupations'),
    ('Natural & applied sciences', 'Natural and applied sciences and related occupations'),
    ('Health occupations', 'Health occupations'),
    ('Education, law & social services', 'Occupations in education, law and social, community and government services'),
    ('Art, culture, recreation & sport', 'Occupations in art, culture, recreation and sport'),
    ('Sales & service', 'Sales and service occupations'),
    ('Trades, transport & equipment', 'Trades, transport and equipment operators and related occupations'),
    ('Natural resources & agriculture', 'Natural resources, agriculture and related production occupations'),
    ('Manufacturing & utilities', 'Occupations in manufacturing and utilities'),
]
GENDERS = {'1': 'Women+', '2': 'Men+'}
MIN_CELL = 30  # App-specific reliability policy, NOT a StatCan disclosure rule.
MAX_CV = 1 / 3


def profile_id(person):
    if person['GENDER'] in GENDERS and person['NOC21'] in {str(i) for i in range(1, 11)}:
        return f"{person['GENDER']}:{person['NOC21']}"
    return None


def empty():
    return {'sample': 0, 'weights': [0.0] * 17}


def add(bucket, person):
    bucket['sample'] += 1
    for i, field in enumerate(['WEIGHT'] + [f'WT{j}' for j in range(1, 17)]):
        bucket['weights'][i] += float(person[field])


def merge(buckets):
    out = empty()
    for bucket in buckets:
        out['sample'] += bucket['sample']
        for i, value in enumerate(bucket['weights']):
            out['weights'][i] += value
    return out


def estimate(numerator, denominator):
    weights, totals = numerator['weights'], denominator['weights']
    p = weights[0] / totals[0] * 100
    replicates = [w / t * 100 if t else 0 for w, t in zip(weights[1:], totals[1:])]
    average = sum(replicates) / 16
    se = math.sqrt(sum((r - average) ** 2 for r in replicates) / 35)
    cv = se / p if p else math.inf
    return {'percent': p, 'lower': max(0, p - 2 * se), 'upper': min(100, p + 2 * se),
            'quality': 'caution' if cv > .165 else 'standard', 'cv': cv,
            'publishable': numerator['sample'] >= MIN_CELL and cv <= MAX_CV}


def public_estimate(result):
    return {k: round(v, 6) if isinstance(v, float) else v
            for k, v in result.items() if k not in ('cv', 'publishable')}


def prepare(archive, output, audit_path):
    families = defaultdict(list)
    all_selected = defaultdict(empty)
    genders, occupations = Counter(), Counter()
    households = set()
    row_count = 0
    weighted_population = married_weight = 0.0
    kept_fields = ['HH_ID', 'CF_ID', 'CF_RP', 'CFSTAT', 'GENDER', 'NOC21', 'MARSTH', 'WEIGHT'] + [f'WT{i}' for i in range(1, 17)]
    with zipfile.ZipFile(archive) as z:
        with z.open('data_donnees_2021_hier_v2.csv') as stream:
            for row in csv.DictReader(io.TextIOWrapper(stream, encoding='utf-8-sig')):
                row_count += 1
                weight = float(row['WEIGHT'])
                weighted_population += weight
                households.add(row['HH_ID'])
                genders[row['GENDER']] += weight
                occupations[row['NOC21']] += weight
                if row['MARSTH'] == '2':
                    married_weight += weight
                    selected = profile_id(row)
                    if selected:
                        add(all_selected[selected], row)
                if row['CFSTAT'] in ('1', '2'):
                    families[(row['HH_ID'], row['CF_ID'])].append({k: row[k] for k in kept_fields})

    # Independent benchmarks transcribed from the official user guide (rounded weighted totals).
    assert row_count == 361915 and len(households) == 149789
    assert abs(weighted_population - 36328477) < 1
    assert abs(married_weight - 13501250) < 1
    for code, expected in {'1': 18028879, '2': 17552030, '8': 747568}.items():
        assert abs(genders[code] - expected) < 1
    for code, expected in enumerate([204585,3036836,1380322,1269926,2100633,513346,4276129,2942274,419310,687697], 1):
        assert abs(occupations[str(code)] - expected) < 1

    cells = defaultdict(empty)
    linked = defaultdict(empty)
    diagnostics = Counter()
    for people in families.values():
        if len(people) != 2:
            diagnostics['incompleteCoupleFamilies'] += 1
            continue
        a, b = people
        assert sorted([a['CF_RP'], b['CF_RP']]) == ['1', '2']
        assert a['CFSTAT'] == b['CFSTAT']
        assert a['MARSTH'] == b['MARSTH']
        if a['MARSTH'] != '2':
            diagnostics['commonLawCouplesExcluded'] += 1
            continue
        diagnostics['linkedMarriedCouples'] += 1
        for person, spouse in [(a, b), (b, a)]:
            selected, target = profile_id(person), profile_id(spouse)
            if selected:
                add(linked[selected], person)
            if selected and target:
                add(cells[(selected, target)], person)

    profiles = [{'id': f'{gender}:{code}', 'gender': label, 'genderCode': gender,
                 'occupation': short, 'fullOccupation': full, 'noc': str(code - 1)}
                for gender, label in GENDERS.items()
                for code, (short, full) in enumerate(NAMES, 1)]
    selections = {}
    audit = {'sourceRows': row_count, 'sourceHouseholds': len(households),
             'weightedPopulation': weighted_population, 'weightedMarriedPopulation': married_weight,
             'benchmarksPassed': True, 'linkage': dict(diagnostics), 'profiles': {}}
    for profile in profiles:
        key = profile['id']
        buckets = {target: bucket for (selected, target), bucket in cells.items() if selected == key}
        denominator = merge(buckets.values())
        assert denominator['sample'] >= 100
        published, hidden = [], []
        for target, bucket in buckets.items():
            result = estimate(bucket, denominator)
            if result['publishable']:
                published.append({'target': target, **public_estimate(result)})
            else:
                hidden.append(bucket)
        published.sort(key=lambda r: (-r['percent'], r['target']))
        grouped = estimate(merge(hidden), denominator) if hidden else None
        # Pool uncertain cells without releasing their individual values or ranks.
        other = public_estimate(grouped) if grouped and grouped['publishable'] else None
        withheld = bool(hidden and not other)
        if not withheld:
            assert abs(sum(r['percent'] for r in published) + (other['percent'] if other else 0) - 100) < 0.0001
        selections[key] = {
            'rows': published, 'pooled': other, 'hasUnreportedRemainder': withheld,
            'includedPercent': round(denominator['weights'][0] / all_selected[key]['weights'][0] * 100, 6),
            'linkedPercent': round(linked[key]['weights'][0] / all_selected[key]['weights'][0] * 100, 6),
        }
        audit['profiles'][key] = {'includedSample': denominator['sample'],
                                  'includedWeightedPeople': denominator['weights'][0],
                                  'allSelectedWeightedPeople': all_selected[key]['weights'][0],
                                  'publishedCells': len(published), 'pooledCells': len(hidden),
                                  'pooledSample': sum(b['sample'] for b in hidden),
                                  'hasUnreportedRemainder': withheld}
    # Reciprocal counts agree because spouses share the same household weight here.
    for (a, b), bucket in cells.items():
        assert math.isclose(bucket['weights'][0], cells[(b, a)]['weights'][0], rel_tol=1e-10)
    metadata = {
        'status': 'real', 'year': 2021, 'geography': 'Canada', 'source': CATALOGUE,
        'download': URL, 'sourceVersion': 'Corrected November 8, 2024 (V2)',
        'archiveSha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
        'generatedAt': datetime.now(timezone.utc).isoformat(),
        'attribution': 'Adapted from Statistics Canada, 2021 Census of Population, Hierarchical Public Use Microdata File, 2021. This does not constitute an endorsement by Statistics Canada of this product.',
        'universe': 'Linked co-resident married spouses in private households, with available gender and an applicable, available occupation category for both spouses.',
        'reliabilityPolicy': 'Individual combinations require at least 30 sample people and a coefficient of variation no greater than one third. CV above 16.5% is flagged. These are app-specific display thresholds, not Statistics Canada disclosure rules.',
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({'metadata': metadata, 'profiles': profiles, 'selections': selections}, indent=2) + '\n')
    audit_path.parent.mkdir(parents=True, exist_ok=True)
    audit_path.write_text(json.dumps(audit, indent=2) + '\n')
    print(json.dumps({'output': str(output), 'bytes': output.stat().st_size, 'profiles': len(profiles),
                      'linkedMarriedCouples': diagnostics['linkedMarriedCouples'],
                      'benchmarksPassed': True, 'unreportedRemainders': sum(s['hasUnreportedRemainder'] for s in selections.values())}))


if __name__ == '__main__':
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', type=Path, default=root / '.data-local/census2021-hier.zip')
    parser.add_argument('--download', action='store_true', help='Download the official ZIP if missing')
    parser.add_argument('--output', type=Path, default=root / 'src/census-summary.json')
    parser.add_argument('--audit', type=Path, default=root / '.data-local/validation.json')
    args = parser.parse_args()
    if not args.archive.exists():
        if not args.download:
            parser.error('Archive missing. Pass --download or --archive PATH.')
        args.archive.parent.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(URL, timeout=120) as response:
            args.archive.write_bytes(response.read())
    prepare(args.archive, args.output, args.audit)
