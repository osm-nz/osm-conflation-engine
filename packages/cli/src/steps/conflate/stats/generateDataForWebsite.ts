import { promises as fs } from 'node:fs';
import {
  type ConflateResult,
  type OsmFeature,
  OsmFlags,
} from '../../../types/callbacks.def.js';
import {
  type Ctx,
  type MatchOutput,
  MatchType,
  type OSMData,
  type OutputLayers,
  type SourceData,
} from '../../../types/internal.def.js';

export async function generateDataForWebsite(
  ctx: Ctx,
  sourceData: SourceData,
  osmData: OSMData,
  matches: MatchOutput,
  handlerReturn: OutputLayers,
): Promise<ConflateResult> {
  const ignoreList = new Set<string>(
    JSON.parse(await fs.readFile(ctx.tempFileNames.ignore_list, 'utf8')),
  );

  // init phase
  let lastEditedByImporter = 0;
  let recentlyChanged = 0;
  let recentlyChecked = 0;
  function collectFlags(feature: OsmFeature) {
    if (feature.flags & OsmFlags.IsLastEditedByImporter) lastEditedByImporter++;
    if (feature.flags & OsmFlags.IsRecentlyChanged) recentlyChanged++;
    if (feature.flags & OsmFlags.IsCheckedRecently) recentlyChecked++;
  }
  for (const feature of Object.values(osmData.withRef)) collectFlags(feature);
  for (const feature of Object.values(osmData.noRef)) collectFlags(feature);
  for (const feature of Object.values(osmData.semi)) collectFlags(feature);
  for (const features of Object.values(osmData.duplicateRefs)) {
    for (const feature of features) collectFlags(feature);
  }

  const result: ConflateResult = {
    config: ctx.config,
    warnings: ctx.warnings,
    countsByPhase: {
      init: {
        sourceDataset: Object.keys(sourceData).length,
        ignored: ignoreList.size,
        osm: {
          withRef: Object.keys(osmData.withRef).length,
          noRef: Object.keys(osmData.noRef).length,
          semi: Object.keys(osmData.semi).length,
          duplicateRefs: Object.values(osmData.duplicateRefs).flat().length,
          lastEditedByImporter,
          recentlyChanged,
          recentlyChecked,
        },
      },
      matched: {
        [MatchType.OneToOne]: matches[MatchType.OneToOne].length,
        [MatchType.OneToMany]: matches[MatchType.OneToMany].length,
        [MatchType.ManyToOne]: Object.keys(matches[MatchType.ManyToOne]).length,
        [MatchType.ManyToMany]: matches[MatchType.ManyToMany].length,
        [MatchType.Delete]: matches[MatchType.Delete].length,
        [MatchType.Guess]: matches[MatchType.Guess].length,
      },
      conflated: { create: 0, edit: 0, delete: 0, perfect: 0 },
    },
  };

  // conflated phase
  for (const sectors of Object.values(handlerReturn).flatMap((v) =>
    Object.values(v),
  )) {
    for (const f of sectors.features) {
      if (f.properties.__action === 'edit') {
        result.countsByPhase.conflated.edit++;
      } else if (f.properties.__action === 'delete') {
        result.countsByPhase.conflated.delete++;
      } else {
        result.countsByPhase.conflated.create++;
      }
    }
  }
  result.countsByPhase.conflated.perfect =
    osmData.count -
    result.countsByPhase.conflated.edit -
    result.countsByPhase.conflated.delete;

  return result;
}
