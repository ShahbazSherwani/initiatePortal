type PsgcRecord = {
  code: string;
  name: string;
};

const PSGC_API_BASE = "https://psgc.gitlab.io/api";

let provincesCache: Promise<PsgcRecord[]> | null = null;
const citiesByProvinceCache = new Map<string, Promise<PsgcRecord[]>>();

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`PSGC request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function sortByName(records: PsgcRecord[]): PsgcRecord[] {
  return [...records].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPsgcProvinces(): Promise<PsgcRecord[]> {
  if (!provincesCache) {
    provincesCache = fetchJson<PsgcRecord[]>(`${PSGC_API_BASE}/provinces/`).then((provinces) => {
      // NCR (Metro Manila) is a region, not a province, so it's not in the provinces list.
      // Add it manually so users can select it.
      const withNcr = [...provinces, { code: "130000000", name: "Metro Manila" }];
      return sortByName(withNcr);
    });
  }

  return provincesCache;
}

const NCR_CODE = "130000000";

export async function getPsgcCitiesMunicipalities(provinceCode: string): Promise<PsgcRecord[]> {
  if (!provinceCode) {
    return [];
  }

  if (!citiesByProvinceCache.has(provinceCode)) {
    // NCR is a region, not a province, so use the regions endpoint for its cities.
    const endpoint = provinceCode === NCR_CODE
      ? `${PSGC_API_BASE}/regions/${provinceCode}/cities-municipalities/`
      : `${PSGC_API_BASE}/provinces/${provinceCode}/cities-municipalities/`;

    const request = fetchJson<PsgcRecord[]>(endpoint).then(sortByName);

    citiesByProvinceCache.set(provinceCode, request);
  }

  return citiesByProvinceCache.get(provinceCode)!;
}
