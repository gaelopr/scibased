export type Verdict =
  | "verified"
  | "leans_for"
  | "context"
  | "leans_against"
  | "debunked";

export type MockKey = "creatine" | "protein" | "coldPlunge";

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
  /**
   * Set when this study was retrieved by widening a specific outcome (for
   * example, bench press) to a related construct (maximal strength). It is
   * always treated as indirect evidence for the original claim.
   */
  redirectedOutcome?: string;
  /** Plain-language explanation of why the tested outcome is only related. */
  redirectNote?: string;
}

/**
 * A record of an automatic outcome redirect. The app never presents related
 * outcomes as if they tested the exact claim; this object carries the audit
 * trail into the UI and the methodology.
 */
export interface SearchRedirect {
  /** The specific outcome the user asked about, e.g. "bench press". */
  from: string;
  /** Broader outcomes used to find adjacent evidence. */
  to: string[];
  /** The query sent to PubMed for the related-outcome search. */
  query: string;
  /** Direct studies found before the search was widened. */
  directStudiesFound: number;
  /** Related-outcome studies included in the final synthesis. */
  relatedStudiesFound: number;
  /** English explanation shown with the search-coverage details. */
  explanation: string;
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
  /** Set when the scan prioritised nutrition / fitness records. */
  searchFocus?: "nutrition-fitness";
  /** Set when no direct test was available and the search was widened. */
  redirect?: SearchRedirect;
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
  /**
   * IDs of the included studies (or sample papers) that this statement draws
   * from. Every synthesis point should carry at least one source when evidence
   * was found, so readers can jump from the claim to the underlying paper.
   */
  studyIds?: string[];
}

export interface VerdictResult {
  id: string;
  verdict: Verdict;
  label: string;
  /** 0–100. How strongly the available evidence supports the claim as stated. */
  score: number;
  /**
   * Whether the score is based on a direct test of the claim or only on
   * related-outcome evidence. The UI must not present an indirect signal as a
   * direct verdict.
   */
  scoreBasis?: "direct" | "indirect" | "directional";
  evidenceQuality: "High" | "Moderate" | "Low to moderate" | "Low" | "Very low";
  category: string;
  platform: "TikTok" | "Instagram" | "X" | "Web";
  claim: string;
  conclusion: string;
  contextLine: string;
  breakdown: BreakdownItem[];
  remember: string;
  /** Studies that support the caveat in the "worth remembering" statement. */
  rememberStudyIds?: string[];
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
