import type { GtfsFiles } from 'gtfs-types';

type UnionToIntersection<T> = (
  T extends unknown ? (_: T) => void : never
) extends (_: infer U) => void
  ? U
  : never;

type AllTablesMerged = UnionToIntersection<GtfsFiles[keyof GtfsFiles]>;

/** helper to get the types given any GTFS field name */
export type Merged<Fields extends keyof AllTablesMerged> = {
  [Field in Fields]: NonNullable<AllTablesMerged[Field]>;
};

export interface Count {
  add: number;
  edit: number;
  skipped: number;
  total: number;
}
