import { hhmmss } from './metrics.js';

function formatDT(d) {
  return d ? d.toLocaleString() : '—';
}

function formatTimeOnly(d) {
  if (!d) return '—';
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function renderSummaryCards(container, result) {
  container.innerHTML = '';
  const pills = [
    { label: 'Total worked', value: hhmmss(result.totalWorkMs), cls: result.overtimeMs > 0 ? 'ok' : '' },
    { label: 'Total break', value: hhmmss(result.totalBreakMs), cls: '' },
    {
      label: result.remainMs > 0 ? 'Remaining to target' : 'Over target',
      value: result.remainMs > 0 ? hhmmss(result.remainMs) : hhmmss(result.overtimeMs),
      cls: result.remainMs > 0 ? 'warn' : 'ok',
    },
  ];

  for (const pill of pills) {
    const div = document.createElement('div');
    div.className = `pill ${pill.cls || ''}`;
    div.innerHTML = `<small>${pill.label}</small><strong>${pill.value}</strong>`;
    container.appendChild(div);
  }
}

export function renderDailySummary(listEl, result) {
  const endLabel = result.overtimeMs > 0 ? 'Overtime:' : 'Finish time:';
  const endValue = result.overtimeMs > 0 ? hhmmss(result.overtimeMs) : result.predictedEnd ? formatTimeOnly(result.predictedEnd) : '—';

  const totalWorkedHours = parseFloat((result.totalWorkMs / 3600000).toFixed(2));

  listEl.innerHTML = `
    <li><strong>Start time:</strong> <code class="kv">${formatTimeOnly(result.firstEntryTime)}</code></li>
    <li><strong>Break duration:</strong> <code class="kv">${hhmmss(result.totalBreakMs)}</code></li>
    <li><strong>${endLabel}</strong> <code class="kv">${endValue}</code></li>
    <li><strong>Total time:</strong> <code class="kv">${totalWorkedHours}h</code></li>
  `;
}

export function renderIntervalsTable(tbody, intervals) {
  tbody.innerHTML = '';
  intervals.forEach((interval, idx) => {
    const tr = document.createElement('tr');
    const status = interval.open ? '<span class="warn">open</span>' : '<span class="ok">closed</span>';
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${formatDT(interval.start)}</td>
      <td>${formatDT(interval.end)}</td>
      <td>${hhmmss(Math.max(0, interval.end - interval.start))}</td>
      <td>${status}</td>
    `;
    tbody.appendChild(tr);
  });
}

export function renderNotes(notesEl, warnings) {
  notesEl.textContent = warnings.join(' ') || 'OK.';
}
