import { use, useMemo } from 'react';
import {
  Button,
  Checkbox,
  Group,
  Pagination,
  Select,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { LocaleContext } from '../../context/LocaleContext.js';
import { HeaderCell } from './HeaderCell.js';
import type { MegaTableProps } from './types.def.js';
import { useMegaTable } from './useMegaTable.js';

const PAGE_SIZES = [50, 100, 250, 500];

const CHECKBOX_COL_WIDTH = '4%';

/**
 * sadly Mantine doesn't have a good table. MegaTable handles:
 * sorting, filtering, pagination, and row selection checkboxes.
 */
export function MegaTable<Row, ColumnKey extends string>({
  minWidth = 900,
  toolbar,
  selection,
  ...options
}: MegaTableProps<Row, ColumnKey>) {
  const { $, locale } = use(LocaleContext);
  const { columns, rowKey, rows: allRows } = options;

  const pageSizeOptions = useMemo(
    () =>
      PAGE_SIZES.map((size) => ({
        value: `${size}`,
        label: size.toLocaleString(locale),
      })),
    [locale],
  );

  const table = useMegaTable(options);

  const toggleRow = (rowId: string) => {
    if (!selection) return;

    const newState = new Set(selection.selected);
    if (!newState.delete(rowId)) newState.add(rowId);

    selection.onChange(newState);
  };

  const ids = table.filteredRows.map((row) => row[rowKey] as string);

  const isEveryRowSelected =
    !!ids.length &&
    !!selection &&
    ids.every((id) => selection.selected.has(id));

  const isSomeRowsSelected =
    !isEveryRowSelected &&
    !!selection &&
    ids.some((id) => selection.selected.has(id));

  const toggleAll = () => {
    if (!selection) return;
    const newState = new Set(selection.selected);
    for (const id of ids) {
      if (isEveryRowSelected) newState.delete(id);
      else newState.add(id);
    }
    selection.onChange(newState);
  };

  return (
    <Stack gap="sm">
      <Group justify="space-between" wrap="nowrap">
        <Group gap="xs" wrap="nowrap">
          {toolbar}
          {table.filtersActive && (
            <>
              <Text c="dimmed" size="sm">
                {$('Common.count_of_total', {
                  count: table.filteredRows.length,
                  total: allRows.length,
                })}
              </Text>
              <Button
                size="compact-xs"
                variant="subtle"
                onClick={table.clearFilters}
              >
                {$('MegaTable.clear_filters')}
              </Button>
            </>
          )}
        </Group>

        <Group gap="xs" wrap="nowrap">
          <Text c="dimmed" size="sm">
            {$('MegaTable.rows_per_page')}
          </Text>
          <Select
            data={pageSizeOptions}
            value={`${table.pageSize}`}
            onChange={(value) => table.setPageSize(+value! || 100)}
            size="xs"
            w={90}
            allowDeselect={false}
            comboboxProps={{ withinPortal: true }}
          />
        </Group>
      </Group>

      <Table.ScrollContainer minWidth={minWidth}>
        <Table
          layout="fixed"
          stickyHeader
          highlightOnHover
          striped
          verticalSpacing="xs"
        >
          <Table.Thead>
            <Table.Tr>
              {!!selection && (
                <Table.Th w={CHECKBOX_COL_WIDTH}>
                  <Checkbox
                    size="xs"
                    checked={isEveryRowSelected}
                    indeterminate={isSomeRowsSelected}
                    onChange={toggleAll}
                  />
                </Table.Th>
              )}
              {columns.map((column) => (
                <HeaderCell<Row, ColumnKey>
                  key={column.key}
                  column={column}
                  sort={table.sort}
                  onSort={table.toggleSort}
                  options={table.filterOptions[column.key] ?? []}
                  filter={table.filters[column.key]}
                  onFilter={table.setFilter}
                />
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {!table.visibleRows.length && (
              <Table.Tr>
                <Table.Td colSpan={columns.length + (selection ? 1 : 0)}>
                  <Text c="dimmed" size="sm" ta="center" py="md">
                    {$('MegaTable.no_match')}
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {table.visibleRows.map((row) => {
              const rowId = row[rowKey] as string;
              return (
                <Table.Tr key={rowId}>
                  {selection && (
                    <Table.Td>
                      <Checkbox
                        size="xs"
                        checked={selection.selected.has(rowId)}
                        onChange={() => toggleRow(rowId)}
                      />
                    </Table.Td>
                  )}
                  {columns.map((column) => (
                    <Table.Td key={column.key}>{column.render(row)}</Table.Td>
                  ))}
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {table.pageCount > 1 && (
        <Group justify="center">
          <Pagination
            total={table.pageCount}
            value={table.page}
            onChange={table.setPage}
            size="sm"
            withEdges
          />
        </Group>
      )}
    </Stack>
  );
}
