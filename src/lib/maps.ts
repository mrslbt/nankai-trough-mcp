import { SOURCES } from "../data/sources.js";

/**
 * Pure builder for the OFFICIAL per-address hazard-map links. This server never
 * computes intensity/tsunami itself; it points the user at the government maps
 * that hold the exact values. Kept pure (no network) so it can be tested.
 */
export function hazardMapLinks(lat: number, lon: number, zoom = 15) {
  return {
    national_overlay_map: `https://disaportal.gsi.go.jp/maps/?ll=${lat},${lon}&z=${zoom}`,
    your_municipal_hazard_map: "https://disaportal.gsi.go.jp/hazardmap/bousaimap/index.html",
    probabilistic_seismic_map_jshis: SOURCES.jshis.url,
    nankai_scenario_source: SOURCES.cabinetNankai.url,
  };
}
