import { getOkayCount } from '../../../components/ProgressBar.js';
import type { ConflationResult } from '../../../conflate/index.js';
import { createBlob } from '../../../helpers/js.js';
import { Warnings } from './Warnings.js';

export const RenderStops: React.FC<{
  data: NonNullable<ConflationResult['stops']>;
}> = ({ data }) => {
  return (
    <>
      <a
        href={createBlob(data.osmPatchMissing)}
        download="stops-missing.osmPatch.geo.json"
      >
        {data.osmPatchMissing.features.length.toLocaleString()} missing
      </a>
      ,{' '}
      <a
        href={createBlob(data.osmPatchWrong)}
        download="stops-wrong.osmPatch.geo.json"
      >
        {data.osmPatchWrong.features.length.toLocaleString()} wrong
      </a>
      , {getOkayCount(data.count).toLocaleString()} are okay. And{' '}
      <a
        href={createBlob(data.osmPatchDisused)}
        download="stops-disused.osmPatch.geo.json"
      >
        {data.osmPatchDisused.features.length.toLocaleString()} disused
      </a>{' '}
      but this does not matter.
      <Warnings warnings={data.warnings} />
    </>
  );
};
