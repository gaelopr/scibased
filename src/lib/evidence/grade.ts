import type {
  Certainty,
  Paper,
  SearchCoverage,
  Study,
  StudyDirection,
  Verdict,
  VerdictResult,
} from "../../types";
import { DESIGN_LABELS } from "./config";
import type { ParsedClaim } from "./query";
import { truncate } from "./utils";

export function gradeStudy(study: Study): Study {
  let score = baseCertainty(study);

  if (study.sampleSize !== undefined) {
    if (study.sampleSize >= 1000) score += 0.4;
    else if (study.sampleSize >= 100) score += 0.2;
    else if (study.sampleSize < 30) score -= 0.3;
  } else {
    score -= 0.1;
  }

  if (study.fullTextRead) score += 0.15;
  if (study.directness === "direct") score += 0.3;
  if (study.directness === "indirect") score -= 0.4;
  if (/high risk of bias|small sample|underpowered|not powered|short duration/i.test(study.limitations)) {
    score -= 0.25;
  }
  if (study.direction === "unclear") score -= 0.15;
  if (study.access !== "full-text") score = Math.min(score, 3.4);

  score = clamp(score, 0.5, 4);
  const certainty = mapCertainty(score);
  const certaintyFactor =
    certainty === "High" ? 1 : certainty === "Moderate" ? 0.8 : certainty === "Low" ? 0.55 : 0.3;
  const directnessFactor =
    study.directness === "direct" ? 1 : study.directness === "partial" ? 0.65 : 0.25;

  return {
    ...study,
    certainty,
    certaintyRationale: buildCertaintyRationale(study, certainty),
    weight: round(study.weight * certaintyFactor * directnessFactor),
  };
}

export function synthesizeResult(
  rawStudies: Study[],
  claim: ParsedClaim,
  coverage: SearchCoverage,
): VerdictResult {
  const studies = rawStudies.map(gradeStudy);

  const supports = studies.filter((study) => study.direction === "supports");
  const contradicts = studies.filter((study) => study.direction === "contradicts");
  const mixed = studies.filter((study) => study.direction === "mixed");
  const unclear = studies.filter((study) => study.direction === "unclear");

  const supportWeight = sum(supports.map((study) => study.weight)) + sum(mixed.map((study) => study.weight)) * 0.5;
  const opposeWeight = sum(contradicts.map((study) => study.weight)) + sum(mixed.map((study) => study.weight)) * 0.5;
  const directionalWeight = supportWeight + opposeWeight;
  const supportShare = directionalWeight > 0 ? supportWeight / directionalWeight : 0.5;

  const directStudyCount = studies.filter(
    (study) => study.directness === "direct" && study.direction !== "unclear",
  ).length;
  const contradictingStudies = contradicts.length;
  const directContradictions = contradicts.filter(
    (study) => study.directness === "direct",
  ).length;
  const clearDirectionalCount = supports.length + contradicts.length;
  const clearContradictionShare =
    clearDirectionalCount > 0 ? contradicts.length / clearDirectionalCount : 0;
  const directionalStudyCount = supports.length + contradicts.length + mixed.length;

  const overallCertaintyScore = computeOverallCertainty(studies, supports, contradicts, directStudyCount);
  const certainty = mapCertainty(overallCertaintyScore);
  const certaintyRationale = buildOverallCertaintyRationale(
    certainty,
    studies,
    supports,
    contradicts,
    directStudyCount,
  );

  const canDefinitive =
    studies.length >= 2 &&
    directionalStudyCount >= 2 &&
    directStudyCount >= 1 &&
    overallCertaintyScore >= 2.1;
  // A clearly one-sided contradiction can still debunk a claim when the
  // remaining studies are mixed or unclear. This is deliberately narrower
  // than the general verdict gate: at least two contradictory studies, a
  // direct contradiction, and no meaningful supporting camp.
  const canDebunk =
    contradictingStudies >= 2 &&
    directContradictions >= 1 &&
    clearDirectionalCount >= 2 &&
    clearContradictionShare >= 0.75 &&
    overallCertaintyScore >= 1.5;
  const absoluteClaim =
    /\b(dramatically|drastically|massively|hugely|instantly|miracle|cures?|eliminates?|reverses?|guarantees?)\b/i.test(
      claim.normalized,
    );

  let verdict: Verdict = "context";
  if (studies.length === 0) {
    verdict = "context";
  } else if (
    supportShare >= 0.68 &&
    canDefinitive &&
    overallCertaintyScore >= 2.5 &&
    (!absoluteClaim ||
      (supportShare >= 0.85 && mixed.length === 0 && unclear.length === 0))
  ) {
    verdict = "verified";
  } else if (
    contradictingStudies >= 2 &&
    ((supportShare <= 0.32 && canDefinitive) ||
      (canDebunk && supportShare <= 0.55))
  ) {
    verdict = "debunked";
  }

  const label =
    verdict === "verified" ? "Verified" : verdict === "debunked" ? "Debunked" : "Needs context";
  const score = studies.length === 0 ? 50 : Math.round(supportShare * 100);

  const topStudy =
    [...studies]
      .filter((study) => study.direction !== "unclear")
      .sort((a, b) => b.weight - a.weight)[0] ?? studies[0];

  const conclusion = buildConclusion(
    verdict,
    studies,
    supports,
    contradicts,
    topStudy,
    certainty,
    supportShare,
  );
  const contextLine = buildContextLine(studies, coverage, certainty, topStudy);
  const breakdown = buildBreakdown(
    studies,
    supports,
    contradicts,
    mixed,
    unclear,
    topStudy,
    certaintyRationale,
    claim,
  );
  const remember = buildRemember(studies, certainty);

  return {
    id: `live-${Date.now()}`,
    verdict,
    label,
    score,
    evidenceQuality: certainty,
    category: claim.category,
    platform: "Web",
    claim: claim.original,
    conclusion,
    contextLine,
    breakdown,
    remember,
    papers: studies.map(toPaper),
    isSample: false,
    fromScreenshot: false,
    studies,
    coverage,
    certainty,
    certaintyRationale,
    methodology: buildMethodology(coverage, studies),
    limitations: coverage.limitations,
    rationale: buildRationale(
      studies,
      supports,
      contradicts,
      mixed,
      unclear,
      supportShare,
      overallCertaintyScore,
      verdict,
    ),
    claimType: claim.claimType,
    isLive: true,
  };
}

function toPaper(study: Study): Paper {
  return {
    id: study.id,
    title: study.title,
    authors: study.authors,
    journal: study.journal,
    year: study.year,
    studyType: study.designLabel,
    finding: study.finding,
    pmid: study.pmid,
    url: study.url,
    source: study.source,
    openAccess: study.access !== "abstract-only",
  };
}

function buildConclusion(
  verdict: Verdict,
  studies: Study[],
  supports: Study[],
  contradicts: Study[],
  topStudy: Study | undefined,
  certainty: Certainty,
  supportShare: number,
): string {
  if (studies.length === 0) {
    return "No directly relevant studies were found for this claim. That is not proof the claim is false — it means the claim needs a more specific, testable formulation.";
  }

  const topFinding = topStudy?.finding
    ? ` The strongest included result: “${truncate(topStudy.finding, 240)}”`
    : "";
  const mixedCount = studies.filter((study) => study.direction === "mixed").length;
  const unclearCount = studies.filter((study) => study.direction === "unclear").length;
  const tally = `${supports.length} supporting, ${contradicts.length} contradicting, ${mixedCount} mixed, ${unclearCount} unclear`;

  if (verdict === "verified") {
    return `Across ${studies.length} included studies (${tally}), the balance of evidence supports the claim as stated, with ${certainty.toLowerCase()} certainty.${topFinding}`;
  }

  if (verdict === "debunked") {
    return `Across ${studies.length} included studies (${tally}), the balance of evidence does not support the claim as stated, with ${certainty.toLowerCase()} certainty.${topFinding}`;
  }

  const leaning =
    supportShare > 0.58
      ? "leans toward the claim"
      : supportShare < 0.42
        ? "leans against the claim"
        : "is genuinely mixed";

  const certaintyText =
    certainty === "High" || certainty === "Moderate"
      ? "The certainty is limited by how directly the studies test the claim."
      : "The available certainty is low, so a definitive verdict would overstate what we know.";

  return `The evidence ${leaning}, but it is not strong or consistent enough for a definitive verdict. Across ${studies.length} included studies, ${tally}. ${certaintyText}${topFinding}`;
}

function buildContextLine(
  studies: Study[],
  coverage: SearchCoverage,
  certainty: Certainty,
  topStudy: Study | undefined,
): string {
  if (studies.length === 0) {
    return `0 included papers · ${coverage.recordsScreened} records screened · Very low certainty`;
  }

  const direct = studies.filter((study) => study.directness === "direct").length;
  const gap =
    topStudy?.limitations && !/not reported/i.test(topStudy.limitations)
      ? ` Main caveat: ${truncate(topStudy.limitations, 150)}`
      : "";

  return `${studies.length} papers included · ${coverage.fullTextsRead} ${coverage.fullTextsRead === 1 ? "full text" : "full texts"} read · ${certainty} certainty · ${direct} directly relevant.${gap}`;
}

function buildBreakdown(
  studies: Study[],
  supports: Study[],
  contradicts: Study[],
  mixed: Study[],
  unclear: Study[],
  topStudy: Study | undefined,
  certaintyRationale: string,
  claim: ParsedClaim,
): Array<{ title: string; body: string }> {
  if (studies.length === 0) {
    return [
      {
        title: "The search came up empty",
        body: `No study passed relevance screening for this exact exposure and outcome. Try naming the exposure, population, and outcome more concretely (for example, “Does creatine affect kidney function in healthy adults?”).`,
      },
      {
        title: "What this does — and does not — mean",
        body: "An empty search is not evidence that the claim is false. It means the claim could not be matched to a testable body of research with the current query.",
      },
    ];
  }

  const designCounts = studies.reduce<Record<string, number>>((acc, study) => {
    acc[study.designLabel] = (acc[study.designLabel] ?? 0) + 1;
    return acc;
  }, {});
  const designSummary = Object.entries(designCounts)
    .map(([label, count]) => `${count} ${pluralizeDesign(label, count)}`)
    .join(", ");

  const direct = studies.filter((study) => study.directness === "direct");
  const partial = studies.filter((study) => study.directness === "partial");
  const indirect = studies.filter((study) => study.directness === "indirect");
  const animal = studies.filter((study) => study.design === "animal" || study.design === "in-vitro");
  const absoluteClaim =
    /\b(dramatically|drastically|massively|hugely|instantly|miracle|cures?|eliminates?|reverses?|guarantees?)\b/i.test(
      claim.normalized,
    );

  const topCitation = topStudy
    ? ` (${topStudy.authors.split(",")[0]} et al., ${topStudy.year}; ${topStudy.designLabel.toLowerCase()})`
    : "";

  const directnessBody = direct.length
    ? `${direct.length} ${direct.length === 1 ? "study" : "studies"} measured the claim's exposure and outcome directly. ${partial.length} measured a related or proxy outcome, and ${indirect.length} ${indirect.length === 1 ? "was" : "were"} indirect.`
    : `No study measured the exact claim directly. ${partial.length} measured a related or proxy outcome, and ${indirect.length} ${indirect.length === 1 ? "was" : "were"} indirect. This is a key reason the verdict is cautious.`;

  return [
    {
      title: "What the strongest evidence found",
      body: topStudy
        ? `“${truncate(topStudy.finding, 320)}”${topCitation}`
        : "No individual study could be identified as the strongest source.",
    },
    {
      title: "How the evidence lines up",
      body: `The scan included ${studies.length} ${studies.length === 1 ? "study" : "studies"}: ${designSummary}. ${supports.length} ${supports.length === 1 ? "was" : "were"} classified as supporting the claim, ${contradicts.length} as contradicting it, ${mixed.length} as mixed, and ${unclear.length} as unclear. This is a balance of evidence, not a vote count — study design, sample size, and directness change the weight of each result.`,
    },
    {
      title: "How directly it was tested",
      body: directnessBody + (animal.length ? ` ${animal.length} ${animal.length === 1 ? "study" : "studies"} used animal or laboratory models, so human relevance is uncertain.` : ""),
    },
    {
      title: "What limits the certainty",
      body: `${certaintyRationale}${absoluteClaim ? " The claim uses dramatic or absolute language, so the verdict was judged against that strength — not merely the direction of the evidence." : ""} The claim was read as ${claim.claimType === "efficacy" || claim.claimType === "association" ? "an" : "a"} ${claim.claimType} claim, which affects which outcomes count as direct evidence.`,
    },
  ];
}

function buildRemember(studies: Study[], certainty: Certainty): string {
  if (studies.length === 0) {
    return "No evidence is not the same as evidence of no effect. Reformulate the claim with a specific exposure, population, and outcome before drawing a conclusion.";
  }

  const withLimitations = studies.find(
    (study) =>
      study.limitations &&
      !/not reported/i.test(study.limitations) &&
      /limitation|small sample|underpowered|not powered|short duration|risk of bias|cannot (?:establish|infer)|caution|generali[sz]ability/i.test(
        study.limitations,
      ),
  );

  return `${withLimitations ? `A key caveat from the included research: “${truncate(withLimitations.limitations, 210)}” ` : ""}Certainty is ${certainty.toLowerCase()}. Automated extraction can misclassify a result — open the quoted sections and papers before acting on this verdict.`;
}

function buildMethodology(coverage: SearchCoverage, studies: Study[]): string[] {
  return [
    `Searched PubMed through NCBI E-utilities and OpenAlex on ${new Date(coverage.searchedAt).toLocaleDateString()}. The query was: “${coverage.query}”.`,
    `Screened ${coverage.recordsScreened} records and included the ${studies.length} most relevant studies across systematic reviews, trials, observational studies, and case reports.`,
    `Read abstracts for every included study and full text for ${coverage.fullTextsRead} legally open-access papers through Europe PMC. Results, methods, and limitations were extracted — not just the authors' conclusion.`,
    "Graded each study on design, sample size, directness, consistency, and risk of bias. Journal impact factor was not used as a proxy for quality.",
    "Paywalled papers were assessed from their abstracts only. No Sci-Hub or other unauthorized full-text source was used.",
    "This is a structured automated evidence scan, not a registered systematic review. It cannot rule out publication bias or errors in the primary literature.",
  ];
}

function buildRationale(
  studies: Study[],
  supports: Study[],
  contradicts: Study[],
  mixed: Study[],
  unclear: Study[],
  supportShare: number,
  certaintyScore: number,
  verdict: Verdict,
): string {
  if (studies.length === 0) {
    return "No studies were available to weigh, so the result is Needs context rather than a fabricated verdict.";
  }

  const weightLine = `Weighted support: ${Math.round(supportShare * 100)}% (${supports.length} supporting, ${contradicts.length} contradicting, ${mixed.length} mixed, ${unclear.length} unclear).`;
  const certaintyLine = `Aggregate certainty score: ${certaintyScore.toFixed(1)}/4.`;
  const verdictLine =
    verdict === "context"
      ? "A definitive verdict requires at least two independent studies, at least one direct test, and sufficient certainty."
      : "The verdict threshold was met by both the direction of the evidence and the certainty grade.";

  return `${weightLine} ${certaintyLine} ${verdictLine}`;
}

function computeOverallCertainty(
  studies: Study[],
  supports: Study[],
  contradicts: Study[],
  directStudyCount: number,
): number {
  if (studies.length === 0) return 0.5;

  const mixed = studies.filter((study) => study.direction === "mixed");
  const unclear = studies.filter((study) => study.direction === "unclear");
  const directionalStudies = studies.filter((study) => study.direction !== "unclear");
  const totalWeight = sum(directionalStudies.map((study) => study.weight));
  const weighted =
    totalWeight > 0
      ? sum(
          directionalStudies.map(
            (study) => certaintyScore(study.certainty) * study.weight,
          ),
        ) / totalWeight
      : 0.8;

  const supportWeight = sum(supports.map((study) => study.weight));
  const opposeWeight = sum(contradicts.map((study) => study.weight));
  const directional = supportWeight + opposeWeight;

  let score = weighted;
  if (directional > 0 && Math.min(supportWeight, opposeWeight) / directional >= 0.2) score -= 0.4;
  if (directStudyCount === 0) score -= 0.6;

  const directDirectional = studies.filter(
    (study) => study.directness === "direct" && study.direction !== "unclear",
  ).length;
  if (directDirectional === 1) score -= 0.2;
  if (studies.length < 3) score -= 0.2;

  const unclearShare = unclear.length / studies.length;
  const mixedShare = mixed.length / studies.length;
  const abstractOnlyShare =
    studies.filter((study) => study.access === "abstract-only").length / studies.length;

  if (unclearShare >= 0.3) score -= 0.5;
  if (mixedShare >= 0.2) score -= 0.3;
  if (abstractOnlyShare >= 0.5) score -= 0.3;
  else if (abstractOnlyShare > 0) score -= 0.1;

  const samples = studies
    .map((study) => study.sampleSize)
    .filter((value): value is number => value !== undefined)
    .sort((a, b) => a - b);
  if (samples.length > 0 && samples[Math.floor(samples.length / 2)] < 100) score -= 0.2;

  // High certainty requires a reasonably complete, classifiable evidence base.
  if (unclearShare >= 0.3 || abstractOnlyShare >= 0.5) score = Math.min(score, 3.4);

  return clamp(score, 0.5, 4);
}

function buildOverallCertaintyRationale(
  certainty: Certainty,
  studies: Study[],
  supports: Study[],
  contradicts: Study[],
  directStudyCount: number,
): string {
  const reasons: string[] = [];
  const mixed = studies.filter((study) => study.direction === "mixed");
  const unclear = studies.filter((study) => study.direction === "unclear");
  const abstractOnly = studies.filter((study) => study.access === "abstract-only");
  const fullTextRead = studies.filter((study) => study.fullTextRead);

  if (directStudyCount === 0) reasons.push("no study tested the exact claim directly");
  if (studies.length < 3) reasons.push("few independent studies were available");
  if (supports.length > 0 && contradicts.length > 0) reasons.push("the studies disagree");
  if (mixed.length > 0) {
    reasons.push(
      `${mixed.length} ${mixed.length === 1 ? "study" : "studies"} had mixed or only partially consistent results`,
    );
  }
  if (unclear.length > 0) {
    reasons.push(
      `${unclear.length} ${unclear.length === 1 ? "study" : "studies"} could not be classified confidently`,
    );
  }
  if (abstractOnly.length > 0) {
    reasons.push(
      `${abstractOnly.length} ${abstractOnly.length === 1 ? "paper was" : "papers were"} assessed from abstracts only`,
    );
  }
  if (fullTextRead.length === 0) reasons.push("no included study had legally accessible full text");
  if (studies.some((study) => study.design === "animal" || study.design === "in-vitro")) {
    reasons.push("some evidence came from animal or laboratory models");
  }
  if (reasons.length === 0) {
    reasons.push("the included designs, sample sizes, and directions were reasonably consistent");
  }

  return `${certainty} certainty: ${reasons.join("; ")}.`;
}

function baseCertainty(study: Study): number {
  switch (study.design) {
    case "meta-analysis":
      return 3.6;
    case "systematic-review":
      return 3.2;
    case "rct":
      return 2.9;
    case "cohort":
      return 2.1;
    case "case-control":
      return 1.9;
    case "cross-sectional":
      return 1.5;
    case "case-report":
      return 0.9;
    case "review":
      return 1.3;
    case "animal":
      return 1.0;
    case "in-vitro":
      return 0.7;
    default:
      return 1.2;
  }
}

function buildCertaintyRationale(study: Study, certainty: Certainty): string {
  const parts = [`${study.designLabel}`];
  if (study.sampleSize) parts.push(`n=${study.sampleSize.toLocaleString()}`);
  parts.push(`${study.directness} outcome`);
  if (study.fullTextRead) parts.push("full text read");
  else parts.push("abstract only");
  return `${certainty} certainty based on ${parts.join(", ")}.`;
}

function mapCertainty(score: number): Certainty {
  if (score >= 3.5) return "High";
  if (score >= 2.6) return "Moderate";
  if (score >= 1.6) return "Low";
  return "Very low";
}

function certaintyScore(certainty: Certainty): number {
  switch (certainty) {
    case "High":
      return 4;
    case "Moderate":
      return 3;
    case "Low":
      return 2;
    default:
      return 1;
  }
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function directionLabel(direction: StudyDirection): string {
  switch (direction) {
    case "supports":
      return "Supports claim";
    case "contradicts":
      return "Contradicts claim";
    case "mixed":
      return "Mixed result";
    default:
      return "Unclear";
  }
}

export function designSummary(studies: Study[]): string {
  const counts = studies.reduce<Record<string, number>>((acc, study) => {
    acc[study.designLabel] = (acc[study.designLabel] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .map(([label, count]) => `${count} ${pluralizeDesign(label, count)}`)
    .join(", ");
}

function pluralizeDesign(label: string, count: number): string {
  const lower = label.toLowerCase();
  if (count === 1) return lower;
  if (lower === "meta-analysis") return "meta-analyses";
  if (lower === "systematic review") return "systematic reviews";
  if (lower === "randomized controlled trial") return "randomized controlled trials";
  if (lower === "cohort study") return "cohort studies";
  if (lower === "case-control study") return "case-control studies";
  if (lower === "cross-sectional study") return "cross-sectional studies";
  if (lower === "case report") return "case reports";
  if (lower === "narrative review") return "narrative reviews";
  if (lower === "animal study") return "animal studies";
  if (lower === "in vitro study") return "in vitro studies";
  if (lower === "other study") return "other studies";
  return lower.endsWith("s") ? lower : `${lower}s`;
}

export { DESIGN_LABELS };
