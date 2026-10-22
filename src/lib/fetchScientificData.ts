import type { AnalysisProgress, VerdictResult } from "../types";
import { runEvidenceScan } from "./evidence/scan";

/* -------------------------------------------------------------------------- */
/*  LIVE EVIDENCE PIPELINE                                                    */
/* -------------------------------------------------------------------------- */
/**
 * fetchScientificData(claimText)
 * --------------------------------
 * The single seam between SciBased's UI and the evidence engine.
 *
 * The live pipeline:
 *   1. Parses the claim into searchable concepts without changing its meaning.
 *   2. Searches PubMed (NCBI E-utilities) and OpenAlex.
 *   3. Screens abstracts for relevance and study design.
 *   4. Reads abstracts for every included study and legally open-access full
 *      text through Europe PMC (results, methods, limitations, not just the
 *      authors' conclusion).
 *   5. Grades design, sample size, directness, consistency, and risk of bias.
 *   6. Returns a transparent VerdictResult with study-level quotes and links.
 *
 * Important limits:
 *   - Paywalled papers are read at the abstract level only. Sci-Hub and other
 *     unauthorized full-text sources are not used.
 *   - The direction labels are automated screening aids, not expert appraisals.
 *   - This is not a registered systematic review and is not medical advice.
 */
export async function fetchScientificData(
  claimText: string,
  options: { onProgress?: (progress: AnalysisProgress) => void } = {},
): Promise<VerdictResult> {
  const normalized = claimText.trim().replace(/\s+/g, " ");

  if (normalized.length < 8) {
    throw new Error("Please enter a more specific claim.");
  }

  const result = await runEvidenceScan(normalized, {
    onProgress: options.onProgress,
  });

  return {
    ...result,
    claim: normalized,
    isSample: false,
    fromScreenshot: false,
  };
}
