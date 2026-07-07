import {
  type Ctx,
  type DatasetId,
  type OSMData,
  OsmFlags,
  type SourceData,
} from '../../types/index.js';

export function processDeletions(
  ctx: Ctx,
  osmData: OSMData,
  sourceData: SourceData,
) {
  const invalidIds: DatasetId[] = [];
  for (const _datasetId in osmData.withRef) {
    const datasetId = <DatasetId>_datasetId;
    const oFeature = osmData.withRef[datasetId]!;
    if (
      !(datasetId in sourceData) && // we delete every OSM node with a linzRef that does not exist in the LINZ data
      !(oFeature.flags & OsmFlags.IsCheckedRecently) // ...and it does not have a recent check_date
    ) {
      invalidIds.push(datasetId);
    }
  }

  const datasetByLocalKey: {
    [sector: string]: { [localKey: string]: DatasetId };
  } = {};
  for (const _datasetId in sourceData) {
    const datasetId = <DatasetId>_datasetId;
    const feature = sourceData[datasetId]!;
    for (const sector of feature.sectors) {
      datasetByLocalKey[sector] ||= {};
      const localKey = ctx.callbacks.getLocalKeyForSource(feature);

      // if (datasetByLocalKey[sector][localKey]) {
      //   console.warn(
      //     `localKey ‘${localKey}’ is not unique within sector ‘${sector}’`,
      //   );
      // }
      datasetByLocalKey[sector][localKey] = datasetId;
    }
  }

  /**
   * cases where we're supposed to delete a feature and re-create an identical one in a
   * similar location. The smarter thing to do would be to simply change the ref.
   */
  const refsThatChanged: Record</* new */ DatasetId, /* old */ DatasetId> = {};
  const toDelete: DatasetId[] = [];

  for (const datasetIdToDelete of invalidIds) {
    const oFeature = osmData.withRef[datasetIdToDelete]!;

    const localKey = ctx.callbacks.getLocalKeyForOsm(oFeature);

    const newDatasetIds = new Set(
      oFeature.sectors
        .map((sector) => datasetByLocalKey[sector]?.[localKey])
        .filter(Boolean),
    );

    if (newDatasetIds.size > 1) {
      console.warn(
        `${oFeature.id} spans multiple sectors, and there are conflicting localKeys across the sectors. Therefore, it will be straight-up deleted`,
      );
    }
    if (newDatasetIds.size === 1) {
      const newDatasetId = [...newDatasetIds][0]!;
      if (osmData.withRef[newDatasetId]) {
        // linz ref changed && new one is already in osm -> so basically it didn't change. Normal delete
        // probably because address accidently existed twice in the LINZ db, with 2 different refs and LINZ fixed it by deleting one.
        toDelete.push(datasetIdToDelete);
      } else {
        // linz ref changed, and the new ref doesn't exist in OSM
        refsThatChanged[newDatasetId] = datasetIdToDelete;
      }
    } else {
      // no identical feature in osm, so delete it
      toDelete.push(datasetIdToDelete);
    }
  }
  return {
    refsThatChanged,
    toDelete,
  };
}
