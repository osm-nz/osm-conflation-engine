import { use } from 'react';
import { Progress } from '@mantine/core';
import type { Count } from '../types/general.def.js';
import { HostContext } from '../context/HostContext.js';

const { format: formatNumber } = new Intl.NumberFormat(navigator.languages);

export const getOkayCount = (count: Count) =>
  count.total - count.add - count.edit - count.skipped;

export const ProgressBar: React.FC<{ count: Count }> = ({ count }) => {
  const { $ } = use(HostContext);
  const chunks = [
    { value: getOkayCount(count), color: 'green' },
    { value: count.edit, color: 'orange' },
    { value: count.add, color: 'pink' },
    { value: count.skipped, color: 'gray' },
  ];
  const sum = chunks.reduce((a, b) => a + b.value, 0);

  return (
    <Progress.Root size="xl" miw={300} style={{ contain: 'inline-size' }}>
      {sum ? (
        chunks.map((chunk) => (
          <Progress.Section
            key={chunk.color}
            value={(chunk.value / count.total) * 100}
            color={chunk.color}
          >
            <Progress.Label>{formatNumber(chunk.value)}</Progress.Label>
          </Progress.Section>
        ))
      ) : (
        <Progress.Section value={100} color="gray">
          <Progress.Label>{$('Common.no_data')}</Progress.Label>
        </Progress.Section>
      )}
    </Progress.Root>
  );
};
