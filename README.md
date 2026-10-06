# nankai-trough-mcp

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Nankai Trough (南海トラフ地震) earthquake hazard and building-safety engine for AI assistants.** Ask "how bad is the Nankai Trough quake, how far does it reach, and what does that mean for a house built in 1978?" and get official Japanese government figures, every one cited and dated, with a route to the official maps for your exact address. It never tells you you're "safe."

It reports what 内閣府 (Cabinet Office), 地震本部, 気象庁, and 国土交通省 actually publish, and where a figure isn't verifiable, it points you at the source instead of inventing one. Bilingual EN/JA. Runs locally, no API keys.

Live companion map: https://nankaitrough.bymarsel.me (this is the open data engine behind it, the same official data as an explorable map).

> **⚠️ Not a prediction, not a verdict.** This explains official data and routes you to official guidance and a professional seismic diagnosis (耐震診断). Always confirm with your municipality and official hazard maps. In an emergency, follow official evacuation instructions.

## Why it exists

Most people underestimate the *reach*. The 30-year probability was revised by 地震本部 in **September 2025** away from the old single "80%" to a two-model range (**60–90%+ (higher model) / 20–50%**). Intensity-7 shaking is projected across **10 prefectures**, and **764 municipalities in 31 prefectures** face major shaking or a 3 m+ tsunami. "I'm inland, so I'm fine" is exactly the assumption this corrects.

The authoritative data is real, but it's scattered across five agencies and mostly buried in PDFs. This server makes it cited and usable from an AI assistant, without ever inventing a number.

## The attitude: assume the worst

The earthquake is unknown, and claiming we know is an illusion. So the refusal here is
one-directional: the tools will alarm you with official numbers, and they will never
reassure you.

Where the official model publishes several cases, the severe one leads. A low
probability is reported as a **floor, not a ceiling**, and is never relayed as good
news. `location_probability` will tell you the government puts your mesh at a 12%
chance of 震度6強 in 30 years; it will not tell you that means you are fine.

## If you cannot write Japanese

The official geocoder only reads Japanese addresses, which would have excluded the
people this server is for. Give a **7-digit postal code** instead and every
address-taking tool resolves it through Japan Post data:

```
232-0063        2320063        〒232-0063
```

That lands on the centre of your postal district rather than your building, and the
tools say so in the response rather than pretending to more precision than they have.
All output is available in English with `language: "en"`.

## Data rules

- **No verdicts.** It reports official figures + plain-language meaning, never "your home is safe/unsafe."
- **Every figure cites its official source + date.** If a value isn't verifiable in a primary source, it points to the source instead of guessing.
- **Probabilistic ≠ scenario.** J-SHIS (all-source probability) is never presented as the Nankai scenario (Cabinet Office).
- **Building safety can't be looked up.** It's classified from the build year + structure *you* provide. No fabricated per-building data.

## Install

```bash
claude mcp add nankai -- npx -y nankai-trough-mcp
```

### JSON config

The server config is the same across clients; only the file path differs.

<details>
<summary>Claude Code: <code>~/.claude/.mcp.json</code></summary>

```json
{
  "mcpServers": {
    "nankai": { "command": "npx", "args": ["-y", "nankai-trough-mcp"] }
  }
}
```

</details>

<details>
<summary>Cursor: <code>~/.cursor/mcp.json</code></summary>

```json
{
  "mcpServers": {
    "nankai": { "command": "npx", "args": ["-y", "nankai-trough-mcp"] }
  }
}
```

</details>

<details>
<summary>VS Code (GitHub Copilot): <code>.vscode/mcp.json</code></summary>

```json
{
  "servers": {
    "nankai": { "type": "stdio", "command": "npx", "args": ["-y", "nankai-trough-mcp"] }
  }
}
```

</details>

<details>
<summary>Claude Desktop: <code>claude_desktop_config.json</code></summary>

```json
{
  "mcpServers": {
    "nankai": { "command": "npx", "args": ["-y", "nankai-trough-mcp"] }
  }
}
```

Config path:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

</details>

### From source

```bash
git clone https://github.com/mrslbt/nankai-trough-mcp.git
cd nankai-trough-mcp
npm install && npm run build
```

Point the client config at the built entry:

```json
{ "command": "node", "args": ["/absolute/path/to/nankai-trough-mcp/dist/index.js"] }
```

## Tools

| Tool | Description |
|---|---|
| `nankai_overview` | The official 2025 scenario's scale and reach (probability, casualties, intensity-7 reach, tsunami), each with its source. Start here. |
| `official_hazard_maps` | Address → links to the **official** per-address hazard maps, where the exact predicted intensity and tsunami live. This server bridges; it doesn't invent those numbers. |
| `building_seismic_check` | Build year + structure → 旧耐震 / 新耐震 / 2000-standard classification with context. Not a verdict. |
| `taishin_subsidy_guide` | Routes to subsidised, often-free 耐震診断 / 耐震補強 programs and the national support framework. |
| `shindo_meaning` | What a JMA intensity (震度 5弱–7) means for people and buildings, on the official 気象庁 scale. |
| `location_probability` | Address → the **official J-SHIS** 30-year probability of reaching each JMA intensity at that ~250m mesh, severe case first. All-source probabilistic (地震本部), **not** the Nankai scenario. Reported, never computed. |
| `preparedness_plan` | Household details → a sourced plan: stockpile sized to the official one-week guidance, what to do now, what to do when it shakes, and the structural route. An officially recommended floor, not a verdict on survival. |
| `geocode_address` | Address → coordinates via the GSI geocoder. Utility. |

Prompts: `assess_home_earthquake_risk`, `nankai_briefing`.

## Resources

Read-only reference documents a client can list and read without a tool call. Each is rendered from the same data the tools use, so they never drift out of sync.

| Resource | Content |
|---|---|
| `nankai://sources` | The official source registry: every agency cited, with URL, plus the standing disclaimer. |
| `nankai://headline-figures` | The 2025 scenario's headline figures, each with source, as-of date, and notes. |
| `nankai://shindo-scale` | The JMA intensity scale (震度 5弱–7): what each level means for people and buildings. |
| `nankai://building-standards` | The 1981 新耐震 / 2000 wooden-house boundaries + 2016 Kumamoto field-damage data. |

## Example prompts

```
Brief me on the Nankai Trough earthquake: the scale, the reach, and what
intensity 7 actually means for a building.
```

```
My house is in 高知市本町. Give me the official hazard maps for my address's
predicted shaking and tsunami.
```

```
I live in a wooden house built in 1978. What seismic standard is that under,
and what should I do about it? Don't tell me whether it's safe.
```

```
Walk me through assessing my home's earthquake risk:
静岡市葵区追手町9-6, built 1990, reinforced concrete.
```

## Scope

**This server does not compute its own per-address values.** Two different things follow
from that:

- It **reports** official published per-mesh probabilities (`location_probability`,
  J-SHIS Y2024). Surfacing a government figure is not inventing one.
- It **bridges** to the official maps for the Nankai scenario at an address
  (`official_hazard_maps`). That data lives in bulk Cabinet Office GIS files needing an
  ingestion pipeline, and faking it is not on the table.

## Headline figures (and where they come from)

Every figure below is verified against the primary government source and carries an as-of date in the tool output. See `src/data/nankai.ts` for the full verification log.

| Figure | Value | Source |
|---|---|---|
| 30-year probability | Two models since the 2025-09-26 revision: **60–90%+** / **20–50%**. Act on the higher. | 地震本部 |
| Worst-case deaths | ~298,000 (upper bound, flood defenses functioning) | 内閣府 2025-03 |
| Economic loss | ~¥270兆 (¥224.9兆 direct + ¥45.4兆 production); ~¥292兆 incl. transport disruption | 内閣府 2025-03 |
| Intensity 7 | Across 10 prefectures | 内閣府 2025-03 |
| Reach | 764 municipalities in 31 prefectures at 震度6弱以上 or 津波3m以上 | 内閣府 2025-03 |
| Tsunami | 5 m+ within minutes on the fastest coasts; max ~34 m (高知), ~31 m (静岡) | 内閣府 / 気象庁 |

## Sources & license

Official data is used as **derived output with attribution**; raw government files are **never re-hosted**.

出典：内閣府 南海トラフの巨大地震モデル・被害想定検討会 ／ 地震調査研究推進本部 ／ 気象庁 ／ 国土交通省（住まいの耐震化）／ 国土地理院（地理院タイル・ジオコーディング）／ 住宅リフォーム推進協議会。

## 日本語

南海トラフ地震のハザードと建物の耐震性を、公的データだけで扱うMCPサーバーです。内閣府・地震本部・気象庁・国土交通省の公表値を、出典と日付つきで提示し、あなたの住所の正確な想定震度・津波は公式ハザードマップへ橋渡しします。建物の安全性は「安全／危険」と判定せず、建築年と構造から耐震基準の世代を示し、耐震診断・補助制度へ案内します。ローカル動作、APIキー不要。

## Disclaimer

This server surfaces official Japanese government data and explanations. It is not a prediction, not a verdict on whether you or your home are safe, and not a substitute for official evacuation guidance or a professional seismic diagnosis (耐震診断). Figures are approximate and as reported by their official sources; always confirm at the source. Unofficial, not affiliated with any government agency.

## License

[MIT](LICENSE)

---

## More MCPs

| MCP | What it does |
|-----|-------------|
| [Japan Design](https://github.com/mrslbt/japan-ux-mcp) | Enforces Japanese UI + UX conventions on real CSS/markup |
| [rippr](https://github.com/mrslbt/rippr) | YouTube transcript ripper for humans and AI agents |
| [Rakuten](https://github.com/mrslbt/rakuten-mcp) | Search Rakuten's marketplace, books, and hotels |

---

Built by [Marsel Bait](https://github.com/mrslbt) in Tokyo
