import { safeFetch } from "../lib/fetch.js";
import { getOrFetch, TTL } from "../lib/cache.js";
import { SOURCES } from "./sources.js";
import { SHINDO, type Shindo } from "./shindo.js";

/**
 * J-SHIS probabilistic seismic hazard (地震ハザードステーション, NIED / 地震本部).
 *
 * These are OFFICIAL published per-mesh values. This module reports them; it never
 * computes its own. They are all-source probabilistic figures for a roughly 250m
 * mesh, NOT the Nankai Trough scenario, and the two must never be presented as
 * the same thing.
 */

export const JSHIS_SOURCE = SOURCES.jshis;
export const JSHIS_VERSION = "Y2024";

/** AVR is the average case, MAX the maximum. We lead with MAX. */
export type JshisCase = "MAX" | "AVR";

/** T30_I{code}_PS = probability of at least this intensity within 30 years. */
const BANDS: Array<{ field: string; shindo: Shindo }> = [
  { field: "T30_I60_PS", shindo: "6+" },
  { field: "T30_I55_PS", shindo: "6-" },
  { field: "T30_I50_PS", shindo: "5+" },
  { field: "T30_I45_PS", shindo: "5-" },
];

export interface JshisBand {
  shindo: Shindo;
  /** "6 upper". The JMA scale is not a number you can read off; give the words. */
  en_label: string;
  ja_label: string;
  probability_30yr_max?: number;
  probability_30yr_avg?: number;
}

export interface JshisResult {
  meshcode: string;
  version: string;
  bands: JshisBand[];
  cases_returned: JshisCase[];
}

function url(version: string, jcase: JshisCase, lat: number, lon: number): string {
  return `https://www.j-shis.bosai.go.jp/map/api/pshm/${version}/${jcase}/TTL_MTTL/meshinfo.geojson?position=${lon},${lat}&epsg=4326`;
}

async function fetchCase(jcase: JshisCase, lat: number, lon: number) {
  const key = `jshis:${JSHIS_VERSION}:${jcase}:${lat.toFixed(4)},${lon.toFixed(4)}`;
  return getOrFetch(key, TTL.JSHIS, async () => {
    const res = await safeFetch(url(JSHIS_VERSION, jcase, lat, lon));
    const json = (await res.json()) as {
      features?: Array<{ properties?: Record<string, string> }>;
    };
    const props = json.features?.[0]?.properties;
    if (!props || !props.meshcode) {
      throw new Error("No J-SHIS mesh covers this position. J-SHIS covers Japan only.");
    }
    return props;
  });
}

/**
 * Look up the official 30-year exceedance probabilities for a position.
 * Queries both cases and leads with MAX. If MAX is unavailable the AVR case is
 * returned alone and `cases_returned` says so, because a missing severe case must
 * never be silently replaced by a milder one.
 */
export async function jshisProbabilities(lat: number, lon: number): Promise<JshisResult> {
  const [maxRes, avgRes] = await Promise.allSettled([
    fetchCase("MAX", lat, lon),
    fetchCase("AVR", lat, lon),
  ]);

  const max = maxRes.status === "fulfilled" ? maxRes.value : undefined;
  const avg = avgRes.status === "fulfilled" ? avgRes.value : undefined;
  if (!max && !avg) {
    const reason = maxRes.status === "rejected" ? maxRes.reason : avgRes.status === "rejected" ? avgRes.reason : undefined;
    throw new Error(reason instanceof Error ? reason.message : "J-SHIS lookup failed.");
  }

  const num = (v?: string) => (v === undefined ? undefined : Number(v));
  const bands: JshisBand[] = BANDS.map((b) => ({
    shindo: b.shindo,
    en_label: SHINDO[b.shindo].en_label,
    ja_label: SHINDO[b.shindo].ja_label,
    probability_30yr_max: num(max?.[b.field]),
    probability_30yr_avg: num(avg?.[b.field]),
  }));

  const cases: JshisCase[] = [];
  if (max) cases.push("MAX");
  if (avg) cases.push("AVR");

  return {
    meshcode: (max ?? avg)!.meshcode,
    version: JSHIS_VERSION,
    bands,
    cases_returned: cases,
  };
}

/** Render a 0..1 probability without ever rounding it down out of existence. */
export function pct(p?: number): string | undefined {
  if (p === undefined || Number.isNaN(p)) return undefined;
  const v = p * 100;
  if (v >= 99.5) return ">99%";
  if (v >= 10) return `${Math.round(v)}%`;
  if (v >= 1) return `${v.toFixed(1)}%`;
  if (v > 0) return `${v.toFixed(2)}%`;
  return "0%";
}

/**
 * The house position. A low official probability is a floor produced by a model,
 * not a ceiling on what can happen, and it is never reported as reassurance.
 */
export const FLOOR_NOT_CEILING = {
  en:
    "Treat every number here as a floor, not a ceiling. These are modelled probabilities from official all-source data, and models miss things. A low probability is not a promise, and no figure here can tell you your home will hold. Prepare for the worst case regardless of what the percentages say.",
  ja:
    "これらの数値は上限ではなく下限として受け取ってください。公的な全地震モデルにもとづく確率であり、モデルは想定外を取りこぼします。確率が低いことは安全の約束ではありません。数値にかかわらず、最悪の事態を前提に備えてください。",
};

export const PROBABILISTIC_NOT_SCENARIO = {
  en:
    "All-source probabilistic hazard (地震本部 / J-SHIS, Y2024). This is every known seismic source combined, NOT the Nankai Trough scenario. For the Nankai scenario at your address, use official_hazard_maps.",
  ja:
    "全地震活動を対象とした確率論的地震動予測（地震本部 / J-SHIS, Y2024）です。南海トラフの想定シナリオではありません。住所ごとの南海トラフ想定は official_hazard_maps をご利用ください。",
};
