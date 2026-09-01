import { use, useMemo } from 'react';
import { Progress } from '@mantine/core';
import type { IgnoredRow } from '../../api/conflation.js';
import { LocaleContext } from '../../context/LocaleContext.js';
import { ReviewDecision } from './columns.js';

export const ReviewProgress: React.FC<{ rows: IgnoredRow[] }> = ({ rows }) => {
  const { $ } = use(LocaleContext);

  const sections = useMemo(() => {
    const approved = rows.filter(
      (r) => r.review_decision === ReviewDecision.Approved,
    ).length;
    const rejected = rows.filter(
      (r) => r.review_decision === ReviewDecision.Rejected,
    ).length;
    const unreviewed = rows.length - approved - rejected;

    return [
      {
        id: 'approved',
        label: $('ReviewDecision.Approved'),
        count: approved,
        color: 'green',
      },
      {
        id: 'rejected',
        label: $('ReviewDecision.Rejected'),
        count: rejected,
        color: 'red',
      },
      {
        id: 'unreviewed',
        label: $('ReviewDecision.UnReviewed'),
        count: unreviewed,
        color: 'gray',
      },
    ];
  }, [rows, $]);

  return (
    <Progress.Root size="xl">
      {sections.map((section) => (
        <Progress.Section
          key={section.id}
          value={(section.count / rows.length) * 100}
          color={section.color}
        >
          <Progress.Label>
            {$('ReviewProgress.count_label', {
              label: section.label,
              count: section.count,
            })}
          </Progress.Label>
        </Progress.Section>
      ))}
    </Progress.Root>
  );
};
