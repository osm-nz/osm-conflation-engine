import type { OsmFeatureType } from 'osm-api';
import type { LineString } from 'geojson';
import { geoDistance } from 'd3-geo';
import type {
  Action,
  OsmFeatureTypeShort,
  OsmId,
  Vec2,
} from '../../../types/callbacks.def.js';
import {
  type Ctx,
  type MatchOutput,
  MatchType,
  type OutputLayers,
} from '../../../types/internal.def.js';
import { EARTH_RADIUS } from '../../../common/geo.js';

const OSM_TYPES: Record<OsmFeatureTypeShort, OsmFeatureType> = {
  n: 'node',
  w: 'way',
  r: 'relation',
};

const osmIdToUrl = (osmId: string) =>
  `https://osm.org/${OSM_TYPES[osmId[0] as OsmFeatureTypeShort]}/${osmId.slice(1)}`;

const osmIdToLink = (osmId: string) => `[${osmId}](${osmIdToUrl(osmId)})`;

function generateMatchReport(ctx: Ctx, data: MatchOutput, type: MatchType) {
  function sourceIdToLink(id: string) {
    if (!ctx.formatterUrl) return id;
    const url = ctx.formatterUrl.replaceAll('$1', id);
    return `[${id}](${url})`;
  }

  let report = `# Matches – ${MatchType[type]}\n\n`;
  const list = data[type];
  if (Array.isArray(list)) {
    for (const row of list) {
      if (typeof row === 'string') {
        report += `- ${row}\n`; // delete is special
        continue;
      }

      const source =
        'source' in row
          ? Array.isArray(row.source)
            ? row.source
            : [row.source]
          : [];
      const osm =
        'osm' in row
          ? Array.isArray(row.osm)
            ? row.osm
            : [row.osm]
          : 'osmCandidates' in row
            ? row.osmCandidates
            : [];

      const sep = 'osmCandidates' in row ? ' or ' : ' + ';

      report += `- ${source.map(sourceIdToLink).join(' + ') || '?'} ⇄ ${osm.map(osmIdToLink).join(sep) || '?'}\n`;
    }
  } else {
    // must be many:1
    for (const osmId in list) {
      const source = list[osmId as OsmId] || [];
      report += `- ${source.map(sourceIdToLink).join(' + ') || '?'} ⇄ ${osmIdToLink(osmId)}\n`;
    }
  }

  return report;
}

function generateConflationReport(data: OutputLayers, action: Action) {
  let report = `# Conflation – ${action}\n\n`;
  for (const i in data) {
    const h2 = `\n## ${i}\n\n`;
    report += h2;
    for (const j in data[i]) {
      const h3 = `\n### ${j}\n\n`;
      report += h3;
      for (const feature of data[i][j]!.features) {
        const thisAction = feature.properties.__action || 'create';
        if (thisAction !== action) continue;

        const id =
          action === 'create' ? feature.id : osmIdToLink(feature.id as OsmId);

        // TODO: include diff before/after, can this be in stored in the osmPatch file too?
        const tagDiff =
          Object.entries(feature.properties)
            .filter(([k]) => !k.startsWith('__'))
            .map((kv) => kv.join('='))
            .join(' + ') || '∅';

        switch (action) {
          case 'create':
          case 'edit':
          case 'delete': {
            report += `- ${id}\t${tagDiff}\n`;
            break;
          }

          case 'move': {
            const [[oldLon, oldLat], [newLon, newLat]] = (
              feature.geometry as LineString
            ).coordinates as [Vec2, Vec2];

            const distance =
              EARTH_RADIUS * geoDistance([oldLon, oldLat], [newLon, newLat]);

            const link = `${osmIdToUrl(feature.id as OsmId)}?mlat=${newLat}&mlon=${newLon}#map=${13}/${newLat}/${newLon}`;

            report += `- [${feature.id}](${link})\tneeds to move ${distance | 0}m to ${newLat},${newLon}\n`;
            break;
          }

          default: {
            throw new TypeError(action satisfies never);
          }
        }
      }

      // delete the heading if the section is empty
      if (report.endsWith(h3)) report = report.slice(0, -h3.length);
    }

    // delete the heading if the section is empty
    if (report.endsWith(h2)) report = report.slice(0, -h2.length);
  }
  return report;
}

export function generateReports(
  ctx: Ctx,
  matches: MatchOutput,
  conflated: OutputLayers,
) {
  const reports: Record<string, string> = {
    // match
    'report-match-OneToOne.md': generateMatchReport(
      ctx,
      matches,
      MatchType.OneToOne,
    ),
    'report-match-OneToMany.md': generateMatchReport(
      ctx,
      matches,
      MatchType.OneToMany,
    ),
    'report-match-ManyToMany.md': generateMatchReport(
      ctx,
      matches,
      MatchType.ManyToMany,
    ),
    'report-match-ManyToOne.md': generateMatchReport(
      ctx,
      matches,
      MatchType.ManyToOne,
    ),
    'report-match-Delete.md': generateMatchReport(
      ctx,
      matches,
      MatchType.Delete,
    ),
    'report-match-Guess.md': generateMatchReport(ctx, matches, MatchType.Guess),

    // conflation
    'report-conflation-create.md': generateConflationReport(
      conflated,
      'create',
    ),
    'report-conflation-edit.md': generateConflationReport(conflated, 'edit'),
    'report-conflation-move.md': generateConflationReport(conflated, 'move'),
    'report-conflation-delete.md': generateConflationReport(
      conflated,
      'delete',
    ),
  };

  for (const report in reports) {
    if (reports[report]!.length > 5_000_000) {
      reports[report] = '_file too large_';
    }
  }

  return reports;
}
