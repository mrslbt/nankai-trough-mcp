/**
 * MCP resources: read-only reference documents a client can list and read
 * without a tool call. Every resource is RENDERED FROM the same data the tools
 * use (SOURCES, NANKAI_FACTS, SHINDO, ERA_INFO/KUMAMOTO), so there is no second
 * copy to drift out of sync. Markdown, bilingual where the underlying data is.
 */
import { SOURCES, DISCLAIMER, ATTRIBUTION } from "./data/sources.js";
import { NANKAI_FACTS, NANKAI_REACH_NOTE } from "./data/nankai.js";
import { SHINDO, SHINDO_SOURCE } from "./data/shindo.js";
import { ERA_INFO, KUMAMOTO_WOOD } from "./data/building.js";

export interface ResourceDef {
  name: string;
  uri: string;
  description: string;
  render: () => string;
}

export const RESOURCES: ResourceDef[] = [
  {
    name: "sources",
    uri: "nankai://sources",
    description:
      "The official source registry: every Japanese government agency this server cites, with its URL, plus the standing disclaimer.",
    render: () => {
      const rows = Object.values(SOURCES)
        .map((s) => `| ${s.name_en} | ${s.name_ja} | ${s.url} |`)
        .join("\n");
      return `# Sources: official data registry

Every figure this server reports traces to one of these. Data is used as derived output with attribution; raw government files are never re-hosted.

| Source (EN) | Source (JA) | URL |
|---|---|---|
${rows}

## Disclaimer
${DISCLAIMER.en}

${DISCLAIMER.ja}

---
${ATTRIBUTION}`;
    },
  },
  {
    name: "headline-figures",
    uri: "nankai://headline-figures",
    description:
      "The official 2025 Nankai Trough scenario's headline figures (probability, casualties, economic loss, intensity-7 reach, tsunami), each with source and as-of date.",
    render: () => {
      const blocks = NANKAI_FACTS.map(
        (f) =>
          `### ${f.en}\n${f.ja}\n\n- **Value:** ${f.value}\n- **Source:** ${f.source.name_en}, ${f.source.url}\n- **As of:** ${f.asOf}${f.note ? `\n- **Note:** ${f.note}` : ""}`
      ).join("\n\n");
      return `# Headline figures: official Nankai Trough scenario

Every value below is verified against its primary government source. These are scenario figures, not predictions, and never a per-address value. Confirm at the source URL.

${blocks}

## The underestimated reach
${NANKAI_REACH_NOTE.en}

${NANKAI_REACH_NOTE.ja}`;
    },
  },
  {
    name: "shindo-scale",
    uri: "nankai://shindo-scale",
    description:
      "The JMA seismic intensity scale (気象庁震度階級) for levels 5弱–7, what each means for people and buildings.",
    render: () => {
      const blocks = Object.values(SHINDO)
        .map((s) => `### ${s.ja_label}\n${s.en}\n\n${s.ja}`)
        .join("\n\n");
      return `# JMA seismic intensity scale (震度): 5弱 to 7

Descriptions paraphrased from the official 震度階級関連解説表. The Nankai scenario projects up to intensity 7 across 10 prefectures.

${blocks}

---
Source: ${SHINDO_SOURCE.name_en}, ${SHINDO_SOURCE.url}`;
    },
  },
  {
    name: "building-standards",
    uri: "nankai://building-standards",
    description:
      "Japanese building seismic-standard reference: the 1981 新耐震 and 2000 wooden-house boundaries, plus the 2016 Kumamoto field-damage data.",
    render: () => {
      const eras = Object.values(ERA_INFO)
        .map((e) => `### ${e.label_en} / ${e.label_ja}\n${e.en}\n\n${e.ja}`)
        .join("\n\n");
      return `# Building seismic standards: reference

The boundary is the 建築確認 (building-confirmation) date, not completion. This is a standard-era reference only, never a verdict on a specific building. Only a professional 耐震診断 can assess an actual building.

- **新耐震基準 (new standard):** took effect **1981-06-01**. 旧耐震 = confirmed on/before 1981-05-31.
- **2000年基準:** a further strengthening of **wooden (木造)** houses (post-1995 Kobe): ground-matched foundations, specified joint hardware (金物), balanced load-bearing wall placement.

## 2016 Kumamoto earthquake wooden-house field data
Collapse / severe-damage rate by era (wood only):
- Pre-1981 (旧耐震): **${KUMAMOTO_WOOD.pre_1981_collapse_severe_pct}%**
- 1981–2000: **${KUMAMOTO_WOOD.y1981_2000_collapse_severe_pct}%**
- Post-2000: lowest

${KUMAMOTO_WOOD.note_en}

## Standard eras
${eras}

---
Source: ${SOURCES.mlitTaishin.name_en}, ${SOURCES.mlitTaishin.url}`;
    },
  },
];
