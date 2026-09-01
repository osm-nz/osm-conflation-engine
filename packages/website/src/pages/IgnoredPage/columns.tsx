import { Anchor, Group, Text } from '@mantine/core';
import TimeAgo from 'react-timeago-i18n';
import type { IgnoredRow } from '../../api/conflation.js';
import type { Column, Filters } from '../../components/MegaTable/index.js';
import { OidcBadge } from '../../components/OidcBadge.js';
import { ReviewBadge } from './ReviewBadge.js';

export enum ReviewDecision {
  UnReviewed = -1,
  Rejected = 0,
  Approved = 1,
}

const REVIEW_LABELS: Record<ReviewDecision, string> = {
  [ReviewDecision.UnReviewed]: 'Unreviewed',
  [ReviewDecision.Rejected]: 'Rejected',
  [ReviewDecision.Approved]: 'Approved',
};

type SortKey =
  'feature' | 'username' | 'timestamp' | 'source' | 'review' | 'note';

export const COLUMNS: readonly Column<IgnoredRow, SortKey>[] = [
  {
    key: 'feature',
    label: 'Feature',
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
    label: 'Deleted by',
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
    label: 'When',
    width: '10%',
    render: (row) => (
      <Text size="sm">{row.timestamp && <TimeAgo date={row.timestamp} />}</Text>
    ),
    getSortValue: (row) => row.timestamp,
  },
  {
    key: 'source',
    label: 'Source',
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
    label: 'Review',
    width: '10%',
    render: (row) => <ReviewBadge row={row} />,
    getSortValue: (row) => String(row.review_decision ?? -1),
    filter: {
      type: 'enum',
      getLabel: (value) => REVIEW_LABELS[+value as ReviewDecision] || '',
    },
  },
  {
    key: 'note',
    label: 'Note',
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

export const DEFAULT_SORT = { key: 'timestamp', desc: true } as const;

export const DEFAULT_FILTERS: Filters<SortKey> = {
  review: [ReviewDecision.Approved, ReviewDecision.UnReviewed].map(String),
};
