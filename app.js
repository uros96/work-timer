import { compute } from './metrics.js';
import { renderDailySummary, renderIntervalsTable, renderNotes, renderSummaryCards } from './ui.js';

const inputEl = document.getElementById('inputBox');
const tblBody = document.querySelector('#intervalsTbl tbody');
const sumRow = document.getElementById('summaryRow');
const notesEl = document.getElementById('notes');
const dailySummaryEl = document.getElementById('dailySummary');

function render() {
  const raw = inputEl.value || '';
  const result = compute(raw);

  renderSummaryCards(sumRow, result);
  renderDailySummary(dailySummaryEl, result);
  renderIntervalsTable(tblBody, result.intervals);
  renderNotes(notesEl, result.warnings);
}

inputEl.addEventListener('input', render);
render();
setInterval(render, 1000);
