export const TAGINFO_BASE_URL = 'https://taginfo.openstreetmap.org';

export interface Chronology {
  /** YYYY-MM-DD */
  date: string;
  nodes: number;
  ways: number;
  relations: number;
}

export interface TaginfoChronology {
  data: Chronology[];
}

export async function getTaginfoKeyChronology(key: string) {
  const result = await fetch(
    `${TAGINFO_BASE_URL}/api/4/key/chronology?key=${key}`,
  );
  if (!result.ok) {
    throw new Error(`HTTP Error ${result.status} ${result.statusText}`);
  }

  const json: TaginfoChronology = await result.json();
  return json.data;
}
