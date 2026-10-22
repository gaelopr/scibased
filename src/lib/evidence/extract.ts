import type {
  ClaimType,
  Directness,
  EvidenceExcerpt,
  Study,
  StudyDesign,
  StudyDirection,
} from "../../types";
import {
  DESIGN_LABELS,
  DESIGN_WEIGHTS,
} from "./config";
import type { FullText } from "./fullText";
import type { ParsedClaim } from "./query";
import type { RawArticle } from "./pubmed";
import {
  cleanText,
  normalizeTitle,
  splitSentences,
  truncate,
} from "./utils";

interface ClassifiedSentence {
  text: string;
  section: string;
  support: boolean;
  contradict: boolean;
  mixed: boolean;
}

export function buildStudy(
  article: RawArticle,
  fullText: FullText | null,
  claim: ParsedClaim,
): Study {
  const design = detectDesign(article, fullText);
  const designLabel = DESIGN_LABELS[design];
  const abstractText = article.abstract;
  const abstractSections = article.abstractSections;

  const resultsText = fullText?.resultsText || sectionText(abstractSections, /result|findings/i);
  const conclusionText =
    fullText?.conclusionText ||
    sectionText(abstractSections, /conclusion|interpretation|summary/i) ||
    lastSentences(abstractText, 2);
  const methodsText =
    fullText?.methodsText || sectionText(abstractSections, /method|design|patients|participants/i);
  const limitationsText =
    fullText?.limitationsText || findLimitations(abstractText);

  const resultSentences = pickSentences(resultsText, 8);
  const conclusionSentences = pickSentences(conclusionText, 5);
  const abstractSentences = pickSentences(abstractText, 6);
  const seenEvidence = new Set<string>();
  const evidenceSentences = [
    ...resultSentences.map((text) => ({ text, section: "Results" })),
    ...conclusionSentences.map((text) => ({ text, section: "Conclusion" })),
    ...abstractSentences.map((text) => ({ text, section: "Abstract" })),
  ].filter((item) => {
    const key = item.text.toLowerCase();
    if (seenEvidence.has(key)) return false;
    seenEvidence.add(key);
    return true;
  });

  if (evidenceSentences.length === 0 && abstractText) {
    evidenceSentences.push({ text: abstractText, section: "Abstract" });
  }

  const classification = classifyDirection(
    evidenceSentences,
    claim,
    article.title,
    abstractText,
  );

  const directness = assessDirectness(
    claim,
    article,
    fullText,
    [...resultSentences, ...conclusionSentences].join(" "),
  );

  const sampleSize = detectSampleSize(
    [abstractText, methodsText, fullText?.resultsText ?? ""].join(" "),
  );
  const reportedSampleSize = normalizeSampleSize(
    design,
    sampleSize,
    [abstractText, methodsText, fullText?.resultsText ?? ""].join(" "),
  );
  const population = detectPopulation(
    [abstractText, methodsText].join(" "),
    reportedSampleSize,
  );

  const findingFallback =
    [...resultSentences, ...conclusionSentences, ...abstractSentences].find(
      (sentence) =>
        !isLowQualitySentence(sentence) && !isNonEvidenceSentence(sentence),
    ) ?? "The available text did not report a clear result.";
  const finding = truncate(
    classification.strongestSentence || findingFallback,
    360,
  );

  const limitations = truncate(
    pickLimitationsSentence(limitationsText) ||
      findLimitations([...resultSentences, ...conclusionSentences].join(" ")) ||
      "Limitations were not reported in the available text.",
    300,
  );

  const methods = truncate(
    pickMethodsSentence(methodsText) ||
      (fullText ? "Methods section available in the full text." : "Methods are not available in the abstract."),
    300,
  );

  const excerpts = buildExcerpts(
    classification,
    resultSentences,
    conclusionSentences,
    methodsText,
    limitationsText,
  );

  const access = fullText
    ? "full-text"
    : article.isOpenAccess || article.pmcid || article.openAccessUrl
      ? "open-access-link"
      : "abstract-only";

  const openAccessUrl = fullText
    ? `https://europepmc.org/article/PMC/${fullText.pmcid || article.pmcid}`
    : article.openAccessUrl ||
      (article.pmcid
        ? `https://europepmc.org/article/PMC/${article.pmcid}`
        : undefined);

  const url = article.pmid
    ? `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`
    : article.doi
      ? `https://doi.org/${article.doi}`
      : article.id.startsWith("http")
        ? article.id
        : openAccessUrl || "https://pubmed.ncbi.nlm.nih.gov/";

  return {
    id: article.pmid ?? article.doi ?? normalizeTitle(article.title),
    title: article.title,
    authors: article.authors || "Authors not listed",
    journal: article.journal || "Unknown journal",
    year: article.year,
    design,
    designLabel,
    sampleSize: reportedSampleSize,
    population,
    direction: classification.direction,
    directionRationale: classification.rationale,
    certainty: "Low",
    certaintyRationale: "",
    directness,
    access,
    fullTextRead: Boolean(fullText),
    pmid: article.pmid,
    pmcid: article.pmcid,
    doi: article.doi,
    abstract: truncate(abstractText, 1600),
    finding,
    methods,
    limitations,
    excerpts,
    url,
    openAccessUrl,
    source: article.source,
    citedByCount: article.citedByCount,
    riskOfBias: describeRiskOfBias(design, reportedSampleSize, limitationsText),
    weight: DESIGN_WEIGHTS[design],
  };
}

export function detectDesign(article: RawArticle, fullText: FullText | null): StudyDesign {
  const title = article.title.toLowerCase();
  const pubTypes = article.pubTypes.join(" ").toLowerCase();
  const abstract = article.abstract.toLowerCase();
  const methods = (fullText?.methodsText ?? "").toLowerCase();

  // The title is the most reliable signal. Checking it first avoids classifying
  // a narrative review as a case report merely because it discusses case reports.
  if (/meta[- ]analys/.test(title)) return "meta-analysis";
  if (/systematic review/.test(title)) return "systematic-review";
  if (/randomi[sz]ed|randomly assigned|placebo[- ]controlled|double[- ]blind/.test(title)) {
    return "rct";
  }
  if (/case[- ]control/.test(title)) return "case-control";
  if (/cross[- ]sectional|survey/.test(title)) return "cross-sectional";
  if (/cohort|longitudinal|prospective|retrospective|observational/.test(title)) {
    return "cohort";
  }
  if (/case report|case series|single case/.test(title)) return "case-report";
  if (/review/.test(title)) return "review";

  // Publication types are curated by PubMed and are the next best signal.
  if (/meta-analysis|meta analysis/.test(pubTypes)) return "meta-analysis";
  if (/systematic review/.test(pubTypes)) return "systematic-review";
  if (/randomized controlled trial|randomised controlled trial|clinical trial/.test(pubTypes)) {
    return "rct";
  }
  if (/case reports?/.test(pubTypes)) return "case-report";
  if (/review/.test(pubTypes)) return "review";
  if (/observational study/.test(pubTypes)) return "cohort";

  const haystack = `${abstract} ${methods}`;
  // Do not infer a systematic review just because the abstract mentions one.
  // That mistake turns narrative reviews into high-weight secondary evidence.
  if (
    /\b(?:this|our) (?:systematic review|meta[- ]analysis)\b|\bwe (?:conducted|performed|did) a (?:systematic review|meta[- ]analysis)\b|\bpooled (?:analysis|estimate|data)\b/.test(
      haystack,
    )
  ) {
    return /meta[- ]analys/.test(haystack) ? "meta-analysis" : "systematic-review";
  }
  if (
    /\b(?:data sources|data synthesis)\b/.test(haystack) &&
    /\b(?:literature search|medline|identified|included)\b/.test(haystack)
  ) {
    return "systematic-review";
  }
  if (
    /randomi[sz]ed|randomly assigned|placebo[- ]controlled|double[- ]blind|controlled trial/.test(
      haystack,
    )
  ) {
    return "rct";
  }
  if (/case[- ]control/.test(haystack)) return "case-control";
  if (/cross[- ]sectional/.test(haystack)) return "cross-sectional";
  if (/cohort|prospective study|retrospective study|longitudinal/.test(haystack)) {
    return "cohort";
  }
  if (/\b(mice|rats|murine|rodent|animal model)\b/.test(haystack)) {
    return "animal";
  }
  if (/in vitro|cell culture|cell line|bench study/.test(haystack)) {
    return "in-vitro";
  }
  if (/case report|case series|single case/.test(haystack)) return "case-report";
  return "other";
}

export function detectSampleSize(text: string): number | undefined {
  const cleaned = cleanText(text).replace(/,/g, "");
  const candidates: number[] = [];

  const patterns = [
    /\b(\d{1,7})\s+(?:participants|patients|subjects|adults|children|women|men|volunteers|individuals|athletes|students|workers|mice|rats)\b/gi,
    /\b(?:n|N)\s*=\s*(\d{1,7})\b/g,
    /\b(\d{1,7})\s+(?:were|was)\s+(?:randomi[sz]ed|included|enrolled|recruited|analy[sz]ed)\b/gi,
  ];

  for (const pattern of patterns) {
    for (const match of cleaned.matchAll(pattern)) {
      const value = Number(match[1]);
      if (value >= 5 && value <= 5_000_000) candidates.push(value);
    }
  }

  if (candidates.length === 0) return undefined;

  // Prefer the largest reported human sample, while avoiding implausible
  // numbers that are usually years, doses, or reference counts.
  return Math.max(...candidates.filter((value) => value < 1_000_000));
}

function normalizeSampleSize(
  design: StudyDesign,
  sampleSize: number | undefined,
  text: string,
): number | undefined {
  if (sampleSize === undefined) return undefined;
  if (design !== "meta-analysis" && design !== "systematic-review") return sampleSize;

  const number = sampleSize.toString();
  const trialCount = new RegExp(
    `\\b${number}\\b\\s*(?:RCTs?|randomi[sz]ed trials?|trials?|studies|articles?|papers?)`,
    "i",
  ).test(text);
  const participantCount = new RegExp(
    `\\b${number}\\b\\s*(?:participants|patients|subjects|adults|children|women|men|volunteers|individuals|athletes|students|workers)`,
    "i",
  ).test(text);

  // In a meta-analysis, \"n = 19\" often means 19 trials, not 19 people.
  if (trialCount && !participantCount) return undefined;
  return sampleSize;
}

export function detectPopulation(text: string, sampleSize?: number): string | undefined {  const cleaned = cleanText(text);
  const patterns = [
    /\b(?:in|among|of)\s+(\d[\d,]*\s+[^.;]{0,90}?(?:adults|patients|participants|children|women|men|athletes|students|volunteers|mice|rats))/i,
    /(\d[\d,]*\s+(?:older adults|adults|patients|participants|children|women|men|athletes|students|volunteers)[^.;]{0,70})/i,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match?.[1]) return truncate(match[1], 120);
  }

  if (sampleSize) {
    const nearby = cleaned.match(
      new RegExp(`.{0,60}\\b${sampleSize}\\b.{0,100}`, "i"),
    );
    if (nearby?.[0]) return truncate(nearby[0], 120);
  }

  return undefined;
}

export function classifyDirection(
  sentences: Array<{ text: string; section: string }>,
  claim: ParsedClaim,
  title: string,
  abstract: string,
): {
  direction: StudyDirection;
  rationale: string;
  strongestSentence: string;
  sentences: ClassifiedSentence[];
} {
  const claimType = claim.claimType;
  const classified: ClassifiedSentence[] = sentences.map(({ text, section }) => {
    const normalized = text.toLowerCase();
    if (isNonEvidenceSentence(text)) {
      return { text, section, support: false, contradict: false, mixed: false };
    }
    const support = matchesAny(normalized, supportPatterns(claimType));
    const contradict = matchesAny(normalized, contradictPatterns(claimType));
    const mixed = /\b(mixed|inconsistent|conflicting|heterogeneous|uncertain|equivocal|suggested|anecdotal|case reports?|almost nonexistent|rather than (?:renal|hepatic) impairment|transient increase|not necessarily)\b/.test(
      normalized,
    );

    if (claimType === "safety") {
      // "No adverse renal effects" is support, not contradiction. A bare
      // mention of "adverse events" is not enough to contradict a kidney
      // claim; the harm must be tied to the organ or a clinical outcome.
      const explicitlyUnsafe =
        /\b(not safe|unsafe|not without risk|not risk[- ]free)\b/i.test(
          normalized,
        );
      return {
        text,
        section,
        support: !explicitlyUnsafe && (support || (contradict && hasNegation(normalized))),
        contradict:
          explicitlyUnsafe ||
          (contradict && !hasNegation(normalized) && !support),
        mixed,
      };
    }

    if (claimType === "efficacy" || claimType === "causation" || claimType === "association") {
      // "No significant improvement" must not count as support.
      return {
        text,
        section,
        support: support && !contradict,
        contradict,
        mixed,
      };
    }

    return { text, section, support, contradict, mixed };
  });

  const supportCount = classified.filter((item) => item.support && !item.contradict).length;
  const contradictCount = classified.filter((item) => item.contradict).length;
  const mixedCount = classified.filter((item) => item.mixed).length;

  let direction: StudyDirection = "unclear";
  if (mixedCount > 0) direction = "mixed";
  else if (supportCount > 0 && contradictCount > 0) direction = "mixed";
  else if (supportCount > 0) direction = "supports";
  else if (contradictCount > 0) direction = "contradicts";

  const strongest = pickStrongestSentence(
    classified,
    direction,
    claim.concepts[0]?.terms ?? [],
    claim.concepts.slice(1).flatMap((concept) => concept.terms),
  );

  const rationale = buildDirectionRationale(
    direction,
    supportCount,
    contradictCount,
    mixedCount,
    strongest,
    claimType,
    title,
    abstract,
  );

  return {
    direction,
    rationale,
    strongestSentence: strongest,
    sentences: classified,
  };
}

function pickStrongestSentence(
  classified: ClassifiedSentence[],
  direction: StudyDirection,
  interventionTerms: string[],
  outcomeTerms: string[],
): string {
  const clean = classified.filter(
    (item) => !isLowQualitySentence(item.text) && !isNonEvidenceSentence(item.text),
  );
  const directional = clean.filter((item) => item.support || item.contradict || item.mixed);
  const pool = clean.length > 0 ? clean : directional;
  if (pool.length === 0) return "";

  const scored = pool.map((item) => {
    const lower = item.text.toLowerCase();
    let score = 0;

    if (direction === "supports" && item.support) score += 4;
    if (direction === "contradicts" && item.contradict) score += 4;
    if (direction === "mixed" && item.mixed) score += 3;
    if (item.section === "Conclusion") score += 3;
    if (outcomeTerms.some((term) => lower.includes(term.toLowerCase()))) score += 4;
    if (interventionTerms.some((term) => lower.includes(term.toLowerCase()))) score += 1.5;
    if (/\d/.test(item.text)) score += 1;
    if (
      /\b(no significant|did not|does not|safe|adverse|risk|increase|decrease|reduced|improved|associated|complication)\b/i.test(
        item.text,
      )
    ) {
      score += 1.5;
    }
    if (
      /\b(urge|lobbyists?|policymakers?|health agencies|restrictions?|public health policy|advocacy)\b/i.test(
        lower,
      )
    ) {
      score -= 7;
    }
    if (
      /\b(background|introduction|we searched|literature search|databases?|further research|future research|more research)\b/i.test(
        lower,
      )
    ) {
      score -= 3;
    }
    if (/\b(recommend|recommended|should be|need to|monitoring is|caution is)\b/i.test(lower)) {
      score -= 1.5;
    }

    const digitShare = (item.text.match(/\d/g) ?? []).length / item.text.length;
    if (digitShare > 0.15) score -= 2;
    return { text: item.text, score };
  });

  return scored.sort((a, b) => b.score - a.score)[0]?.text ?? "";
}

function buildDirectionRationale(
  direction: StudyDirection,
  supportCount: number,
  contradictCount: number,
  mixedCount: number,
  strongest: string,
  claimType: ClaimType,
  title: string,
  abstract: string,
): string {
  const label =
    direction === "supports"
      ? "consistent with the claim"
      : direction === "contradicts"
        ? "contrary to the claim"
        : direction === "mixed"
          ? "mixed or inconsistent"
          : "not directly classifiable";

  if (!strongest) {
    return `No clear ${claimType} result sentence was found in the available text. Direction marked ${label}.`;
  }

  const counts = `${supportCount} supporting sentence${supportCount === 1 ? "" : "s"}, ${contradictCount} contradicting, ${mixedCount} mixed`;
  const titleRelevance = title.toLowerCase().includes("review") ? " The paper is a review, so it is treated as secondary evidence." : "";

  return `Automated reading marked this study ${label} (${counts}). Key sentence: “${truncate(strongest, 220)}”.${titleRelevance}${
    abstract.length < 200 ? " The abstract was short, so this classification is less certain." : ""
  }`;
}

function assessDirectness(
  claim: ParsedClaim,
  article: RawArticle,
  fullText: FullText | null,
  evidenceText: string,
): Directness {
  const design = detectDesign(article, fullText);
  if (design === "animal" || design === "in-vitro") return "indirect";

  const interventionTerms = claim.concepts[0]?.terms ?? [];
  const outcomeTerms = claim.concepts.slice(1).flatMap((concept) => concept.terms);

  const titleAndAbstract = `${article.title} ${article.abstract}`.toLowerCase();
  const allText = `${titleAndAbstract} ${evidenceText}`.toLowerCase();

  // A study of "sleep quality" is not a direct test of a claim specifically
  // about deep sleep. Keep the grade honest about that mismatch.
  if (
    /\bdeep sleep|slow[- ]wave sleep\b/.test(claim.normalized.toLowerCase()) &&
    !/\b(deep sleep|slow[- ]wave|sleep architecture|sleep stages?|stage 3|n3)\b/.test(
      allText,
    )
  ) {
    return "partial";
  }

  if (
    /\bbloat(?:ing|ed)?\b/.test(claim.normalized.toLowerCase()) &&
    !/\bbloat(?:ing|ed)?\b/.test(allText)
  ) {
    return "partial";
  }

  if (
    /\bmagnesium\b/.test(claim.normalized.toLowerCase()) &&
    /\bsupplements?\b/.test(claim.normalized.toLowerCase()) &&
    !/\b(supplement(?:ation|s)?|oral magnesium|magnesium (?:oxide|citrate|glycinate|bisglycinate|threonate|l[- ]threonate)|mg\s*\/\s*day|mg per day)\b/.test(
      allText,
    )
  ) {
    return "partial";
  }

  const interventionInTitle = containsAnyTerm(titleAndAbstract, interventionTerms);
  const outcomeInTitle = containsAnyTerm(titleAndAbstract, outcomeTerms);
  const interventionInText = containsAnyTerm(allText, interventionTerms);
  const outcomeInText = containsAnyTerm(allText, outcomeTerms);

  if (interventionInTitle && outcomeInTitle) {
    return design === "review" ? "partial" : "direct";
  }
  if (interventionInText && outcomeInText) {
    const harmTerms = /\b(issue|issues|damage|pain|bloat|bloating|inflammation|disease|failure|injury|symptom|symptoms)\b/i;
    const clinicalOutcome = /\b(risk|incidence|adverse events?|hospitali[sz]ation|diagnosis|mortality|quality of life)\b/i;
    if (claim.claimType === "causation" && harmTerms.test(claim.normalized) && !clinicalOutcome.test(allText)) {
      return "partial";
    }
    return design === "review" ? "partial" : "direct";
  }
  if (interventionInText || outcomeInText) return "partial";
  return "indirect";
}

function pickMethodsSentence(text: string): string {
  const sentences = splitSentences(text);
  const prioritized = sentences.filter((sentence) =>
    /randomi[sz]ed|participants|patients|subjects|trial|cohort|reviewed|searched|we (?:included|analy[sz]ed)|study design|duration|weeks?|months?/i.test(
      sentence,
    ),
  );
  return prioritized[0] ?? sentences[0] ?? "";
}

function buildExcerpts(
  classification: ReturnType<typeof classifyDirection>,
  resultSentences: string[],
  conclusionSentences: string[],
  methodsText: string,
  limitationsText: string,
): EvidenceExcerpt[] {
  const excerpts: EvidenceExcerpt[] = [];
  const seen = new Set<string>();

  const add = (section: string, text: string) => {
    if (isLowQualitySentence(text) || isNonEvidenceSentence(text)) return;
    const cleaned = truncate(text, 420);
    const key = cleaned.toLowerCase();
    if (!cleaned || seen.has(key)) return;
    seen.add(key);
    excerpts.push({ section, text: cleaned });
  };

  const directional = classification.sentences.find(
    (item) => item.support || item.contradict || item.mixed,
  );
  if (directional) add(directional.section, directional.text);
  if (resultSentences[0]) add("Results", resultSentences[0]);
  if (conclusionSentences[0]) add("Conclusion", conclusionSentences[0]);
  if (methodsText) add("Methods", pickMethodsSentence(methodsText));
  if (limitationsText) {
    const limitation = pickLimitationsSentence(limitationsText);
    if (limitation) add("Limitations", limitation);
  }

  return excerpts.slice(0, 5);
}

function describeRiskOfBias(
  design: StudyDesign,
  sampleSize: number | undefined,
  limitations: string,
): string {
  const notes: string[] = [];

  if (design === "case-report") notes.push("Single case or small case series; cannot establish causality or generalizability.");
  if (design === "cross-sectional") notes.push("Cross-sectional design cannot establish temporal order or causation.");
  if (design === "cohort" || design === "case-control") notes.push("Observational design is vulnerable to confounding.");
  if (design === "animal") notes.push("Animal model; human relevance is uncertain.");
  if (design === "in-vitro") notes.push("Laboratory/cell model; does not demonstrate effects in people.");
  if (design === "meta-analysis" || design === "systematic-review") notes.push("Quality depends on the included studies, heterogeneity, and publication bias.");
  if (design === "rct") notes.push("Randomization helps, but blinding and allocation concealment still need checking.");
  if (design === "review") notes.push("Narrative review; selection of studies is not systematic.");
  if (sampleSize !== undefined && sampleSize < 50) notes.push(`Small sample (n=${sampleSize}); effect estimates are imprecise.`);
  if (/high risk of bias|small sample|underpowered|not powered|short duration/i.test(limitations)) {
    notes.push("The authors report a relevant methodological limitation.");
  }

  return notes[0] ?? "No major design-level risk flag identified; read the full paper for details.";
}

function sectionText(
  sections: Array<{ label: string; text: string }>,
  pattern: RegExp,
): string {
  return sections
    .filter((section) => pattern.test(section.label))
    .map((section) => section.text)
    .join(" ");
}

function lastSentences(text: string, count: number): string {
  return splitSentences(cleanText(text)).slice(-count).join(" ");
}

function findLimitations(text: string): string {
  const sentences = splitSentences(cleanText(text));
  const candidates = sentences.filter((sentence) =>
    /limitation|small sample|underpowered|not powered|risk of bias|short duration|cannot (?:establish|infer)|generali[sz]ability|heterogeneity|single[- ]cent(?:er|re)|observational/i.test(
      sentence,
    ),
  );
  if (candidates.length === 0) return "";

  const score = (sentence: string): number => {
    let value = 0;
    if (/^(?:a |the )?(?:key |main |potential )?limitations?\b/i.test(sentence)) value += 4;
    if (/\b(?:however|although|but|yet)\b/i.test(sentence)) value += 2;
    if (/\b(?:well designed|low (?:overall )?risk of bias|strengths?)\b/i.test(sentence)) value -= 3;
    if (/\b(?:small sample|underpowered|not powered|short duration|cannot|generali[sz]ability|risk of bias)\b/i.test(sentence)) value += 2;
    return value;
  };

  const best = [...candidates].sort((a, b) => score(b) - score(a))[0];
  const index = best.toLowerCase().lastIndexOf("limitation");
  if (index > 0) {
    const clause = best.slice(index);
    return clause.charAt(0).toUpperCase() + clause.slice(1);
  }
  return best;
}

function pickLimitationsSentence(text: string): string {
  return findLimitations(text);
}

/** Future-research recommendations and policy asks are not study findings. */
function isNonEvidenceSentence(sentence: string): boolean {
  const lower = sentence.toLowerCase();
  if (
    /^\s*(?:objective|background|purpose|aim|introduction|methods?|design|setting|participants)\s*[:\-]/i.test(
      lower,
    ) ||
    /\b(?:we|this study|the present study|the current study)\s+(?:aimed|sought)\s+to\b/i.test(
      lower,
    ) ||
    /\bthe (?:aim|purpose|objective) of (?:this|the) (?:study|review|trial)\b/i.test(
      lower,
    ) ||
    /\b(?:is|are) (?:a|an) [^.]{0,90}\b(?:disorder|condition|disease|disability|syndrome)\b/i.test(
      lower,
    )
  ) {
    return true;
  }

  // Reporting a belief, a hypothesis, a controversy, or a retracted paper is
  // not the same as reporting a result. Keep clear "no link" conclusions, but
  // do not let a historical claim become supporting evidence.
  const commentary =
    /\b(beliefs?|parents? (?:remain|are|were|still) (?:concerned|wary|hesitant)|claims?|hypothes[ie]s|theor(?:y|ies)|suggested that|implied|myth|misconception|controversy|media attention|public concern|origins? of the hypothesis|will discuss|we discuss)\b/i.test(
      lower,
    ) ||
    /\b(?:a|one|another|previous|earlier|prior|1998|published)\s+(?:report|study|paper|article|trial)\b[^.]{0,80}\b(?:suggested|reported|claimed|found|showed|linked|implied)\b/i.test(
      lower,
    ) ||
    /\b(?:retracted|fraudulent|falsification|Wakefield)\b/i.test(lower) ||
    /\b(?:immunization|vaccination|vaccine) coverage\b|\b(?:take-up|uptake)\b/i.test(
      lower,
    ) ||
    /\b(?:decreasing acceptance|vaccine hesitancy|outbreaks?|resurgence|public confidence)\b/i.test(
      lower,
    );
  if (commentary) {
    const clearResult =
      /\b(no link|no association|no relationship|not associated|does not cause|did not cause|no evidence|not supportive|not found|have not found|evidence (?:now )?(?:is )?convincing)\b/i.test(
        lower,
      );
    if (!clearResult) return true;
  }

  const recommendation =
    /\b(further|future|more|additional|long[- ]term)\b[^.]{0,100}\b(trials?|studies|research|evidence|rcts?|randomi[sz]ed controlled trials?|clinical trials?)\b[^.]{0,100}\b(needed|required|warranted)\b/i.test(
      lower,
    ) ||
    /\b(needed|required|warranted)\b[^.]{0,100}\b(further|future|more|additional|long[- ]term)\b/i.test(
      lower,
    ) ||
    /\b(should be|need to be)\s+(conducted|performed|investigated|studied|evaluated)\b/i.test(
      lower,
    ) ||
    /\b(we urge|lobbyists?|policymakers?|health agencies|public health policy|advocacy)\b/i.test(
      lower,
    ) ||
    /\bthis (?:review|study|paper) (?:is|was) the first\b/i.test(lower) ||
    /\bthis (?:review|article|paper) (?:summarizes|discusses|focuses|provides an overview)\b/i.test(
      lower,
    ) ||
    /\b(purpose|objective|aim) of this (?:review|study)\b/i.test(lower);

  if (!recommendation) return false;

  const empirical =
    /\b(no significant|adverse events?|side effects?|did not|does not|showed|found|observed|reported|demonstrated|associated|increased|decreased|reduced|improved|risk of)\b/i.test(
      sentence,
    );
  return !empirical;
}

/** Reject table dumps and other non-prose fragments before they can become findings. */
function isLowQualitySentence(sentence: string): boolean {
  const cleaned = sentence.trim();
  const letters = (cleaned.match(/[a-z]/gi) ?? []).length;
  const digits = (cleaned.match(/\d/g) ?? []).length;

  if (letters < 20) return true;
  if (/(?:group|arm|placebo|creatine)\s*\d*\s*=\s*\d+[\s\S]{0,80}(?:group|arm|placebo|creatine)\s*\d*\s*=\s*\d+/i.test(cleaned)) {
    return true;
  }
  if (/\b(?:[A-Z]{2,}\s*\[\d+\]\s*){2,}/.test(cleaned)) return true;

  const digitShare = digits / cleaned.length;
  if (
    digitShare > 0.22 &&
    !/\b(was|were|showed|found|associated|increased|decreased|reduced|improved|did not|no significant|safe|adverse|risk)\b/i.test(
      cleaned,
    )
  ) {
    return true;
  }

  return false;
}

/** Pick the most result-like sentences while preserving their original order. */
function pickSentences(text: string, limit: number): string[] {
  const sentences = splitSentences(cleanText(text)).filter(
    (sentence) =>
      sentence.length >= 35 &&
      sentence.length <= 700 &&
      !isLowQualitySentence(sentence),
  );
  if (sentences.length <= limit) return sentences;

  const scored = sentences.map((sentence, index) => {
    let score = 0;
    if (/\d/.test(sentence)) score += 1.5;
    if (/\b(p\s*[<=>]|confidence interval|CI|odds ratio|hazard ratio|mean difference|effect size)\b/i.test(sentence)) score += 2;
    if (/\b(improved|reduced|increased|decreased|associated|no significant|did not|safe|adverse|effective)\b/i.test(sentence)) score += 1.5;
    if (/\b(conclusion|we found|these results|our findings|this study)\b/i.test(sentence)) score += 1;
    if (/\b(background|introduction|we searched|was conducted)\b/i.test(sentence)) score -= 1;
    return { sentence, index, score };
  });

  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.sentence);
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function containsAnyTerm(text: string, terms: string[]): boolean {
  return terms.some((term) => {
    const normalized = term.toLowerCase().trim();
    return normalized.length >= 3 && text.includes(normalized);
  });
}

function hasNegation(text: string): boolean {
  return /\b(no|not|none|without|absence of|did not|does not|do not|nor does|nor did|failed to|neither|never)\b/i.test(
    text,
  );
}

function supportPatterns(claimType: ClaimType): RegExp[] {
  switch (claimType) {
    case "safety":
      return [
        /\b(no|no evidence of|without|absence of|did not (?:show|find|increase|affect|impair)|was not associated with)\b[^.]{0,90}\b(adverse|harm|toxicity|renal|kidney|hepatic|side effects?|damage|impairment|events?)\b/i,
        /\b(safe|well tolerated|no significant adverse|no adverse|renally safe)\b/i,
        /\b(did not|does not|do not|nor does|nor did)\b[^.]{0,60}\b(affect|alter|impair|increase|change|raise|elevate|cause|produce)\b[^.]{0,70}\b(kidney|renal|hepatic|liver|function|risk|adverse|complication)\b/i,
        /\b(no|no evidence of|without|absence of)\b[^.]{0,80}\b(increase|raise|elevate|change|alter|impair)\b[^.]{0,50}\b(risk|adverse|complication|renal|kidney|hepatic|function)\b/i,
        /\b(no significant|no|without)\b[^.]{0,50}\b(changes?|effects?|differences?)\b[^.]{0,60}\b(kidney|renal|hepatic|liver|function|creatinine)\b/i,
        /\b(neither|nor)\b[^.]{0,100}\b(difference|change|effect|increase|decrease)\b[^.]{0,80}\b(urea|egfr|kidney|renal|function|creatinine)\b/i,
        /\b(did not|does not|do not|was not|were not)\b[^.]{0,40}\b(adversely|significantly)?\b[^.]{0,40}\b(affect|change|alter|increase|decrease)\b[^.]{0,60}\b(kidney|renal|hepatic|function)\b/i,
        /\bno (?:serious )?(?:long[- ]term )?(?:adverse|harmful) (?:effects?|events?|impact)\b[^.]{0,60}\b(kidney|renal|hepatic|function)\b/i,
        /\b(not|never) (?:found|observed|reported)\b[^.]{0,50}\b(clinically significant|significant)\b[^.]{0,60}\b(renal|kidney|hepatic|function)\b/i,
        /\b(favou?rable safety profile|generally safe|safe when used appropriately|safe for human consumption)\b/i,
      ];
    case "efficacy":
      return [
        /\b(significant(?:ly)?|marked(?:ly)?|substantial(?:ly)?)\b[^.]{0,80}\b(improv|reduc|increase|decreas|lower|higher|better|greater)\w*/i,
        /\b(improved|reduced|increased|decreased|lowered|effective|beneficial|superior|greater improvement)\b/i,
        /\bassociated with\b[^.]{0,70}\b(lower|higher|better|greater|reduced|improved)\b/i,
        /\b(effect size|mean difference|odds ratio|hazard ratio)\b/i,
      ];
    case "causation":
      return [
        /\b(caused|causes|induced|led to|resulted in|increased risk|higher risk)\b/i,
        /\bassociated with (?:an? )?(?:increased|higher) risk\b/i,
        /\b(dose[- ]response|temporal relationship)\b/i,
      ];
    case "association":
      return [
        /\b(associated with|correlated with|relationship between|higher odds|lower odds)\b/i,
        /\b(risk ratio|odds ratio|hazard ratio)\b/i,
      ];
    case "mechanism":
      return [/\b(mechanism|pathway|mediated by|via)\b/i];
    default:
      return [/\b(evidence (?:of|for)|consistent with|supports?|confirms?)\b/i];
  }
}

function contradictPatterns(claimType: ClaimType): RegExp[] {
  switch (claimType) {
    case "safety":
      return [
        /\b(?:adverse|harmful|toxic|nephrotoxic|hepatotoxic)\b[^.]{0,90}\b(?:kidney|renal|hepatic|creatinine|egfr|function)\b/i,
        /\b(?:kidney|renal|hepatic)\b[^.]{0,90}\b(?:failure|injury|damage|impairment|dysfunction|toxicity)\b/i,
        /\b(?:increased|elevated|higher|raise|rise)\b[^.]{0,70}\b(?:creatinine|egfr|urea)\b[^.]{0,70}\b(?:risk|impair|dysfunction|damage|failure|adverse)\b/i,
        /\b(?:risk of|associated with)\b[^.]{0,50}\b(?:kidney|renal|hepatic)\b[^.]{0,50}\b(?:failure|injury|damage|impairment|dysfunction)\b/i,
        /\b(?:rhabdomyolysis|hepatotoxicity|nephrotoxicity)\b/i,
      ];
    case "efficacy":
      return [
        /\bno (?:significant|statistically significant)?\s*(?:difference|effect|improvement|association|change|benefit)\b/i,
        /\b(did not|does not|failed to)\b[^.]{0,60}\b(improve|reduce|increase|decrease|affect|change|lower)\b/i,
        /\bnot (?:significantly )?(?:effective|associated|different|superior)\b/i,
        /\b(no evidence (?:of|that)|little evidence|insufficient evidence)\b/i,
      ];
    case "causation":
      return [
        /\bno (?:evidence of )?(?:(?:harmful|significant|causal|observable|apparent)\s+)?(?:association|relationship|link)\b/i,
        /\bno evidence (?:of|that|for)\b[^.]{0,70}\b(?:association|link|causal|relationship|increased risk|causes?|caused|causing)\b/i,
        /\b(?:not|never)\s+(?:associated|supportive|support)\b/i,
        /\b(?:has|have|had|was|were|is|are)?\s*not\s+(?:been\s+)?(?:found|shown|observed|reported)\b[^.]{0,80}\b(?:association|link|increased risk|risk|causes?|caused)\b/i,
        /\b(?:does not|do not|did not|doesn't|don't|didn't)\s+(?:causes?|caused|increase|lead to|result in)\b/i,
        /\b(?:not|never)\s+to\s+(?:find|detect|observe)\b[^.]{0,80}\b(?:increased risk|association|link|risk)\b/i,
        /\b(?:deny|denied|denies|denying|refute|refuted|reject|rejected)\b[^.]{0,50}\b(?:association|link|causal|relationship)\b/i,
        /\b(?:cannot establish causation|correlation does not imply causation|no effect)\b/i,
        /\bno significant (?:difference|increase|effect)\b/i,
      ];
    case "association":
      return [
        /\b(no association|not associated|no relationship|no correlation|no link)\b/i,
      ];
    case "mechanism":
      return [/\b(no mechanism|not mediated|unknown mechanism)\b/i];
    default:
      return [/\b(no evidence|does not support|inconsistent|refutes?)\b/i];
  }
}
