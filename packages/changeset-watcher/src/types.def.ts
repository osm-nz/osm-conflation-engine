import type { BBox, OsmFeature } from 'osm-api';

import type * as Server from '@osm-conflation-engine/server';

// this weird syntax is to work around a bug in tsdown
export type ChangesetWatchCheckDate = Server.ChangesetWatchCheckDate;
export type IgnoreList = Server.IgnoreList;

export interface ChangesetWatchConfig {
  /**
   * The OIDC authentication token. If running in GitHub pages,
   * you should set this value to:
   * ```js
   * import * as core from '@actions/core';
   * // …
   * authToken: await core.getIDToken('osm-conflation-engine')
   * ```
   */
  authToken: string;

  /** the osm key used to identify this dataset */
  refTag: string;

  /** BBox where changesets will be watched */
  watchArea: BBox;

  /**
   * It is possible that the user deleted a node, and manually created
   * a building with the same tags. To detect these cases, you should
   * define a function which transforms tags into a somewhat-unique key.
   * @param feature
   */
  getLocalKey(feature: OsmFeature): string;

  /**
   * optional, function to return a label which is stored alongside
   * the ID and the key from {@link getKey}, to make it easier to read.
   * For example, this could be the suburb to make grouping easier.
   */
  getLabel?(feature: OsmFeature): string;

  /**
   * optional, by default a username which ends in `_import` is considered
   * to be an importer. Use this callback if you want to customise the
   * behaviour.
   *
   * Changesets created by importers must be ignored, otherwise they will
   * clog the ignore list with false-positives.
   */
  isImportUser?(username: string): boolean;
}
