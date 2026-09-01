import { use, useMemo } from 'react';
import type { IgnoredRow } from '../../api/conflation.js';
import { LocaleContext } from '../../context/LocaleContext.js';
import { ReviewDecision } from '../IgnoredPage/columns.js';
import { GREY, PieChart, type PieSlice } from './PieChart.js';

export const IgnoredByReview: React.FC<{
  ignoreList: IgnoredRow[] | undefined;
}> = ({ ignoreList }) => {
  const { $ } = use(LocaleContext);

  const data = useMemo(() => {
    if (!ignoreList) return undefined;

    const approved = ignoreList.filter(
      (row) => row.review_decision === ReviewDecision.Approved,
    ).length;
    const rejected = ignoreList.filter(
      (row) => row.review_decision === ReviewDecision.Rejected,
    ).length;

    return [
      { id: $('ReviewDecision.Approved'), value: approved, colour: '#0ca30c' },
      { id: $('ReviewDecision.Rejected'), value: rejected, colour: '#d03b3b' },
      {
        id: $('ReviewDecision.UnReviewed'),
        value: ignoreList.length - approved - rejected,
        colour: GREY,
      },
    ].filter((slice): slice is PieSlice => slice.value > 0);
  }, [$, ignoreList]);

  return (
    <PieChart
      title={$('IgnoredByReview.title')}
      description={$('IgnoredByReview.description')}
      data={data}
    />
  );
};
