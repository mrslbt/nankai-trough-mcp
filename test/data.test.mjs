import test from "node:test";
import assert from "node:assert/strict";
import { classifyEra } from "../dist/data/building.js";
import { SHINDO } from "../dist/data/shindo.js";
import { NANKAI_FACTS } from "../dist/data/nankai.js";
import { parsePrefMuni } from "../dist/lib/geocode.js";
import { hazardMapLinks } from "../dist/lib/maps.js";
import { subsidyRoute } from "../dist/data/subsidy.js";

test("building era classification matches the 1981 / 2000 boundaries", () => {
  assert.equal(classifyEra(1975, "wood"), "pre_1981");
  assert.equal(classifyEra(1980, "wood"), "pre_1981");
  assert.equal(classifyEra(1981, "wood"), "boundary_1981");
  assert.equal(classifyEra(1990, "wood"), "1981_2000");
  assert.equal(classifyEra(2010, "wood"), "post_2000_wood");
  assert.equal(classifyEra(2010, "reinforced_concrete"), "post_1981_nonwood");
  assert.equal(classifyEra(1990, "steel"), "post_1981_nonwood");
});

test("JMA intensity scale covers 5弱..7", () => {
  for (const k of ["5-", "5+", "6-", "6+", "7"]) {
    assert.ok(SHINDO[k]?.en && SHINDO[k]?.ja, `missing description for ${k}`);
  }
});

test("every Nankai fact cites an official source URL", () => {
  assert.ok(NANKAI_FACTS.length >= 5);
  for (const f of NANKAI_FACTS) {
    assert.match(f.source.url, /^https:\/\/.+\.go\.jp/, `fact "${f.key}" must cite a .go.jp source`);
    assert.ok(f.asOf, `fact "${f.key}" must carry an as-of date`);
  }
});

test("the retired single '80%' probability never reappears as a current value", () => {
  const prob = NANKAI_FACTS.find((f) => f.key === "probability");
  assert.ok(prob, "probability fact must exist");
  assert.match(prob.value, /60[–-]90|20[–-]50/, "probability must carry the two-model range");
  assert.match(prob.asOf, /2025/, "probability must reflect the 2025 revision");
});

test("address parsing splits prefecture and municipality correctly", () => {
  assert.deepEqual(parsePrefMuni("高知県高知市本町"), { prefecture: "高知県", municipality: "高知市" });
  assert.deepEqual(parsePrefMuni("静岡県静岡市葵区追手町"), { prefecture: "静岡県", municipality: "静岡市" });
  assert.deepEqual(parsePrefMuni("東京都千代田区"), { prefecture: "東京都", municipality: "千代田区" });
  assert.equal(parsePrefMuni("和歌山県東牟婁郡那智勝浦町").prefecture, "和歌山県");
  assert.deepEqual(parsePrefMuni("not an address"), {});
});

test("hazard-map links are official gov URLs and carry the address coordinates", () => {
  const links = hazardMapLinks(33.56, 133.53);
  assert.match(links.national_overlay_map, /disaportal\.gsi\.go\.jp.*33\.56,133\.53/);
  for (const url of Object.values(links)) {
    assert.match(url, /^https:\/\/.+\.(go\.jp|bosai\.go\.jp)/, `hazard link must be official: ${url}`);
  }
});

test("subsidy routing never quotes an amount and tailors to a location", () => {
  const generic = subsidyRoute();
  const tokyo = subsidyRoute("高知市");
  assert.ok(generic.search_directory.startsWith("https://"), "must route to a directory URL");
  assert.match(tokyo.how_to_use_ja, /高知市/, "must use the given location in the hint");
  // Strip URLs first. Gov URLs legitimately contain digit runs; we only forbid yen figures.
  const all = JSON.stringify(subsidyRoute("静岡県")).replace(/https?:\/\/[^\s"]+/g, "");
  assert.doesNotMatch(all, /\d+\s*円|¥\s*\d|\d+\s*万/, "subsidy routing must never state a money amount");
});

test("every JMA intensity description covers both people and buildings, bilingually", () => {
  for (const [k, s] of Object.entries(SHINDO)) {
    assert.ok(s.ja_label?.startsWith("震度"), `${k} must carry a 震度 label`);
    assert.ok(s.en.length > 40 && s.ja.length > 20, `${k} descriptions must be substantive`);
    assert.match(s.en, /house|building|RC|wooden|wall/i, `${k} must describe building effects`);
  }
});
