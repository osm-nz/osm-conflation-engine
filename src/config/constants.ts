// if less than this percentage of trips stop at a certain bus stop, we don't include that stop
// in the route relation, because it's so rarely serviced. e.g. 1 of 1000 trips of the 82 bus
// stops at the night-bus stops along ECB road.
// likewise with public bus routes that are extended as school bus routes twice a day.
export const TRIP_PERCENT_THRESHOLD = 10;
