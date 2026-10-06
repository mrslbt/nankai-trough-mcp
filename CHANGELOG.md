# Changelog

## 0.2.1

Correctness fixes in the building checks. The Kumamoto figures were re-checked
against MLIT's published breakdown (28.2% / 8.7% / 2.2%, split at June 1981 and
June 2000).

### Fixed
- Pre-1981 non-wood buildings (concrete, steel, other) were told that "28.2% of
  pre-1981 wooden houses collapsed". That statistic is wood-only. They now get their
  own `pre_1981_nonwood` classification, which states the government priority without
  borrowing the wooden-house rate.
- The English Kumamoto note said "Pre-2000 wooden houses fared best". It was
  backwards: houses built to the post-2000 standard fared best. The Japanese line was
  already correct.
- A wooden house from the year 2000 was given the newer 2000-standard label, but that
  standard applies from June 2000. Year 2000 is now a boundary year
  (`boundary_2000_wood`) that says to check the 建築確認 date and assume the earlier
  era until then, the same way 1981 is handled.
- City names containing 市 or 町 were cut short (四日市市 read as "四日市", 十日町市 as
  "十日町"). Display only; coordinates were not affected.
- The tail of a phone number (03-1234-5678) could be read as a postal code.

### Changed
- The post-2000 Kumamoto rate (2.2%) is now reported alongside the other two, framed
  as lower, not zero.
- The `assess_home_earthquake_risk` prompt now walks through `location_probability`
  and `preparedness_plan` as well.

### Tests
- Era boundaries for 1980/1981/1999/2000/2001 across wood and non-wood; a guard that
  no non-wood era ever quotes a wood-only rate; postal and municipality edge cases;
  the smoke test now expects all 8 tools and checks a 1975 concrete building.

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
