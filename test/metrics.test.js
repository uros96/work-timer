import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { compute, hhmmss } from '../metrics.js';

const fullDayLog = `Entry\tHQ\t2024-05-01 09:00:00
Exit\tHQ\t2024-05-01 12:00:00
Entry\tHQ\t2024-05-01 12:30:00
Exit\tHQ\t2024-05-01 17:00:00`;

const duplicateEntryLog = `Entry\tHQ\t2024-05-02 09:00:00
Entry\tHQ\t2024-05-02 10:00:00
Exit\tHQ\t2024-05-02 11:00:00`;

const exitOnlyLog = `Exit\tHQ\t2024-05-03 10:00:00`;

const invalidRowsLog = `Entry\tHQ\t2024-05-04 09:00:00
Entry\tHQ\tinvalid
Exit\tHQ\t2024-05-04 17:00:00`;

describe('hhmmss formatting', () => {
  it('pads time and handles negatives', () => {
    assert.equal(hhmmss(3_661_000), '01:01:01');
    assert.equal(hhmmss(-3_600_000), '-01:00:00');
  });
});

describe('compute metrics', () => {
  it('handles a full day with one break', () => {
    const result = compute(fullDayLog);
    assert.equal(result.intervals.length, 2);
    assert.equal(result.totalWorkMs, 27_000_000);
    assert.equal(result.totalBreakMs, 1_800_000);
    assert.equal(result.hasBreak, true);
    assert.equal(result.targetMs, 27_000_000);
    assert.equal(result.remainMs, 0);
    assert.equal(result.overtimeMs, 0);
    assert.ok(result.firstEntryTime instanceof Date);
    assert.ok(result.lastTime instanceof Date);
    assert.equal(result.predictedEnd, null);
    assert.deepEqual(result.warnings, []);
  });

  it('emits warning for duplicate entry', () => {
    const result = compute(duplicateEntryLog);
    assert.equal(result.warnings.length, 1);
    assert.match(result.warnings[0], /Duplicate Entry/);
    assert.equal(result.intervals.length, 2);
    assert.equal(result.totalWorkMs, 7_200_000);
  });

  it('warns when exit is missing an entry', () => {
    const result = compute(exitOnlyLog);
    assert.equal(result.warnings.length, 1);
    assert.match(result.warnings[0], /Exit without a prior Entry/);
    assert.equal(result.intervals.length, 0);
    assert.equal(result.totalWorkMs, 0);
    assert.equal(result.targetMs, 28_800_000);
  });

  it('includes parse warnings for invalid rows', () => {
    const result = compute(invalidRowsLog);
    assert.equal(result.intervals.length, 1);
    assert.equal(result.warnings.length, 1);
    assert.match(result.warnings[0], /Skipping invalid row/);
  });
});
