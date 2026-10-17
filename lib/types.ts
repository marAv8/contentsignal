import { z } from 'zod';

export const SectorSchema = z.enum(['Health', 'Legal', 'Travel', 'Media']);
export type Sector = z.infer<typeof SectorSchema>;
export const ClassificationSchema = z.enum(['supported', 'contradicted', 'insufficient_evidence', 'policy_issue']);
export type Classification = z.infer<typeof ClassificationSchema>;
export const PrioritySchema = z.enum(['critical', 'high', 'medium', 'low']);
export type Priority = z.infer<typeof PrioritySchema>;

export const AnalysisSchema = z.object({
  classification: ClassificationSchema,
  priority: PrioritySchema,
  evidenceQuote: z.string().nullable(),
  rationale: z.string(),
  recommendedAction: z.string(),
  needsHumanReview: z.boolean(),
  appliedPolicyIds: z.array(z.string()),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

export interface Policy {
  id: string;
  sector: Sector | 'All';
  title: string;
  requirement: string;
  rationale: string;
}
export interface SourceDocument {
  id: string;
  title: string;
  issuer: string;
  sector: Sector;
  version: string;
  excerpt: string;
  verified: false;
}
export interface EditorialCase {
  id: string;
  sector: Sector;
  property: string;
  title: string;
  content: string;
  sourceId: string;
  reference: string;
  intake: 'Draft review' | 'Reader report' | 'Source update';
  published: string;
  owner: string;
  gold: Classification;
  goldPriority: Priority;
  explanation: string;
}
export interface UpdateEvent {
  id: string;
  sourceId: string;
  title: string;
  date: string;
  previousVersion: string;
  updatedVersion: string;
  previousText: string;
  updatedText: string;
  changedTerms: string[];
  sector: Sector;
}
export interface AnalysisRecord {
  caseId: string;
  mode: 'demo' | 'live';
  analysis: Analysis;
  evidenceVerified: boolean;
  timestamp: string;
}
export type ReviewDecision = 'confirmed' | 'dismissed' | 'investigate';
