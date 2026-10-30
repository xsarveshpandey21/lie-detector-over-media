export type ContentType = 'text' | 'image' | 'video' | 'audio' | 'url';

export type VerdictLabel = 'likely_true' | 'likely_false' | 'uncertain';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type ReasonTone = 'good' | 'warn' | 'bad' | 'info';

export type SourceStatus = 'checked' | 'not_checked' | 'no_matches_found';

export interface Reference {
  id: string;
  publisher: string;
  title: string;
  rating: string;
  ratingMeaning: string;
  claim: string;
  url: string;
  date: string;
  language: string;
  source: 'google_fact_check' | 'registry' | 'domain_registry' | 'metadata_inspection' | 'style_pattern';
  retrievedAt: string;
  verifiedOn?: string;
  isOld?: boolean;
}

export interface Match {
  matchType: 'live_api' | 'registry_semantic' | 'registry_phrase';
  matchStrength: number;
  matchedPhrases: string[];
  relation: 'same_claim' | 'similar_claim';
  similarityNote: string;
  reference: Reference;
}

export interface ConfidenceAssessment {
  level: ConfidenceLevel;
  score: number;
  reason: string;
}

export interface ReasonItem {
  tone: ReasonTone;
  text: string;
  refIds?: string[];
}

export interface SourceItem {
  publisher: string;
  rating: string;
  claim: string;
  url: string;
  date: string;
  verifiedOn?: string;
  isLocalRegistry?: boolean;
  similarityNote?: string;
  referenceId?: string;
  isOld?: boolean;
  ratingMeaning?: string;
}

export interface CheckItem {
  name: string;
  ran: boolean;
  note: string;
}

export interface InputMeta {
  words?: number;
  chars?: number;
  fileName?: string;
  fileType?: string;
  sizeKB?: number;
  sizeMB?: number;
  domain?: string;
  url?: string;
  width?: number;
  height?: number;
  cameraMake?: string;
  cameraModel?: string;
  software?: string;
  duration?: number;
  codec?: string;
  format?: string;
  https?: boolean;
}

export interface InputSummary {
  kind: 'text' | 'file' | 'url';
  preview: string;
  meta: InputMeta;
}

export interface Verdict {
  label: VerdictLabel;
  headline: string;
  meaning: string;
  score: number | null;
  confidenceLevel: ConfidenceLevel;
}

export interface Sources {
  status: SourceStatus;
  items: SourceItem[];
}

export interface Report {
  type: ContentType;
  input: InputSummary;
  verdict: Verdict;
  confidence?: ConfidenceAssessment;
  reasons: ReasonItem[];
  matches?: Match[];
  references?: Reference[];
  sources: Sources;
  nextSteps: string[];
  checks: CheckItem[];
  technical: Record<string, unknown>;
  notices: string[];
  disclaimer: string;

  // Deprecated compatibility aliases
  truthScore?: number | null;
  label?: VerdictLabel;
  summary?: string;
  explanations?: string[];
}

export interface ApiErrorResponse {
  error: string;
  message: string;
}
