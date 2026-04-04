/**
 * Format a timestamp to a localized date string
 */
export function formatDate(timestamp: number, locale = 'ca-ES'): string {
  return new Date(timestamp).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format a timestamp to a localized date-time string
 */
export function formatDateTime(timestamp: number, locale = 'ca-ES'): string {
  return new Date(timestamp).toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a timestamp to relative time (e.g., "2 hours ago")
 */
export function formatRelative(timestamp: number, locale = 'ca-ES'): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (seconds < 60) return rtf.format(-seconds, 'second');
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  if (hours < 24) return rtf.format(-hours, 'hour');
  if (days < 30) return rtf.format(-days, 'day');
  return formatDate(timestamp, locale);
}

/**
 * Get the number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the day of week for the first day of a month (0=Sun, 1=Mon...)
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Convert a date string (YYYY-MM-DD) to timestamp
 */
export function dateStringToTimestamp(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00').getTime();
}

/**
 * Convert a timestamp to date string (YYYY-MM-DD)
 */
export function timestampToDateString(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Get month name from index
 */
export function getMonthName(month: number, locale = 'ca-ES'): string {
  return new Date(2024, month, 1).toLocaleString(locale, { month: 'long' });
}

/**
 * Get short day names for calendar header
 */
export function getShortDayNames(locale = 'ca-ES'): string[] {
  const days: string[] = [];
  // Start from Monday (day 1)
  for (let i = 1; i <= 7; i++) {
    const date = new Date(2024, 0, i); // Jan 1, 2024 is Monday
    days.push(date.toLocaleString(locale, { weekday: 'short' }).slice(0, 2));
  }
  return days;
}

/**
 * Returns today's date at midnight
 */
export function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
