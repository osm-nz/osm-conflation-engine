import type {
  OsmPatchFeature,
  OsmFeature as StandardOsmFeature,
  Tags,
} from 'osm-api';
import type { Feature, GeoJsonProperties, Geometry } from 'geojson';
import type { Step } from '../constants/defaults.js';
import type { SourceData } from './internal.def.js';

export type TagDiff = OsmPatchFeature['properties'];

/** see microsoft/TypeScript#202 */
export type Identity<out T> = { _: T; readonly __: unique symbol };

export type OsmFeatureTypeShort = 'n' | 'w' | 'r';
export type OsmId = `${OsmFeatureTypeShort}${number}`;
export type DatasetId = string & Identity<'DatasetId'>;

export type Vec2 = [lon: number, lat: number];

export enum OsmFlags {
  None = 0,
  IsLastEditedByImporter = 1 << 0,
  IsRecentlyChanged = 1 << 1,
  IsChecked = 1 << 2,
  IsCheckedRecently = 1 << 3,
}

export interface OsmFeature {
  id: OsmId;
  sectors: string[];
  centroid: Vec2;
  tags: Tags;
  metadata?: Partial<
    Pick<StandardOsmFeature, 'changeset' | 'version' | 'user' | 'timestamp'>
  >;
  flags: number & OsmFlags;
}

export interface SourceDataFeature<
  G extends Geometry = Geometry,
  P extends GeoJsonProperties = GeoJsonProperties,
> extends Feature<G, P> {
  /** list of sector IDs (h3 hexes) that this feature passes through */
  sectors: string[];
  centroid: Vec2;
}

type MaybePromise<T> = T | Promise<T>;

export interface ConflationResultExtra {
  createFeatures?: OsmPatchFeature[];
  warnings?: string[];
}

export interface ConflationDiff {
  tags: TagDiff;
  geometry?: Geometry;
}

export interface SingleFeatureConflationResult {
  group?: string;
  diff: ConflationDiff;
  extra?: ConflationResultExtra;
}

export interface MutliFeatureConflationResult {
  group?: string;
  diffPerFeature: { [id: OsmId]: ConflationDiff };
  extra?: ConflationResultExtra;
}

// this is the public API, so any break changes require a major version bump
export interface Callbacks<G extends Geometry, P extends GeoJsonProperties> {
  /**
   * called for every OSM feature, you should return a key which is unique
   * within its sector. For example, this could be the most important tags
   * concatenated together, if those tags are usually unique within the
   * local area (the sector).
   */
  getLocalKeyForOsm(osmFeature: OsmFeature): string;
  /**
   * see docs for {@link getLocalKeyForOsm}. This is the equivilant callback
   * for the source data, which is called for every feature.
   */
  getLocalKeyForSource(sourceFeature: SourceDataFeature<G, P>): string;

  /**
   * optional, by default a username which ends in `_import` is considered
   * to be an importer. Use this callback if you want to customise the
   * behaviour.
   */
  isImportUser?(username: string): boolean;

  // TODO: documentation for each
  mergeOneToOne(input: {
    source: SourceDataFeature<G, P>;
    osm: OsmFeature;
  }): MaybePromise<SingleFeatureConflationResult | undefined>;

  mergeOneToMany?(input: {
    source: SourceDataFeature<G, P>;
    osm: OsmFeature[];
  }): MaybePromise<MutliFeatureConflationResult | undefined>;

  mergeManyToOne?(input: {
    source: SourceDataFeature<G, P>[];
    osm: OsmFeature;
  }): MaybePromise<SingleFeatureConflationResult | undefined>;

  mergeManyToMany?(input: {
    source: SourceDataFeature<G, P>[];
    osm: OsmFeature[];
  }): MaybePromise<MutliFeatureConflationResult | undefined>;

  /**
   * called for OSM features which have a ref tag that does not exist in the
   * source dataset. You need to decide whether to:
   * (1) delete this feature; or
   * (2) only remove the import related tags; or
   * (3) do nothing.
   */
  deleteFeature?(input: {
    osm: OsmFeature;
  }): MaybePromise<SingleFeatureConflationResult | undefined>;

  /**
   * Calls for each feature in the source dataset where a matching feature
   * could not be found in OSM. If there are potential matches, these are
   * supplied using the `osmCandidates` argument. If you choose to accept
   * one of these candidates, return the `selection` property set to that
   * feature's {@link OsmId}. If not, return `selection: undefined`, which
   * will create a new OSM feature instead.
   */
  create(input: {
    source: SourceDataFeature<G, P>;
    osmCandidates: OsmFeature[];
  }): MaybePromise<
    | (SingleFeatureConflationResult & {
        /**
         * undefined means that no selection was made, so we
         * will create a new OSM feature instead
         */
        selection: OsmId | undefined;
      })
    | undefined
  >;

  /**
   * optional, called after the conflation stage once all diffs have been
   * allocated to a group. You can apply any addition transformations to
   * the features in each layer.
   */
  postprocessLayer?(input: {
    group: string;
    features: OsmPatchFeature[];
    osmData: Record<OsmId, OsmFeature>;
    sourceData: SourceData<G, P>;
  }): MaybePromise<OsmPatchFeature[] | undefined>;

  /**
   * optional, called after the conflation stage for every group. You can
   * return the changeset tags which will be applied to this group, and
   * optionally `instructions` which are shown in the website UI, before
   * someone starts working on this group.
   */
  getChangesetTags?(group: string): MaybePromise<{
    instructions?: string;
    changesetTags?: Tags;
  }>;
}
export interface RunOptions {
  steps?: Step[];
  use_cache?: boolean;
}

export interface ConflateResult {
  counts: {
    create: number;
    edit: number;
    delete: number;
    perfect: number;
  };
}

export interface RunResult {
  conflate?: ConflateResult;
}
