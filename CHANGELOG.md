# Changelog

## 0.2.0

Attitude, stated: **assume the worst.** The refusal is one-directional. The tools may
alarm with official numbers; they may never reassure.

### Added
- `location_probability`: reports the official J-SHIS (地震本部, Y2024) 30-year
  probability of reaching each JMA intensity at an address's ~250m mesh. Queries both
  the MAX and AVR cases and leads with MAX. Labelled all-source probabilistic, never
  the Nankai scenario. Every response carries a floor-not-ceiling note.
- `preparedness_plan`: household details to a sourced plan. Stockpile sized to the
  Cabinet Office one-week guidance rather than the lighter three-day figure. Folds in
  seismic-era classification when a build year is given, and assumes coastal exposure
  when it is unconfirmed.

- Postal-code addressing. The GSI geocoder only reads Japanese, which shut out exactly
  the people this server exists for. Any tool taking an address now accepts a 7-digit
  postal code (232-0063, 2320063, or with the 〒 mark), resolves it through Japan Post
  data, and reports the reduced precision instead of hiding it.

### Changed
- Server rule 3 reworded: the server does not compute its own per-address values, but
  it may report official published per-mesh values.
- Server rule 6 added: never turn a user away for not writing kanji.
- Server rule 7 added: assume the worst; lead with the severe case; a low probability
  is a floor, not a ceiling.

### Tests
- `test/verdict-guard.test.mjs` fails the build if verdict-shaped reassurance ever
  reaches `dist/`.
- `test/acceptance.mjs` runs live J-SHIS lookups against Akasaka and Kochi.

## 0.1.1
- Dropped em dashes, linked the live site, dated the promotion-region fact.
