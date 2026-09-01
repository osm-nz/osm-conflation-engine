import { use, useMemo } from 'react';
import { Progress } from '@mantine/core';
import type { IgnoredRow } from '../../api/conflation.js';
import { LocaleContext } from '../../context/LocaleContext.js';
import { ReviewDecision } from './columns.js';

export const ReviewProgress: React.FC<{ rows: IgnoredRow[] }> = ({ rows }) => {
  const { locale } = use(LocaleContext);

  const sections = useMemo(() => {
    const approved = rows.filter(
      (r) => r.review_decision === ReviewDecision.Approved,
    ).length;
    const rejected = rows.filter(
      (r) => r.review_decision === ReviewDecision.Rejected,
    ).length;
    const unreviewed = rows.length - approved - rejected;

    return [
      { label: 'Approved', count: approved, color: 'green' },
      { label: 'Rejected', count: rejected, color: 'red' },
      { label: 'Unreviewed', count: unreviewed, color: 'gray' },
    ];
  }, [rows]);

  return (
    <Progress.Root size="xl">
      {sections.map((section) => (
        <Progress.Section
          key={section.label}
          value={(section.count / rows.length) * 100}
          color={section.color}
        >
          <Progress.Label>
            {section.label} ({section.count.toLocaleString(locale)})
          </Progress.Label>
        </Progress.Section>
      ))}
    </Progress.Root>
  );
};
