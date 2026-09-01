import { use, useMemo, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { LocaleContext } from '../../context/LocaleContext.js';
import type {
  FilterValue,
  Filters,
  MegaTableProps,
  Sort,
} from './types.def.js';

export function useMegaTable<Row, ColumnKey extends string>({
  rows: allRows,
  columns,
  rowKey,
  defaultSort,
  defaultFilters,
  defaultPageSize = 100,
}: MegaTableProps<Row, ColumnKey>) {
  const { locale } = use(LocaleContext);

  const collator = useMemo(() => {
    return new Intl.Collator(locale, { numeric: true, sensitivity: 'base' });
  }, [locale]);

  const [sort, setSort] = useState<Sort<ColumnKey>>(defaultSort);
  const [filters, setFilters] = useState<Filters<ColumnKey>>(
    defaultFilters ?? {},
  );
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [page, setPage] = useState(1);

  const [debouncedFilters] = useDebouncedValue(filters, 200);

  const toggleSort = (key: ColumnKey) => {
    setPage(1);
    setSort((current) => ({
      key,
      desc: current.key === key ? !current.desc : false,
    }));
  };

  const setFilter = (key: ColumnKey, value: FilterValue) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const filterOptions = useMemo(() => {
    const result: Partial<Record<ColumnKey, string[]>> = {};
    for (const column of columns) {
      if (column.filter?.type !== 'enum') continue;
      const values = new Set(
        allRows.map(column.getFilterValue || column.getSortValue),
      );
      result[column.key] = [...values].toSorted(collator.compare);
    }
    return result;
  }, [allRows, columns, collator]);

  const rows = useMemo(() => {
    const filterFuncs = columns
      .map((column): ((row: Row) => boolean) | undefined => {
        const value = debouncedFilters[column.key];
        if (!value?.length) return undefined;

        const get = column.getFilterValue || column.getSortValue;
        if (typeof value === 'string') {
          const query = value.toLowerCase();
          return (row) => get(row).toLowerCase().includes(query);
        }

        const allowed = new Set(value);
        return (row) => allowed.has(get(row));
      })
      .filter((x) => !!x);

    const filtered = filterFuncs.length
      ? allRows.filter((row) => filterFuncs.every((f) => f(row)))
      : allRows;

    const column = columns.find((c) => c.key === sort.key)!;

    return filtered
      .map((row) => ({ row, value: column.getSortValue(row) }))
      .toSorted(
        (a, b) =>
          (sort.desc ? -1 : 1) * collator.compare(a.value, b.value) ||
          collator.compare(a.row[rowKey] as string, b.row[rowKey] as string),
      )
      .map((entry) => entry.row);
  }, [allRows, columns, rowKey, sort, debouncedFilters, collator]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);

  return {
    sort,
    toggleSort,
    filters,
    setFilter,
    filtersActive: Object.values<FilterValue | undefined>(filters).some(
      (value) => !!value?.length,
    ),
    clearFilters: () => {
      setPage(1);
      setFilters({});
    },
    filterOptions,
    filteredRows: rows,
    visibleRows: rows.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    ),
    page: currentPage,
    setPage,
    pageCount,
    pageSize,
    setPageSize: (size: number) => {
      setPageSize(size);
      setPage(1);
    },
  };
}
