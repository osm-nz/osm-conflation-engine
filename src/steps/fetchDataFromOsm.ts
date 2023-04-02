import { promises as fs } from "fs";
import type { OsmFeature } from "osm-api";
import { join } from "path";
import { withConfig } from "../util";
import { BBox } from "../types";

const bboxToString = (bbox: BBox) =>
  [bbox.minLat, bbox.minLng, bbox.maxLat, bbox.maxLng].join(",");

const query = (bbox: BBox) => `
[out:json][timeout:25];
(
  node[highway=bus_stop](${bboxToString(bbox)});
  relation[public_transport=stop_area](${bboxToString(bbox)});
  relation[route=bus](${bboxToString(bbox)});
);
out body;
`;

export async function fetchDataFromOsm(tempFolder: string) {
  await withConfig(tempFolder, async (config) => {
    const url = `http://overpass-api.de/api/interpreter?data=${encodeURIComponent(
      query(config.bbox!)
    )}`;
    console.log("url", url);
    const osmData = await fetch(url)
      .then((r) => r.json())
      .then((resp): OsmFeature[] => resp.elements);

    await fs.writeFile(
      join(tempFolder, "osmRaw.json"),
      JSON.stringify(osmData, null, 2)
    );
  });
}
