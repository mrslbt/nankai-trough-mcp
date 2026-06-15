import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";

/** Pure compute on bundled, verified data, no external calls. */
export const READONLY: ToolAnnotations = {
  readOnlyHint: true,
  idempotentHint: true,
  openWorldHint: false,
};

/** Read-only, but reaches an external official API (GSI geocoder). */
export const READONLY_EXTERNAL: ToolAnnotations = {
  readOnlyHint: true,
  idempotentHint: true,
  openWorldHint: true,
};
