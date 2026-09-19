# 2021 census spouse-occupation summary

## Source and scope

Statistics Canada, **2021 Census of Population: Hierarchical Public Use Microdata File**, catalogue 98M0001X2021002, corrected November 8, 2024 (V2).

- Catalogue: https://www150.statcan.gc.ca/n1/en/catalogue/98M0001X2021002
- Download: https://www150.statcan.gc.ca/n1/pub/98m0001x/2023001/cen21_hier_98M0001X_rec21_hier.zip
- Licence: https://www.statcan.gc.ca/en/terms-conditions/open-licence
- Documentation: `English/Documentation/2021 Census Hierarchical PUMF User Guide_V2.pdf` inside that ZIP.

The public-use sample contains 361,915 people in 149,789 private households. It is a roughly 1% sample, anonymized and altered to protect confidentiality. The website contains our derived estimates, not an official Statistics Canada table.

## Categories

`NOC21` contains only ten broad groups. File codes 1–10 map to NOC broad categories 0–9 respectively. Never treat file code 1 as NOC category 1. Codes 88 and 99 mean unavailable and not applicable. The occupation variable covers work since January 2020; it generally refers to the job during May 2–8, 2021, or the longest-held job since January 2020 if not working during that week. Do not describe every record as currently employed.

`GENDER` codes 1 and 2 are Woman+ and Man+. The interface uses plural Women+ and Men+. Each includes some non-binary people. Code 8 is unavailable. There is no separate non-binary category. Some same-gender couples have been perturbed; these data do not measure sexual orientation. See guide pp. 6, 13–14 and 67–68.

## Linking and inclusion

1. Select spouse/partner records using `CFSTAT` 1 or 2, and group by `(HH_ID, CF_ID)`. Do not match all adults sharing a household.
2. Require exactly two partner records, consistent `CFSTAT`, and reference-person flags `CF_RP` 1 and 2. Incomplete families are not matched. The guide notes that truncating households to seven records can leave incomplete families.
3. Require both partners' `MARSTH = 2` (married). Common-law partners are excluded.
4. Require valid gender and occupation for both partners. Missing/inapplicable codes are excluded from the study variables, per guide p. 106. In particular, a spouse who has not worked since January 2020 does not have a usable occupation here.
5. Emit two directed contributions per included couple, one per person, with that person's own `WEIGHT` and `WT1`–`WT16`. Couples whose profiles match contribute two people to that selection. Use person weights, not the product of spouse weights.

There are 65,678 linked married couples before excluding unusable occupations/genders. The source also contains 19,378 complete common-law couples and 117 incomplete partner groups. These sample counts describe processing, not population estimates.

For each source profile, the denominator is the weighted number of included people, not all married people, all workers, or all Canadians. Coverage is that denominator divided by the weighted total of all married people with that source profile in the original file, whether or not a usable spouse was found. This exposes omissions from linkage and spouse-variable availability. Results describe the included population; missingness can bias comparisons with all married people.

## Estimates and sampling uncertainty

For a source profile A and spouse profile B:

`share = sum(person WEIGHT for A with spouse B) / sum(person WEIGHT for all included A) × 100`

Compute this ratio separately for each of the sixteen replicate weights, then their mean. The guide's dependent-random-groups/Fay-adjusted approximation is:

`SE = sqrt(sum((replicate_share - mean_replicate_share)^2) / 35)`

The approximate 95% interval is `share ± 2 × SE`, clipped to 0–100. The coefficient of variation is `SE/share`. The denominator 35 is specific to this file's method; do not substitute a generic bootstrap factor. See guide pp. 109–111. Intervals describe sampling uncertainty only, not bias from anonymization, missing data, coverage or response errors. Point ranks do not imply statistically significant differences.

## Website reliability policy

This is an explicit application policy, **not a Statistics Canada disclosure threshold**:

- Individual combinations need at least 30 contributing sample people and CV ≤ 1/3.
- CV > 0.165 receives a caution label.
- Failed cells are pooled into one mixed-category residual if the pooled estimate passes the same checks.
- Otherwise the residual is omitted, and the interface explains that the displayed total is below 100%. It is not shown as zero.
- The denominator always includes all eligible contributions, including unpublished combinations. The public output contains no hidden cells' individual counts, values or ranks.
- The graph groups reportable rows beyond the first six together with any publishable residual. This graph remainder has no separate interval displayed. The full list shows intervals for individually published estimates and the pooled residual.

Unweighted counts are used only internally to assess reliability. No unweighted population estimate or raw record identifier is sent to the website. This is not a disclosure-control mechanism for confidential data; the source is already a public-use file.

## Validation and reproducibility

Run `python3 scripts/prepare_census.py --download`, or pass `--archive /path/to/census2021-hier.zip`.

The script uses only Python's standard library, records the archive SHA-256 in `src/census-summary.json`, and writes processing diagnostics to the ignored `.data-local/validation.json`. The current official V2 archive is required; a changed source must be reviewed before changing benchmark assertions.

Checks compare the source with the guide's weighted totals (to within one person due to published rounding):

- Total: 36,328,477.
- Married: 13,501,250.
- Gender: 18,028,879 Women+, 17,552,030 Men+, 747,568 unavailable.
- All ten occupational categories, plus source row/household counts.

The script also checks spouse roles, marital-status agreement, reciprocal point-weight totals, source-profile sample adequacy and percentage closure where the residual is reportable. Percentages are computed from person weights without demographic assumptions or corrections toward expected gender-pairing rates.

## Hosting

Only `dist/` should be uploaded to a static host. The build bundles the small summary with the application. It does not make runtime calls to Statistics Canada. Do not upload the project root or `.data-local/`. The archive and private processing report are ignored by Git.

Attribution on the site follows the licence's value-added-product notice. This does not imply endorsement or access to identifiable census responses. The 2021 census reference year and corrected release are distinct from the summary's generation timestamp.

## What this cannot answer

- Specific job-to-job relationships (such as teachers and engineers).
- Separate non-binary estimates or sexual-orientation statistics.
- Occupations when people married, causal effects, or future partner probabilities.
- Couples living apart, common-law relationships, or marriages outside the stated universe.

More detailed occupations require a suitable custom tabulation or approved access to more detailed data. Do not relabel broad groups as specific occupations.
