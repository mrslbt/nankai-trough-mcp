import { jshisProbabilities, pct } from "../dist/data/jshis.js";
import { geocode } from "../dist/lib/geocode.js";
import { stockpile } from "../dist/data/prepare.js";

let fails = 0;
const check = (label, cond) => { console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}`); if (!cond) fails++; };

for (const addr of ["東京都港区赤坂9-7-1", "高知市本町5"]) {
  const t0 = Date.now();
  const g = await geocode(addr);
  const j = await jshisProbabilities(g.lat, g.lon);
  const ms = Date.now() - t0;
  console.log(`\n${addr} -> ${g.normalized}`);
  console.log(`  mesh ${j.meshcode} ${j.version} cases=${j.cases_returned.join("+")} ${ms}ms`);
  for (const b of j.bands) {
    console.log(`   ${`JMA ${b.en_label}+`.padEnd(18)} ${b.ja_label.padEnd(6)} max ${String(pct(b.probability_30yr_max)).padStart(7)}  avg ${String(pct(b.probability_30yr_avg)).padStart(7)}`);
  }
  check("4 bands returned", j.bands.length === 4);
  check("every band has a readable English label", j.bands.every((x) => x.en_label && !/[぀-ヿ一-龯]/.test(x.en_label)));
  check("severe band first (6強)", j.bands[0].shindo === "6+");
  check("probabilities ascend as severity drops", (j.bands[0].probability_30yr_max ?? 0) <= (j.bands[3].probability_30yr_max ?? 1));
  check("MAX >= AVR on every band", j.bands.every((b) => (b.probability_30yr_max ?? 0) >= (b.probability_30yr_avg ?? 0)));
  check("meshcode present", Boolean(j.meshcode));
  check("under 3s", ms < 3000);
}

// English input must work: the people who cannot read the official PDFs are the
// same people who cannot type kanji.
console.log("\nEnglish / postal-code input");
for (const q of [
  "232-0063 Kanagawa Yokohama-shi Minami-ku Nakazato 3-11-13 Leo Palace T & H 102",
  "232-0063",
  "\u3012232-0063",
]) {
  const g = await geocode(q);
  console.log(`  ${g.resolved_via === "postal_code" ? "PASS" : "FAIL"}  ${q.slice(0, 46)} -> ${g.normalized}`);
  check(`resolves: ${q.slice(0, 24)}`, Boolean(g.lat) && g.resolved_via === "postal_code");
}

const s = stockpile({ adults: 2, children: 1 });
console.log(`\nstockpile 2+1: ${s.water_litres}L water, ${s.meals} meals, ${s.days} days`);
check("sized to 7 days not 3", s.days === 7);
check("3 people x 3L x 7d = 63L", s.water_litres === 63);

console.log(fails === 0 ? "\nALL ACCEPTANCE CHECKS PASSED" : `\n${fails} CHECK(S) FAILED`);
process.exit(fails === 0 ? 0 : 1);
