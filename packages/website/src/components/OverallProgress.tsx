import { use } from 'react';
import { Progress } from '@mantine/core';
import type { ConflateResult } from '@osm-conflation-engine/cli';
import { LocaleContext } from '../context/LocaleContext.js';

export const OverallProgress: React.FC<{
  metrics: ConflateResult['countsByPhase']['conflated'];
}> = ({ metrics }) => {
  const { $ } = use(LocaleContext);
  const { create, delete: deletē, edit, perfect } = metrics;
  const total = create + deletē + edit + perfect;

  const perfectPercent = ((perfect / total) * 100) | 0;
  const editPercent = ((edit / total) * 100) | 0;
  const createPercent = ((create / total) * 100) | 0;
  const deletePercent = ((deletē / total) * 100) | 0;
  const gap = Math.max(
    0,
    100 - perfectPercent - editPercent - createPercent - deletePercent,
  );

  return (
    <Progress.Root size="xl">
      <Progress.Section value={perfectPercent} color="green">
        <Progress.Label>
          {$('OverallProgress.percent_label', {
            label: $('Conflation.perfect'),
            percent: perfectPercent,
          })}
        </Progress.Label>
      </Progress.Section>
      <Progress.Section value={editPercent} color="orange">
        <Progress.Label>
          {$('OverallProgress.percent_label', {
            label: $('Conflation.edit'),
            percent: editPercent,
          })}
        </Progress.Label>
      </Progress.Section>
      <Progress.Section value={createPercent} color="pink">
        <Progress.Label>
          {$('OverallProgress.percent_label', {
            label: $('Conflation.create'),
            percent: createPercent,
          })}
        </Progress.Label>
      </Progress.Section>
      <Progress.Section value={deletePercent} color="grape">
        <Progress.Label>
          {$('OverallProgress.percent_label', {
            label: $('Conflation.delete'),
            percent: deletePercent,
          })}
        </Progress.Label>
      </Progress.Section>
      {/* because we floor everything */}
      <Progress.Section value={gap} color="orange" />
    </Progress.Root>
  );
};
