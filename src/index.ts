#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { READONLY, READONLY_EXTERNAL } from "./meta.js";
import { SOURCES, DISCLAIMER, ATTRIBUTION } from "./data/sources.js";
import { NANKAI_FACTS, NANKAI_REACH_NOTE } from "./data/nankai.js";
import { classifyEra, ERA_INFO, KUMAMOTO_WOOD, type Structure } from "./data/building.js";
import { SHINDO, SHINDO_SOURCE, type Shindo } from "./data/shindo.js";
import { SUBSIDY_FRAMEWORK, subsidyRoute } from "./data/subsidy.js";
import { jshisProbabilities, pct, FLOOR_NOT_CEILING, PROBABILISTIC_NOT_SCENARIO, JSHIS_SOURCE, JSHIS_VERSION } from "./data/jshis.js";
import { stockpile, NOW_STEPS, WHEN_IT_SHAKES, COASTAL_UNKNOWN, PLAN_IS_NOT_A_VERDICT, STOCKPILE_SOURCE, QUANTITY_SOURCE, DAYS } from "./data/prepare.js";
import { geocode } from "./lib/geocode.js";
import { hazardMapLinks } from "./lib/maps.js";
import { RESOURCES } from "./resources.js";

type Lang = "en" | "ja" | "both";
const bi = (en: string, ja: string, lang: Lang) =>
  lang === "en" ? { en } : lang === "ja" ? { ja } : { en, ja };
const disc = (lang: Lang) => (lang === "en" ? { disclaimer: DISCLAIMER.en } : lang === "ja" ? { disclaimer: DISCLAIMER.ja } : { disclaimer_en: DISCLAIMER.en, disclaimer_ja: DISCLAIMER.ja });
const ok = (obj: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(obj, null, 2) }] });
const fail = (msg: string) => ({ isError: true as const, content: [{ type: "text" as const, text: msg }] });

const LANG = z
  .enum(["en", "ja", "both"])
  .default("both")
  .describe("Output language: 'en', 'ja', or 'both' (default).")
  .meta({ title: "Language" });

const server = new McpServer(
  { name: "nankai-trough-mcp", version: "0.2.1" },
  {
    instructions: `Nankai Trough (南海トラフ地震) earthquake hazard + building-safety engine. Surfaces ONLY official Japanese government data.

ABSOLUTE RULES when using these tools, state them to the user:
1. NEVER tell the user their area or home is "safe" or "unsafe." Report the official numbers + plain-language meaning, and route to official guidance. There is no verdict.
2. Always pass through the disclaimer the tools return, and cite the official source for every figure.
3. This server does NOT compute its own per-address values. It can REPORT official published per-mesh probabilities (location_probability, J-SHIS) and it bridges to the official maps for the Nankai scenario (official_hazard_maps).
4. Distinguish probabilistic data (J-SHIS, all-source) from the Nankai SCENARIO (Cabinet Office). Never present one as the other.
5. Building safety cannot be looked up. building_seismic_check uses the year/structure the USER provides.
6. Users who cannot write Japanese can give a 7-digit postal code instead of an address; the tools resolve it via Japan Post data and report the reduced precision. Never turn someone away for not writing kanji.
7. ASSUME THE WORST. Where official data offers several cases, lead with the severe one. A low probability is a floor, not a ceiling, and must never be relayed as reassurance.

Tool guide:
- nankai_overview: the scale and reach of the 2025 official estimate. Start here.
- official_hazard_maps: address → links to the official per-address hazard maps (the bridge for exact intensity/tsunami).
- building_seismic_check: user's build year + structure → seismic-standard classification. NOT a verdict.
- taishin_subsidy_guide: route to subsidised 耐震診断/補強 (the real action).
- shindo_meaning: what a JMA intensity (震度) level means.
- location_probability: address → OFFICIAL J-SHIS 30-year probabilities for that mesh (probabilistic, not the Nankai scenario).
- preparedness_plan: household details → sourced checklist of what to do now, and when it shakes.
- geocode_address: address → coordinates (utility, GSI).

All tools are read-only. ${ATTRIBUTION}`,
  }
);

// ── 1. nankai_overview ────────────────────────────────────────────────
server.registerTool(
  "nankai_overview",
  {
    title: "Nankai Trough Scale & Reach",
    description:
      "Get the headline facts of the official 2025 Nankai Trough estimate (probability, worst-case casualties/loss, intensity-7 reach, tsunami) with sources. Start here to understand the scale; then call official_hazard_maps for a specific address.",
    inputSchema: { language: LANG },
    annotations: READONLY,
  },
  async ({ language }) => {
    const facts = NANKAI_FACTS.map((f) => ({
      ...bi(f.en, f.ja, language),
      value: f.value,
      source: language === "ja" ? f.source.name_ja : f.source.name_en,
      source_url: f.source.url,
      as_of: f.asOf,
    }));
    return ok({
      facts,
      the_underestimated_reach: bi(NANKAI_REACH_NOTE.en, NANKAI_REACH_NOTE.ja, language),
      ...disc(language),
      note: "All figures are approximate and as reported by the official sources. Confirm at the source URLs. Not a per-address prediction.",
    });
  }
);

// ── 2. official_hazard_maps (the bridge for exact per-address values) ──
server.registerTool(
  "official_hazard_maps",
  {
    title: "Official Hazard Maps for an Address",
    description:
      "Geocode a Japanese address and return links to the OFFICIAL government hazard maps that hold the exact per-address values (predicted intensity, tsunami inundation, your municipal map). This server does not compute those itself; it bridges you to the authoritative source.",
    inputSchema: {
      address: z
        .string()
        .describe("Japanese address, or a 7-digit postal code if you cannot type Japanese. e.g. '静岡県静岡市葵区追手町9-6' or '232-0063'.")
        .meta({ title: "Address" }),
      language: LANG,
    },
    annotations: READONLY_EXTERNAL,
  },
  async ({ address, language }) => {
    try {
      const g = await geocode(address);
      return ok({
        location: { lat: g.lat, lon: g.lon, normalized: g.normalized, prefecture: g.prefecture, municipality: g.municipality, resolved_via: g.resolved_via, ...(g.postal_code ? { postal_code: g.postal_code } : {}) },
        exact_values_live_here: {
          ...bi(
            "Open these official maps for your address's exact predicted shaking and tsunami. This MCP intentionally does not invent those numbers.",
            "あなたの住所の正確な想定震度・津波は、以下の公式地図でご確認ください。本MCPはこれらの数値を独自に作り出しません。",
            language
          ),
          ...hazardMapLinks(g.lat, g.lon),
          national_overlay_map_how: language === "ja" ? "重ねるハザードマップ。「津波」レイヤーを有効にしてください。" : "Kasaneru Hazard Map. Enable the '津波' (tsunami) layer.",
        },
        ...disc(language),
        attribution: `${SOURCES.gsi.name_en} (geocoding) · ${SOURCES.disaportal.name_en} · ${SOURCES.jshis.name_en} · ${SOURCES.cabinetNankai.name_en}`,
      });
    } catch (err) {
      return fail(`Could not look up "${address}": ${err instanceof Error ? err.message : String(err)}. You can also open the national hazard portal directly: https://disaportal.gsi.go.jp/`);
    }
  }
);

// ── 3. building_seismic_check ─────────────────────────────────────────
server.registerTool(
  "building_seismic_check",
  {
    title: "Building Seismic-Standard Check",
    description:
      "Classify a building's seismic standard (旧耐震 / 新耐震 / 2000 wooden standard) from a build year and structure the USER provides, with risk context. This is NOT a safety verdict; direct the user to a professional 耐震診断 via taishin_subsidy_guide.",
    inputSchema: {
      build_year: z
        .number()
        .int()
        .min(1900)
        .max(2100)
        .describe("Year the building's 建築確認 (building confirmation) was issued, roughly its build year.")
        .meta({ title: "Build Year" }),
      structure: z
        .enum(["wood", "reinforced_concrete", "steel", "other"])
        .describe("Building structure: wood (木造), reinforced_concrete (RC), steel (鉄骨), or other.")
        .meta({ title: "Structure" }),
      language: LANG,
    },
    annotations: READONLY,
  },
  async ({ build_year, structure, language }) => {
    const era = classifyEra(build_year, structure as Structure);
    const info = ERA_INFO[era];
    const out: Record<string, unknown> = {
      input: { build_year, structure },
      classification: language === "ja" ? info.label_ja : info.label_en,
      what_it_means: bi(info.en, info.ja, language),
      not_a_verdict: bi(
        "This is the standard era only, not a verdict on whether the building is safe. Only a professional 耐震診断 (seismic diagnosis) can assess this building. See taishin_subsidy_guide for subsidised diagnosis.",
        "これは耐震基準の世代であり、建物が安全かどうかの判定ではありません。実際の評価は専門家の耐震診断のみで可能です。補助制度は taishin_subsidy_guide をご覧ください。",
        language
      ),
      source: language === "ja" ? SOURCES.mlitTaishin.name_ja : SOURCES.mlitTaishin.name_en,
      source_url: SOURCES.mlitTaishin.url,
      ...disc(language),
    };
    if (structure === "wood") {
      out.kumamoto_2016_wood = {
        ...bi(KUMAMOTO_WOOD.note_en, KUMAMOTO_WOOD.note_ja, language),
        pre_1981_collapse_or_severe_pct: KUMAMOTO_WOOD.pre_1981_collapse_severe_pct,
        y1981_2000_collapse_or_severe_pct: KUMAMOTO_WOOD.y1981_2000_collapse_severe_pct,
        post_2000_collapse_or_severe_pct: KUMAMOTO_WOOD.post_2000_collapse_severe_pct,
      };
    }
    return ok(out);
  }
);

// ── 4. taishin_subsidy_guide ──────────────────────────────────────────
server.registerTool(
  "taishin_subsidy_guide",
  {
    title: "Seismic Diagnosis & Retrofit Subsidy Guide",
    description:
      "Route the user to subsidised/often-free seismic diagnosis (耐震診断) and retrofit (耐震補強) programs via the national directory, and explain the support framework. Amounts vary by municipality, so this routes and explains; it never quotes a figure.",
    inputSchema: {
      location: z
        .string()
        .optional()
        .describe("Optional municipality or prefecture to tailor the search hint, e.g. '高知市' or '静岡県'.")
        .meta({ title: "Location" }),
      language: LANG,
    },
    annotations: READONLY,
  },
  async ({ location, language }) => {
    const route = subsidyRoute(location);
    return ok({
      framework: language === "ja" ? { ja: SUBSIDY_FRAMEWORK.ja } : language === "en" ? { en: SUBSIDY_FRAMEWORK.en } : SUBSIDY_FRAMEWORK,
      how_to_find_your_subsidy: bi(route.how_to_use_en, route.how_to_use_ja, language),
      search_directory: route.search_directory,
      national_framework_page: route.national_framework_page,
      source: language === "ja" ? `${SOURCES.mlitTaishin.name_ja} / ${SOURCES.jReform.name_ja}` : `${SOURCES.mlitTaishin.name_en} / ${SOURCES.jReform.name_en}`,
      ...disc(language),
    });
  }
);

// ── 5. shindo_meaning ─────────────────────────────────────────────────
server.registerTool(
  "shindo_meaning",
  {
    title: "JMA Seismic Intensity (震度) Meaning",
    description:
      "Explain what a JMA seismic intensity level (5弱–7) actually means for people and buildings, using the official 気象庁 scale. The Nankai scenario projects up to intensity 7 across 10 prefectures.",
    inputSchema: {
      shindo: z
        .enum(["5-", "5+", "6-", "6+", "7"])
        .describe("JMA intensity: '5-' (5弱), '5+' (5強), '6-' (6弱), '6+' (6強), or '7'.")
        .meta({ title: "Intensity" }),
      language: LANG,
    },
    annotations: READONLY,
  },
  async ({ shindo, language }) => {
    const s = SHINDO[shindo as Shindo];
    return ok({
      intensity:
        language === "ja" ? s.ja_label : `JMA intensity ${s.en_label}${language === "both" ? ` (${s.ja_label})` : ""}`,
      scale_note: bi(
        "The JMA intensity scale is not magnitude. It measures shaking where you are, and levels 5 and 6 each split into lower and upper.",
        "震度はマグニチュードではなく、その場所での揺れの強さです。5と6にはそれぞれ弱と強があります。",
        language
      ),
      meaning: bi(s.en, s.ja, language),
      source: language === "ja" ? SHINDO_SOURCE.name_ja : SHINDO_SOURCE.name_en,
      source_url: SHINDO_SOURCE.url,
      ...disc(language),
    });
  }
);

// ── 6. geocode_address (utility) ──────────────────────────────────────
server.registerTool(
  "geocode_address",
  {
    title: "Geocode a Japanese Address",
    description:
      "Convert a Japanese address to coordinates (lat/lon) and parse the prefecture/municipality, via the official GSI geocoder. Utility used by official_hazard_maps; call it directly when you only need coordinates.",
    inputSchema: {
      address: z.string().describe("Japanese address, or a 7-digit postal code (e.g. 232-0063) if you cannot type Japanese.").meta({ title: "Address" }),
    },
    annotations: READONLY_EXTERNAL,
  },
  async ({ address }) => {
    try {
      const g = await geocode(address);
      return ok({ ...g, source: SOURCES.gsi.name_en, source_url: SOURCES.gsi.url, note: "GSI geocoding is best-effort and resolves to about the town-block level." });
    } catch (err) {
      return fail(`Geocode failed for "${address}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }
);

// ── 7. location_probability (official J-SHIS per-mesh, severe case first) ──
server.registerTool(
  "location_probability",
  {
    title: "Official 30-Year Probabilities for a Location",
    description:
      "Report the OFFICIAL J-SHIS 30-year probabilities of reaching each JMA intensity at an address's ~250m mesh, severe case first. These are all-source probabilistic figures published by 地震本部, NOT the Nankai Trough scenario, and they are floors rather than ceilings. This server reports these official values; it does not compute its own.",
    inputSchema: {
      address: z
        .string()
        .describe("Japanese address, or a 7-digit postal code if you cannot type Japanese. e.g. '東京都港区赤坂9-7-1', '高知市本町5', or '232-0063'.")
        .meta({ title: "Address" }),
      language: LANG,
    },
    annotations: READONLY_EXTERNAL,
  },
  async ({ address, language }) => {
    try {
      const g = await geocode(address);
      const j = await jshisProbabilities(g.lat, g.lon);
      const probabilities = j.bands.map((b) => ({
        at_least:
          language === "ja"
            ? `${b.ja_label}以上`
            : `JMA intensity ${b.en_label} or greater${language === "both" ? ` (${b.ja_label}以上)` : ""}`,
        max_case: pct(b.probability_30yr_max),
        average_case: pct(b.probability_30yr_avg),
        what_it_feels_like: bi(SHINDO[b.shindo].en, SHINDO[b.shindo].ja, language),
      }));
      return ok({
        location: { lat: g.lat, lon: g.lon, normalized: g.normalized, prefecture: g.prefecture, municipality: g.municipality, resolved_via: g.resolved_via, ...(g.postal_code ? { postal_code: g.postal_code } : {}) },
        mesh: { meshcode: j.meshcode, model_version: j.version, cases_returned: j.cases_returned },
        ...(g.resolved_via === "postal_code"
          ? {
              precision: bi(
                `Resolved from postal code ${g.postal_code} to the centre of ${g.normalized}, not to your exact building. Shaking can differ across a postal district, so treat this mesh as indicative and check the official map for the building itself.`,
                `郵便番号 ${g.postal_code} から ${g.normalized} の代表地点として求めた結果で、建物単位ではありません。同じ郵便番号内でも揺れは異なるため、建物ごとの確認は公式ハザードマップで行ってください。`,
                language
              ),
            }
          : {}),
        probabilities_within_30_years: probabilities,
        reading_order: bi(
          "Read the maximum case first. Where the official model gives more than one case, the severe one is the planning number.",
          "まず最大ケースを見てください。公的モデルが複数のケースを示す場合、計画の基準にすべきは深刻なほうです。",
          language
        ),
        floor_not_ceiling: bi(FLOOR_NOT_CEILING.en, FLOOR_NOT_CEILING.ja, language),
        what_this_is_not: bi(PROBABILISTIC_NOT_SCENARIO.en, PROBABILISTIC_NOT_SCENARIO.ja, language),
        next: "For the Nankai Trough scenario at this address, call official_hazard_maps. For what to do about it, call preparedness_plan.",
        ...disc(language),
        attribution: `${JSHIS_SOURCE.name_en} ${JSHIS_VERSION} · ${SOURCES.herp.name_en} · ${SOURCES.gsi.name_en} (geocoding)`,
      });
    } catch (err) {
      return fail(
        `Could not read official probabilities for "${address}": ${err instanceof Error ? err.message : String(err)}. J-SHIS covers Japan only. You can query it directly at ${JSHIS_SOURCE.url}`
      );
    }
  }
);

// ── 8. preparedness_plan (the action layer) ───────────────────────────
server.registerTool(
  "preparedness_plan",
  {
    title: "Preparedness Plan for a Household",
    description:
      "Turn household details into a sourced preparedness plan: stockpile quantities sized to the official one-week guidance, what to do now, what to do when it shakes, and the structural route if a build year is given. Officially recommended minimums, never a verdict on survival.",
    inputSchema: {
      adults: z.number().int().min(1).describe("Number of adults in the household.").meta({ title: "Adults" }),
      children: z.number().int().min(0).optional().describe("Number of children.").meta({ title: "Children" }),
      elderly: z.number().int().min(0).optional().describe("Number of elderly members, or members needing assistance to evacuate.").meta({ title: "Elderly" }),
      floor: z.number().int().optional().describe("Which floor the home is on.").meta({ title: "Floor" }),
      building_year: z.number().int().optional().describe("Year of 建築確認 (building confirmation), if known.").meta({ title: "Build year" }),
      structure: z
        .enum(["wood", "reinforced_concrete", "steel", "other", "unknown"])
        .default("unknown")
        .describe("Building structure: wood (木造), reinforced_concrete (RC), steel (鉄骨), other, or unknown.")
        .meta({ title: "Structure" }),
      near_coast_or_river: z.enum(["yes", "no", "unknown"]).default("unknown").describe("Near the coast or a river mouth?").meta({ title: "Coastal" }),
      language: LANG,
    },
    annotations: READONLY,
  },
  async ({ adults, children, elderly, floor, building_year, structure, near_coast_or_river, language }) => {
    const supplies = stockpile({ adults, children, elderly, floor });
    const coastal = near_coast_or_river;

    const structural =
      building_year !== undefined
        ? (() => {
            // Unknown structure resolves to "wood": it is the least favourable
            // classification for a given year, and we assume the worst.
            const struct = (structure === "unknown" ? "wood" : structure) as Structure;
            const era = classifyEra(building_year, struct);
            const info = ERA_INFO[era];
            return {
              era,
              assumed_structure: structure === "unknown" ? "wood (assumed: least favourable)" : struct,
              classification: language === "ja" ? info.label_ja : info.label_en,
              ...bi(info.en, info.ja, language),
              action: bi(
                "Book a 耐震診断 (seismic diagnosis) through your municipality. Call taishin_subsidy_guide for the route and the framework.",
                "自治体経由で耐震診断を申し込んでください。手順と制度は taishin_subsidy_guide をご利用ください。",
                language
              ),
              not_a_verdict: bi(
                "An era classification is not a structural assessment. Only a professional seismic diagnosis (耐震診断) can assess this building.",
                "区分は構造評価ではありません。この建物を評価できるのは専門家の耐震診断だけです。",
                language
              ),
            };
          })()
        : bi(
            "No build year given, so assume the building is unassessed. Find the 建築確認 year and call building_seismic_check.",
            "建築年が未入力のため、未評価の建物として扱ってください。建築確認の年を確認し building_seismic_check をご利用ください。",
            language
          );

    return ok({
      household: { people: supplies.people, floor, structure: structure ?? "unknown", near_coast_or_river: coastal },
      stockpile: {
        days: supplies.days,
        water_litres: supplies.water_litres,
        meals: supplies.meals,
        portable_toilet_uses: supplies.toilet_uses,
        ...bi(supplies.basis_en, supplies.basis_ja, language),
        source: language === "ja" ? QUANTITY_SOURCE.name_ja : QUANTITY_SOURCE.name_en,
        source_url: QUANTITY_SOURCE.url,
      },
      do_now: bi(NOW_STEPS.en.join("\n"), NOW_STEPS.ja.join("\n"), language),
      when_it_shakes: bi(WHEN_IT_SHAKES.en.join("\n"), WHEN_IT_SHAKES.ja.join("\n"), language),
      ...(coastal === "unknown" ? { coastal_unresolved: bi(COASTAL_UNKNOWN.en, COASTAL_UNKNOWN.ja, language) } : {}),
      structural,
      this_is_a_floor: bi(PLAN_IS_NOT_A_VERDICT.en, PLAN_IS_NOT_A_VERDICT.ja, language),
      ...disc(language),
      attribution: `${STOCKPILE_SOURCE.name_en} · ${QUANTITY_SOURCE.name_en} · ${SOURCES.mlitTaishin.name_en}`,
    });
  }
);

// ── Prompts ───────────────────────────────────────────────────────────
server.registerPrompt(
  "assess_home_earthquake_risk",
  {
    title: "Assess my home's earthquake risk",
    description: "Guided walkthrough: scale, official maps, official probabilities, building standard, subsidy, and a preparedness plan. Never a verdict.",
    argsSchema: {
      address: z.string().describe("Japanese address of the home"),
      build_year: z.string().describe("Build year (建築確認), e.g. 1990"),
      structure: z.string().describe("Structure: wood / reinforced_concrete / steel / other"),
    },
  },
  ({ address, build_year, structure }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Help me understand the Nankai Trough earthquake risk for my home at "${address}" (built ${build_year}, ${structure}).\n\nDo this, and DO NOT tell me I'm "safe" or "unsafe":\n1. nankai_overview for the scale and reach.\n2. official_hazard_maps with my address, give me the official maps for my exact predicted shaking and tsunami.\n3. location_probability with my address, for the official 30-year probabilities at my location (maximum case first, a floor not a ceiling).\n4. building_seismic_check with build_year=${build_year}, structure=${structure}, for my building's standard.\n5. taishin_subsidy_guide for my municipality, the subsidised 耐震診断 I should get.\n6. preparedness_plan for what to do now and when it shakes.\n\nPass through every source and disclaimer.`,
        },
      },
    ],
  })
);

server.registerPrompt(
  "nankai_briefing",
  {
    title: "Brief me on the Nankai Trough threat",
    description: "Plain-language briefing on the scale, reach, and what intensity 7 means.",
    argsSchema: {},
  },
  () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Brief me on the Nankai Trough earthquake. Use nankai_overview for the scale and reach, and shindo_meaning with shindo='7' to explain what the worst shaking means. Emphasise the underestimated reach. Cite the official sources.`,
        },
      },
    ],
  })
);

// ── Resources (read-only reference docs, rendered from the same data) ──
for (const r of RESOURCES) {
  server.registerResource(
    r.name,
    r.uri,
    { title: r.name, description: r.description, mimeType: "text/markdown" },
    async () => ({ contents: [{ uri: r.uri, mimeType: "text/markdown", text: r.render() }] })
  );
}

// ── Start ─────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
