import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cases, updates } from '../data/index';
import { demoAnalysis, impactForUpdate, scoreRecords, validateEvidence } from '../lib/engine';

test('fixture IDs are unique and cases have relevant source links', () => {
  assert.equal(cases.length, 20);
  assert.equal(new Set(cases.map((c) => c.id)).size, cases.length);
  assert(cases.every((c) => /^SRC-/.test(c.sourceId)));
});
test('demo baseline is visibly synthetic and contains deliberate mistakes', () => {
  const records = cases.map(demoAnalysis);
  assert(records.every((r) => r.mode === 'demo'));
  const score = scoreRecords(records);
  assert.equal(score.total, 20);
  assert(score.correct < 20);
  assert(score.mismatches.some((m) => m.caseId === 'CS-016'));
  assert((score.falsePositiveRate ?? 0) > 0);
  assert(score.evidenceValidity < 1);
});
test('evidence validator rejects fabricated quoted support', () => {
  const original = demoAnalysis(cases[0]).analysis;
  assert.equal(validateEvidence(original, 'A completely unrelated source'), false);
  assert.equal(validateEvidence({ ...original, evidenceQuote: 'not in the original source' }, 'The original source'), false);
});
test('source updates preserve known linked dependencies', () => {
  const matches = impactForUpdate(updates[0]);
  assert(matches.some((m) => m.caseId === 'CS-009' && m.basis === 'linked_source'));
  assert(matches.every((m) => m.basis === 'linked_source' || m.basis === 'keyword_candidate'));
});
test('empty score does not divide by zero', () => {
  const score = scoreRecords([]);
  assert.equal(score.total, 0);
  assert.equal(score.accuracy, 0);
  assert.equal(score.highPriorityRecall, null);
});
