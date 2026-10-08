# Changelog

## [3.12.0](https://github.com/osm-nz/osm-conflation-engine/compare/cli-v3.11.1...cli-v3.12.0) (2026-10-08)


### Features

* **cli:** add two new metadata properties ([3a75a0a](https://github.com/osm-nz/osm-conflation-engine/commit/3a75a0a9350c071f4920efce45e79a9a0a80267b))


### Bug Fixes

* **cli:** deduplicate instructions ([95cc272](https://github.com/osm-nz/osm-conflation-engine/commit/95cc272f78e30d08d9077fc5b917e451b5efb41c))

## [3.11.1](https://github.com/osm-nz/osm-conflation-engine/compare/cli-v3.11.0...cli-v3.11.1) (2026-10-07)


### Bug Fixes

* **cli:** include __oldTags for deletions ([981da6c](https://github.com/osm-nz/osm-conflation-engine/commit/981da6c1d54c6f799d7d87520f79cf88340169a6))

## [3.11.0](https://github.com/osm-nz/osm-conflation-engine/compare/cli-v3.10.0...cli-v3.11.0) (2026-10-06)


### Features

* **cli:** generate __oldTags ([aa7c505](https://github.com/osm-nz/osm-conflation-engine/commit/aa7c505cbc75e2a812c071135ab5a63f52038974))


### Bug Fixes

* **cli:** wrong typedefs ([185d8c3](https://github.com/osm-nz/osm-conflation-engine/commit/185d8c3da9ea1e8ac8221862c197a382f26a4a3e))

## [3.10.0](https://github.com/osm-nz/osm-conflation-engine/compare/cli-v3.9.0...cli-v3.10.0) (2026-10-01)


### Features

* use tag2link to linkify the primary key in reports ([52952f3](https://github.com/osm-nz/osm-conflation-engine/commit/52952f3ded9d9af740ce963ce338876a9148d215))


### Bug Fixes

* normaliseNames never being called ([7a7e05d](https://github.com/osm-nz/osm-conflation-engine/commit/7a7e05d3e2e6b66771d9e3f3f7dcca206ed028fa))
* stop generating index.json ([20557c2](https://github.com/osm-nz/osm-conflation-engine/commit/20557c206fabf42b4f5eb6ed0aea5a2b55c4e8f7))

## [3.9.0](https://github.com/osm-nz/osm-conflation-engine/compare/cli-v3.8.0...cli-v3.9.0) (2026-09-27)


### Features

* setup metrics history, which will be stored on the CDN ([eb64c5d](https://github.com/osm-nz/osm-conflation-engine/commit/eb64c5d16edfff2431b891c6e6efb81390c87199))

## [3.8.0](https://github.com/osm-nz/osm-conflation-engine/compare/cli-v3.7.1...cli-v3.8.0) (2026-09-27)


### Features

* create step 1 and 2 of the new import page ([749b727](https://github.com/osm-nz/osm-conflation-engine/commit/749b727746f6b876080b807bda2d550b0d576ec2))
* generate additional reports for matching and conflation result ([82d61c7](https://github.com/osm-nz/osm-conflation-engine/commit/82d61c7d812ccd4b0aa01d7ffd4a1378cf7e2e9d))
* rename `o` -&gt; `osm` ([1cdc328](https://github.com/osm-nz/osm-conflation-engine/commit/1cdc3281fbabe2c92a0588a645fe77e275885534))


### Bug Fixes

* rename output subfolder ([884d706](https://github.com/osm-nz/osm-conflation-engine/commit/884d706b8a02d42d27e6d586e09c17e388e86bb6))

## [3.7.1](https://github.com/osm-nz/osm-conflation-engine/compare/cli-v3.7.0...cli-v3.7.1) (2026-09-23)


### Bug Fixes

* handle invalid geojson from postpass ([57133a8](https://github.com/osm-nz/osm-conflation-engine/commit/57133a871b79783482e79969d3a8c4f4d3966312))
* skip duplicate results from postpass ([d6673a9](https://github.com/osm-nz/osm-conflation-engine/commit/d6673a934f3f99eb8d72dbe3f17c28470410b18e))

## [3.7.0](https://github.com/osm-nz/osm-conflation-engine/compare/cli-v3.6.0...cli-v3.7.0) (2026-09-21)


### Features

* add postpass as a data source ([7f8fc11](https://github.com/osm-nz/osm-conflation-engine/commit/7f8fc11a629c35205fa71ca4162fb0c6f6a6d553))


### Bug Fixes

* overpass cache not working ([ed66901](https://github.com/osm-nz/osm-conflation-engine/commit/ed669019778a6baffc27bff2c34ad2e09341b9cf))

## [3.6.0](https://github.com/osm-nz/osm-conflation-engine/compare/cli-v3.5.1...cli-v3.6.0) (2026-09-11)


### Features

* add a callback for `getAltRefs` ([b7ec641](https://github.com/osm-nz/osm-conflation-engine/commit/b7ec641db50a505000bf6222391b03519a8e7a2a))

## [3.5.1](https://github.com/osm-nz/osm-conflation-engine/compare/cli-v3.5.0...cli-v3.5.1) (2026-09-10)


### Bug Fixes

* handle 1:1 match for refs with a semicolon in both osm and source ([b06a514](https://github.com/osm-nz/osm-conflation-engine/commit/b06a51423d0b199cfe71d0416fc171ef80fcbabe))
* stringified coordinates ([d3b3cf2](https://github.com/osm-nz/osm-conflation-engine/commit/d3b3cf21eff8a6010d6aec1b049fd2f72650598b))
* warnings ignored when a feature is rejected ([75eb7e6](https://github.com/osm-nz/osm-conflation-engine/commit/75eb7e6668c334e33428ed11299ba763df3af130))

## [3.5.0](https://github.com/osm-nz/osm-conflation-engine/compare/cli-v3.4.4...cli-v3.5.0) (2026-09-10)


### Features

* add a callback for `addCustomLayers` ([cf35ea6](https://github.com/osm-nz/osm-conflation-engine/commit/cf35ea6d71c530c566fa55f3ab1899c01caceb02))


### Bug Fixes

* overpass response not being cached ([7e95d73](https://github.com/osm-nz/osm-conflation-engine/commit/7e95d731a1b07baf52734c6d6fa6eb4a0e7f6f60))

## [3.4.4](https://github.com/osm-nz/osm-conflation-engine/compare/cli-v3.4.3...cli-v3.4.4) (2026-09-09)


### Bug Fixes

* add missing properties to index.geo.json ([45dda81](https://github.com/osm-nz/osm-conflation-engine/commit/45dda8145594805060e4a558ff772a59d770a7aa))
* mergeTinyDatasets not working well ([ee5aa09](https://github.com/osm-nz/osm-conflation-engine/commit/ee5aa09d2ffb4b8abc6a33e3678705c297015cb5))

## [3.4.3](https://github.com/osm-nz/osm-conflation-engine/compare/cli-v3.4.2...cli-v3.4.3) (2026-09-07)


### Bug Fixes

* metrics double-counted ([49b68d8](https://github.com/osm-nz/osm-conflation-engine/commit/49b68d8dd469be9c37dedf9cca62ae686d792851))
* recently-edited flag wrong ([2858c70](https://github.com/osm-nz/osm-conflation-engine/commit/2858c7022562194732448bb49adf818f601dc56e))

## [3.4.2](https://github.com/osm-nz/osm-conflation-engine/compare/cli-v3.4.1...cli-v3.4.2) (2026-09-02)


### Bug Fixes

* inconsistent api response shape ([8247df4](https://github.com/osm-nz/osm-conflation-engine/commit/8247df495318bc5c927db5dad5793568e99d1d1d))

## [3.4.1](https://github.com/osm-nz/osm-conflation-engine/compare/cli-v3.4.0...cli-v3.4.1) (2026-09-01)


### Bug Fixes

* don't call the API in unit tests ([961c459](https://github.com/osm-nz/osm-conflation-engine/commit/961c459b7f31c525a00cc738daee5dbeb4c001f8))

## [3.4.0](https://github.com/osm-nz/osm-conflation-engine/compare/cli-v3.3.0...cli-v3.4.0) (2026-09-01)


### Features

* also store the metrics object on the server ([3bed500](https://github.com/osm-nz/osm-conflation-engine/commit/3bed5006d3b39765eb15e1760fe675dd8fa8d086))

## [3.3.0](https://github.com/osm-nz/osm-conflation-engine/compare/cli-v3.2.0...cli-v3.3.0) (2026-08-06)


### Features

* store stats that we need for the graphs on the website ([a810c69](https://github.com/osm-nz/osm-conflation-engine/commit/a810c6964d53ae028cf7432fa9b10696d038f8e0))

## [3.2.0](https://github.com/osm-nz/osm-conflation-engine/compare/cli-v3.1.0...cli-v3.2.0) (2026-07-21)


### Features

* merge tiny datasets with the closest neighbour ([9672801](https://github.com/osm-nz/osm-conflation-engine/commit/967280152a221f57228226d71acbe0c50bdbe728))

## [3.1.0](https://github.com/osm-nz/osm-conflation-engine/compare/cli-v3.0.1...cli-v3.1.0) (2026-07-15)


### Features

* automatically merge tiny datasets in the same sector ([e27a4d1](https://github.com/osm-nz/osm-conflation-engine/commit/e27a4d126fed8e7d56669cc2b5611ba4f6f89d8a))
* refactor pbf-related code to support downloading from overpass ([c60811c](https://github.com/osm-nz/osm-conflation-engine/commit/c60811cd880701e7c1c4953d4ef6a21e0cb9d6d6))
* support categories for output layers ([84d905d](https://github.com/osm-nz/osm-conflation-engine/commit/84d905d74f0f36421de07dc24f35b1eb0d79bac9))


### Bug Fixes

* fix a few miscellaneous bugs ([33bc0fd](https://github.com/osm-nz/osm-conflation-engine/commit/33bc0fdc3d4a1ce4ea2c82c1dd096ed625a54a02))

## [3.0.1](https://github.com/osm-nz/osm-conflation-engine/compare/cli-v3.0.0...cli-v3.0.1) (2026-07-07)


### Bug Fixes

* typo ([540a7f0](https://github.com/osm-nz/osm-conflation-engine/commit/540a7f042dd5bb31daaedd4ae2082094e6086fda))

## [3.0.0](https://github.com/osm-nz/osm-conflation-engine/compare/cli-v2.0.0...cli-v3.0.0) (2026-07-07)


### ⚠ BREAKING CHANGES

* convert the NZ-specific code into a general-purpose library

### Features

* convert the NZ-specific code into a general-purpose library ([71a6efb](https://github.com/osm-nz/osm-conflation-engine/commit/71a6efb3154893c7944d4ee7deaecc393c13bb78))
