import { useEffect, useRef, useState } from 'react';
import type { OsmPatch } from 'osm-api';
import { getDataset } from '../../api/static.js';
import type { DatasetRow } from './SelectDatasetsStep/datasetColumns.js';

interface State {
  data: Record<string, OsmPatch>;
  errors: ReadonlySet<string>;
  pending: number;
}

export function useOsmPatchFiles(
  refTag: string,
  datasets: DatasetRow[],
  enabled: boolean,
) {
  // simpler than a useReducer
  const [state, setState] = useState<State>(() => ({
    data: {},
    errors: new Set(),
    pending: 0,
  }));

  /** dataset IDs */
  const inflightRef = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled) return;

    const toFetch = datasets.filter((v) => !inflightRef.current.has(v.title));
    if (!toFetch.length) return;

    for (const dataset of toFetch) {
      inflightRef.current.add(dataset.title);
    }

    /* eslint-disable-next-line @eslint-react/set-state-in-effect */
    setState((current) => ({
      ...current,
      pending: current.pending + toFetch.length,
    }));

    for (const { id, title } of toFetch) {
      getDataset(refTag, id)
        .then((osmPatch) => {
          setState((current) => {
            const errors = new Set(current.errors);
            errors.delete(title);
            return {
              data: { ...current.data, [title]: osmPatch },
              errors,
              pending: current.pending - 1,
            };
          });
        })
        .catch((error) => {
          console.error(error);
          inflightRef.current.delete(title);
          setState((current) => ({
            ...current,
            errors: new Set(current.errors).add(title),
            pending: current.pending - 1,
          }));
        });
    }
  }, [enabled, refTag, datasets]);

  return state;
}
