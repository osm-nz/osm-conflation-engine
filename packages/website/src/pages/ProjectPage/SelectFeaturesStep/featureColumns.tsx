import {
  Anchor,
  Badge,
  Code,
  Group,
  type MantineColor,
  Text,
} from '@mantine/core';
import type { OsmPatchFeature, Tags } from 'osm-api';
import type { OsmId } from '@osm-conflation-engine/cli';
import type { Column, Sort } from '../../../components/MegaTable/index.js';
import type { I$ } from '../../../context/LocaleContext.js';
import { utilDisplayName } from '../../../util/utilDisplayName.js';
import { osmLink } from '../../../util/osm.js';

export type Action = 'create' | 'edit' | 'move' | 'delete';
export const ACTIONS: Action[] = ['create', 'edit', 'move', 'delete'];

export const ACTION_COLOURS: Record<
  Action,
  { name: MantineColor; hex: string }
> = {
  create: { name: 'green', hex: '#2f9e44' },
  edit: { name: 'yellow', hex: '#f08c00' },
  move: { name: 'violet', hex: '#7048e8' },
  delete: { name: 'red', hex: '#e03131' },
};

export const ACTION_LABELS = ($: I$): Record<Action, string> => ({
  create: $('Action.create'),
  edit: $('Action.edit'),
  move: $('Action.move'),
  delete: $('Action.delete'),
});

export const FEATURE_DEFAULT_SORT: Sort = { key: 'dataset', desc: false };

export interface FeatureRow {
  /** unique across all datasets */
  id: string;
  dataset: string;
  action: Action;
  label: string;
  tags: Tags;
  original: OsmPatchFeature;
}

export function toFeatureRows(
  dataset: string,
  features: OsmPatchFeature[],
): FeatureRow[] {
  return features.map((feature, index) => {
    const tags: Tags = {};
    for (const key in feature.properties) {
      const value = feature.properties[key];
      if (!key.startsWith('__') && typeof value === 'string') {
        tags[key] = value;
      }
    }

    return {
      id: `${dataset}␞${index}`,
      dataset,
      action: feature.properties.__action || 'create',
      label: utilDisplayName(tags),
      tags,
      original: feature,
    };
  });
}

type ColumnKey = 'label' | 'action' | 'dataset' | 'tags';

export const getFeatureColumns = ($: I$): Column<FeatureRow, ColumnKey>[] => {
  return [
    {
      key: 'label',
      label: $('ProjectPage.col.feature'),
      width: '25%',
      render: (row) => {
        const children = row.label || row.original.id;
        return (
          <Text size="sm" style={{ wordBreak: 'break-word' }}>
            {row.action === 'create' ? (
              children
            ) : (
              <Anchor
                href={osmLink(row.original.id as OsmId)}
                target="_blank"
                rel="noopener"
              >
                {children}
              </Anchor>
            )}
          </Text>
        );
      },
      getSortValue: (row) => row.label,
      filter: { type: 'text' },
    },
    {
      key: 'tags',
      label: $('ProjectPage.col.tags'),
      width: '35%',
      render: (row) => (
        <Group gap={4}>
          {Object.entries(row.tags).map(([key, value]) => (
            <Code key={key} fz="xs">
              {key}={value}
            </Code>
          ))}
        </Group>
      ),
      getSortValue: (row) => `${Object.keys(row.tags).length}`,
      getFilterValue: (row) =>
        Object.entries(row.tags)
          .map(([key, value]) => `${key}=${value}`)
          .join('␞'),
      filter: { type: 'text' },
    },
    {
      key: 'action',
      label: $('ProjectPage.col.action'),
      width: '10%',
      render: (row) => (
        <Badge
          variant="light"
          size="sm"
          color={ACTION_COLOURS[row.action].name}
        >
          {ACTION_LABELS($)[row.action]}
        </Badge>
      ),
      getSortValue: (row) => row.action,
      filter: {
        type: 'enum',
        getLabel: (value) => ACTION_LABELS($)[value as Action],
      },
    },
    {
      key: 'dataset',
      label: $('ProjectPage.col.dataset'),
      width: '25%',
      render: (row) => (
        <Text size="sm" style={{ wordBreak: 'break-word' }}>
          {row.dataset}
        </Text>
      ),
      getSortValue: (row) => row.dataset,
      filter: { type: 'enum' },
    },
  ];
};
