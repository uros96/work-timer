import { parseRows } from './parser.js';

export function hhmmss(totalMs) {
  const sign = totalMs < 0 ? '-' : '';
  let s = Math.floor(Math.abs(totalMs) / 1000);
  const h = Math.floor(s / 3600);
  s %= 3600;
  const m = Math.floor(s / 60);
  s %= 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${sign}${pad(h)}:${pad(m)}:${pad(s)}`;
}

function sumMs(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

function shouldStayOpen(rows) {
  if (!rows.length) return true;

  const last = rows[rows.length - 1];
  const isExit = last.type.toLowerCase().startsWith('exit');
  const penultimate = (last.parts[last.parts.length - 2] || '').trim().toLowerCase();
  const lastPart = (last.parts[last.parts.length - 1] || '').trim().toLowerCase();

  return !(isExit && penultimate === 'yes' && lastPart === 'yes');
}

function buildIntervals(rows, openUntilNow, nowRef) {
  const intervals = [];
  const warnings = [];
  let currentEntry = null;

  for (const r of rows) {
    const t = r.type.toLowerCase();
    if (t.startsWith('entry')) {
      if (currentEntry) {
        warnings.push('Duplicate Entry – previous interval closed at the next Entry.');
        intervals.push({ start: currentEntry.date, end: r.date, open: false });
      }
      currentEntry = { date: r.date };
    } else if (t.startsWith('exit')) {
      if (currentEntry) {
        intervals.push({ start: currentEntry.date, end: r.date, open: false });
        currentEntry = null;
      } else {
        warnings.push('Exit without a prior Entry – skipping this Exit.');
      }
    }
  }

  const lastLogTime = rows.length ? rows[rows.length - 1].date : nowRef;
  if (currentEntry) {
    intervals.push({
      start: currentEntry.date,
      end: openUntilNow ? nowRef : lastLogTime,
      open: openUntilNow,
    });
  }

  return { intervals, warnings, lastLogTime };
}

function calculateBreakMs(intervals) {
  let totalBreakMs = 0;
  for (let i = 0; i < intervals.length - 1; i++) {
    const gap = intervals[i + 1].start - intervals[i].end;
    if (gap > 0) totalBreakMs += gap;
  }
  return totalBreakMs;
}

function predictEndTime(intervals, remainMs, openUntilNow, lastLogTime, nowRef) {
  if (remainMs <= 0) return null;

  const lastInterval = intervals.at(-1);
  if (!lastInterval || !lastInterval.open) return null;

  const reference = openUntilNow ? nowRef : lastLogTime;
  return new Date(reference.getTime() + remainMs);
}

export function compute(raw) {
  const nowRef = new Date();
  const parsed = parseRows(raw);
  const rows = parsed.rows.sort((a, b) => a.date - b.date);
  const openUntilNow = shouldStayOpen(rows);
  const { intervals, warnings, lastLogTime } = buildIntervals(rows, openUntilNow, nowRef);

  const durations = intervals.map((x) => Math.max(0, x.end - x.start));
  const totalWorkMs = sumMs(durations);

  const totalBreakMs = calculateBreakMs(intervals);
  const hasBreak = totalBreakMs > 0;
  const targetMs = (hasBreak ? 7.5 : 8.0) * 3600 * 1000;

  const remainMs = Math.max(0, targetMs - totalWorkMs);
  const overtimeMs = Math.max(0, totalWorkMs - targetMs);

  const firstEntryTime = intervals[0]?.start ?? null;
  const lastTime = intervals.at(-1)?.end ?? null;
  const predictedEnd = predictEndTime(intervals, remainMs, openUntilNow, lastLogTime, nowRef);

  return {
    intervals,
    warnings: [...parsed.warnings, ...warnings],
    totalWorkMs,
    totalBreakMs,
    hasBreak,
    targetMs,
    remainMs,
    overtimeMs,
    firstEntryTime,
    lastTime,
    predictedEnd,
  };
}
