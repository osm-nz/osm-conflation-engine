import { promises as fs } from 'node:fs';
import { isChecked } from '../../../common/helpers.js';
import { writeJsonL } from '../../../common/jsonl.js';
import {
  CHECK_DATE_KEY,
  RECENT_THRESHOLD,
} from '../../../constants/defaults.js';
import {
  type DatasetId,
  type OsmFeature,
  OsmFlags,
} from '../../../types/callbacks.def.js';
import {
  CheckDate,
  type Ctx,
  type OSMData,
} from '../../../types/internal.def.js';
import { getSector } from '../../../common/getSector.js';

const THRESHOLD_DATE = ((d) => {
  d.setDate(d.getDate() - RECENT_THRESHOLD);
  return +d / 1000;
})(new Date());

export function loadOsmFeature(ctx: Ctx, out: OSMData, object: OsmFeature) {
  out.count += 1;

  object.sectors = getSector(
    { type: 'Point', coordinates: object.centroid },
    ctx.config.merge.sector_resolution,
  );

  const checkDateKey = ctx.config.o_data.check_date_key || CHECK_DATE_KEY;

  // boolean flags
  if (+new Date(object.metadata?.timestamp ?? 0) > THRESHOLD_DATE) {
    object.flags |= OsmFlags.IsRecentlyChanged;
  }

  const isLastEditedByImporter =
    object.metadata?.user &&
    // TODO: cache the result per username
    (ctx.callbacks.isImportUser
      ? ctx.callbacks.isImportUser?.(object.metadata.user)
      : object.metadata?.user?.endsWith('_import'));
  if (object.metadata?.version === 1 || isLastEditedByImporter) {
    object.flags |= OsmFlags.IsLastEditedByImporter;
  }

  if (object.tags[checkDateKey]) {
    object.flags |= OsmFlags.IsChecked;
  }

  if (isChecked(object.tags[checkDateKey]) === CheckDate.YesRecent) {
    object.flags |= OsmFlags.IsCheckedRecently;
  }

  const primaryKey = <DatasetId | undefined>(
    object.tags[ctx.config.merge.osm_key]
  );
  if (primaryKey) {
    out.count++;
    // check if there is already an OSM object with the same linz ID

    // this node is 3rd+ one with this linzId
    if (out.duplicateRefs[primaryKey]) {
      out.duplicateRefs[primaryKey].push(object);
    }

    // this node is 2nd one with this linzId
    else if (out.withRef[primaryKey]) {
      out.duplicateRefs[primaryKey] = [out.withRef[primaryKey], object];
      delete out.withRef[primaryKey];
    }

    // the linz id has a semicolon in it - we don't like this
    // unless the address has alt_addr:* tags.
    else if (primaryKey.includes(';')) {
      const mergedIds = <DatasetId[]>primaryKey.split(';');
      for (const value of mergedIds) {
        out.semi[value] = object;
      }
    }

    // not a duplicate
    else {
      out.withRef[primaryKey] = object;
    }
  } else {
    out.noRef[object.id] = object;
  }
}

export async function saveLoadedOsmFeatures(ctx: Ctx, out: OSMData) {
  const { withRef, noRef, ...other } = out;
  await writeJsonL(
    ctx.tempFileNames.osm_processed_with_ref,
    Object.values(withRef),
  );
  await writeJsonL(
    ctx.tempFileNames.osm_processed_no_ref,
    Object.values(noRef),
  );
  await fs.writeFile(
    ctx.tempFileNames.osm_processed_other,
    JSON.stringify(other),
  );
}
