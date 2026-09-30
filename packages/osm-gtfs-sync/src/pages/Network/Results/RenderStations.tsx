import { getOkayCount } from '../../../components/ProgressBar.js';
import type { ConflationResult } from '../../../conflate/index.js';
import { createBlob } from '../../../helpers/js.js';
import { Warnings } from './Warnings.js';

export const RenderStations: React.FC<{
  data: NonNullable<ConflationResult['stations']>;
}> = ({ data }) => {
  return (
    <>
      <a
        href={createBlob(data.osmPatch.create)}
        download="stations-missing.osmPatch.geo.json"
      >
        {data.osmPatch.create.features.length.toLocaleString()} missing
      </a>
      ,{' '}
      <a
        href={createBlob(data.osmPatch.update)}
        download="stations-wrong.osmPatch.geo.json"
      >
        {data.osmPatch.update.features.length.toLocaleString()} wrong
      </a>
      , {getOkayCount(data.count).toLocaleString()} are okay.
      <Warnings warnings={data.warnings} />
    </>
  );
};
