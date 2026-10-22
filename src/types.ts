export type Verdict = "verified" | "context" | "debunked";

export type MockKey = "creatine" | "magnesium" | "iceWater";

export type PaperSource = "PubMed" | "Google Scholar" | "Europe PMC" | "OpenAlex";

export type StudyDesign =
  | "meta-analysis"
  | "systematic-review"
  | "rct"
  | "cohort"
  | "case-control"
  | "cross-sectional"
  | "case-report"
  | "review"
  | "animal"
  | "in-vitro"
  | "other";

export type StudyDirection = "supports" | "contradicts" | "mixed" | "unclear";

export type StudyAccess = "full-text" | "abstract-only" | "open-access-link";

export type Certainty = "High" | "Moderate" | "Low" | "Very low";

export type ClaimType =
  | "safety"
  | "efficacy"
  | "causation"
  | "association"
  | "mechanism"
  | "other";

export type Directness = "direct" | "partial" | "indirect";

export interface EvidenceExcerpt {
  /** Section of the paper the quote came from, e.g. "Results" or "Abstract". */
  section: string;
  text: string;
}

export interface Study {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  design: StudyDesign;
  designLabel: string;
  sampleSize?: number;
  population?: string;
  direction: StudyDirection;
  directionRationale: string;
  certainty: Certainty;
  certaintyRationale: string;
  directness: Directness;
  access: StudyAccess;
  fullTextRead: boolean;
  pmid?: string;
  pmcid?: string;
  doi?: string;
  abstract: string;
  /** The most relevant result/conclusion sentence, quoted verbatim. */
  finding: string;
  methods: string;
  limitations: string;
  excerpts: EvidenceExcerpt[];
  url: string;
  openAccessUrl?: string;
  source: PaperSource;
  citedByCount?: number;
  riskOfBias: string;
  /** Relative weight used in the balance-of-evidence calculation. */
  weight: number;
}

export interface SearchCoverage {
  databases: string[];
  query: string;
  searchedAt: string;
  recordsFound: number;
  recordsScreened: number;
  studiesIncluded: number;
  fullTextsRead: number;
  openAccessAvailable: number;
  dateRange: string;
  limitations: string[];
  /** Set when a non-English claim was locally translated for the search. */
  translatedFrom?: "Spanish";
}

export type AnalysisStep =
  | "ocr"
  | "query"
  | "search"
  | "abstracts"
  | "screen"
  | "fulltext"
  | "synthesize"
  | "done";

export interface AnalysisProgress {
  step: AnalysisStep;
  message: string;
  percent: number;
  current?: number;
  total?: number;
}

export interface Paper {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  studyType: string;
  finding: string;
  pmid?: string;
  url: string;
  source: PaperSource;
  openAccess?: boolean;
}

export interface BreakdownItem {
  title: string;
  body: string;
}

export interface VerdictResult {
  id: string;
  verdict: Verdict;
  label: string;
  /** 0–100. How strongly the available evidence supports the claim as stated. */
  score: number;
  evidenceQuality: "High" | "Moderate" | "Low to moderate" | "Low" | "Very low";
  category: string;
  platform: "TikTok" | "Instagram" | "X" | "Web";
  claim: string;
  conclusion: string;
  contextLine: string;
  breakdown: BreakdownItem[];
  remember: string;
  papers: Paper[];
  /**
   * True when the placeholder router had to fall back to a sample analysis.
   * A live API implementation should return claim-specific results and leave
   * this false.
   */
  isSample?: boolean;
  /** True when the claim came from a simulated screenshot read. */
  fromScreenshot?: boolean;
  /** Present on live scans. Demo results omit it. */
  studies?: Study[];
  coverage?: SearchCoverage;
  certainty?: Certainty;
  certaintyRationale?: string;
  methodology?: string[];
  limitations?: string[];
  /** Plain-language explanation of how the evidence balance produced this verdict. */
  rationale?: string;
  claimType?: ClaimType;
  /** True for a real evidence scan, false/undefined for a demo result. */
  isLive?: boolean;
}
