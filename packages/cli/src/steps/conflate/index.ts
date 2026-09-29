import { promises as fs } from 'node:fs';
import type { OsmPatchFeature } from 'osm-api';
import {
  type ConflateResult,
  type ConflationDiff,
  type ConflationResultExtra,
  type Ctx,
  type DatasetId,
  type MatchOutput,
  MatchType,
  type OSMData,
  type OsmFeature,
  OsmFlags,
  type OsmId,
  type OutputLayers,
  type SourceData,
  type SourceDataFeature,
  type TagDiff,
} from '../../types/index.js';
import { createDiamond, createSquare } from './createDiamond.js';
import {
  normaliseNames,
  splitUntilSmallEnough,
} from './splitUntilSmallEnough.js';
import { shiftOverlappingPoints } from './spreadToGrid.js';
import { createIndexAndSaveToDisk } from './createIndexAndSaveToDisk.js';
import { mergeTinyDatasets } from './mergeTinyDatasets.js';
import { generateDataForWebsite } from './stats/generateDataForWebsite.js';
import { writeToRunHistory } from './stats/writeToRunHistory.js';

const MSG = 'invalid value returned by your callback function';

function isTagDiffEmpty(diff: TagDiff) {
  for (const key in diff) {
    if (key === '__action' && diff[key] === 'edit') continue;
    return false;
  }
  return true;
}

function hasDiff(diff: ConflationDiff | undefined): diff is ConflationDiff {
  if (!diff) return false;
  if (typeof diff !== 'object') throw new TypeError(MSG);
  if (typeof diff.tags !== 'object') throw new TypeError(MSG);
  return !!diff.geometry || !isTagDiffEmpty(diff.tags);
}

function createFeature(
  diff: ConflationDiff,
  osm?: OsmFeature,
  source?: SourceDataFeature,
): OsmPatchFeature {
  if (!osm && !source) throw new Error('requires either osm or source');

  if (osm) diff.tags.__action ||= 'edit';

  const [lng, lat] = (osm?.centroid || source?.centroid)!;
  return {
    type: 'Feature',
    id: osm?.id || source?.id,
    geometry:
      diff.tags.__action === 'delete'
        ? { type: 'Polygon', coordinates: createSquare({ lat, lng }) }
        : diff.geometry ||
          (diff.tags.__action === 'edit'
            ? { type: 'Polygon', coordinates: createDiamond({ lat, lng }) }
            : { type: 'Point', coordinates: [lng, lat] }),
    properties: diff.tags,
  };
}

export async function conflate(
  ctx: Ctx,
  sourceData: SourceData,
  osmData: OSMData,
): Promise<ConflateResult> {
  const osmDataById: Record<OsmId, OsmFeature> = { ...osmData.noRef };
  for (const cat of <const>['withRef', 'semi', 'duplicateRefs']) {
    for (const k in osmData[cat]) {
      const feature = osmData[cat][k as DatasetId]!;
      if (Array.isArray(feature)) {
        for (const item of feature) {
          osmDataById[item.id] = item;
        }
      } else {
        osmDataById[feature.id] = feature;
      }
    }
  }

  const output: {
    [category: string]: { [sector: string]: OsmPatchFeature[] };
  } = {};

  function handleExtra(
    extra: ConflationResultExtra | undefined,
    category: string,
    sector: string,
  ) {
    if (!extra) return;
    if (extra.warnings?.length) ctx.warnings.push(...extra.warnings);
    const extraFeatures = extra.extraFeatures || extra.createFeatures;
    if (extraFeatures) {
      output[category] ||= {};
      output[category][sector] ||= [];
      output[category][sector].push(...extraFeatures);
    }
  }

  const matches: MatchOutput = JSON.parse(
    await fs.readFile(ctx.tempFileNames.matches, 'utf8'),
  );

  // 1.
  for (const { source, osm } of matches[MatchType.OneToOne]) {
    const osmFeature = osmDataById[osm]!;
    const sourceFeature = sourceData[source]!;

    if (osmFeature.flags & OsmFlags.IsCheckedRecently) continue;

    const result = await ctx.callbacks.mergeOneToOne({
      osm: osmFeature,
      source: sourceFeature,
    });
    if (!result) continue;
    if (typeof result !== 'object') throw new TypeError(MSG);

    const category = result.category || '';
    const sector = result.group || osmFeature.sectors[0]!;
    handleExtra(result.extra, category, sector);

    if (!hasDiff(result.diff)) continue;
    output[category] ||= {};
    output[category][sector] ||= [];
    output[category][sector].push(
      createFeature(result.diff, osmFeature, sourceFeature),
    );
  }

  // 2.
  for (const { source, osm } of matches[MatchType.OneToMany]) {
    const osmFeatures = osm
      .map((id) => osmDataById[id]!)
      .filter((osmFeature) => !(osmFeature.flags & OsmFlags.IsCheckedRecently));

    const sourceFeature = sourceData[source]!;

    const result = await ctx.callbacks.mergeOneToMany?.({
      osm: osmFeatures,
      source: sourceFeature,
    });
    if (!result) continue;
    if (typeof result !== 'object') throw new TypeError(MSG);
    if (typeof result.diffPerFeature !== 'object') {
      throw new TypeError(MSG);
    }

    const category = result.category || '';
    handleExtra(
      result.extra,
      category,
      result.group || osmFeatures[0]?.sectors[0] || sourceFeature.sectors[0]!,
    );

    for (const _osmId in result.diffPerFeature) {
      const osmId = <OsmId>_osmId;
      const osmFeature = osmFeatures.find((f) => f.id === osmId)!;
      const diff = result.diffPerFeature[osmId]!;
      if (typeof diff !== 'object') throw new TypeError(MSG);
      if (!hasDiff(diff)) continue;

      const group = result.group || osmFeature.sectors[0]!;
      output[category] ||= {};
      output[category][group] ||= [];
      output[category][group].push(
        createFeature(diff, osmFeature, sourceFeature),
      );
    }
  }

  // 3.
  for (const _osmId in matches[MatchType.ManyToOne]) {
    const osmId = <OsmId>_osmId;
    const osmFeature = osmDataById[osmId]!;
    const sourceFeatures = matches[MatchType.ManyToOne][osmId]!.map(
      (id) => sourceData[id]!,
    );

    if (osmFeature.flags & OsmFlags.IsCheckedRecently) continue;

    const result = await ctx.callbacks.mergeManyToOne?.({
      osm: osmFeature,
      source: sourceFeatures,
    });
    if (!result) continue;
    if (typeof result !== 'object') throw new TypeError(MSG);

    const category = result.category || '';
    const group = result.group || osmFeature.sectors[0]!;
    handleExtra(result.extra, category, group);

    if (!hasDiff(result.diff)) continue;
    output[category] ||= {};
    output[category][group] ||= [];
    output[category][group].push(createFeature(result.diff, osmFeature));
  }

  // 4.
  for (const { source, osm } of matches[MatchType.ManyToMany]) {
    const osmFeatures = osm
      .map((id) => osmDataById[id]!)
      .filter((osmFeature) => !(osmFeature.flags & OsmFlags.IsCheckedRecently));

    const sourceFeature = source.map((id) => sourceData[id]!);

    const result = await ctx.callbacks.mergeManyToMany?.({
      osm: osmFeatures,
      source: sourceFeature,
    });
    if (!result) continue;
    if (typeof result !== 'object') throw new TypeError(MSG);
    if (typeof result.diffPerFeature !== 'object') {
      throw new TypeError(MSG);
    }

    const category = result.category || '';
    handleExtra(
      result.extra,
      category,
      result.group ||
        osmFeatures[0]?.sectors[0] ||
        sourceFeature[0]!.sectors[0]!,
    );

    for (const _osmId in result.diffPerFeature) {
      const osmId = <OsmId>_osmId;
      const osmFeature = osmFeatures.find((f) => f.id === osmId)!;
      const diff = result.diffPerFeature[osmId]!;
      if (typeof diff !== 'object') throw new TypeError(MSG);
      if (!hasDiff(diff)) continue;

      const group = result.group || osmFeature.sectors[0]!;
      output[category] ||= {};
      output[category][group] ||= [];
      output[category][group].push(createFeature(diff, osmFeature));
    }
  }

  // 5. deletions
  for (const idToDelete of matches[MatchType.Delete]) {
    const osmFeature = osmData.withRef[idToDelete]!;

    if (osmFeature.flags & OsmFlags.IsCheckedRecently) continue;

    // the business-side needs to decide for each feature, if it will outright
    // delete it, or just remove the relevant tags.
    const result = await ctx.callbacks.deleteFeature?.({ osm: osmFeature });
    if (!result) continue;
    if (typeof result !== 'object') throw new TypeError(MSG);

    const category = result.category || '';
    const group = result.group || osmFeature.sectors[0]!;
    handleExtra(result.extra, category, group);

    if (!hasDiff(result.diff)) continue;
    output[category] ||= {};
    output[category][group] ||= [];
    output[category][group].push(createFeature(result.diff, osmFeature));
  }

  // 6. to avoid reënqueuing these features twice, the business-side needs to
  // make a selection, and process the tagDiff at the same time.
  for (const pair of matches[MatchType.Guess]) {
    const sourceFeature = sourceData[pair.source]!;
    const result = await ctx.callbacks.create({
      source: sourceFeature,
      osmCandidates: pair.osmCandidates.map((osmId) => osmData.noRef[osmId]!),
    });
    if (!result) continue;
    if (typeof result !== 'object') throw new TypeError(MSG);

    const osmFeature = result.selection
      ? osmData.noRef[result.selection]!
      : undefined;

    const category = result.category || '';
    const group = result.group || osmFeature?.sectors[0] || 'unknown';
    handleExtra(result.extra, category, group);

    if (!hasDiff(result.diff)) continue;
    output[category] ||= {};
    output[category][group] ||= [];
    output[category][group].push(
      createFeature(result.diff, osmFeature, sourceFeature),
    );
  }

  const result = await ctx.callbacks.addCustomLayers?.();
  for (const category in result) {
    for (const group in result[category]) {
      handleExtra(result[category][group], category, group);
    }
  }

  const handlerReturn: OutputLayers = {};
  for (const category in output) {
    handlerReturn[category] ||= {};

    for (const group in output[category]) {
      const { changesetTags = {}, instructions } =
        (await ctx.callbacks.getChangesetTags?.({ category, group })) || {};

      // add some default changeset tags if not defined by the consumer
      /* eslint-disable dot-notation */
      changesetTags['created_by'] ||= 'osm-conflation-engine';
      changesetTags['import'] ||= 'yes';
      changesetTags['source'] ||= ctx.config.metadata.wiki_page;
      /* eslint-enable dot-notation */

      const features = output[category][group]!;
      if (ctx.callbacks.postprocessLayer) {
        await ctx.callbacks.postprocessLayer({
          category,
          group,
          osmData: osmDataById,
          sourceData,
          features,
        });
      }

      let groups = splitUntilSmallEnough(
        ctx,
        group,
        { changesetTags, instructions },
        features,
      );
      groups = normaliseNames(groups);
      Object.assign(handlerReturn[category], groups);
    }

    shiftOverlappingPoints(handlerReturn[category]);
    mergeTinyDatasets(handlerReturn[category]);
  }

  const metrics = await generateDataForWebsite(
    ctx,
    sourceData,
    osmData,
    matches,
    handlerReturn,
  );
  await createIndexAndSaveToDisk(ctx, metrics, matches, handlerReturn);
  await writeToRunHistory(metrics);

  return metrics;
}
