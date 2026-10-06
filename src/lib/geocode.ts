import { safeFetch } from "./fetch.js";
import { getOrFetch, TTL } from "./cache.js";
import { extractPostalCode, postalToAddress } from "./postal.js";

export interface GeoResult {
  lat: number;
  lon: number;
  normalized: string;
  prefecture?: string;
  municipality?: string;
  /** How the address was resolved. "postal_code" means we fell back to Japan Post data. */
  resolved_via?: "address" | "postal_code";
  /** Set when a postal code carried the lookup, so callers can state the precision. */
  postal_code?: string;
}

const PREF = /^(北海道|東京都|京都府|大阪府|.{2,3}?県)/;

/**
 * Pure parse of a normalized Japanese address into prefecture + municipality.
 * Exported so it can be tested without a network call. The first capture is the
 * 都道府県; the remainder is matched up to the first 市/区/町/村 boundary.
 */
export function parsePrefMuni(normalized: string): { prefecture?: string; municipality?: string } {
  const pm = normalized.match(PREF);
  if (!pm) return {};
  const prefecture = pm[1];
  const rest = normalized.slice(prefecture.length);
  let municipality = rest.match(/^(.+?[市区町村])/)?.[1];
  // The lazy match stops at the first 市/町, which truncates city names that
  // contain one (四日市市, 廿日市市, 十日町市, 大町市). If the next character is 市,
  // the name continues. County towns (…郡…町) are real towns, so leave those alone.
  if (municipality && !municipality.includes("郡") && /[市町]$/.test(municipality) && rest[municipality.length] === "市") {
    municipality += "市";
  }
  return { prefecture, municipality };
}

/** One raw pass at the GSI geocoder. Returns undefined rather than throwing. */
async function gsiLookup(query: string): Promise<GeoResult | undefined> {
  const url = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(query)}`;
  const data = (await getOrFetch(`geo:${query}`, TTL.GEOCODE, () =>
    safeFetch(url).then((r) => r.json())
  )) as Array<{ geometry?: { coordinates?: [number, number] }; properties?: { title?: string } }>;

  if (!Array.isArray(data) || data.length === 0 || !data[0]?.geometry?.coordinates) return undefined;
  const top = data[0];
  const [lon, lat] = top.geometry!.coordinates!;
  const normalized = top.properties?.title ?? query;
  return { lat, lon, normalized, ...parsePrefMuni(normalized) };
}

/**
 * Address → coordinates via the GSI geocoder, with a postal-code path.
 *
 * The GSI geocoder only understands Japanese. Someone who cannot read the official
 * hazard information is often the same person who cannot type their address in kanji,
 * so a romaji address or a bare postal code has to work. Order:
 *   1. the string as given (handles kanji input),
 *   2. the postal code inside it, resolved to a kanji address via Japan Post data,
 *   3. the string with the postal code stripped.
 */
export async function geocode(address: string): Promise<GeoResult> {
  const direct = await gsiLookup(address);
  if (direct) return { ...direct, resolved_via: "address" };

  const zip = extractPostalCode(address);
  if (zip) {
    const post = await postalToAddress(zip);
    const viaPostal = await gsiLookup(post.kanji);
    if (viaPostal) {
      return {
        ...viaPostal,
        resolved_via: "postal_code",
        postal_code: `${zip.slice(0, 3)}-${zip.slice(3)}`,
      };
    }
  }

  const stripped = address.replace(/(?:〒\s*)?\d{3}[-\s]?\d{4}(?!\d)/, "").trim();
  if (stripped && stripped !== address) {
    const viaStripped = await gsiLookup(stripped);
    if (viaStripped) return { ...viaStripped, resolved_via: "address" };
  }

  throw new Error(
    `No location found for "${address}". The official geocoder only reads Japanese addresses. ` +
      `Give your 7-digit postal code instead (for example 232-0063) and it will resolve.`
  );
}
