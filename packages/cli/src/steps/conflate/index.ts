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
import { splitUntilSmallEnough } from './splitUntilSmallEnough.js';
import { shiftOverlappingPoints } from './spreadToGrid.js';
import { createIndexAndSaveToDisk } from './createIndexAndSaveToDisk.js';

const MSG = 'invalid value returned by your callback function';

function isTagDiffEmpty(diff: TagDiff) {
  for (const key in diff) {
    if (key === '__action' && diff[key] === 'edit') continue;
    return false;
  }
  return true;
}

function hasDiff(diff: ConflationDiff) {
  if (typeof diff !== 'object') throw new TypeError(MSG);
  if (typeof diff.tags !== 'object') throw new TypeError(MSG);
  return !!diff.geometry || !isTagDiffEmpty(diff.tags);
}

function createFeature(
  diff: ConflationDiff,
  o?: OsmFeature,
  s?: SourceDataFeature,
): OsmPatchFeature {
  if (!o && !s) throw new Error('requires either o or s');

  if (o) diff.tags.__action ||= 'edit';

  const [lng, lat] = (o?.centroid || s?.centroid)!;
  return {
    type: 'Feature',
    id: o?.id || s?.id,
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
    if (extra.createFeatures) {
      output[category] ||= {};
      output[category][sector] ||= [];
      output[category][sector].push(...extra.createFeatures);
    }
  }

  const matches: MatchOutput = JSON.parse(
    await fs.readFile(ctx.tempFileNames.matches, 'utf8'),
  );

  // 1.
  for (const { source: s, osm: o } of matches[MatchType.OneToOne]) {
    const oFeature = osmDataById[o]!;
    const sFeature = sourceData[s]!;

    if (oFeature.flags & OsmFlags.IsCheckedRecently) continue;

    const result = await ctx.callbacks.mergeOneToOne({
      osm: oFeature,
      source: sFeature,
    });
    if (typeof result !== 'object') throw new TypeError(MSG);
    if (!hasDiff(result.diff)) continue;

    const category = result.category || '';
    const sector = result.group || oFeature.sectors[0]!;
    handleExtra(result.extra, category, sector);
    output[category] ||= {};
    output[category][sector] ||= [];
    output[category][sector].push(
      createFeature(result.diff, oFeature, sFeature),
    );
  }

  // 2.
  for (const { source, osm } of matches[MatchType.OneToMany]) {
    const oFeatures = osm
      .map((id) => osmDataById[id]!)
      .filter((oFeature) => !(oFeature.flags & OsmFlags.IsCheckedRecently));

    const sFeature = sourceData[source]!;

    const result = await ctx.callbacks.mergeOneToMany?.({
      osm: oFeatures,
      source: sFeature,
    });
    if (!result) continue;
    if (typeof result !== 'object') throw new TypeError(MSG);
    if (typeof result.diffPerFeature !== 'object') {
      throw new TypeError(MSG);
    }

    for (const _osmId in result.diffPerFeature) {
      const osmId = <OsmId>_osmId;
      const oFeature = oFeatures.find((f) => f.id === osmId)!;
      const diff = result.diffPerFeature[osmId]!;
      if (typeof diff !== 'object') throw new TypeError(MSG);
      if (!hasDiff(diff)) continue;

      const category = result.category || '';
      const group = result.group || oFeature.sectors[0]!;
      handleExtra(result.extra, category, group);
      output[category] ||= {};
      output[category][group] ||= [];
      output[category][group].push(createFeature(diff, oFeature, sFeature));
    }
  }

  // 3.
  for (const _osmId in matches[MatchType.ManyToOne]) {
    const osmId = <OsmId>_osmId;
    const oFeature = osmDataById[osmId]!;
    const sFeatures = matches[MatchType.ManyToOne][osmId]!.map(
      (id) => sourceData[id]!,
    );

    if (oFeature.flags & OsmFlags.IsCheckedRecently) continue;

    const result = await ctx.callbacks.mergeManyToOne?.({
      osm: oFeature,
      source: sFeatures,
    });
    if (!result) continue;
    if (typeof result !== 'object') throw new TypeError(MSG);
    if (typeof result.diff !== 'object') throw new TypeError(MSG);
    if (!hasDiff(result.diff)) continue;

    const category = result.category || '';
    const group = result.group || oFeature.sectors[0]!;
    handleExtra(result.extra, category, group);
    output[category] ||= {};
    output[category][group] ||= [];
    output[category][group].push(createFeature(result.diff, oFeature));
  }

  // 4.
  for (const { source, osm } of matches[MatchType.ManyToMany]) {
    const oFeatures = osm
      .map((id) => osmDataById[id]!)
      .filter((oFeature) => !(oFeature.flags & OsmFlags.IsCheckedRecently));

    const sFeature = source.map((id) => sourceData[id]!);

    const result = await ctx.callbacks.mergeManyToMany?.({
      osm: oFeatures,
      source: sFeature,
    });
    if (!result) continue;
    if (typeof result !== 'object') throw new TypeError(MSG);
    if (typeof result.diffPerFeature !== 'object') {
      throw new TypeError(MSG);
    }

    for (const _osmId in result.diffPerFeature) {
      const osmId = <OsmId>_osmId;
      const oFeature = oFeatures.find((f) => f.id === osmId)!;
      const diff = result.diffPerFeature[osmId]!;
      if (typeof diff !== 'object') throw new TypeError(MSG);
      if (!hasDiff(diff)) continue;

      const category = result.category || '';
      const group = result.group || oFeature.sectors[0]!;
      handleExtra(result.extra, category, group);
      output[category] ||= {};
      output[category][group] ||= [];
      output[category][group].push(createFeature(diff, oFeature));
    }
  }

  // 5. deletions
  for (const idToDelete of matches[MatchType.Delete]) {
    const oFeature = osmData.withRef[idToDelete]!;

    if (oFeature.flags & OsmFlags.IsCheckedRecently) continue;

    // the business-side needs to decide for each feature, if it will outright
    // delete it, or just remove the relevant tags.
    const result = await ctx.callbacks.deleteFeature?.({ osm: oFeature });
    if (!result) continue;
    if (typeof result !== 'object') throw new TypeError(MSG);
    if (typeof result.diff !== 'object') throw new TypeError(MSG);
    if (!hasDiff(result.diff)) continue;

    const category = result.category || '';
    const group = result.group || oFeature.sectors[0]!;
    handleExtra(result.extra, category, group);
    output[category] ||= {};
    output[category][group] ||= [];
    output[category][group].push(createFeature(result.diff, oFeature));
  }

  // 6. to avoid reënqueuing these features twice, the business-side needs to
  // make a selection, and process the tagDiff at the same time.
  for (const pair of matches[MatchType.Guess]) {
    const sFeature = sourceData[pair.source]!;
    const result = await ctx.callbacks.create({
      source: sFeature,
      osmCandidates: pair.osmCandidates.map((osmId) => osmData.noRef[osmId]!),
    });
    if (!result) continue;
    if (typeof result !== 'object') throw new TypeError(MSG);
    if (typeof result.diff !== 'object') throw new TypeError(MSG);
    if (!hasDiff(result.diff)) continue;

    const oFeature = result.selection
      ? osmData.noRef[result.selection]!
      : undefined;

    const category = result.category || '';
    const group = result.group || oFeature?.sectors[0] || 'unknown';
    handleExtra(result.extra, category, group);
    output[category] ||= {};
    output[category][group] ||= [];
    output[category][group].push(
      createFeature(result.diff, oFeature, sFeature),
    );
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

      const groups = splitUntilSmallEnough(
        group,
        { changesetTags, instructions },
        features,
      );
      Object.assign(handlerReturn[category], groups);
    }

    // TODO: merge tiny datasets into adjacent sectors (using h3 API)
    shiftOverlappingPoints(handlerReturn[category]);
  }

  await createIndexAndSaveToDisk(ctx, handlerReturn);
  // TODO: generate stats and stats history

  const counts: ConflateResult['counts'] = {
    create: 0,
    edit: 0,
    delete: 0,
    perfect: 0,
  };
  for (const sectors of Object.values(handlerReturn).flatMap((v) =>
    Object.values(v),
  )) {
    for (const f of sectors.features) {
      if (f.properties.__action === 'edit') {
        counts.edit++;
      } else if (f.properties.__action === 'delete') {
        counts.delete++;
      } else {
        counts.create++;
      }
    }
  }

  counts.perfect = osmData.count - counts.edit - counts.delete;
  return { counts };
}
