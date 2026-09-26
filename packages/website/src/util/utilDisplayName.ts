import type { Tags } from 'osm-api';

const LABEL_KEYS = ['name', 'ref', 'seamark:name', 'operator', 'description'];

/** based on iD's version */
export function utilDisplayName(tags: Tags): string {
  for (const key of LABEL_KEYS) {
    const value = tags[key];
    if (value) return value;
  }

  const houseNumber = tags['addr:housenumber'];
  const street = tags['addr:street'];
  if (houseNumber && street) return `${houseNumber} ${street}`;
  if (houseNumber) return houseNumber;

  return '';
}
