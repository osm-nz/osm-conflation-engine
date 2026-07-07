# description

A server is not strictly required for the core part of this tool.

It has 3 purposes, which are auxillary features:

1. The server stores a list of features which were 'ignored' by the importer, or deleted by OSM users. These tool will not suggest importing these features. This must be stored externally to OSM.
2. The server stores temporarily stores a list of datasets which have been locked by another importer. This prevents two importers from uploading the same thing at the same same time.
3. If your project is using the '[changeset-watcher](../changeset-watcher)' feature, then the server stores the date when the script last ran. This ensures that the tool doesn't waste time by scanning the same changesets multiple times.

# notes

to run it on your local machine:

- `npm start`; or
- `npm test`

deployed to https://osm-conflation-engine.kyle.kiwi

to deploy from your local machine instead of the CI:

- [`npx drizzle-kit push`](https://orm.drizzle.team/docs/get-started/d1-new)
- `pnpm deploy`
