import { use, useEffect, useRef, useState } from 'react';
import type maplibregl from 'maplibre-gl';
import type { ExpressionSpecification } from 'maplibre-gl';
import type { Feature, GeoJsonGeometryTypes } from 'geojson';
import { LocaleContext } from '../../../context/LocaleContext.js';
import { calcBBox, getCentroid } from '../../../util/geo.js';
import {
  EMPTY_GEOJSON,
  IS_CENTROID,
  IS_HOVERED,
  IS_SELECTED,
  addHoverPopup,
  createMap,
  useSyncSelectedFeatures,
} from '../map-utils.js';
import classes from '../ProjectPage.module.css';
import {
  ACTIONS,
  ACTION_COLOURS,
  ACTION_LABELS,
  type FeatureRow,
} from './featureColumns.js';

const SOURCE = 'features';
const FILL_LAYER = 'features-fill';
const LINE_LAYER = 'features-outline';
const CIRCLE_LAYER = 'features-circle';
const CENTROID_LAYER = 'features-centroid';
const LAYERS = [FILL_LAYER, LINE_LAYER, CIRCLE_LAYER, CENTROID_LAYER];

/** at lower zoom levels, polygons are also drawn as a centroid point */
const CENTROID_MAX_ZOOM = 14;

const isType = (...types: GeoJsonGeometryTypes[]): ExpressionSpecification => [
  'in',
  ['geometry-type'],
  ['literal', types],
];

const COLOUR: ExpressionSpecification = [
  'case',
  IS_SELECTED,
  ['get', 'colour'],
  '#868e96',
];

const CIRCLE_PAINT: maplibregl.CircleLayerSpecification['paint'] = {
  'circle-color': COLOUR,
  'circle-opacity': ['case', IS_SELECTED, 1, IS_HOVERED, 0.65, 0.3],
  'circle-radius': ['case', IS_HOVERED, 7, 5],
  'circle-stroke-color': ['case', IS_SELECTED, ['get', 'colour'], '#868e96'],
  'circle-stroke-opacity': ['case', IS_SELECTED, 1, IS_HOVERED, 0.65, 0.3],
  'circle-stroke-width': ['case', IS_SELECTED, 1.5, 0],
};

export interface FeatureMapProps {
  rows: FeatureRow[];
  /** the IDs of the features which are ticked in the table */
  selected: ReadonlySet<string>;
  /** must be stable! called when a feature is clicked */
  onToggle(id: string): void;
}

export const FeatureMap: React.FC<FeatureMapProps> = ({
  rows,
  selected,
  onToggle,
}) => {
  const { $ } = use(LocaleContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map>();

  /** the features currently rendered, so that we only re-fit when they change */
  const renderedIdsRef = useRef<string>(undefined);

  useEffect(() => {
    const newMap = createMap(containerRef.current!);

    newMap.on('load', () => {
      newMap.addSource(SOURCE, {
        type: 'geojson',
        data: EMPTY_GEOJSON,
        promoteId: 'id',
      });
      newMap.addLayer({
        id: FILL_LAYER,
        type: 'fill',
        source: SOURCE,
        filter: isType('Polygon', 'MultiPolygon'),
        paint: {
          'fill-color': COLOUR,
          'fill-opacity': ['case', IS_SELECTED, 0.5, IS_HOVERED, 0.3, 0.12],
        },
      });
      newMap.addLayer({
        id: LINE_LAYER,
        type: 'line',
        source: SOURCE,
        filter: isType(
          'LineString',
          'MultiLineString',
          'Polygon',
          'MultiPolygon',
        ),
        paint: {
          'line-color': COLOUR,
          'line-opacity': ['case', IS_SELECTED, 1, IS_HOVERED, 0.65, 0.3],
          'line-width': ['case', ['any', IS_SELECTED, IS_HOVERED], 3, 1],
        },
      });
      newMap.addLayer({
        id: CIRCLE_LAYER,
        type: 'circle',
        source: SOURCE,
        filter: ['all', isType('Point', 'MultiPoint'), ['!', IS_CENTROID]],
        paint: CIRCLE_PAINT,
      });
      newMap.addLayer({
        id: CENTROID_LAYER,
        type: 'circle',
        source: SOURCE,
        maxzoom: CENTROID_MAX_ZOOM,
        filter: IS_CENTROID,
        paint: CIRCLE_PAINT,
      });
      setMap(newMap);
    });

    const { clearHover } = addHoverPopup(newMap, SOURCE, LAYERS, 'id');

    newMap.on('click', LAYERS, (event) => {
      const feature = event.features?.[0];
      if (feature) onToggle(feature.properties.id);
    });

    return () => {
      clearHover();
      newMap.remove();
    };
  }, [onToggle]);

  useEffect(() => {
    if (!map) return;

    map.getSource<maplibregl.GeoJSONSource>(SOURCE)?.setData({
      type: 'FeatureCollection',
      features: rows.flatMap((row) => {
        const feature: Feature = {
          type: 'Feature',
          geometry: row.original.geometry,
          properties: {
            id: row.id,
            colour: ACTION_COLOURS[row.action].hex,
            label: [row.label, row.dataset].filter(Boolean).join(' — '),
          },
        };
        const { type } = row.original.geometry;
        const centroid =
          (type === 'Polygon' || type === 'MultiPolygon') &&
          getCentroid(feature);

        return centroid ? [feature, centroid] : [feature];
      }),
    });

    const ids = rows.map((row) => row.id).join('␞');
    if (ids === renderedIdsRef.current) return;
    renderedIdsRef.current = ids;

    const bounds = calcBBox(rows.map((row) => row.original.geometry));
    if (bounds) map.fitBounds(bounds, { padding: 32, animate: false });
  }, [map, rows]);

  // grey out the features which aren't ticked in the table
  useSyncSelectedFeatures(map, SOURCE, selected);

  return (
    <>
      <div ref={containerRef} className={classes.map} />

      <div className={classes.legend}>
        <strong>{$('FeatureMap.legend_title')}</strong>
        {ACTIONS.map((action) => (
          <div key={action}>
            <i
              className={classes.swatch}
              style={{ background: ACTION_COLOURS[action].hex }}
            />
            {ACTION_LABELS($)[action]}
          </div>
        ))}
      </div>
    </>
  );
};
