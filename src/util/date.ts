export const DEFAULT_SINCE_INTERVAL_IN_DAYS = 7;

export const getDefaultSince = (): Date => {
  const dateInPast = new Date();
  dateInPast.setDate(dateInPast.getDate() - DEFAULT_SINCE_INTERVAL_IN_DAYS);

  return dateInPast;
};

/**
 * Parses an optional ISO 8601 date string into a Date, falling back to the
 * provided default when the value is null/undefined. Throws if the string
 * cannot be parsed into a valid date.
 */
export const parseTimestamp = (
  timestamp: string | null | undefined,
  fallback: Date,
): Date => {
  if (!timestamp) {
    return fallback;
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(
      `Invalid date: "${timestamp}". Expected an ISO 8601 date string (e.g. 2024-01-31 or 2024-01-31T12:00:00Z).`,
    );
  }

  return parsed;
};
