import { promises as fs } from 'node:fs';
import {
  type Ctx,
  type DatasetId,
  type MatchOutput,
  MatchType,
  type OSMData,
  type SourceData,
} from '../../types/index.js';
import { processDeletions } from './processDeletions.js';
import { findPotentialOFeatures } from './findPotentialOFeatures.js';

export async function match(
  ctx: Ctx,
  sourceData: SourceData,
  osmData: OSMData,
) {
  const count = Object.keys(sourceData).length;

  const ignoreList = new Set<string>(
    JSON.parse(await fs.readFile(ctx.tempFileNames.ignore_list, 'utf8')),
  );

  console.info('processing deleted data...');
  console.time('matchDeletions');
  const { refsThatChanged, toDelete } = processDeletions(
    ctx,
    osmData,
    sourceData,
  );
  console.timeEnd('matchDeletions');

  console.info('Processing data...');
  let index = 0;
  console.time('match');
  const output: MatchOutput = {
    [MatchType.OneToOne]: [],
    [MatchType.OneToMany]: [],
    [MatchType.ManyToOne]: {},
    [MatchType.ManyToMany]: [],
    [MatchType.Delete]: toDelete,
    [MatchType.Guess]: [],
  };

  const osmFeaturesWithNoRef = Object.values(osmData.noRef);

  const individualRefsToSemiRef: Record<
    DatasetId,
    { value: DatasetId; isFirst: boolean }[]
  > = {};
  for (const ref in osmData.semi) {
    const parts = ref.split(';');
    for (const [j, part] of parts.entries()) {
      individualRefsToSemiRef[<DatasetId>part] ||= [];
      individualRefsToSemiRef[<DatasetId>part]!.push({
        value: <DatasetId>ref,
        isFirst: !j,
      });
    }
  }

  for (const _datasetId in sourceData) {
    const originalDatasetId = <DatasetId>_datasetId;
    let datasetId = refsThatChanged[originalDatasetId] || originalDatasetId;

    // someone has explicitly ignored this row, so act as if it doesn't exist.
    if (ignoreList.has(datasetId)) continue;

    // don't try to recreate the feature, we'll handle it when we reach the old ID
    if (datasetId in refsThatChanged) continue;

    // skip non-first

    const oFeature = osmData.withRef[datasetId];
    const sourceFeature = sourceData[originalDatasetId]!;
    const duplicate = osmData.duplicateRefs[datasetId];

    if (individualRefsToSemiRef[datasetId]) {
      // TODO: hardcoded 0 here is not good.
      if (individualRefsToSemiRef[datasetId]![0]!.isFirst) {
        datasetId = individualRefsToSemiRef[datasetId]![0]!.value!;
      } else {
        // it's not the first one, so skip
        continue;
      }
    }
    const semi = osmData.semi[datasetId];

    // (source:o)
    if (oFeature && semi) {
      const parts = <DatasetId[]>datasetId.split(';');
      output[MatchType.ManyToMany].push({
        osm: [oFeature.id, semi.id],
        source: parts,
      });
    } else if (oFeature) {
      // [1:1] found an exact match
      // the tags might be wrong, but we'll deal with that later
      output[MatchType.OneToOne].push({
        osm: oFeature.id,
        source: originalDatasetId,
      });
    } else if (duplicate) {
      // [1:many] there are multiple exact matches (1:many)
      output[MatchType.OneToMany].push({
        osm: duplicate.map((feature) => feature.id),
        source: datasetId,
      });
    } else if (semi) {
      // [many:1] there is one match, but it contains multiple source features merged
      const parts = <DatasetId[]>datasetId.split(';');
      output[MatchType.ManyToOne][semi.id] ||= [];
      output[MatchType.ManyToOne][semi.id]?.push(...parts);
    } else {
      // if there is no match, try to guess based on nearby candidates
      const possibleAddresses = findPotentialOFeatures(
        ctx,
        sourceFeature,
        osmFeaturesWithNoRef,
      );
      if (possibleAddresses.length === 1) {
        // [1:1] but the ref needs to be added
        output[MatchType.OneToOne].push({
          source: datasetId,
          osm: possibleAddresses[0]!.id,
        });
      } else {
        // [1:?]
        output[MatchType.Guess].push({
          source: datasetId,
          osmCandidates: possibleAddresses.map((f) => f.id),
        });
      }
    }

    index += 1;
    if (!(index % 1000)) {
      /* istanbul ignore next */
      process.stdout.write(`${((index / count) * 100).toFixed(1)}% `);
    }
  }

  console.timeEnd('match');

  await fs.writeFile(
    ctx.tempFileNames.matches,
    JSON.stringify(output, null, undefined),
  );

  return { output };
}
