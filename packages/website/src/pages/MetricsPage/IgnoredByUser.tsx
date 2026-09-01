import { use, useMemo } from 'react';
import type { IgnoredRow } from '../../api/conflation.js';
import { LocaleContext } from '../../context/LocaleContext.js';
import { GREY, PieChart, type PieSlice } from './PieChart.js';

const COLOURS = [
  '#2a78d6',
  '#eb6834',
  '#1baf7a',
  '#eda100',
  '#e87ba4',
  '#008300',
  '#4a3aa7',
];

export const IgnoredByUser: React.FC<{
  ignoreList: IgnoredRow[] | undefined;
}> = ({ ignoreList }) => {
  const { $ } = use(LocaleContext);

  const data = useMemo(() => {
    if (!ignoreList) return undefined;

    const countByUser = new Map<string, number>();
    for (const row of ignoreList) {
      countByUser.set(row.username, (countByUser.get(row.username) ?? 0) + 1);
    }

    const sorted = [...countByUser].toSorted(([, a], [, b]) => b - a);
    const slices = sorted
      .slice(0, COLOURS.length)
      .map(([id, value], index): PieSlice => ({
        id,
        value,
        colour: COLOURS[index]!,
      }));

    const otherCount = sorted
      .slice(COLOURS.length)
      .reduce((total, [, value]) => total + value, 0);
    if (otherCount) {
      slices.push({ id: $('Common.other'), value: otherCount, colour: GREY });
    }

    return slices;
  }, [$, ignoreList]);

  return (
    <PieChart
      title={$('IgnoredByUser.title')}
      description={$('IgnoredByUser.description')}
      data={data}
    />
  );
};
