/** `keyof Row` where the value is a `string` */
type StringKeyOf<Row> = {
  [Key in keyof Row]: Row[Key] extends string ? Key : never;
}[keyof Row];

export type Filter =
  | { type: 'text' }
  | {
      type: 'enum';
      getLabel?(value: string): string;
    };

export interface Column<Row, ColumnKey extends string = string> {
  key: ColumnKey;
  label: string;
  width: string;
  render(row: Row): React.ReactNode;
  getSortValue(row: Row): string;
  filter?: Filter;
  getFilterValue?(row: Row): string;
}

export interface Sort<ColumnKey extends string = string> {
  key: ColumnKey;
  desc: boolean;
}

export type FilterValue = string | string[];

export type Filters<ColumnKey extends string = string> = Partial<
  Record<ColumnKey, FilterValue>
>;

export interface Selection {
  selected: ReadonlySet<string>;
  onChange: (selected: ReadonlySet<string>) => void;
}

export interface MegaTableProps<Row, ColumnKey extends string> {
  rows: readonly Row[];
  /** must be stable! */
  columns: readonly Column<Row, ColumnKey>[];
  rowKey: StringKeyOf<Row>;
  defaultSort: Sort<ColumnKey>;
  defaultFilters?: Filters<ColumnKey>;
  defaultPageSize?: number;

  minWidth?: number;
  toolbar?: React.ReactNode;
  /** if undefined, the table has no checkboxes */
  selection?: Selection;
}
