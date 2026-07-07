import { CheckDate } from '../types/index.js';

/** number of years before we revisit a feature with check_date */
const CHECK_DATE_THRESHOLD_YEARS = 4;

/** checks if an ISO date exists and if it it's less than X years old */
export const isChecked = (v: string | undefined): CheckDate => {
  if (!v) return CheckDate.No;

  const yearsAgo = (Date.now() - +new Date(v)) / 1000 / 60 / 60 / 24 / 365;
  return yearsAgo < CHECK_DATE_THRESHOLD_YEARS
    ? CheckDate.YesRecent
    : CheckDate.YesExpired;
};
