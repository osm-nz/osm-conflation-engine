import { use, useMemo } from 'react';
import type { ConflateResult } from '@osm-conflation-engine/cli';
import { LocaleContext } from '../../context/LocaleContext.js';
import { PieChart, type PieSlice } from './PieChart.js';
import { COLOURS, NODE_LABELS } from './Sankey.js';

const RESULTS = ['perfect', 'edit', 'create', 'delete'] as const;

export const ConflationResult: React.FC<{ metrics: ConflateResult }> = ({
  metrics,
}) => {
  const { $ } = use(LocaleContext);
  const { conflated } = metrics.countsByPhase;
  const refTag = metrics.config.merge.osm_key;

  const data = useMemo(() => {
    const labels = NODE_LABELS($, refTag);

    return RESULTS.map((key): PieSlice => ({
      id: labels[key],
      value: conflated[key],
      colour: COLOURS[key],
    })).filter((slice) => slice.value > 0);
  }, [$, conflated, refTag]);

  return (
    <PieChart
      title={$('ConflationResult.title')}
      description={$('ConflationResult.description')}
      data={data}
    />
  );
};
