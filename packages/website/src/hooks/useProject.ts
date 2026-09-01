import { use, useCallback, useEffect, useMemo, useState } from 'react';
import type { ConflateResult, IndexFile } from '@osm-conflation-engine/cli';
import { useParams } from 'react-router';
import { getIndex, getMetrics } from '../api/static.js';
import { parseOperator } from '../util/conflation.js';
import { DataContext } from '../context/DataContext.js';
import { type IgnoredRow, getIgnoreList } from '../api/conflation.js';

export function useProject() {
  const refTag = useParams<'refTag'>().refTag!;
  const { allProjects } = use(DataContext);

  const [metrics, setMetrics] = useState<ConflateResult>();
  const [indexFile, setIndexFile] = useState<IndexFile>();
  const [ignoreList, setIgnoreList] = useState<IgnoredRow[]>();

  const project = useMemo(
    () => allProjects.find((p) => p.refTag === refTag),
    [allProjects, refTag],
  );

  const fetchIgnoreList = useCallback(() => {
    if (!project) return;
    getIgnoreList(project.refTag).then(setIgnoreList).catch(console.error);
  }, [project]);

  useEffect(() => {
    if (!project) return;

    // when the ref changes, fetch the new data
    /* eslint-disable @eslint-react/set-state-in-effect, react-hooks/set-state-in-effect  */
    setMetrics(undefined);
    setIndexFile(undefined);
    setIgnoreList(undefined);

    const operator = parseOperator(project.operator)!;
    getMetrics(operator).then(setMetrics).catch(console.error);
    getIndex(operator).then(setIndexFile).catch(console.error);
    fetchIgnoreList();
  }, [project, fetchIgnoreList]);

  const result = useMemo(
    () => ({
      project,
      metrics,
      indexFile,
      ignoreList,
      fetchIgnoreList,
    }),
    [project, metrics, indexFile, ignoreList, fetchIgnoreList],
  );

  return result;
}
