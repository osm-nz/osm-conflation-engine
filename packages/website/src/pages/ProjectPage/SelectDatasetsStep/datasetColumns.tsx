import { Badge, Group, Text } from '@mantine/core';
import type { IndexFileProperties } from '@osm-conflation-engine/cli';
import type { Feature, Polygon } from 'geojson';
import type { Column, Sort } from '../../../components/MegaTable/index.js';
import type { I$ } from '../../../context/LocaleContext.js';
import type { Locale } from '../../../translations/index.js';
import { getColourHash } from '../../../util/colour.js';
import { DownloadOsmPatchFileButton } from './DownloadButton.js';

export interface DatasetRow extends IndexFileProperties {
  original: Feature<Polygon, IndexFileProperties>;
}

type DatasetColumnKey = 'title' | 'category' | 'count' | 'totalCount';

export const DEFAULT_DATASET_SORT: Sort = { key: 'title', desc: false };

const getDisplayName = (row: DatasetRow) => row.group || row.title;

export const getDatasetColumns = (
  $: I$,
  locale: Locale,
  refTag: string,
): Column<DatasetRow, DatasetColumnKey>[] => [
  {
    key: 'title',
    label: $('ProjectPage.col.dataset'),
    width: '40%',
    render: (row) => (
      <>
        <Group gap={4} wrap="nowrap">
          <Text size="sm" style={{ wordBreak: 'break-word' }}>
            {getDisplayName(row)}
          </Text>
          <DownloadOsmPatchFileButton refTag={refTag} datasetId={row.id} />
        </Group>
        {row.instructions && (
          <Text size="xs" c="dimmed" lineClamp={2}>
            {row.instructions}
          </Text>
        )}
      </>
    ),
    getSortValue: getDisplayName,
    getFilterValue: (row) => [row.title, row.instructions].join('␞'),
    filter: { type: 'text' },
  },
  {
    key: 'category',
    label: $('ProjectPage.col.category'),
    width: '20%',
    render: (row) =>
      !!row.category && (
        <Badge variant="light" size="sm" color={getColourHash(row.category)}>
          {row.category}
        </Badge>
      ),
    getSortValue: (row) => row.category,
    filter: { type: 'enum' },
  },
  {
    key: 'count',
    label: $('ProjectPage.col.diff'),
    width: '25%',
    render: (row) => (
      <Text size="sm" style={{ wordBreak: 'break-word' }}>
        {row.count}
      </Text>
    ),
    getSortValue: (row) => row.count,
    filter: { type: 'text' },
  },
  {
    key: 'totalCount',
    label: $('Common.features'),
    width: '10%',
    render: (row) => (
      <Text size="sm">{row.totalCount.toLocaleString(locale)}</Text>
    ),
    getSortValue: (row) => `${row.totalCount}`,
  },
];
