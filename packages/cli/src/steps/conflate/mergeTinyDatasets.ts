import type { Tags } from 'osm-api';
import type { BBox, HandlerReturnWithBBox } from '../../types/index.js';
import {
  MAX_BBOX_DEGREES,
  MAX_ITEMS_PER_DATASET,
  MIN_ITEMS_PER_DATASET,
} from '../../constants/defaults.js';
import { calcBBox } from '../../common/calcBBox.js';
import { bboxToPolygon } from '../../common/bboxToPolygon.js';
import {
  distanceBetweenBboxes,
  getBboxMaxDimension,
} from '../../common/geo.js';

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

function mergeBboxes(a: BBox, b: BBox): BBox {
  return calcBBox([
    { type: 'Feature', geometry: bboxToPolygon(a), properties: {} },
    { type: 'Feature', geometry: bboxToPolygon(b), properties: {} },
  ]);
}

/**
 * having many tiny datasets is unhelpful, it's more convenient for us
 * to merge them into
 */
export function mergeTinyDatasets(
  sectors: HandlerReturnWithBBox,
): HandlerReturnWithBBox {
  // keep looping until there is nothing more that can be merged.
  let anyModificationsInPrevPass = true;
  while (anyModificationsInPrevPass) {
    anyModificationsInPrevPass = false;

    for (const sectorName in sectors) {
      const sector = sectors[sectorName]!;

      // skip if it already has enough members
      if (sector.features.length > MIN_ITEMS_PER_DATASET) continue;

      // try to find another group in the same sector which
      // also has too few items.
      const bestOther = Object.entries(sectors)
        .filter(([otherName, other]) => {
          return (
            // at least 1 sector ID must overlap
            other.sectorIds.some((id) => sector.sectorIds.includes(id)) &&
            // skip self
            otherName !== sectorName &&
            // if we merge them, the total must not be too high
            sector.features.length + other.features.length <
              MAX_ITEMS_PER_DATASET
          );
        })
        .toSorted(
          ([, a], [, b]) =>
            // prefer the closest
            distanceBetweenBboxes(sector.bbox, a.bbox) -
            distanceBetweenBboxes(sector.bbox, b.bbox),
        )
        .find(([, other]) => {
          // If the new bbox is now ridiculously big, and the previous
          // bboxes were not this big, then abort the merge.
          const isMergedSmallEnough =
            getBboxMaxDimension(mergeBboxes(sector.bbox, other.bbox)) <=
            MAX_BBOX_DEGREES;

          const isAlreadyTooBig =
            getBboxMaxDimension(sector.bbox) > MAX_BBOX_DEGREES &&
            getBboxMaxDimension(other.bbox) > MAX_BBOX_DEGREES;

          return isMergedSmallEnough || isAlreadyTooBig;
        });

      if (!bestOther) continue;

      const [otherName, other] = bestOther;

      // combine them
      sector.bbox = mergeBboxes(sector.bbox, other.bbox);
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
      delete sectors[sectorName];
      delete sectors[otherName];

      const { name: mergedName } = mergeTags(
        { name: sectorName },
        { name: otherName },
      );
      sectors[mergedName!] = sector;
      anyModificationsInPrevPass = true;
    }
  }
  return sectors;
}
