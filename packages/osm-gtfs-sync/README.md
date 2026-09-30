# OSM-GTFS Sync

![Test](https://github.com/k-yle/osm-gtfs-sync/actions/workflows/ci.yml/badge.svg)
![Lines of code](https://img.shields.io/tokei/lines/github/k-yle/osm-gtfs-sync?color=green)

A simple modern alternative to [CUTR-at-USF/gtfs-osm-sync](https://github.com/CUTR-at-USF/gtfs-osm-sync), with a few benefits:

- doesn't add a spam of tags. The existing `ref`/`network`/`operator` tags from OSM are used, no need to add tags like `gtfs:stop_id`
- focusses on improving OSM data instead of trying to import everything
- Supports reviewing all change via an easy-to-use UI (a [modified version](https://github.com/osm-nz/RapiD) of [RapiD](https://github.com/facebook/RapiD)) using [OsmPatch files](https://github.com/osm-nz/linz-address-import/blob/main/SPEC.md)
- Supports a mix of PTv2 and PTv1 in the same city.
- Automatically adds stops to route relations and conflates existing data.
- Automatically generates and conflates `stop_area` relations.

# Usage

- Install nodejs v18 or newer
- clone the repo
- `cd` into the repo
- run `npm install`
- run `npm start -- https://gtfs.at.govt.nz/gtfs.zip`, replacing the URL with the URL to your GTFS zip file
- After the first execution, a file called `config.json` will be generated in `./tmp/[cityId]`. This file can be modified and will apply to future executions.
- The output files are stored in `./tmp/[cityId]/output`. These are [.osmPatch.geo.json files](https://github.com/osm-nz/linz-address-import/blob/main/SPEC.md) which you can then import into a [modified version](https://github.com/osm-nz/RapiD) of RapiD, or [directly upload to OSM](https://osm-nz.github.io/#/upload)
