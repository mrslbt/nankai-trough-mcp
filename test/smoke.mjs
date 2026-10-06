import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import assert from "node:assert/strict";

const transport = new StdioClientTransport({ command: "node", args: ["dist/index.js"] });
const client = new Client({ name: "nankai-smoke", version: "1.0.0" }, { capabilities: {} });
await client.connect(transport);

try {
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();
  assert.deepEqual(
    names,
    [
      "building_seismic_check",
      "geocode_address",
      "location_probability",
      "nankai_overview",
      "official_hazard_maps",
      "preparedness_plan",
      "shindo_meaning",
      "taishin_subsidy_guide",
    ],
    "expected the 8 tools"
  );
  assert.ok(tools.every((t) => t.annotations?.readOnlyHint === true), "every tool must be read-only");
  assert.ok(
    tools.some((t) => Object.values(t.inputSchema?.properties ?? {}).some((p) => typeof p?.title === "string")),
    "tools should expose parameter titles"
  );

  // Deterministic, no-network: a pre-1981 wooden house must classify as 旧耐震.
  const b = await client.callTool({ name: "building_seismic_check", arguments: { build_year: 1975, structure: "wood", language: "en" } });
  const bd = JSON.parse(b.content.map((c) => c.text).join("\n"));
  assert.match(JSON.stringify(bd), /旧耐震|pre-1981/i, "1975 wood should read as old standard");
  assert.ok(/not a verdict/i.test(JSON.stringify(bd)) || bd.not_a_verdict, "must include the not-a-verdict statement");

  // A pre-1981 concrete building must not be shown the wood-only Kumamoto rate.
  const rc = await client.callTool({ name: "building_seismic_check", arguments: { build_year: 1975, structure: "reinforced_concrete", language: "both" } });
  const rcText = rc.content.map((c) => c.text).join("\n");
  assert.doesNotMatch(rcText, /28\.2%/, "1975 RC must not quote the wood-only 28.2%");
  assert.match(rcText, /非木造|non-wood/i, "1975 RC must be labelled non-wood");

  const o = await client.callTool({ name: "nankai_overview", arguments: { language: "en" } });
  const od = JSON.parse(o.content.map((c) => c.text).join("\n"));
  assert.ok(Array.isArray(od.facts) && od.facts.length >= 5 && od.facts.every((f) => f.source_url), "overview facts must each cite a source URL");

  // The resource layer must list and read over the wire.
  const { resources } = await client.listResources();
  const rNames = resources.map((r) => r.name).sort();
  assert.deepEqual(rNames, ["building-standards", "headline-figures", "shindo-scale", "sources"], "expected the 4 reference resources");
  const read = await client.readResource({ uri: "nankai://headline-figures" });
  const text = read.contents.map((c) => c.text).join("\n");
  assert.ok(/\.go\.jp/.test(text) && /60[–-]90|20[–-]50/.test(text), "headline-figures resource must be sourced and carry the revised probability");

  console.log(`✅ smoke: ${tools.length} tools + ${resources.length} resources, all READONLY, building check + overview + resources honest & sourced`);
} finally {
  await client.close();
}
