import type { Analysis, AnalysisRecord, Classification, EditorialCase, Priority, ReviewDecision, UpdateEvent } from './types';
import { cases, sources } from '../data/index';

export const className = (value: Classification) => ({
  supported: 'Supported', contradicted: 'Contradicted', insufficient_evidence: 'Insufficient evidence', policy_issue: 'Policy issue',
})[value];

export function validateEvidence(analysis: Analysis, sourceText: string): boolean {
  if (analysis.classification === 'insufficient_evidence') return analysis.evidenceQuote === null || analysis.evidenceQuote.trim() === '' || sourceText.includes(analysis.evidenceQuote);
  if (!analysis.evidenceQuote || !analysis.evidenceQuote.trim()) return false;
  return sourceText.includes(analysis.evidenceQuote.trim());
}

/** A synthetic baseline, authored independently of the gold labels: no LLM is invoked. */
const demoPredictions: Record<string, { classification: Classification; priority: Priority; quote: string | null }> = {
  'CS-001': { classification: 'contradicted', priority: 'high', quote: 'improvement was observed in 62% of 120 participants' },
  'CS-002': { classification: 'contradicted', priority: 'high', quote: 'The product should not be described as risk-free.' },
  'CS-003': { classification: 'contradicted', priority: 'medium', quote: 'Researchers observed improved sleep scores in a small observational sample; no causal relationship was established.' },
  'CS-004': { classification: 'insufficient_evidence', priority: 'medium', quote: null },
  'CS-005': { classification: 'contradicted', priority: 'high', quote: 'form Q-14 is retired. All new applications must use form Q-18.' },
  'CS-006': { classification: 'supported', priority: 'low', quote: 'Paper and electronic submission are both accepted' },
  'CS-007': { classification: 'contradicted', priority: 'high', quote: 'the stated deadline is 30 calendar days from notice.' },
  'CS-008': { classification: 'policy_issue', priority: 'medium', quote: 'must identify the jurisdiction and an applicable reference date.' },
  'CS-009': { classification: 'contradicted', priority: 'high', quote: 'must complete the digital arrival form before departure.' },
  'CS-010': { classification: 'contradicted', priority: 'medium', quote: 'The museum is open on Mondays and closes at 5 PM' },
  'CS-011': { classification: 'insufficient_evidence', priority: 'low', quote: null },
  'CS-012': { classification: 'supported', priority: 'low', quote: 'The downtown shuttle departs from Terminal 2.' },
  'CS-013': { classification: 'policy_issue', priority: 'high', quote: 'Placement type: Paid sponsorship.' },
  'CS-014': { classification: 'supported', priority: 'low', quote: 'Substantive published corrections must be marked with an editorial correction notice.' },
  'CS-015': { classification: 'supported', priority: 'low', quote: '12,000 visits and 240 signups, yielding a 2% signup rate.' },
  'CS-016': { classification: 'supported', priority: 'low', quote: 'Product feature article is paid content' },
  'CS-017': { classification: 'supported', priority: 'low', quote: 'visitors from Region A must complete the digital arrival form before departure.' },
  'CS-018': { classification: 'contradicted', priority: 'high', quote: 'form Q-14 is retired. All new applications must use form Q-18.' },
  'CS-019': { classification: 'supported', priority: 'low', quote: 'The comparative study enrolled adults only.' },
  'CS-020': { classification: 'supported', priority: 'low', quote: 'requires a visible sponsorship label.' },
};

export function demoAnalysis(item: EditorialCase): AnalysisRecord {
  const pred = demoPredictions[item.id];
  const source = sources.find((s) => s.id === item.sourceId)!;
  const analysis: Analysis = {
    classification: pred.classification,
    priority: pred.priority,
    evidenceQuote: pred.quote,
    rationale: `Synthetic baseline predicts “${className(pred.classification)}” for this editorial submission. This is an authored demonstration output, not an AI conclusion.`,
    recommendedAction: pred.classification === 'supported' ? 'Sample for routine editorial quality check.' : 'Review article and the attached reference before deciding whether to revise.',
    needsHumanReview: pred.classification !== 'supported',
    appliedPolicyIds: ['POL-001', 'POL-002', 'POL-007'],
  };
  return { caseId: item.id, mode: 'demo', timestamp: '2026-10-16T17:00:00-07:00', analysis, evidenceVerified: validateEvidence(analysis, source.excerpt) };
}

export interface Score {
  total: number;
  correct: number;
  accuracy: number;
  mismatches: { caseId: string; gold: Classification; predicted: Classification }[];
  highPriorityRecall: number | null;
  evidenceValidity: number;
  falsePositiveRate: number | null;
  abstentionRecall: number | null;
  priorityMatches: number;
}
export function scoreRecords(records: AnalysisRecord[], groundTruth = cases): Score {
  const joined = records.map((r) => ({ record: r, item: groundTruth.find((c) => c.id === r.caseId) })).filter((x): x is { record: AnalysisRecord; item: EditorialCase } => Boolean(x.item));
  const total = joined.length;
  const correct = joined.filter(({ record, item }) => record.analysis.classification === item.gold).length;
  const high = joined.filter(({ item }) => item.goldPriority === 'high' || item.goldPriority === 'critical');
  const highCaught = high.filter(({ record }) => record.analysis.priority === 'high' || record.analysis.priority === 'critical');
  const negatives = joined.filter(({ item }) => item.gold === 'supported');
  const negativeIncorrect = negatives.filter(({ record }) => record.analysis.classification !== 'supported');
  const insufficient = joined.filter(({ item }) => item.gold === 'insufficient_evidence');
  const abstained = insufficient.filter(({ record }) => record.analysis.classification === 'insufficient_evidence');
  return {
    total, correct, accuracy: total ? correct / total : 0,
    mismatches: joined.filter(({ record, item }) => record.analysis.classification !== item.gold).map(({ record, item }) => ({ caseId: item.id, gold: item.gold, predicted: record.analysis.classification })),
    highPriorityRecall: high.length ? highCaught.length / high.length : null,
    evidenceValidity: total ? joined.filter(({ record }) => record.evidenceVerified).length / total : 0,
    falsePositiveRate: negatives.length ? negativeIncorrect.length / negatives.length : null,
    abstentionRecall: insufficient.length ? abstained.length / insufficient.length : null,
    priorityMatches: joined.filter(({ record, item }) => record.analysis.priority === item.goldPriority).length,
  };
}

export interface ImpactMatch {
  caseId: string;
  title: string;
  property: string;
  basis: 'linked_source' | 'keyword_candidate';
  matchingTerms: string[];
  priority: Priority;
  decision: ReviewDecision | null;
}
/** Linked source IDs establish known dependencies. Keyword hits are weaker candidates, never confirmed impact. */
export function impactForUpdate(event: UpdateEvent): ImpactMatch[] {
  const normalize = (s: string) => s.toLowerCase();
  return cases.map((item): ImpactMatch | null => {
    const linked = item.sourceId === event.sourceId;
    const matchingTerms = event.changedTerms.filter((term) => normalize(item.title + ' ' + item.content).includes(normalize(term)));
    if (!linked && matchingTerms.length < 2) return null;
    return {
      caseId: item.id, title: item.title, property: item.property,
      basis: linked ? 'linked_source' as const : 'keyword_candidate' as const,
      matchingTerms, priority: linked ? item.goldPriority : 'low' as const, decision: null,
    };
  }).filter((m): m is ImpactMatch => m !== null).sort((a,b) => (a.basis === 'linked_source' ? 0 : 1) - (b.basis === 'linked_source' ? 0 : 1));
}
export function ruleChecks(item: EditorialCase): { label: string; pass: boolean; detail: string }[] {
  const source = sources.find((s) => s.id === item.sourceId);
  return [
    { label: 'Source relationship', pass: Boolean(source), detail: source ? `${source.id} is linked in the fixture dataset` : 'No source record found' },
    { label: 'Reference excerpt', pass: Boolean(source?.excerpt.trim()), detail: source?.excerpt ? 'Source excerpt available for comparison' : 'No evidence supplied' },
    { label: 'Review owner', pass: Boolean(item.owner), detail: item.owner || 'No owner specified' },
    { label: 'Version awareness', pass: Boolean(source?.version), detail: source?.version ? `Version ${source.version}` : 'Unknown version' },
  ];
}
