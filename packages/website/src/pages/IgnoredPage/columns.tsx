import { Anchor, Group, Text } from '@mantine/core';
import TimeAgo from 'react-timeago-i18n';
import type { IgnoredRow } from '../../api/conflation.js';
import type { Column, Filters } from '../../components/MegaTable/index.js';
import type { I$ } from '../../context/LocaleContext.js';
import { OidcBadge } from '../../components/OidcBadge.js';
import { ReviewBadge } from './ReviewBadge.js';

export enum ReviewDecision {
  UnReviewed = -1,
  Rejected = 0,
  Approved = 1,
}

type SortKey =
  'feature' | 'username' | 'timestamp' | 'source' | 'review' | 'note';

export const getColumns = ($: I$): readonly Column<IgnoredRow, SortKey>[] => {
  const reviewLabels: Record<ReviewDecision, string> = {
    [ReviewDecision.UnReviewed]: $('ReviewDecision.UnReviewed'),
    [ReviewDecision.Rejected]: $('ReviewDecision.Rejected'),
    [ReviewDecision.Approved]: $('ReviewDecision.Approved'),
  };

  return [
    {
      key: 'feature',
      label: $('IgnoredPage.col_feature'),
      width: '21%',
      render: (row) => (
        <>
          <Text size="sm" style={{ wordBreak: 'break-word' }}>
            {row.local_key}
          </Text>
          <Text size="xs" c="dimmed">
            {row.label} · {row.rowId}
          </Text>
        </>
      ),
      getSortValue: (row) => row.local_key,
      getFilterValue: (row) => [row.local_key, row.label, row.rowId].join('␞'),
      filter: { type: 'text' },
    },
    {
      key: 'username',
      label: $('IgnoredPage.col_deleted_by'),
      width: '13%',
      render: (row) => (
        <Group gap={4} wrap="nowrap">
          <Anchor
            href={`https://osm.org/user/${row.username}`}
            target="_blank"
            rel="noopener"
            size="sm"
          >
            {row.username}
          </Anchor>
          <OidcBadge
            operator={row.operator}
            timestamp={row.timestamp}
            size={12}
          />
        </Group>
      ),
      getSortValue: (row) => row.username,
      filter: { type: 'enum' },
    },
    {
      key: 'timestamp',
      label: $('IgnoredPage.col_when'),
      width: '10%',
      render: (row) => (
        <Text size="sm">
          {row.timestamp && <TimeAgo date={row.timestamp} />}
        </Text>
      ),
      getSortValue: (row) => row.timestamp,
    },
    {
      key: 'source',
      label: $('IgnoredPage.col_source'),
      width: '16%',
      render: (row) =>
        row.changeset && (
          <Anchor
            href={`https://osmcha.org/changesets/${row.changeset}`}
            target="_blank"
            rel="noopener"
            size="sm"
          >
            cs{row.changeset}
          </Anchor>
        ),
      getSortValue: (row) => `${row.changeset}`,
      getFilterValue: (row) => `cs${row.changeset}`,
      filter: { type: 'text' },
    },
    {
      key: 'review',
      label: $('IgnoredPage.col_review'),
      width: '10%',
      render: (row) => <ReviewBadge row={row} />,
      getSortValue: (row) => String(row.review_decision ?? -1),
      filter: {
        type: 'enum',
        getLabel: (value) => reviewLabels[+value as ReviewDecision] || '',
      },
    },
    {
      key: 'note',
      label: $('IgnoredPage.col_note'),
      width: '26%',
      render: (row) => (
        <Text size="xs" c="dimmed" style={{ wordBreak: 'break-word' }}>
          {row.note}
        </Text>
      ),
      getSortValue: (row) => row.note,
      filter: { type: 'text' },
    },
  ];
};

export const DEFAULT_SORT = { key: 'timestamp', desc: true } as const;

export const DEFAULT_FILTERS: Filters<SortKey> = {
  review: [ReviewDecision.Approved, ReviewDecision.UnReviewed].map(String),
};
