export const DEFAULT_SINCE_INTERVAL_IN_DAYS = 7;

export const getDefaultSince = (): Date => {
  const dateInPast = new Date();
  dateInPast.setDate(dateInPast.getDate() - DEFAULT_SINCE_INTERVAL_IN_DAYS);

  return dateInPast;
};
