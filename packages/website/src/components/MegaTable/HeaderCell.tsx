import { Group, Table, UnstyledButton } from '@mantine/core';
import {
  IconChevronDown,
  IconChevronUp,
  IconSelector,
} from '@tabler/icons-react';
import type { Column, Sort } from './types.def.js';
import { FilterControl } from './FilterControl.js';

export function HeaderCell<Row, ColumnKey extends string>({
  column,
  sort,
  onSort,
  options,
  filter,
  onFilter,
}: {
  column: Column<Row, ColumnKey>;
  sort: Sort<ColumnKey>;
  onSort(key: ColumnKey): void;
  options: string[];
  filter: string | string[] | undefined;
  onFilter(key: ColumnKey, value: string | string[]): void;
}) {
  const isActive = sort.key === column.key;

  const Icon = isActive
    ? sort.desc
      ? IconChevronDown
      : IconChevronUp
    : IconSelector;

  return (
    <Table.Th w={column.width}>
      <Group gap={4} wrap="nowrap">
        <UnstyledButton
          onClick={() => onSort(column.key)}
          style={{ flex: 1 }}
          fz="sm"
          fw={700}
        >
          <Group gap={4} justify="space-between" wrap="nowrap">
            {column.label}
            <Icon size={14} stroke={1.5} opacity={isActive ? 1 : 0.4} />
          </Group>
        </UnstyledButton>
        {column.filter && (
          <FilterControl
            column={column}
            options={options}
            value={filter}
            onChange={(value) => onFilter(column.key, value)}
          />
        )}
      </Group>
    </Table.Th>
  );
}
