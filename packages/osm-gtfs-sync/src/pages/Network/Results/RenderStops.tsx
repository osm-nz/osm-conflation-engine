import { getOkayCount } from '../../../components/ProgressBar.js';
import type { ConflationResult } from '../../../conflate/index.js';
import type { OnSelect } from '../Review.tsx';
import { Warnings } from './Warnings.js';

export const RenderStops: React.FC<{
  data: NonNullable<ConflationResult['stops']>;
  onSelect: OnSelect;
}> = ({ data, onSelect }) => {
  return (
    <>
      <button
        onClick={() => onSelect({ 'Stops Missing': data.osmPatchMissing })}
      >
        {data.osmPatchMissing.features.length.toLocaleString()} missing
      </button>
      ,{' '}
      <button onClick={() => onSelect({ 'Stops Wrong': data.osmPatchWrong })}>
        {data.osmPatchWrong.features.length.toLocaleString()} wrong
      </button>
      , {getOkayCount(data.count).toLocaleString()} are okay. And{' '}
      <button
        onClick={() => onSelect({ 'Disused Stops': data.osmPatchDisused })}
      >
        {data.osmPatchDisused.features.length.toLocaleString()} disused
      </button>{' '}
      but this does not matter.
      <Warnings warnings={data.warnings} />
    </>
  );
};
