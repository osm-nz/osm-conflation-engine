import { getOkayCount } from '../../../components/ProgressBar.js';
import type { ConflationResult } from '../../../conflate/index.js';
import type { OnSelect } from '../Review.tsx';
import { Warnings } from './Warnings.js';

export const RenderStations: React.FC<{
  data: NonNullable<ConflationResult['stations']>;
  onSelect: OnSelect;
}> = ({ data, onSelect }) => {
  return (
    <>
      <button
        onClick={() => onSelect({ 'Stations Missing': data.osmPatch.create })}
      >
        {data.osmPatch.create.features.length.toLocaleString()} missing
      </button>
      ,{' '}
      <button
        onClick={() => onSelect({ 'Stations Wrong': data.osmPatch.update })}
      >
        {data.osmPatch.update.features.length.toLocaleString()} wrong
      </button>
      , {getOkayCount(data.count).toLocaleString()} are okay.
      <Warnings warnings={data.warnings} />
    </>
  );
};
