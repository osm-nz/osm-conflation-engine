# osm-conflation-engine

[![CI](https://github.com/osm-nz/osm-conflation-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/osm-nz/osm-conflation-engine/actions/workflows/ci.yml)
![Lines of code](https://sloc.xyz/github/osm-nz/osm-conflation-engine)

**Go to the Website:** 👉 [osm-nz.github.io/osm-conflation-engine](https://osm-nz.github.io/osm-conflation-engine) 👈

## Background

There are several limitations with ordinary OpenStreetMap import projects:

1. They are usually one-off projects, which rely on manual data processing, so the imported data becomes out of data very quickly.
1. Each region's import projects need to create their own bespoke software or system to review changes before uploading them to OSM.
   This creates a lot of duplicate work.
1. Splitting up the work of an import project between multiple people is very difficult, and there's a risk of missing certain areas.

"osm-conflation-engine" tries to fix all these problems.
It allows you to create an OSM import project using very minimal code.

- Instead of a one-off import, you configure a regular scheduled synchronisation.
  This automatically compares every feature in your dataset with OSM, and flags features which are missing or have the wrong tags.
- Every import project uses the same unified website to perform the importing, as well as same shared integrations with tools like MapRoulette and RapiD.

It handles all the complicated parts of conflation for you:

- Setting up a system that runs regularly
- Publish the results from the comparison
- Convert the conflation results into a format that can be loaded into OSM editors or MapRoulette

* Implementing the matching between OSM features and rows in the source dataset

## System Architecture

[![](https://wiki.openstreetmap.org/w/images/5/53/LINZ_Address_Conflation_Flowchart.png?)](https://psg1rwze8tq6.feishu.cn/wiki/GxmZw1lG2i0IOkkzRKglVEEhgue?openbrd=1&doc_app_id=501&blockId=HXU9dz5FFocakqx1I5SlBQIjgR2&blockType=whiteboard&blockToken=LThTwNalYhBFxRbvfhulTOW5g3f#HXU9dz5FFocakqx1I5SlBQIjgR2)

## History

- This project started in 2021, but at the time it was only usable for [a few import projects in New Zealand](https://osm.wiki/LINZ/Address_Import).
- In 2026, the code was refactored into a generic system that could be re-used in any import project in any country.

## Scalability

Despite being written mostly in TypeScript, this project has not hit a performance bottleneck (yet).

The largest import project using this tool is the [LINZ Address Import](https://osm.wiki/LINZ/Address_Import), which has 2.2 million rows, and covers a land area larger than the UK.
For that project, the conflation takes about 3 minutes to run.

For GTFS, the largest project is [TfNSW](https://en.wikipedia.org/wiki/Transport_for_NSW), which has 170,000 bus stops, and covers the entire continent of Australia.
Depending on your laptop's specs, importing the zip file into sqlite takes about 90 seconds and conflation takes another 90 seconds.

## Tags

This tool does not use any OSM tags itself.
That is all defined by the import projects, this tool only provides the infrastructure and website.

## Prerequisites

Imports that want to use "osm-conflation-engine" need to meet all these requirements, in addition to [Import Guidelines](https://osm./wiki/Import/Guidelines):

1. Your import needs to use a `ref:*` tag on every OSM feature, such as [`ref:linz:place_id`](https://osm.wiki/Key:ref:linz:place_id). This is non-negotiable, otherwise it would be extremely slow, unreliable, and computationally expensive to perform automated conflation.
   - if you're importing data that doesn't have distinct features, or doesn't have a clear ID for each feature (like rivers or buildings), then this tool is not for you, sorry.
1. You need some way of downloading the source data programatically with a script.
1. You need some basic knowledge of TypeScript and how to use GitHub or another code-hosting platform.

## Legacy systems (Public Transport / GTFS)

> [!NOTE]
> For legacy reasons, some types of conflation projects use a different older system.
> For example, road names and public transport (GTFS). This will eventually be unified.

For now, GTFS is handled in a special way.
The configuration for all regions is stored in [a folder in this repository](./packages/osm-gtfs-sync/src/config), anyone can send a Pull Request to update this configuration.

GTFS conflation is much more standardised: all imports use the same standard tags like [`public_transport=*`](https://osm.wiki/Key:public_transport), [`ref=*`](https://osm.wiki/Key:ref), [`local_ref=*`](https://osm.wiki/Key:local_ref), etc. See the wiki page for more details.

## Screenshots

<table>
  <tr>
    <td>
      <a href="https://osm.wiki/File:Osm-conflation-engine-1.png"><img src="https://wiki.openstreetmap.org/w/images/c/ca/Osm-conflation-engine-1.png" /></a>
      The page to select an import project
    </td>
    <td>
      <a href="https://osm.wiki/File:Osm-conflation-engine-2.png"><img src="https://wiki.openstreetmap.org/w/images/8/85/Osm-conflation-engine-2.png" /></a>
      The page to select which task/area you want to review
    </td>
  </tr>
  <tr>
    <td>
      <a href="https://osm.wiki/File:Osm-conflation-engine-3.png"><img src="https://wiki.openstreetmap.org/w/images/0/0d/Osm-conflation-engine-3.png" /></a>
      The page to select and review specific features
    </td>
    <td>
      <a href="https://osm.wiki/File:Osm-conflation-engine-4.png"><img src="https://wiki.openstreetmap.org/w/images/c/c6/Osm-conflation-engine-4.png" /></a>
      The page shows metrics and statistics about the import
    </td>
  </tr>
</table>

## Usage

To create a project, you only need to define three things:

1. A script to download the data from your source data
1. A script which is given 1 OSM feature and 1 row from your source data. The matching is performed automaticaly, so your script just needs to check if the OSM tags are correct for the provided pair.
1. A [JSON config file](https://github.com/osm-nz/osm-conflation-engine/blob/main/packages/cli/src/types/config.def.ts). For example, you can control how matching works, whether geometry should be compared, and how to download.

For a very simple example project, see [osm-nz/doc-accommodation-import](https://github.com/osm-nz/doc-accommodation-import).

## Setup Guide

Start by creating your config file, using JSON or TypeScript.
For both formats, ensure that you have schema validation enabled to see the inline documentation for each configuration option.

It might look something like this:

```jsonc
{
  "$schema": "https://unpkg.com/@osm-conflation-engine/cli/dist/config.schema.json",
  "metadata": {
    "region": "EG",
    "name": "...",
    "description": "...",
    // ...
  },
  "source_data": { "type": "file", "file": "./myData.csv" },
  "osm_data": {
    "source": {
      "type": "overpass",
      // overpass_query_file is not specified, so it'll default to downloading everything with ref:EG:place_names
    },
    "tags_to_keep": ["check_date", "name", "natural", /* ... */],
  },
  "merge": {
    "osm_key": "ref:EG:place_names",
    "dataset_column": "PRIMARY_KEY",
  },
};
```

Then install this library from npm (`npm i @osm-conflation-engine/cli`), and create a new TypeScript file:

```ts
import { run } from '@osm-conflation-engine/cli';
import config from './my_config_file.json';

await run(config, {
  // in this object, you define all the callback functions, which the
  // conflation engine calls. Most are optional.

   /**
   * called for every OSM feature, you should return a key which is unique
   * within its sector. For example, this could be the most important tags
   * concatenated together, if those tags are usually unique within the
   * local area (the sector).
   *
   * It is used to automatically match OSM features that are missing a
   * `ref:*` tag.
   */
  getLocalKeyForOsm(osmFeature) {
    // ...
  }
  /**
   * see docs for {@link getLocalKeyForOsm}. This is the equivilant callback
   * for the source data, which is called for every feature.
   *
   * It is used to automatically match OSM features that are missing a
   * `ref:*` tag.
   */
  getLocalKeyForSource(sourceFeature) {
    // ...
  }

  /**
   * given a ref, this function should return alterantive variants for
   * matching. For example, if the ref is `00123`, this function could
   * return `123`, which will also be considered for matching.
   */
  getAltRefs(ref) {
    // ...
  }

  /**
   * optional, by default a username which ends in `_import` is considered
   * to be an importer. Use this callback if you want to customise the
   * behaviour.
   */
  isImportUser(username) {
    // ...
  }

  // TODO: documentation for each
  mergeOneToOne({ source, osm }) {
    // ...
  }

  mergeOneToMany({ source, osm }) {
    // ...
  }

  mergeManyToOne({ source, osm }) {
    // ...
  }

  mergeManyToMany({ source, osm }) {
    // ...
  }

  /**
   * called for OSM features which have a ref tag that does not exist in the
   * source dataset. You need to decide whether to:
   * (1) delete this feature; or
   * (2) only remove the import related tags; or
   * (3) do nothing.
   */
  deleteFeature({ osm }) {
    // ...
  }

  /**
   * Calls for each feature in the source dataset where a matching feature
   * could not be found in OSM. If there are potential matches, these are
   * supplied using the `osmCandidates` argument. If you choose to accept
   * one of these candidates, return the `selection` property set to that
   * feature's {@link OsmId}. If not, return `selection: undefined`, which
   * will create a new OSM feature instead.
   */
  create({ source, osmCandidates }) {
    // ...
  }

  /**
   * optional, called after the conflation stage once all diffs have been
   * allocated to a group. You can apply any addition transformations to
   * the features in each layer.
   */
  postprocessLayer({ category, group, features, osmData, sourceData }) {
    // ...
  }

  /**
   * optional, called after the conflation stage for every group. You can
   * return the changeset tags which will be applied to this group, and
   * optionally `instructions` which are shown in the website UI, before
   * someone starts working on this group.
   */
  getChangesetTags({ category, group }) {
    // ...
  }

  /**
   * optional, called ONCE after conflation is finished. use this
   * if you to add any other any other {@link OsmPatchFeature}
   * features to the output, or any warnings.
   */
  addCustomLayers() {
    // ...
  }
});
```

Lastly, you need commit your code into a git repository, and publish it to GitHub.
Then you need to configure a CI pipeline (GitHub Actions) to regularly run your code (for example, weekly or monthly).
This is straightforward, for an example see [sync.yml in osm-nz/doc-accommodation-import](https://github.com/osm-nz/doc-accommodation-import/blob/main/.github/workflows/sync.yml).

All the other integration works automatically, once your conflation is running by itself it the GitHub CI.
