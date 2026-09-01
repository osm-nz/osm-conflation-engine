import { Progress } from '@mantine/core';
import type { ConflateResult } from '@osm-conflation-engine/cli';

export const OverallProgress: React.FC<{
  metrics: ConflateResult['countsByPhase']['conflated'];
}> = ({ metrics }) => {
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
        <Progress.Label>Perfect ({perfectPercent}%)</Progress.Label>
      </Progress.Section>
      <Progress.Section value={editPercent} color="orange">
        <Progress.Label>Tags Wrong ({editPercent}%)</Progress.Label>
      </Progress.Section>
      <Progress.Section value={createPercent} color="pink">
        <Progress.Label>Missing ({createPercent}%)</Progress.Label>
      </Progress.Section>
      <Progress.Section value={deletePercent} color="grape">
        <Progress.Label>To Delete ({deletePercent}%)</Progress.Label>
      </Progress.Section>
      {/* because we floor everything */}
      <Progress.Section value={gap} color="orange" />
    </Progress.Root>
  );
};
