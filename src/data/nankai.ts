import { SOURCES } from "./sources.js";

/**
 * Headline facts from the official Nankai Trough estimate.
 * Every figure is verified against the PRIMARY government source (内閣府 令和7年3月
 * 被害想定 / 地震本部 令和7年9月26日 長期評価) and quoted approximately. Always direct
 * the user to the source URL to confirm. Never our own calculation, never per-address.
 *
 * VERIFICATION LOG (2026-06, primary PDFs):
 * - Deaths ~298k: VERIFIED (saidai_01.pdf, upper bound of the 東海 case; assumes flood
 *   defenses function). The drop from the old ~323k is mostly updated methodology.
 * - Economic loss: primary headline ≈ ¥270兆 (直接224.9兆 + 生産低下45.4兆); ~¥292兆 is the
 *   with-transport-disruption sum reported by official-adjacent press.
 * - Intensity 7: VERIFIED in 10 named prefectures. (The "149 municipalities" figure could
 *   NOT be confirmed in any primary PDF, so it was dropped. Verified reach = 31 prefectures /
 *   764 municipalities at 震度6弱以上 or 津波3m以上.)
 * - 30-yr probability: REVISED 2025-09-26, no longer a single "80%"; two models now.
 * - Tsunami: fastest coasts 5m+ within minutes; max ~34m (高知県).
 */
export interface NankaiFact {
  key: string;
  en: string;
  ja: string;
  value: string;
  source: { name_en: string; name_ja: string; url: string };
  asOf: string;
  note?: string;
}

export const NANKAI_FACTS: NankaiFact[] = [
  {
    key: "probability",
    en: "Probability of a Nankai Trough earthquake (M8–M9 class) in the next 30 years",
    ja: "南海トラフ地震（M8〜M9クラス）が今後30年以内に発生する確率",
    value:
      "Two models (no single figure since the revision): 60–90%+ (slip-dependent BPT model) / 20–50% (BPT model). Authorities recommend acting on the higher value.",
    source: SOURCES.herp,
    asOf: "Revised 2025-09-26 (HERP), reference date 2025-01-01",
    note:
      "HERP dropped the old single '80%程度' on 2025-09-26 after long-standing scientific debate over the calculation method, and now publishes two model results. Neither model is treated as superior; for safety, act on 60–90%+.",
  },
  {
    key: "worst_case_deaths",
    en: "Worst-case estimated deaths (national, worst regional case)",
    ja: "想定死者数（最大クラス・最悪ケース）",
    value: "~298,000 (約298千人)",
    source: SOURCES.cabinetNankai,
    asOf: "2025-03 (Cabinet Office revised estimate)",
    note:
      "Upper bound of the case where the Tokai region is hardest hit, assuming flood defenses (levees/floodgates) function. Tsunami deaths are higher if they fail. The drop from the older ~323,000 is mostly updated methodology, not reduced risk.",
  },
  {
    key: "economic_damage",
    en: "Worst-case estimated economic loss",
    ja: "想定経済被害額（最大クラス）",
    value: "~¥270 trillion (約270兆円: ¥224.9兆 direct asset + ¥45.4兆 production loss); ~¥292兆 including transport disruption",
    source: SOURCES.cabinetNankai,
    asOf: "2025-03",
    note: "Primary report headline is ~¥270兆 (or ¥224.9兆 direct); the ¥292兆 total adds transport-network disruption. Old 2013 figure was ¥214.2兆.",
  },
  {
    key: "intensity7_reach",
    en: "Reach of the strongest shaking (JMA intensity 7)",
    ja: "最大震度7が想定される範囲",
    value:
      "Intensity-7 areas across 10 prefectures: Shizuoka, Aichi, Mie, Hyogo, Wakayama, Tokushima, Kagawa, Ehime, Kochi, Miyazaki.",
    source: SOURCES.cabinetNankai,
    asOf: "2025-03",
  },
  {
    key: "affected_reach",
    en: "Total affected area (the underestimated reach)",
    ja: "影響を受ける範囲（過小評価されがちな広がり）",
    value: "31 prefectures / 764 municipalities face intensity 6-lower or above, or a tsunami of 3 m or more.",
    source: SOURCES.cabinetNankai,
    asOf: "2025-03",
  },
  {
    key: "tsunami",
    en: "Tsunami: speed and height",
    ja: "津波：速さと高さ",
    value:
      "On the fastest coasts (e.g. Suruga Bay) a tsunami over 5 m can arrive within a few minutes. Maximum heights reach ~34 m (Kochi) and ~31 m (Shizuoka); 10 m+ is expected along wide Pacific coasts from Kanto to Kyushu (JMA).",
    source: SOURCES.cabinetNankai,
    asOf: "2025-03",
  },
  {
    key: "promotion_region",
    en: "Designated disaster-preparedness promotion region (防災対策推進地域)",
    ja: "南海トラフ地震防災対策推進地域",
    value:
      "A wide designated region spanning Pacific-side prefectures from the Kanto/Tokai area through Kinki, Shikoku and Kyushu. Check whether your municipality is included.",
    source: SOURCES.cabinetNankai,
    asOf: "2026-06 (current designation)",
  },
];

export const NANKAI_REACH_NOTE = {
  en:
    "The most-underestimated fact: the Nankai Trough quake reaches far beyond the immediate coast. Intensity-7 shaking is projected across 10 prefectures, and 764 municipalities in 31 prefectures face intensity 6-lower+ or a 3 m+ tsunami. 'I'm inland, so I'm fine' is exactly the assumption this data corrects.",
  ja:
    "最も過小評価されがちな事実：南海トラフ地震の影響は沿岸部だけにとどまりません。震度7は10県に想定され、震度6弱以上または3m以上の津波の影響を受けるのは31都府県・764市町村に及びます。「内陸だから大丈夫」という思い込みこそ、このデータが正すものです。",
};
