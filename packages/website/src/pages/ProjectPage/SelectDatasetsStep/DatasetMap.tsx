import { use, useEffect, useRef, useState } from 'react';
import type maplibregl from 'maplibre-gl';
import type { Feature } from 'geojson';
import { LocaleContext } from '../../../context/LocaleContext.js';
import {
  COLOUR_SCALE,
  getColourFromScale,
  getColourScaleLabel,
} from '../../../util/colour.js';
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
import { isTruthy } from '../../../util/object.js';
import type { DatasetRow } from './datasetColumns.js';

const SOURCE = 'datasets';
const FILL_LAYER = 'datasets-fill';
const LINE_LAYER = 'datasets-outline';
const CENTROID_LAYER = 'datasets-centroid';
const LAYERS = [FILL_LAYER, CENTROID_LAYER];

/** at lower zoom levels, polygons are also drawn as a centroid point */
const CENTROID_MAX_ZOOM = 10;

export interface DatasetMapProps {
  rows: DatasetRow[];
  selected: ReadonlySet<string>;
  /** must be stable! */
  onToggle(title: string): void;
  /** must be stable! */
  onHide(title: string): void;
}

export const DatasetMap: React.FC<DatasetMapProps> = ({
  rows,
  selected,
  onToggle,
  onHide,
}) => {
  const { $, locale } = use(LocaleContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map>();

  const skipNextFitBoundsRef = useRef(false);
  const renderedIdsRef = useRef<string>(undefined);

  useEffect(() => {
    const newMap = createMap(containerRef.current!);

    newMap.on('load', () => {
      newMap.addSource(SOURCE, {
        type: 'geojson',
        data: EMPTY_GEOJSON,
        promoteId: 'title',
      });
      newMap.addLayer({
        id: FILL_LAYER,
        type: 'fill',
        source: SOURCE,
        filter: ['!', IS_CENTROID],
        paint: {
          'fill-color': ['get', 'colour'],
          'fill-opacity': ['case', IS_SELECTED, 0.75, IS_HOVERED, 0.55, 0.3],
        },
      });
      newMap.addLayer({
        id: LINE_LAYER,
        type: 'line',
        source: SOURCE,
        filter: ['!', IS_CENTROID],
        paint: {
          'line-color': [
            'case',
            ['any', IS_HOVERED, IS_SELECTED],
            '#000',
            ['get', 'colour'],
          ],
          'line-width': ['case', ['any', IS_HOVERED, IS_SELECTED], 2, 1],
        },
      });
      newMap.addLayer({
        id: CENTROID_LAYER,
        type: 'circle',
        source: SOURCE,
        maxzoom: CENTROID_MAX_ZOOM,
        filter: IS_CENTROID,
        paint: {
          'circle-color': ['get', 'colour'],
          'circle-opacity': 0.9,
          'circle-radius': ['case', IS_HOVERED, 7, 5],
          'circle-stroke-color': '#000',
          'circle-stroke-width': [
            'case',
            ['any', IS_HOVERED, IS_SELECTED],
            2,
            0,
          ],
        },
      });
      setMap(newMap);
    });

    const { clearHover } = addHoverPopup(newMap, SOURCE, LAYERS, 'title');

    newMap.on('click', LAYERS, (event) => {
      const feature = event.features?.[0];
      if (feature) onToggle(feature.properties.title);
    });

    // right click to hide the dataset
    newMap.on('contextmenu', LAYERS, (event) => {
      const feature = event.features?.[0];
      if (!feature) return;

      event.originalEvent.preventDefault();
      skipNextFitBoundsRef.current = true;
      clearHover();
      onHide(feature.properties.title);
    });

    return () => {
      clearHover();
      newMap.remove();
    };
  }, [onToggle, onHide]);

  // render the datasets, and fit the map to them if the list changed
  useEffect(() => {
    if (!map) return;

    map.getSource<maplibregl.GeoJSONSource>(SOURCE)?.setData({
      type: 'FeatureCollection',
      features: rows.flatMap((row) => {
        const f: Feature = {
          ...row.original,
          properties: {
            ...row.original.properties,
            colour: getColourFromScale(row.totalCount),
            label: `${row.title} (${row.count || $('DatasetMap.feature_count', { count: row.totalCount })})`,
          },
        };
        return [f, getCentroid(f)].filter(isTruthy);
      }),
    });

    // bail if nothing has changed
    const ids = rows.map((row) => row.title).join('␞');
    if (ids === renderedIdsRef.current) return;
    renderedIdsRef.current = ids;

    if (skipNextFitBoundsRef.current) {
      skipNextFitBoundsRef.current = false;
      return;
    }

    const bounds = calcBBox(rows.map((row) => row.original.geometry));
    if (bounds) map.fitBounds(bounds, { padding: 32, animate: false });
  }, [map, rows, $]);

  useSyncSelectedFeatures(map, SOURCE, selected);

  return (
    <>
      <div ref={containerRef} className={classes.map} />

      <div className={classes.legend}>
        <strong>{$('DatasetMap.legend_title')}</strong>
        {COLOUR_SCALE.map((step, index) => (
          <div key={step.from}>
            <i className={classes.swatch} style={{ background: step.colour }} />
            {getColourScaleLabel(index, locale)}
          </div>
        ))}
      </div>
    </>
  );
};
