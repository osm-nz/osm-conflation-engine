import type { Count } from '../types/general.def';
import classes from './ProgressBar.module.css';

const { format: formatNumber } = new Intl.NumberFormat(navigator.languages);

export const getOkayCount = (count: Count) =>
  count.total - count.add - count.edit - count.skipped;

export const ProgressBar: React.FC<{ count: Count }> = ({ count }) => {
  const chunks = [getOkayCount(count), count.edit, count.add, count.skipped];
  const sum = chunks.reduce((a, b) => a + b, 0);

  return (
    <div className={classes.ProgressBar}>
      {sum ? (
        chunks.map((chunk, index) => (
          <div
            // eslint-disable-next-line @eslint-react/no-array-index-key
            key={index}
            style={{ width: `${((chunk / count.total) * 100).toFixed(3)}%` }}
          >
            {formatNumber(chunk)}
          </div>
        ))
      ) : (
        <div style={{ width: '100%' }}>No Data</div>
      )}
    </div>
  );
};
