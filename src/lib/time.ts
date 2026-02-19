export function formatTimestamp(value: string | null | undefined, timeZone: string): string {
  if (!value) return 'N/A';

  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value;

  const baseOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };

  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat('en-GB', {
      ...baseOptions,
      timeZone
    });
  } catch {
    formatter = new Intl.DateTimeFormat('en-GB', {
      ...baseOptions,
      timeZone: 'UTC'
    });
  }

  const parts = formatter.formatToParts(new Date(parsed));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}
