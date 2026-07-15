import type { Tags } from 'osm-api';
import type { HandlerReturnWithBBox } from '../../types/index.js';
import {
  MAX_ITEMS_PER_DATASET,
  MIN_ITEMS_PER_DATASET,
} from '../../constants/defaults.js';
import { calcBBox } from '../../common/calcBBox.js';
import { bboxToPolygon } from '../../common/bboxToPolygon.js';

export function mergeTags(a: Tags, b: Tags): Tags {
  const merged = { ...a };
  for (const key in b) {
    if (!merged[key]) {
      merged[key] = b[key]!;
    } else if (merged[key] !== b[key]) {
      merged[key] += `;${b[key]}`;
    }
  }
  return merged;
}

/**
 * having many tiny datasets is unhelpful, it's more convenient for us
 * to merge them into
 */
export function mergeTinyDatasets(
  sectors: HandlerReturnWithBBox,
): HandlerReturnWithBBox {
  const datasetsBySectorId: {
    [sectorId: string]: { sectorNames: string[]; count: number };
  } = {};

  for (const sectorName in sectors) {
    const sector = sectors[sectorName]!;
    const mainSectorId = sector.sectorIds[0]!;
    datasetsBySectorId[mainSectorId] ||= { sectorNames: [], count: 0 };
    datasetsBySectorId[mainSectorId].sectorNames.push(sectorName);
    datasetsBySectorId[mainSectorId].count += sector.features.length;
  }

  for (const sectorName in sectors) {
    const sector = sectors[sectorName]!;
    const mainSectorId = sector.sectorIds[0]!;
    if (sector.features.length <= MIN_ITEMS_PER_DATASET) {
      for (const otherName of datasetsBySectorId[mainSectorId]!.sectorNames) {
        if (otherName === sectorName) continue;
        const other = sectors[otherName];
        if (!other) continue; // deleted by the previous loop
        if (
          other.features.length <= MIN_ITEMS_PER_DATASET &&
          sector.features.length + other.features.length < MAX_ITEMS_PER_DATASET
        ) {
          // combine them
          sector.bbox = calcBBox([
            {
              type: 'Feature',
              geometry: bboxToPolygon(sector.bbox),
              properties: {},
            },
            {
              type: 'Feature',
              geometry: bboxToPolygon(other.bbox),
              properties: {},
            },
          ]);
          sector.sectorIds = [
            ...new Set([...sector.sectorIds, ...other.sectorIds]),
          ];
          sector.changesetTags = mergeTags(
            sector.changesetTags || {},
            other.changesetTags || {},
          );
          if (other.instructions) {
            sector.instructions ||= '';
            sector.instructions += `\n\n${other.instructions}`;
            sector.instructions.trim();
          }
          sector.features.push(...other.features);

          // deleting it now means it won't be visited again by this loop
          delete sectors[otherName];
        }
      }
    }
  }
  return sectors;
}
