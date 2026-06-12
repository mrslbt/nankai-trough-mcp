# AGENTS.md — nankai-trough-mcp

Guide for AI coding agents (Claude Code, Cursor, Codex, Copilot…) working in this repo.

## What this project is

**nankai-trough-mcp** — an MCP server that surfaces official Japanese government data on the Nankai Trough (南海トラフ地震) earthquake hazard and Japanese building seismic standards, so an AI assistant can answer "how bad is it, how far does it reach, and what does my build year mean?" with cited figures instead of guesses. It never returns a safety verdict.

- npm: `nankai-trough-mcp` · registry name: `io.github.mrslbt/nankai-trough`
- Local **stdio** server, **read-only**, bundled data + one official geocoder call — no API keys.
- Six tools, two prompts, four resources. Entry tool: **`nankai_overview`** (scale and reach); **`official_hazard_maps`** bridges to the official per-address maps.

## Quick commands

```bash
npm install        # deps
npm run build      # tsc → dist/   (must pass before commit)
npm test           # build + node --test test/*.test.mjs   (must pass before commit)
npm run smoke      # build + a live MCP round-trip (lists tools + resources, classifies a 1975 wooden house)
npm run dev        # tsc --watch
```

Pre-commit: `npm run build && npm test`. Both must pass. 11 tests today.

## Architecture (the whole mental model)

```
src/
├── index.ts            # McpServer — registers the 6 tools + 2 prompts + 4 resources + server instructions (the no-verdict rules)
├── meta.ts             # READONLY / READONLY_EXTERNAL annotations
├── resources.ts        # RESOURCES — reference docs rendered FROM the data below (no second copy, no drift)
├── data/
│   ├── nankai.ts       # NANKAI_FACTS — the headline figures, each with source + as-of + a VERIFICATION LOG header
│   ├── building.ts     # classifyEra(year, structure); ERA_INFO; KUMAMOTO_WOOD field data
│   ├── shindo.ts       # JMA 震度 5弱–7 meanings
│   ├── subsidy.ts      # 耐震診断/補強 routing (never quotes an amount — varies by municipality)
│   └── sources.ts      # SOURCES, DISCLAIMER, ATTRIBUTION — single source of truth, every figure traces here
└── lib/
    ├── geocode.ts      # GSI geocoder + parsePrefMuni() (pure, tested)
    ├── maps.ts         # hazardMapLinks() — pure builder for the official per-address map URLs (tested)
    ├── fetch.ts        # safeFetch (hard timeout, UA, throws on non-OK)
    └── cache.ts        # getOrFetch + TTL
```

The SDK is `@modelcontextprotocol/sdk` (1.29+), zod 4. Annotations are honest about reach: pure-compute tools use `READONLY` (`openWorldHint: false`); anything that calls the GSI geocoder uses `READONLY_EXTERNAL` (`openWorldHint: true`).

## How to add or change a tool

Every tool is registered in `index.ts` with **annotations + parameter titles**. Use this shape — don't drop the `.meta({ title })` or the annotation:

```ts
server.registerTool(
  "your_tool_name",                                   // snake_case, verb-first
  {
    title: "Human Title",
    description: "Verb-first, ≤2 sentences, names the next tool to call.",
    inputSchema: {
      some_field: z.string().describe("English description with a concrete example.").meta({ title: "Some Field" }),
      language: LANG,                                  // reuse the shared en/ja/both param
    },
    annotations: READONLY,                             // or READONLY_EXTERNAL if it hits the geocoder
  },
  async ({ some_field, language }) => ok({ /* … */ })
);
```

Keep tool logic thin in `index.ts`; put data in `src/data/<name>.ts` and shared helpers in `src/lib/`. Then update the expected-tools list in `test/smoke.mjs` and run `npm test && npm run smoke`.

## The honesty rule (non-negotiable — it's the whole point)

This is a life-safety topic. A single fabricated number breaks the server. Five rules, no exceptions:

1. **No verdicts.** Never tell a user their area or home is "safe" or "unsafe." Report the figure + plain-language meaning, then route to official guidance and a professional 耐震診断. The words "safe/unsafe" may appear *only* as a negation in a guardrail.
2. **Every figure cites a primary source + as-of date.** No number ships without a `.go.jp` source and the date verified. If a value can't be confirmed in a primary source, **drop it and point to the source** — never repeat a press figure as fact. (See the retired "149 municipalities" note in `nankai.ts`.)
3. **Probabilistic ≠ scenario.** J-SHIS (NIED, all-source) and the Cabinet Office Nankai *scenario* are different. Never present one as the other.
4. **Building safety can't be looked up.** `building_seismic_check` classifies a standard *era* from user-supplied year + structure. It never claims to know a specific building's condition.
5. **Derived output only.** Cite and link official data; never re-host raw government files. v1 does not compute per-address values — `official_hazard_maps` bridges to the maps that do.

The fact-citation test in `test/data.test.mjs` enforces rule 2: add a fact without a `.go.jp` source and an as-of date and the build fails. Don't weaken it.

### Current verified figures

Touch these only with a primary source in hand, and update the `VERIFICATION LOG` in `nankai.ts` when you do:

- **30-yr probability** — revised by 地震本部 **2025-09-26**: no single figure. Two models — **60–90%+** (slip-dependent BPT) / **20–50%** (BPT). Act on the higher. *Do not reintroduce the retired single "80%".*
- **Worst-case deaths** — ~298,000 (内閣府 2025-03, upper bound, flood defenses functioning).
- **Economic loss** — ~¥270兆 (¥224.9兆 direct + ¥45.4兆 production); ~¥292兆 incl. transport disruption.
- **Intensity 7** — across 10 named prefectures. **Reach** — 764 municipalities / 31 prefectures at 震度6弱以上 or 津波3m以上.
- **Tsunami** — 5 m+ within minutes on the fastest coasts; max ~34 m (高知), ~31 m (静岡).

## Release / version sync

Bump the version in **all three** places (they must match) and keep the names aligned:

1. `package.json` → `version`
2. `src/index.ts` → the `McpServer({ version })`
3. `server.json` → top-level `version` **and** `packages[0].version`

`package.json` `mcpName` **must equal** `server.json` `name` (`io.github.mrslbt/nankai-trough`) — the registry validates npm ownership against it. Then: `npm run build && npm test` → `git push` → `npm publish` → `mcp-publisher publish` (npm must publish first; the registry verifies it). `server.json` `description` is capped at **100 chars**.

## Conventions

- Bilingual: user-facing strings carry `en` + `ja`. Use the `bi(en, ja, lang)` helper and respect the `"en" | "ja" | "both"` param.
- Sources flow through: tool output keeps `source` + `source_url` + the disclaimer. Don't strip them.
- No money, no PII, no writes. Nothing here mutates state or stores user data.
- Keep `dist/` and `node_modules/` out of git; never commit `.mcpregistry_*_token` (see `.gitignore`). npm ships `files: ["dist"]` only.
