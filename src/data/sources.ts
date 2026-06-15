/**
 * Single source of truth for official Japanese government data sources.
 * Every figure this server reports must trace back to one of these.
 * License note: official data is used as DERIVED output with attribution.
 * We never re-host raw government files.
 */
export const SOURCES = {
  cabinetNankai: {
    name_en: "Cabinet Office: Nankai Trough Mega-Earthquake Model & Damage Assessment Working Group",
    name_ja: "内閣府 南海トラフ巨大地震モデル・被害想定検討ワーキンググループ",
    url: "https://www.bousai.go.jp/jishin/nankai/",
  },
  herp: {
    name_en: "Headquarters for Earthquake Research Promotion (HERP / Jishin-honbu)",
    name_ja: "地震調査研究推進本部（地震本部）",
    url: "https://www.jishin.go.jp/",
  },
  jma: {
    name_en: "Japan Meteorological Agency (JMA) Seismic Intensity Scale",
    name_ja: "気象庁 震度階級",
    url: "https://www.jma.go.jp/jma/kishou/know/shindo/index.html",
  },
  mlitTaishin: {
    name_en: "MLIT Home Seismic Retrofitting (Sumai no Taishin-ka)",
    name_ja: "国土交通省 住まいの耐震化",
    url: "https://www.mlit.go.jp/jutakukentiku/house/jutakukentiku_house_fr_000043.html",
  },
  jReform: {
    name_en: "Japan Housing Remodeling Promotion Council, local subsidy search",
    name_ja: "住宅リフォーム推進協議会 地方公共団体支援制度検索",
    url: "https://www.j-reform.com/reform-support/",
  },
  gsi: {
    name_en: "Geospatial Information Authority of Japan (GSI)",
    name_ja: "国土地理院",
    url: "https://www.gsi.go.jp/",
  },
  disaportal: {
    name_en: "MLIT/GSI National Hazard Map Portal (Kasaneru Hazard Map)",
    name_ja: "国土交通省 ハザードマップポータルサイト（重ねるハザードマップ）",
    url: "https://disaportal.gsi.go.jp/",
  },
  jshis: {
    name_en: "J-SHIS National Seismic Hazard Maps (NIED)",
    name_ja: "地震ハザードステーション J-SHIS（防災科研）",
    url: "https://www.j-shis.bosai.go.jp/",
  },
} as const;

/** The disclaimer that must accompany every hazard-related answer. */
export const DISCLAIMER = {
  en:
    "This tool surfaces official Japanese government data and explanations. It is NOT a prediction, NOT a verdict on whether you or your home are safe, and NOT a substitute for official evacuation guidance or a professional seismic diagnosis (耐震診断). Always confirm with your municipality and official hazard maps.",
  ja:
    "本ツールは公的機関の公開データと解説を提示するものです。予測でも、あなたや住居が安全かどうかの判定でもなく、自治体の避難指示や専門家による耐震診断に代わるものではありません。必ずお住まいの自治体および公式ハザードマップでご確認ください。",
};

export const ATTRIBUTION =
  "出典：内閣府 南海トラフの巨大地震モデル・被害想定検討会／地震調査研究推進本部／気象庁／国土交通省／国土地理院（地理院タイル）。Derived output with attribution; raw files not redistributed.";
