import { getOkayCount } from '../../../components/ProgressBar';
import type { ConflationResult } from '../../../conflate';
import { createBlob } from '../../../helpers/js';
import { Warnings } from './Warnings';

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
