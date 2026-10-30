export type ContentType = 'text' | 'image' | 'video' | 'audio' | 'url';

export type VerdictLabel = 'likely_true' | 'likely_false' | 'uncertain';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type ReasonTone = 'good' | 'warn' | 'bad' | 'info';

export type SourceStatus = 'checked' | 'not_checked' | 'no_matches_found';

export interface ReasonItem {
  tone: ReasonTone;
  text: string;
}

export interface SourceItem {
  publisher: string;
  rating: string;
  claim: string;
  url: string;
  date: string;
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
  reasons: ReasonItem[];
  sources: Sources;
  nextSteps: string[];
  checks: CheckItem[];
  technical: Record<string, unknown>;
  notices: string[];
  disclaimer: string;

  // Deprecated compatibility aliases
  truthScore?: number | null;
  confidence?: number;
  label?: VerdictLabel;
  summary?: string;
  explanations?: string[];
}

export interface ApiErrorResponse {
  error: string;
  message: string;
}

