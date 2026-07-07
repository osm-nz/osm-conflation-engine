# @osm-conflation-engine/changeset-watcher

This is a simple script which you can run daily, which searches all changesets
in a local area to see if certain tags were deleted.

It is an optional add-on to the [osm-conflation-engine](https://github.com/osm-nz/osm-conflation-engine) ecosystem.

This script needs to interact with a database to:

1. store the results (the list of OSM tag values that were deleted)
2. to store the date/time when the script last executed, so that it knows how far back to search.

Therefore, this data is stored in the [osm-conflation-engine](https://github.com/osm-nz/osm-conflation-engine)'s shared database. Authentication is handled via [OIDC token](https://docs.github.com/en/actions/concepts/security/openid-connect), which means this script can only be run from a CI/CD environment such as GitHub Actions.

## Usage

> (assuming you want to run this on GitHub Actions)

First, install this package and install [`@actions/core`](https://npm.im/@actions/core), which will give you an [OIDC token](https://docs.github.com/en/actions/concepts/security/openid-connect):

```sh
npm i @actions/core @osm-conflation-engine/changeset-watcher
```

Then create a file such as `changeset_watch.ts`:

```ts
import * as core from '@actions/core';
import { run } from '@osm-conflation-engine/changeset-watcher';

await run({
  // the OIDC token, used to authenticate with the server
  authToken: await core.getIDToken('osm-conflation-engine'),

  // the OSM tag used to store the primary key of your dataset
  refTag: 'ref:AU:address_id',

  // the bbox to search for changesets in
  watchArea: [165.366, -47.762, 179.384, -33.545],

  // a local key, which usually uniquely identifies the feature
  getLocalKey({ tags }) {
    return tags?.['addr:housenumber'] + ' ' + tags?.['addr:street'];
  },

  // ❗️ for more details on these options, and the other options
  //    that are available, see in the inline JSDoc comments.
});
```

Then setup a new GitHub CI workflow, which will regularly run your script:

```yaml
name: Changeset Watch

on:
  schedule:
    - cron: '0 17 * * *' # pick any schedule, such as daily
  workflow_dispatch:

permissions:
  id-token: write
  contents: read

jobs:
  watch:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v7

      - uses: actions/setup-node@v6
        with:
          node-version: 26.x

      - run: node changeset_watch.ts # use the file name that you chose earlier
```

If your repository is [inactive for 60 days](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows), GitHub will stop triggering these daily workflows. If you need to prevent that, there are [workarounds](https://github.com/osm-nz/linz-address-import/blob/main/.github/workflows/keepalive.yml).
