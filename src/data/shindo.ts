import { SOURCES } from "./sources.js";

/**
 * JMA seismic intensity scale (気象庁震度階級). Descriptions paraphrased from the
 * official 震度階級関連解説表. Source: JMA. Verify at the official page before use.
 * We cover 5弱..7 (the levels relevant to the Nankai scenario's strong-shaking zones).
 */
export type Shindo = "5-" | "5+" | "6-" | "6+" | "7";

export const SHINDO_SOURCE = SOURCES.jma;

export const SHINDO: Record<Shindo, { ja_label: string; en_label: string; en: string; ja: string }> = {
  "5-": {
    ja_label: "震度5弱",
    en_label: "5 lower",
    en: "Most people feel fear and reach for something to hold. Hanging objects swing markedly; unstable ornaments may fall. Less earthquake-resistant houses can develop cracks in walls.",
    ja: "大半の人が恐怖を覚え、物につかまりたいと感じる。つり下げ物は大きく揺れ、棚の不安定な物が落ちることがある。耐震性の低い住宅では壁などに亀裂が生じることがある。",
  },
  "5+": {
    ja_label: "震度5強",
    en_label: "5 upper",
    en: "Many find it hard to move or walk without holding something. Dishes and books fall; unsecured furniture may topple. Less-resistant houses can have wall cracks and roof tiles may dislodge.",
    ja: "物につかまらないと歩くことが難しい。食器や本が落ち、固定していない家具が倒れることがある。耐震性の低い住宅では壁に亀裂、瓦が落ちることがある。",
  },
  "6-": {
    ja_label: "震度6弱",
    en_label: "6 lower",
    en: "Standing is difficult. Heavy, unfixed furniture can topple or shift. Wall tiles and windows may break and fall. Less earthquake-resistant wooden houses may lean or, in some cases, collapse.",
    ja: "立っていることが困難になる。固定していない重い家具が倒れたり移動したりする。壁のタイルや窓ガラスが破損・落下することがある。耐震性の低い木造住宅は傾いたり、倒れるものもある。",
  },
  "6+": {
    ja_label: "震度6強",
    en_label: "6 upper",
    en: "Impossible to stand or move without crawling; people may be thrown. Less-resistant wooden houses are more likely to lean or collapse; even quake-resistant houses can suffer wall damage. Less-resistant RC buildings can collapse.",
    ja: "はわないと動くことができず、揺れにほんろうされることがある。耐震性の低い木造住宅は傾く・倒れるものが多くなり、耐震性の高い住宅でも壁などが破損することがある。耐震性の低い鉄筋コンクリート造は倒れるものがある。",
  },
  "7": {
    ja_label: "震度7",
    en_label: "7",
    en: "People are thrown by the shaking and cannot move at will. Less-resistant wooden houses lean or collapse even more; in extreme cases even highly resistant houses may lean. Less-resistant RC buildings collapse more; even resistant ones can be damaged.",
    ja: "揺れにほんろうされ、自分の意思で行動できない。耐震性の低い木造住宅は傾く・倒れるものがさらに多くなり、耐震性の高い住宅でもまれに傾くことがある。耐震性の低い鉄筋コンクリート造は倒れるものが多くなり、高いものでも破損することがある。",
  },
};
