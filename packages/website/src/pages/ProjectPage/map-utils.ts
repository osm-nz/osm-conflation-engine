import { useEffect, useRef } from 'react';
import maplibregl, {
  type ExpressionSpecification,
  type StyleSpecification,
} from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';

const STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

export const EMPTY_GEOJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

export const IS_HOVERED: ExpressionSpecification = [
  'boolean',
  ['feature-state', 'hover'],
  false,
];

export const IS_SELECTED: ExpressionSpecification = [
  'boolean',
  ['feature-state', 'selected'],
  false,
];

export const IS_CENTROID: ExpressionSpecification = [
  'boolean',
  ['get', 'centroid'],
  false,
];

export function createMap(container: HTMLElement) {
  const map = new maplibregl.Map({
    container,
    style: STYLE,
    center: [0, 0],
    zoom: 1,
    attributionControl: { compact: true },
  });
  map.addControl(new maplibregl.NavigationControl(), 'top-right');
  map.addControl(new maplibregl.ScaleControl());
  return map;
}

export function addHoverPopup(
  map: maplibregl.Map,
  source: string,
  layers: string[],
  idProperty: string,
) {
  const popup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 8,
  });

  let current: string | undefined;
  const setHovered = (id: string | undefined) => {
    if (current === id) return;
    if (current) {
      map.setFeatureState({ source, id: current }, { hover: false });
    }
    current = id;
    if (current) {
      map.setFeatureState({ source, id: current }, { hover: true });
    }
  };

  const clearHover = () => {
    map.getCanvas().style.cursor = '';
    setHovered(undefined);
    popup.remove();
  };

  map.on('mousemove', layers, (event) => {
    const feature = event.features?.[0];
    if (!feature) return;

    map.getCanvas().style.cursor = 'pointer';
    setHovered(feature.properties[idProperty]);
    popup.setLngLat(event.lngLat).setText(feature.properties.label).addTo(map);
  });
  map.on('mouseleave', layers, clearHover);

  return { clearHover };
}

/** syncs the `selected` param with the maplibre map */
export function useSyncSelectedFeatures(
  map: maplibregl.Map | undefined,
  source: string,
  selected: ReadonlySet<string>,
) {
  const appliedRef = useRef<ReadonlySet<string>>(new Set());

  useEffect(() => {
    if (!map) return;

    const applied = appliedRef.current;
    for (const id of applied) {
      if (!selected.has(id)) {
        map.setFeatureState({ source, id }, { selected: false });
      }
    }
    for (const id of selected) {
      if (!applied.has(id)) {
        map.setFeatureState({ source, id }, { selected: true });
      }
    }
    appliedRef.current = new Set(selected);
  }, [map, source, selected]);
}
