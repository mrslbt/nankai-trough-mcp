import { SOURCES } from "./sources.js";

/**
 * Japanese building seismic-standard classification.
 *
 * VERIFIED FACTS (re-confirm against MLIT before relying on for decisions):
 * - 新耐震基準 (new seismic standard) took effect 1981-06-01. The boundary is the
 *   建築確認 (building-confirmation) date, NOT completion. 旧耐震 = confirmed on/before
 *   1981-05-31; 新耐震 = confirmed on/after 1981-06-01.  [国土交通省]
 * - 2000年基準: a further strengthening of WOODEN (木造) houses (post-1995 Kobe):
 *   ground-matched foundations, specified joint hardware (金物), balanced load-bearing
 *   wall placement.  [建築基準法 2000 改正]
 * - 2016 Kumamoto earthquake field data (wooden houses): collapse/severe-damage rate
 *   was 28.2% for pre-1981 (旧耐震), 8.7% for 1981-06 to 2000-05, and 2.2% for
 *   2000-06 onward. MLIT splits the eras at June 2000, which is when the 2000
 *   wooden-house standard took effect, so year 2000 itself is a boundary year.
 *   This is the empirical basis the government uses to prioritise 旧耐震 retrofit.
 *   This statistic is WOOD-SPECIFIC and must never be shown for a non-wood
 *   building. [国土交通省]
 */

export type Structure = "wood" | "reinforced_concrete" | "steel" | "other";
export type Era =
  | "pre_1981"
  | "pre_1981_nonwood"
  | "boundary_1981"
  | "1981_2000"
  | "boundary_2000_wood"
  | "post_2000_wood"
  | "post_1981_nonwood";

export const KUMAMOTO_WOOD = {
  pre_1981_collapse_severe_pct: 28.2,
  y1981_2000_collapse_severe_pct: 8.7,
  post_2000_collapse_severe_pct: 2.2,
  note_en: "2016 Kumamoto earthquake, wooden houses. Houses built to the post-2000 standard fared best.",
  note_ja: "2016年熊本地震、木造住宅。2000年基準の木造が最も被害が小さかった。",
  source: SOURCES.mlitTaishin,
} as const;

/**
 * Boundary years resolve to their own "check the date" era rather than the more
 * favourable one: the standard changed mid-year, and assuming the newer standard
 * would be the optimistic guess.
 */
export function classifyEra(buildYear: number, structure: Structure): Era {
  const wood = structure === "wood";
  if (buildYear <= 1980) return wood ? "pre_1981" : "pre_1981_nonwood";
  if (buildYear === 1981) return "boundary_1981"; // ambiguous: depends on 建築確認 month
  if (!wood) return "post_1981_nonwood";
  if (buildYear <= 1999) return "1981_2000";
  if (buildYear === 2000) return "boundary_2000_wood"; // ambiguous: 2000 standard from June
  return "post_2000_wood";
}

export const ERA_INFO: Record<Era, { label_en: string; label_ja: string; en: string; ja: string }> = {
  pre_1981: {
    label_en: "Old standard (旧耐震, pre-1981-06)",
    label_ja: "旧耐震（1981年6月以前）",
    en: "Designed under the pre-1981 standard. The government treats these as the highest-priority for seismic diagnosis and retrofit. In the 2016 Kumamoto quake, 28.2% of pre-1981 wooden houses collapsed or were severely damaged.",
    ja: "1981年6月以前の旧耐震基準。国は耐震診断・改修の最優先対象としています。2016年熊本地震では旧耐震の木造の28.2%が倒壊・大破しました。",
  },
  pre_1981_nonwood: {
    label_en: "Old standard (旧耐震, pre-1981-06), non-wood",
    label_ja: "旧耐震（1981年6月以前・非木造）",
    en: "Non-wood building (reinforced concrete, steel or other) designed under the pre-1981 standard. The government treats pre-1981 buildings as the highest priority for seismic diagnosis and retrofit. The well-known Kumamoto collapse rates are for wooden houses and do not apply to this building; its performance depends on the specific structure and its condition, which only a 耐震診断 can assess.",
    ja: "旧耐震基準（1981年6月以前）の非木造（RC・鉄骨等）の建物です。国は旧耐震の建物を耐震診断・改修の最優先対象としています。熊本地震の倒壊率は木造の数値で、この建物には当てはまりません。実際の性能は構造と状態によるため、耐震診断でしか評価できません。",
  },
  boundary_1981: {
    label_en: "1981, boundary year (ambiguous)",
    label_ja: "1981年（境界年・要確認）",
    en: "1981 straddles the standard change. Whether it is 旧耐震 or 新耐震 depends on the 建築確認 (building-confirmation) date: on/before 1981-05-31 = old; on/after 1981-06-01 = new. Check the building's 建築確認 date.",
    ja: "1981年は基準改正の境界です。旧耐震か新耐震かは建築確認日で決まります（1981年5月31日以前＝旧、6月1日以降＝新）。建築確認日をご確認ください。",
  },
  "1981_2000": {
    label_en: "New standard (新耐震), 1981–2000",
    label_ja: "新耐震（1981〜2000年）",
    en: "Built to the post-1981 new seismic standard. For wooden houses, the 2016 Kumamoto data showed an 8.7% collapse/severe-damage rate for this era, better than pre-1981, but the 2000 wooden-house standard improved it further.",
    ja: "1981年以降の新耐震基準。木造では熊本地震で倒壊・大破8.7%（旧耐震より良好）。ただし2000年基準の木造はさらに改善されています。",
  },
  boundary_2000_wood: {
    label_en: "2000, boundary year for wooden houses (ambiguous)",
    label_ja: "2000年（木造の境界年・要確認）",
    en: "The 2000 wooden-house standard applies from June 2000, so a wooden house from 2000 may be either era. If its 建築確認 date is before June 2000 it falls in the 1981–2000 group (8.7% collapsed or severely damaged in the 2016 Kumamoto quake); from June 2000 it is under the 2000 standard. Until you have checked the 建築確認 date, assume the earlier era.",
    ja: "木造の2000年基準は2000年6月から適用されるため、2000年の木造住宅はどちらの世代にもなり得ます。建築確認日が2000年6月より前なら1981〜2000年の世代（熊本地震で倒壊・大破8.7%）、6月以降なら2000年基準です。建築確認日を確認するまでは、前の世代と考えてください。",
  },
  post_2000_wood: {
    label_en: "2000 wooden-house standard (木造2000年基準)",
    label_ja: "2000年基準（木造）",
    en: "Wooden house built to the post-2000 standard (foundation matched to ground, specified joint hardware, balanced wall placement). This era performed best in the 2016 Kumamoto quake (2.2% collapsed or severely damaged), which is lower, not zero.",
    ja: "2000年以降の木造（地盤に応じた基礎・接合金物・耐力壁のバランス配置）。熊本地震で最も被害が小さかった世代です（倒壊・大破2.2%）。低いとはいえ、ゼロではありません。",
  },
  post_1981_nonwood: {
    label_en: "New standard (新耐震), non-wood",
    label_ja: "新耐震（非木造）",
    en: "Non-wood building (reinforced concrete, steel or other) under the post-1981 new seismic standard. The Kumamoto collapse rates are wood-specific and do not apply; non-wood performance depends heavily on the specific structure and maintenance.",
    ja: "1981年以降の新耐震の非木造（RC・鉄骨等）。熊本地震の倒壊率は木造の数値で当てはまりません。非木造は構造・維持管理に大きく依存します。",
  },
};
