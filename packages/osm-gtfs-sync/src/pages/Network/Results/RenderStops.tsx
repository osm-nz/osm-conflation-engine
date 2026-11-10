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
      <br />
      <br />
      Entrance:{' '}
      <button
        onClick={() =>
          onSelect({ 'Entrances Missing': data.osmPatchEntrancesMissing })
        }
      >
        {data.osmPatchEntrancesMissing.features.length.toLocaleString()} missing
      </button>
      ,{' '}
      <button
        onClick={() =>
          onSelect({ 'Entrances Wrong': data.osmPatchEntrancesWrong })
        }
      >
        {data.osmPatchEntrancesWrong.features.length.toLocaleString()} wrong
      </button>
      , {getOkayCount(data.entranceCount).toLocaleString()} are okay.
      <Warnings warnings={data.warnings} />
    </>
  );
};
