import { SOURCES } from "./sources.js";

/**
 * Preparedness content. Every line traces to official guidance; nothing here is
 * invented advice. Quantities follow the more demanding official figure, not the
 * lighter one: 内閣府 recommends a one-week stockpile for a large-scale disaster
 * such as the Nankai Trough, so we size to 7 days rather than the 3 often quoted.
 */

export const STOCKPILE_SOURCE = SOURCES.bousaiStockpile;
export const QUANTITY_SOURCE = SOURCES.tokyoBichiku;

/** Per-person daily baselines from official stockpile guidance. */
const PER_PERSON_PER_DAY = { water_litres: 3, rice_meals: 3 };
export const DAYS = 7;

export interface Household {
  adults: number;
  children?: number;
  elderly?: number;
  floor?: number;
  buildingYear?: number;
  structure?: string;
  coastalOrRiver?: boolean | "unknown";
}

export function stockpile(h: Household) {
  const people = h.adults + (h.children ?? 0) + (h.elderly ?? 0);
  return {
    people,
    days: DAYS,
    water_litres: people * PER_PERSON_PER_DAY.water_litres * DAYS,
    meals: people * PER_PERSON_PER_DAY.rice_meals * DAYS,
    toilet_uses: people * 5 * DAYS,
    basis_en: `${DAYS} days at ${PER_PERSON_PER_DAY.water_litres}L water and ${PER_PERSON_PER_DAY.rice_meals} meals per person per day. Cabinet Office guidance is a one-week stockpile for a large-scale disaster; we size to that rather than the lighter three-day figure.`,
    basis_ja: `1人1日あたり水${PER_PERSON_PER_DAY.water_litres}L・食事${PER_PERSON_PER_DAY.rice_meals}食で${DAYS}日分。大規模災害では1週間分の備蓄が内閣府の目安であり、より軽い3日分ではなくこちらを基準にしています。`,
  };
}

export const NOW_STEPS = {
  en: [
    "Fix furniture to walls. Most injuries in strong shaking come from furniture and falling objects, not collapse.",
    "Clear the path from your bed to the door, and keep shoes and a torch within reach of the bed.",
    "Agree one out-of-area contact and one meeting point with your household. Phone networks fail; a shared plan does not.",
    "Check your municipality's designated evacuation site now, not during the shaking.",
    "Photograph your rooms and documents. Insurance and 罹災証明 claims go faster with a before.",
  ],
  ja: [
    "家具を壁に固定する。強い揺れでの負傷の多くは倒壊ではなく家具や落下物によるものです。",
    "寝床から出口までの動線を空け、枕元に靴と懐中電灯を置く。",
    "家族で「遠方の連絡先」と「集合場所」を1つずつ決める。通信は途絶しますが、決めごとは残ります。",
    "自治体の指定緊急避難場所を、揺れてからではなく今のうちに確認する。",
    "部屋と重要書類を撮影しておく。保険や罹災証明の手続きが早くなります。",
  ],
};

export const WHEN_IT_SHAKES = {
  en: [
    "Protect your head and get under a sturdy table. Do not run outside during the shaking.",
    "Do not rush to turn off the gas during the shaking. Modern meters cut off automatically; move only when it stops.",
    "After the shaking stops: shoes on, then open a door or window to keep an exit.",
    "If you are anywhere near the coast, move to high ground immediately and do not wait for an official warning or for the water to recede. In a Nankai Trough event the first waves can arrive within minutes.",
    "Take the evacuation route on foot. Roads will not be usable.",
  ],
  ja: [
    "頭を守り、丈夫な机の下に入る。揺れている最中に外へ飛び出さない。",
    "揺れている最中に無理にガスを止めに行かない。最近のメーターは自動で遮断します。動くのは揺れが収まってから。",
    "揺れが収まったら、靴を履き、ドアや窓を開けて出口を確保する。",
    "海の近くにいる場合は、警報や潮が引くのを待たず、ただちに高台へ避難する。南海トラフでは第一波が数分で到達しうるとされています。",
    "避難は徒歩で。道路は使えません。",
  ],
};

/** The coastal question is answered pessimistically when unknown. */
export const COASTAL_UNKNOWN = {
  en:
    "You did not confirm whether you are near the coast or a river mouth. Assume you are until you have checked the official inundation map, and plan the evacuation on that basis.",
  ja:
    "海や河口の近くかどうかが未確認です。公式の浸水想定図で確認するまでは「近い」前提で考え、その前提で避難計画を立ててください。",
};

export const PLAN_IS_NOT_A_VERDICT = {
  en:
    "Completing this list does not make you safe and this plan is not a verdict on your survival. It is the officially recommended floor. Your building, your street and the hour of day all matter more than any checklist.",
  ja:
    "このリストを終えても安全になるわけではなく、これは生存の判定でもありません。公的に推奨される最低ラインです。建物・道路・発生時刻のほうが、どんなチェックリストよりも結果を左右します。",
};
