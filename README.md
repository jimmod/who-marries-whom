# Who married who? — Canada

Explore spouse occupation groups using **real weighted estimates from the 2021 Canadian Census Hierarchical Public Use Microdata File**. This version replaces the earlier synthetic demo.

## Documentation for agents and contributors

- [Agent instructions](AGENTS.md): entry point and rules to preserve.
- [Architecture and code guide](docs/ARCHITECTURE.md): components, data contracts, pipeline, testing, hosting, and extension guidance.
- [Statistical methodology](docs/METHODOLOGY.md): source, weighting, coverage, and uncertainty.
- [Detailed occupation data request](docs/DETAILED-OCCUPATION-REQUEST.md): requirements for a future detailed selector.

## Run locally

Requires Node.js 22.12+ (or a current supported release).

```sh
npm install
npm run dev
```

`npm test` checks the estimator against the official guide example, reliability rules, public-data fields, and all 20 selectable profiles.

`npm run build` checks TypeScript and creates `dist/`. `npm run preview` serves the built website.

## Stack and hosting

- React + TypeScript + Vite.
- SVG connection diagram and accessible native selectors.
- A bundled, roughly 35 KB JSON summary; no backend or live StatCan query needed.
- Python standard-library preparation script; no additional data-processing dependencies.

Deploy **only `dist/`** to your static host. Build command: `npm run build`. Output directory: `dist`. Raw census records and processing diagnostics are never included in the build. This task does not deploy the site.

## Important data limits

- Ten **broad occupation groups**, not individual job titles.
- **Women+ / Men+** are the available source categories; each includes some non-binary people.
- Married spouses living together, with usable occupation and gender for both spouses. Common-law couples and unusable spouse records are excluded. Each selection displays its coverage.
- Occupation generally refers to the census reference week or the longest-held job since January 2020. These are not occupations at marriage.
- Small or uncertain combinations are pooled or omitted, never presented as zero. The full list includes approximate 95% sampling ranges.
- Same-gender couple information is affected by privacy perturbation and cannot establish sexual orientation.

See [methodology](docs/METHODOLOGY.md) for inclusion rules, weighting, uncertainty calculations, source references and validation.

## Rebuild the census summary

Python 3, standard library only:

```sh
python3 scripts/prepare_census.py --download
# Or use a previously downloaded official ZIP:
python3 scripts/prepare_census.py --archive /path/to/census2021-hier.zip
npm run build
```

Default raw-data cache and processing report: `.data-local/` (ignored by Git). Public output: `src/census-summary.json`. The output records the download URL, correction version, SHA-256 and generation timestamp. The script validates official population and occupation benchmarks before writing output.

## Source

[Statistics Canada catalogue 98M0001X2021002](https://www150.statcan.gc.ca/n1/en/catalogue/98M0001X2021002), corrected V2 release of November 8, 2024.

Adapted from Statistics Canada, 2021 Census of Population, Hierarchical Public Use Microdata File, 2021. This does not constitute an endorsement by Statistics Canada of this product.

## Licences

Original project code is licensed under the [MIT License](LICENSE).

Contains information licensed under the [Statistics Canada Open Licence](https://www.statcan.gc.ca/en/terms-conditions/open-licence). Statistics Canada source information and the census-derived data in `src/census-summary.json` remain subject to those terms; the MIT licence for the code does not replace them. The required source and non-endorsement attribution appears above and on the website. Third-party dependencies retain their own licences.
