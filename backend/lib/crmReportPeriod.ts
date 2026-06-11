export const REPORT_TIMEZONE = 'Europe/Kyiv';

export type ReportPeriodKind = 'all' | 'month' | 'lastMonth' | 'year' | 'custom';

export type ReportDateRange = {
  period: ReportPeriodKind;
  label: string;
  fromYmd: string | null;
  toYmd: string | null;
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function ymdInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function lastDayOfMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

function monthLabel(y: number, m: number): string {
  return `${pad2(m)}.${y}`;
}

export function parseReportPeriodInput(raw: string): ReportPeriodKind {
  if (raw === 'month' || raw === 'lastMonth' || raw === 'year' || raw === 'custom') {
    return raw;
  }
  return 'all';
}

export function resolveReportDateRange(
  periodInput: string,
  fromInput?: string,
  toInput?: string,
): ReportDateRange {
  const period = parseReportPeriodInput(periodInput);
  const today = ymdInTimeZone(new Date(), REPORT_TIMEZONE);
  const [ty, tm] = today.split('-').map(Number);

  if (period === 'all') {
    return { period, label: 'Весь период', fromYmd: null, toYmd: null };
  }

  if (period === 'month') {
    const fromYmd = `${ty}-${pad2(tm)}-01`;
    return { period, label: monthLabel(ty, tm), fromYmd, toYmd: today };
  }

  if (period === 'lastMonth') {
    let py = ty;
    let pm = tm - 1;
    if (pm < 1) {
      pm = 12;
      py -= 1;
    }
    const fromYmd = `${py}-${pad2(pm)}-01`;
    const toYmd = `${py}-${pad2(pm)}-${pad2(lastDayOfMonth(py, pm))}`;
    return { period, label: monthLabel(py, pm), fromYmd, toYmd };
  }

  if (period === 'year') {
    const fromYmd = `${ty}-01-01`;
    return { period, label: String(ty), fromYmd, toYmd: today };
  }

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  const fromYmd = fromInput && dateRe.test(fromInput) ? fromInput : today;
  const toYmd = toInput && dateRe.test(toInput) ? toInput : today;
  const sortedFrom = fromYmd <= toYmd ? fromYmd : toYmd;
  const sortedTo = fromYmd <= toYmd ? toYmd : fromYmd;
  return {
    period,
    label: `${sortedFrom} — ${sortedTo}`,
    fromYmd: sortedFrom,
    toYmd: sortedTo,
  };
}

export function orderYmdInReportTz(createdAt: Date): string {
  return ymdInTimeZone(createdAt, REPORT_TIMEZONE);
}

export function isDateInReportRange(createdAt: Date, range: ReportDateRange): boolean {
  if (!range.fromYmd && !range.toYmd) return true;
  const key = orderYmdInReportTz(createdAt);
  if (range.fromYmd && key < range.fromYmd) return false;
  if (range.toYmd && key > range.toYmd) return false;
  return true;
}
