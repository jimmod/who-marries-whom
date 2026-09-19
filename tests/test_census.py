import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('prepare', ROOT / 'scripts/prepare_census.py')
prepare = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prepare)


class CensusTests(unittest.TestCase):
    def test_variance_matches_official_guide_example(self):
        # Guide pp. 110–111: a total of 18,409 with standard error about 1,763.
        # Use the exact published example values, not a fabricated binomial SE.
        replicates = [22443,16911,18755,16296,15681,12608,18140,20599,
                      17525,18140,19369,16911,19369,24286,18755,18755]
        result = prepare.estimate({'sample': 183, 'weights': [18409, *replicates]},
                                  {'sample': 1000, 'weights': [100000] * 17})
        self.assertAlmostEqual(result['percent'], 18.409)
        self.assertEqual(round((result['upper'] - result['lower']) / 4 * 1000), 1763)

    def test_small_cells_are_not_individually_publishable(self):
        small = {'sample': 29, 'weights': [2900] * 17}
        total = {'sample': 100, 'weights': [10000] * 17}
        self.assertFalse(prepare.estimate(small, total)['publishable'])
        pooled = prepare.merge([small, small])
        self.assertTrue(prepare.estimate(pooled, total)['publishable'])

    def test_file_codes_are_not_noc_codes(self):
        self.assertEqual(prepare.profile_id({'GENDER': '1', 'NOC21': '1'}), '1:1')
        self.assertIsNone(prepare.profile_id({'GENDER': '8', 'NOC21': '1'}))
        self.assertIsNone(prepare.profile_id({'GENDER': '1', 'NOC21': '99'}))
        data = json.loads((ROOT / 'src/census-summary.json').read_text())
        self.assertEqual(next(p for p in data['profiles'] if p['id'] == '1:1')['noc'], '0')

    def test_public_summary_contains_no_raw_records(self):
        data = json.loads((ROOT / 'src/census-summary.json').read_text())
        forbidden = {'HH_ID', 'CF_ID', 'PP_ID', 'WEIGHT', 'sample', 'weights', 'pairs'}
        def check(value):
            if isinstance(value, dict):
                self.assertFalse(forbidden.intersection(value))
                for child in value.values(): check(child)
            elif isinstance(value, list):
                for child in value: check(child)
        check(data)
        self.assertEqual(data['metadata']['status'], 'real')
        self.assertEqual(len(data['metadata']['archiveSha256']), 64)


if __name__ == '__main__':
    unittest.main()
