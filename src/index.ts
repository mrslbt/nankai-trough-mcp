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
  { name: "nankai-trough-mcp", version: "0.1.1" },
  {
    instructions: `Nankai Trough (南海トラフ地震) earthquake hazard + building-safety engine. Surfaces ONLY official Japanese government data.

ABSOLUTE RULES when using these tools, state them to the user:
1. NEVER tell the user their area or home is "safe" or "unsafe." Report the official numbers + plain-language meaning, and route to official guidance. There is no verdict.
2. Always pass through the disclaimer the tools return, and cite the official source for every figure.
3. This server does NOT compute a per-address Nankai intensity/tsunami value. For that, use official_hazard_maps to bridge the user to the official government maps that do.
4. Distinguish probabilistic data (J-SHIS, all-source) from the Nankai SCENARIO (Cabinet Office). Never present one as the other.
5. Building safety cannot be looked up. building_seismic_check uses the year/structure the USER provides.

Tool guide:
- nankai_overview: the scale and reach of the 2025 official estimate. Start here.
- official_hazard_maps: address → links to the official per-address hazard maps (the bridge for exact intensity/tsunami).
- building_seismic_check: user's build year + structure → seismic-standard classification. NOT a verdict.
- taishin_subsidy_guide: route to subsidised 耐震診断/補強 (the real action).
- shindo_meaning: what a JMA intensity (震度) level means.
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
        .describe("Japanese address, e.g. '静岡県静岡市葵区追手町9-6' or '高知市本町5'.")
        .meta({ title: "Address" }),
      language: LANG,
    },
    annotations: READONLY_EXTERNAL,
  },
  async ({ address, language }) => {
    try {
      const g = await geocode(address);
      return ok({
        location: { lat: g.lat, lon: g.lon, normalized: g.normalized, prefecture: g.prefecture, municipality: g.municipality },
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
      intensity: s.ja_label,
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
      address: z.string().describe("Japanese address to geocode.").meta({ title: "Address" }),
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

// ── Prompts ───────────────────────────────────────────────────────────
server.registerPrompt(
  "assess_home_earthquake_risk",
  {
    title: "Assess my home's earthquake risk",
    description: "Guided walkthrough: scale, then the official maps, building standard, and subsidy. Never a verdict.",
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
          text: `Help me understand the Nankai Trough earthquake risk for my home at "${address}" (built ${build_year}, ${structure}).\n\nDo this, and DO NOT tell me I'm "safe" or "unsafe":\n1. nankai_overview for the scale and reach.\n2. official_hazard_maps with my address, give me the official maps for my exact predicted shaking and tsunami.\n3. building_seismic_check with build_year=${build_year}, structure=${structure}, for my building's standard.\n4. taishin_subsidy_guide for my municipality, the subsidised 耐震診断 I should get.\n\nPass through every source and disclaimer.`,
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
