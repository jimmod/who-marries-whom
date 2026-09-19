# Request specification: detailed spouse occupation pairings

Status: prepared for review; not sent, ordered, or purchased.

## Objective

Obtain a publishable Canada-wide 2021 Census aggregate table for a website that lets a visitor choose their gender, broad occupation group, and then a detailed occupation, and see the distribution of their spouse's detailed occupation and gender.

The existing public Hierarchical PUMF contains only the ten NOC broad groups. Neither a list of NOC job titles nor the individual-level distribution of occupations can recover the joint distribution between spouses. Do not allocate broad-group percentages to jobs using assumptions.

## Proposed table

- Reference: 2021 Census of Population; Canada total initially.
- Unit: people in married couples whose spouses live in the same private household.
- Rows: selected person's NOC 2021 occupation and gender.
- Columns: spouse's NOC 2021 occupation and gender.
- Desired occupation detail: 5-digit unit groups for both partners, with codes and official titles.
- Fallback: the finest common detail that can be reliably released (for example 3- or 4-digit groups), with an explanation of any exceptions.
- Relationship: legally married, with common-law couples excluded or supplied as a distinct dimension if practical.
- Coverage: all available gender categories at a releasable level; preserve and explain any Women+/Men+ aggregation. Do not infer sexual orientation.
- Occupation universe: explicitly identify whether occupation refers to work during the reference week, recent work since January 2020, or a currently employed population. Prefer comparability with the current site's recent-work definition, and ask for alternatives if necessary.
- Missing/inapplicable spouse occupation: distinguish unavailable information from no applicable occupation. Include totals needed to display coverage and document the denominator. Ask for a complete-case distribution plus coverage totals if that is the recommended approach.
- Statistics: weighted person counts sufficient to calculate conditional percentages, with official quality flags, suppression/rounding guidance, and any available uncertainty information.
- Format: machine-readable CSV plus metadata, code lists and a data dictionary.

Please represent couples consistently so either person can be the selected person. In a directed person-based table, two spouses with the same occupation/gender profile contribute two people. Alternatively, supply an unordered couple table with explicit instructions for producing person-based conditional distributions.

## Questions for Statistics Canada

1. Does an existing standard or previously produced custom table already meet this need?
2. What detail is feasible for both spouses' occupations, crossed with both genders, at Canada level?
3. Would starting with a limited occupation shortlist materially improve reliability, cost or turnaround?
4. Which population definition and denominator do you recommend?
5. Which cells will be suppressed or rounded, and which totals may be displayed without defeating those controls?
6. Can the derived percentages be published on a public website under the Open Licence? Please supply the required attribution and any product-specific conditions.
7. What are the estimated cost and delivery time? This inquiry does not authorize paid work.

## Proposed website behavior when data arrives

1. Gender → broad occupation group → detailed occupation.
2. The second occupation selector lists only categories with actual spouse-pairing data.
3. Each selection recomputes the distribution from the released counts at that level. Broad group values must not be passed off as detailed job estimates.
4. Unavailable or suppressed detail is explicitly marked; it must not fall back silently to the parent group's percentages.
5. When both broad and detailed datasets are available, record their universes and source provenance separately. Do not mix incompatible denominators or different NOC editions.

Reference: Statistics Canada's [2021 Census guide, custom services](https://www12.statcan.gc.ca/census-recensement/2021/ref/98-304/98-304-x2021001-eng.pdf), which describes custom tabulations for requirements not met by standard products.
