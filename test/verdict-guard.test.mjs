import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * The product rule: the tools may alarm with official numbers, they may never
 * reassure. This guards the shipped bundle against verdict-shaped language.
 */
function allDistFiles(dir = "dist", acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) allDistFiles(p, acc);
    else if (p.endsWith(".js")) acc.push(p);
  }
  return acc;
}

const FORBIDDEN = [
  /your home is safe/i,
  /you are safe/i,
  /is not at risk/i,
  /安全です/,
  /危険はありません/,
  /心配ありません/,
];

test("no verdict-shaped reassurance ships in the bundle", () => {
  for (const f of allDistFiles()) {
    const src = readFileSync(f, "utf8");
    for (const re of FORBIDDEN) {
      const m = src.match(re);
      assert.equal(m, null, `${f} contains forbidden reassurance: ${m?.[0]}`);
    }
  }
});

test("the assume-the-worst rule is in the server instructions", () => {
  const src = readFileSync("dist/index.js", "utf8");
  assert.match(src, /ASSUME THE WORST/);
  assert.match(src, /floor, not a ceiling/);
});

test("every new tool is registered", () => {
  const src = readFileSync("dist/index.js", "utf8");
  for (const t of ["location_probability", "preparedness_plan"]) {
    assert.match(src, new RegExp(`"${t}"`), `${t} not registered`);
  }
});

/**
 * English mode must be readable by someone who cannot read Japanese. Japanese is
 * allowed only when glossed in English (proper nouns, official terms) or when it is
 * the address itself.
 */
test("English labels exist for every intensity level", async () => {
  const { SHINDO } = await import("../dist/data/shindo.js");
  for (const [k, v] of Object.entries(SHINDO)) {
    assert.ok(v.en_label, `${k} has no en_label`);
    assert.equal(/[぀-ヿ一-龯]/.test(v.en_label), false, `${k} en_label is not readable: ${v.en_label}`);
  }
});

test("J-SHIS bands carry a readable English label", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync("dist/data/jshis.js", "utf8");
  assert.match(src, /en_label/);
  assert.equal(/at_least: `\$\{[^}]*label\}以上/.test(src), false, "at_least must not hardcode kanji");
});
