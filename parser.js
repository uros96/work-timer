export function parseTimestamp(tsRaw) {
  const ts = (tsRaw || '').trim().replace(/\s+/, 'T');
  const d = new Date(ts);
  return Number.isFinite(d.getTime()) ? d : null;
}

export function parseRows(raw) {
  const warnings = [];

  const rows = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\t+| {2,}/);
      const type = (parts[0] || '').trim();
      const ts = parts[2] ? parts[2].trim() : (parts[1] || '').trim();
      const date = parseTimestamp(ts);

      if (!type || !date) {
        warnings.push(`Skipping invalid row: ${line}`);
        return null;
      }

      return { type, date, parts, raw: line };
    })
    .filter(Boolean);

  return { rows, warnings };
}
