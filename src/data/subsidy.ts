import { SOURCES } from "./sources.js";

/**
 * Seismic diagnosis (耐震診断) / retrofit (耐震補強) support framework.
 * Programs and amounts vary by municipality, so we route to the national directory
 * and explain the framework, and we NEVER state a specific subsidy amount (it is
 * city-dependent). Source: MLIT 住まいの耐震化 + 住宅リフォーム推進協議会.
 */
export const SUBSIDY_FRAMEWORK = {
  en: [
    "Many municipalities offer a free or heavily subsidised 耐震診断 (seismic diagnosis), especially for pre-1981 (旧耐震) wooden houses.",
    "耐震補強 (retrofit) grants are common but the amount and eligibility differ by city.",
    "National supports that may stack: income-tax deduction (所得税控除), fixed-asset-tax reduction (固定資産税減額), and JHF (住宅金融支援機構) retrofit loans.",
    "The official guidance is literally: consult your local government first (まずはお住まいの自治体に相談).",
  ],
  ja: [
    "多くの自治体が、特に旧耐震（1981年5月以前）の木造住宅向けに、無料または補助つきの耐震診断を実施しています。",
    "耐震補強（改修）の補助金も一般的ですが、金額・要件は自治体ごとに異なります。",
    "併用できる国の支援：所得税控除、固定資産税の減額、住宅金融支援機構の耐震改修ローンなど。",
    "公式の案内は『まずはお住まいの自治体に相談』です。",
  ],
};

/** Build the routing payload for a given location (prefecture/municipality string). */
export function subsidyRoute(location?: string) {
  return {
    search_directory: SOURCES.jReform.url,
    search_directory_name_en: SOURCES.jReform.name_en,
    search_directory_name_ja: SOURCES.jReform.name_ja,
    national_framework_page: SOURCES.mlitTaishin.url,
    how_to_use_en: location
      ? `Open the directory and search for "${location}" to find that municipality's 耐震診断 / 耐震補強 subsidy programs. If you cannot find it, search your prefecture, then contact your city office.`
      : "Open the directory and search by your municipality to find its 耐震診断 / 耐震補強 subsidy programs.",
    how_to_use_ja: location
      ? `検索サイトで「${location}」を検索し、その自治体の耐震診断・補強の補助制度をご確認ください。見つからない場合は都道府県で検索し、市区町村窓口にお問い合わせください。`
      : "検索サイトでお住まいの自治体を検索し、耐震診断・補強の補助制度をご確認ください。",
  };
}
