import type { Concept, ParsedClaim } from "./query";
import { buildPubMedQuery } from "./query";

/**
 * Outcome redirects.
 *
 * A specific claim can be narrower than the published literature. For example,
 * there may be no bench-press trial of creatine, while several trials measure
 * maximal or upper-body strength. Those papers cannot answer the bench-press
 * question directly, but they are useful for forming a hypothesis.
 *
 * The redirect is deliberately explicit: the search is widened only after the
 * exact query produces no direct test, the related studies are marked, and the
 * verdict gate still refuses to verify or debunk a claim without direct
 * evidence.
 */

export interface OutcomeRedirectPlan {
  /** The exact outcome the user asked about, e.g. "bench press". */
  from: string;
  /** Human-readable related outcomes used to widen the search. */
  to: string[];
  /** Label shown on the related study cards. */
  outcomeLabel: string;
  /** PubMed query for the related-outcome search. */
  query: string;
  /** Broader related-outcome query used if the first one is empty. */
  broadQuery: string;
  /** Last-resort query that keeps the intervention but drops the outcome. */
  fallbackQuery: string;
  /** OpenAlex query for the related-outcome search. */
  openAlexQuery: string;
  /** Claim-shaped object used by screening, not by the final directness grade. */
  searchClaim: ParsedClaim;
  /** English audit-trail explanation. */
  explanation: string;
  /** English note attached to each related study. */
  outcomeNote: string;
}

interface OutcomeFamily {
  key: string;
  priority: number;
  patterns: RegExp[];
  /** Short label for the related outcome family. */
  outcomeLabel: string;
  /** Display labels shown in the redirect callout. */
  to: string[];
  /** Terms used to search and screen for related evidence. */
  terms: string[];
}

const OUTCOME_FAMILIES: OutcomeFamily[] = [
  {
    key: "bench_press",
    priority: 100,
    patterns: [/\bbench press\b|\bbench-press\b|\bchest press\b/i],
    outcomeLabel: "maximal and upper-body strength",
    to: ["maximal strength", "upper-body strength", "muscle strength", "1RM"],
    terms: [
      "maximal strength",
      "muscle strength",
      "upper-body strength",
      "one-repetition maximum",
      "upper body strength",
      "1rm",
      "strength performance",
      "bench press",
      "chest press",
    ],
  },
  {
    key: "squat",
    priority: 95,
    patterns: [/\b(?:back|barbell|front)?\s*squat\b/i],
    outcomeLabel: "lower-body and maximal strength",
    to: ["lower-body strength", "maximal strength", "1RM"],
    terms: [
      "lower-body strength",
      "lower body strength",
      "maximal strength",
      "one-repetition maximum",
      "1rm",
      "muscle strength",
      "squat",
    ],
  },
  {
    key: "deadlift",
    priority: 94,
    patterns: [/\bdead\s*lift\b|\bdeadlift\b/i],
    outcomeLabel: "lower-body and maximal strength",
    to: ["lower-body strength", "maximal strength", "1RM"],
    terms: [
      "lower-body strength",
      "lower body strength",
      "maximal strength",
      "one-repetition maximum",
      "1rm",
      "muscle strength",
      "deadlift",
    ],
  },
  {
    key: "overhead_press",
    priority: 90,
    patterns: [/\b(?:overhead|military|shoulder|strict)\s+press\b/i],
    outcomeLabel: "upper-body and shoulder strength",
    to: ["upper-body strength", "shoulder strength", "maximal strength"],
    terms: [
      "upper-body strength",
      "upper body strength",
      "shoulder strength",
      "maximal strength",
      "one-repetition maximum",
      "1rm",
      "overhead press",
    ],
  },
  {
    key: "vertical_jump",
    priority: 85,
    patterns: [/\bvertical jump\b|\bjump height\b|\bjump performance\b|\bcountermovement jump\b/i],
    outcomeLabel: "jump performance and lower-body power",
    to: ["jump performance", "lower-body power", "athletic performance"],
    terms: [
      "jump performance",
      "jump height",
      "vertical jump",
      "lower-body power",
      "lower body power",
      "explosive power",
      "athletic performance",
    ],
  },
  {
    key: "endurance",
    priority: 80,
    patterns: [
      /\brunning performance\b|\btime trial\b|\btime-trial\b|\bendurance performance\b|\bvo2\s*max\b/i,
    ],
    outcomeLabel: "endurance performance and aerobic capacity",
    to: ["endurance performance", "aerobic capacity", "time-trial performance"],
    terms: [
      "endurance performance",
      "aerobic capacity",
      "vo2max",
      "vo2 max",
      "time trial",
      "time-trial performance",
      "running performance",
    ],
  },
  {
    key: "hypertrophy",
    priority: 70,
    patterns: [
      /\bmuscle growth\b|\bmuscle hypertrophy\b|\bhypertrophy\b|\bmuscle mass\b|\bmuscle size\b|\bmuscle gain\b/i,
    ],
    outcomeLabel: "muscle mass and hypertrophy",
    to: ["muscle mass", "cross-sectional area", "lean mass"],
    terms: [
      "muscle mass",
      "muscle cross-sectional area",
      "cross-sectional area",
      "lean mass",
      "muscle size",
      "hypertrophy",
    ],
  },
  {
    key: "weight_loss",
    priority: 65,
    patterns: [/\bweight loss\b|\bfat loss\b|\blose fat\b|\bbody composition\b|\bbody fat\b/i],
    outcomeLabel: "fat mass and body composition",
    to: ["fat mass", "body composition", "body weight"],
    terms: [
      "fat mass",
      "body fat",
      "body composition",
      "body weight",
      "weight loss",
      "fat loss",
    ],
  },
  {
    key: "kidney",
    priority: 60,
    patterns: [/\bkidney function\b|\brenal function\b|\bkidney health\b|\brenal health\b/i],
    outcomeLabel: "renal function and kidney safety markers",
    to: ["renal function", "eGFR", "creatinine"],
    terms: [
      "renal function",
      "kidney function",
      "egfr",
      "glomerular filtration rate",
      "creatinine",
      "kidney injury",
    ],
  },
  {
    key: "sleep",
    priority: 58,
    patterns: [/\bdeep sleep\b|\bslow[- ]wave sleep\b|\bsleep quality\b|\bsleep duration\b/i],
    outcomeLabel: "sleep quality and sleep architecture",
    to: ["sleep quality", "sleep architecture", "sleep duration"],
    terms: [
      "sleep quality",
      "sleep architecture",
      "slow wave sleep",
      "slow-wave sleep",
      "sleep duration",
      "sleep efficiency",
    ],
  },
  {
    key: "bloating",
    priority: 56,
    patterns: [/\bbloating\b|\bbloated\b|\babdominal distension\b/i],
    outcomeLabel: "gastrointestinal symptoms and abdominal distension",
    to: ["gastrointestinal symptoms", "abdominal distension", "gut comfort"],
    terms: [
      "gastrointestinal symptoms",
      "abdominal distension",
      "abdominal bloating",
      "bloating",
      "gut symptoms",
      "digestive symptoms",
    ],
  },
  {
    key: "blood_pressure",
    priority: 54,
    patterns: [/\bblood pressure\b|\bhypertension\b|\bsystolic pressure\b|\bdiastolic pressure\b/i],
    outcomeLabel: "blood pressure and vascular function",
    to: ["hypertension", "systolic blood pressure", "vascular function"],
    terms: [
      "blood pressure",
      "hypertension",
      "systolic blood pressure",
      "diastolic blood pressure",
      "vascular function",
    ],
  },
  {
    key: "cognition",
    priority: 52,
    patterns: [/\bcognitive performance\b|\bcognition\b|\bmemory\b|\bexecutive function\b/i],
    outcomeLabel: "cognitive performance and memory",
    to: ["cognitive performance", "memory", "executive function"],
    terms: [
      "cognitive performance",
      "cognition",
      "memory",
      "executive function",
      "reaction time",
    ],
  },
  {
    key: "strength",
    priority: 40,
    patterns: [
      /\bmaximal strength\b|\bmuscle strength\b|\bone-repetition maximum\b|\b1rm\b|\bupper-body strength\b|\blower-body strength\b/i,
    ],
    outcomeLabel: "maximal strength and strength performance",
    to: ["maximal strength", "muscle strength", "strength performance"],
    terms: [
      "maximal strength",
      "muscle strength",
      "one-repetition maximum",
      "1rm",
      "strength performance",
      "muscle power",
    ],
  },
];

interface OutcomeMatch {
  family: OutcomeFamily;
  matchedText: string;
}

function findOutcomeFamily(claim: ParsedClaim): OutcomeMatch | null {
  const text = claim.normalized;
  const matches: OutcomeMatch[] = [];

  for (const family of OUTCOME_FAMILIES) {
    for (const pattern of family.patterns) {
      const match = text.match(pattern);
      if (match) {
        matches.push({ family, matchedText: match[0].toLowerCase() });
        break;
      }
    }
  }

  if (matches.length === 0) return null;
  return matches.sort((a, b) => b.family.priority - a.family.priority)[0];
}

function uniqueTerms(terms: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const term of terms) {
    const normalized = term.toLowerCase().replace(/\s+/g, " ").trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

function outcomeConceptFor(
  key: string,
  terms: string[],
  position: number,
): Concept {
  return {
    key,
    terms: uniqueTerms(terms).slice(0, 12),
    score: 6,
    position,
  };
}

function isPhysicalPerformanceClaim(claim: ParsedClaim): boolean {
  return /\b(strength|muscle|training|exercise|sprint|jump|running|run|dash|lift|lifting|squat|press|deadlift|power|endurance|vo2|reps|workout|gym|athletic|sport|hypertrophy|fat|weight|body composition|recovery|soreness|flexibility|balance|agility)\b/i.test(
    claim.normalized,
  );
}

function buildGenericPlan(claim: ParsedClaim, intervention: Concept): OutcomeRedirectPlan | null {
  const originalOutcomes = claim.outcomes ?? [];
  if (originalOutcomes.length === 0) return null;

  const originalTerms = originalOutcomes.flatMap((concept) => concept.terms);
  const from =
    [...originalOutcomes]
      .sort(
        (a, b) =>
          (a.position ?? Number.MAX_SAFE_INTEGER) -
          (b.position ?? Number.MAX_SAFE_INTEGER),
      )
      .map((concept) => concept.key.replace(/_/g, " "))
      .join(" and ") || "this outcome";
  const to = ["related strength, performance, or capacity outcomes"];
  const outcomeConcept = outcomeConceptFor(
    "related_outcome",
    [
      ...originalTerms,
      "performance",
      "capacity",
      "strength",
    ],
    originalOutcomes[0]?.position ?? claim.normalized.length,
  );

  return createPlan({
    claim,
    intervention,
    outcomeConcept,
    from,
    to,
    outcomeLabel: "related performance outcomes",
    explanation: `No included study measured ${from} directly. The search was widened to related strength, performance, and capacity outcomes. Those studies can inform a hypothesis, but they cannot confirm or refute the exact claim.`,
    outcomeNote: `This study was retrieved for related evidence on related performance outcomes, not ${from} directly. It is indirect evidence for the exact claim.`,
  });
}

export function buildOutcomeRedirect(claim: ParsedClaim): OutcomeRedirectPlan | null {
  const match = findOutcomeFamily(claim);
  const intervention = claim.intervention ?? claim.concepts[0];
  if (!intervention) return null;

  if (!match) {
    return isPhysicalPerformanceClaim(claim)
      ? buildGenericPlan(claim, intervention)
      : null;
  }

  const originalOutcomeTerms = (claim.outcomes ?? []).flatMap(
    (concept) => concept.terms,
  );
  const outcomeConcept = outcomeConceptFor(
    match.family.key,
    [...match.family.terms, ...originalOutcomeTerms],
    claim.outcomes?.[0]?.position ?? claim.normalized.length,
  );
  const from = match.matchedText;
  const to = match.family.to;
  const outcomeLabel = match.family.outcomeLabel;

  return createPlan({
    claim,
    intervention,
    outcomeConcept,
    from,
    to,
    outcomeLabel,
    explanation: `No included study measured ${from} directly. The search was widened to related outcomes such as ${to.join(", ")} to find the closest available evidence. Those studies can inform a hypothesis, but they cannot confirm or refute the exact claim.`,
    outcomeNote: `This study was retrieved for related evidence on ${outcomeLabel}, not ${from} directly. It is indirect evidence for the exact claim.`,
  });
}

function createPlan({
  claim,
  intervention,
  outcomeConcept,
  from,
  to,
  outcomeLabel,
  explanation,
  outcomeNote,
}: {
  claim: ParsedClaim;
  intervention: Concept;
  outcomeConcept: Concept;
  from: string;
  to: string[];
  outcomeLabel: string;
  explanation: string;
  outcomeNote: string;
}): OutcomeRedirectPlan {
  const searchConcepts = [intervention, outcomeConcept];
  const query = buildPubMedQuery(searchConcepts);
  const broadOutcome = {
    ...outcomeConcept,
    terms: uniqueTerms([
      ...outcomeConcept.terms.slice(0, 2),
      "performance",
      "capacity",
    ]),
  };
  const broadQuery = buildPubMedQuery([intervention, broadOutcome]);
  const fallbackQuery = buildPubMedQuery([intervention]);
  const openAlexQuery = searchConcepts
    .map((concept) => concept.terms.slice(0, 2).join(" "))
    .join(" ");

  const searchClaim: ParsedClaim = {
    ...claim,
    concepts: searchConcepts,
    intervention,
    outcomes: [outcomeConcept],
    pubmedQuery: query,
    broadPubMedQuery: broadQuery,
    openAlexQuery,
  };

  return {
    from,
    to,
    outcomeLabel,
    query,
    broadQuery,
    fallbackQuery,
    openAlexQuery,
    searchClaim,
    explanation,
    outcomeNote,
  };
}
