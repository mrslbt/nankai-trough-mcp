import { safeFetch } from "./fetch.js";
import { getOrFetch, TTL } from "./cache.js";

/**
 * Japan Post postal code lookup (via the zipcloud mirror of the official data).
 *
 * This exists so the server can be used by someone who cannot type their address in
 * Japanese. The tool is for residents who cannot read the official hazard PDFs, and
 * requiring kanji input would have excluded exactly those people. A postal code is
 * printed on their mail whether or not they read the language.
 */

export interface PostalResult {
  zipcode: string;
  prefecture: string;
  city: string;
  town: string;
  /** Kanji address string suitable for the GSI geocoder. */
  kanji: string;
}

/**
 * Pull a 7-digit Japanese postal code out of free text. Accepts 2320063, 232-0063, 〒232-0063.
 * Not preceded by a digit or hyphen, so the tail of a phone number (03-1234-5678)
 * is not mistaken for a postal code.
 */
export function extractPostalCode(input: string): string | undefined {
  const m = input.match(/(?:〒\s*)?(?<![\d-])(\d{3})[-\s]?(\d{4})(?!\d)/);
  return m ? `${m[1]}${m[2]}` : undefined;
}

/** Postal code (7 digits, no hyphen) to its official kanji address. */
export async function postalToAddress(zipcode: string): Promise<PostalResult> {
  const url = `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zipcode}`;
  const data = (await getOrFetch(`zip:${zipcode}`, TTL.GEOCODE, () =>
    safeFetch(url).then((r) => r.json())
  )) as {
    status?: number;
    results?: Array<{ address1?: string; address2?: string; address3?: string }> | null;
  };

  const top = data.results?.[0];
  if (!top?.address1) {
    throw new Error(`No Japanese address found for postal code ${zipcode}.`);
  }
  const prefecture = top.address1 ?? "";
  const city = top.address2 ?? "";
  const town = top.address3 ?? "";
  return { zipcode, prefecture, city, town, kanji: `${prefecture}${city}${town}` };
}
