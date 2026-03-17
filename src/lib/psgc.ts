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
    provincesCache = fetchJson<PsgcRecord[]>(`${PSGC_API_BASE}/provinces/`).then(sortByName);
  }

  return provincesCache;
}

export async function getPsgcCitiesMunicipalities(provinceCode: string): Promise<PsgcRecord[]> {
  if (!provinceCode) {
    return [];
  }

  if (!citiesByProvinceCache.has(provinceCode)) {
    const request = fetchJson<PsgcRecord[]>(
      `${PSGC_API_BASE}/provinces/${provinceCode}/cities-municipalities/`
    ).then(sortByName);

    citiesByProvinceCache.set(provinceCode, request);
  }

  return citiesByProvinceCache.get(provinceCode)!;
}
