import type { ClaimType } from "../../types";
import { MULTIWORD_CONCEPTS, STOPWORDS, SYNONYM_GROUPS } from "./config";
import { detectEvidenceDomain, type EvidenceDomain } from "./domain";

const QUERY_NOISE = new Set(
  `lower lowers lowered raise raises raised boost boosts boosted cure cures cured
  treat treats treated treatment prevent prevents prevented reduce reduces reduced
  increase increases increased decrease decreases decreased reverse reverses reversed
  eliminate eliminates eliminated fix fixes fixed avoid avoids avoided`
    .split(/\s+/)
    .filter(Boolean),
);

export interface Concept {
  key: string;
  terms: string[];
  score: number;
  /** Character offset of the first mention, used to infer exposure vs outcome. */
  position?: number;
}

export interface ParsedClaim {
  original: string;
  normalized: string;
  claimType: ClaimType;
  concepts: Concept[];
  /** The exposure/intervention concept, when one can be identified. */
  intervention?: Concept;
  /** The outcome concepts, excluding the intervention. */
  outcomes?: Concept[];
  keywords: string[];
  pubmedQuery: string;
  broadPubMedQuery: string;
  openAlexQuery: string;
  category: string;
  domain: EvidenceDomain;
}

const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  safety: "safety",
  efficacy: "efficacy",
  causation: "causal",
  association: "association",
  mechanism: "mechanism",
  other: "health",
};

export function parseClaim(claim: string): ParsedClaim {
  const normalized = normalizeClaim(claim);
  const claimType = detectClaimType(normalized);
  const concepts = extractConcepts(normalized, claimType);
  const intervention = pickInterventionConcept(concepts);
  const outcomes = concepts.filter((concept) => concept.key !== intervention?.key);
  const keywords = unique(concepts.flatMap((concept) => concept.terms));
  const domain = detectEvidenceDomain(normalized);

  return {
    original: claim,
    normalized,
    claimType,
    concepts,
    intervention,
    outcomes,
    keywords,
    pubmedQuery: buildPubMedQuery(concepts),
    broadPubMedQuery: buildBroadPubMedQuery(concepts),
    openAlexQuery: concepts
      .map((concept) => concept.terms.slice(0, 2).join(" "))
      .join(" "),
    category: inferCategory(normalized, concepts, domain),
    domain,
  };
}

/**
 * Known exposures are preferred over outcomes when a claim mentions both.
 * This matters for outcome-first phrasing such as "bench press: does creatine
 * help?" and keeps directness checks anchored to the exposure.
 */
const STRONG_INTERVENTION_KEYS = new Set([
  "creatine",
  "protein",
  "caffeine",
  "magnesium",
  "omega3",
  "vitamin_d",
  "collagen",
  "melatonin",
  "turmeric",
  "ashwagandha",
  "probiotic",
  "cold_plunge",
  "cold_water",
  "fasting",
  "keto",
  "carnivore_diet",
  "carbohydrate",
  "fiber",
  "sugar",
  "calories",
  "caloric_deficit",
  "bulking",
]);

const EXERCISE_INTERVENTION_KEYS = new Set([
  "resistance_training",
  "exercise",
  "gym",
  "cardio",
  "running",
  "fasted_cardio",
]);

const OUTCOME_KEYS = new Set([
  "safe",
  "health",
  "kidney",
  "liver",
  "gut",
  "bloating",
  "digestion",
  "sleep",
  "blood_pressure",
  "heart",
  "brain",
  "depression",
  "anxiety",
  "inflammation",
  "cholesterol",
  "diabetes",
  "cancer",
  "immune",
  "strength",
  "hypertrophy",
  "bench_press",
  "overhead_press",
  "squat",
  "deadlift",
  "vertical_jump",
  "endurance",
  "body_composition",
  "weight_loss",
  "recovery",
  "training_failure",
]);

function pickInterventionConcept(concepts: Concept[]): Concept | undefined {
  if (concepts.length === 0) return undefined;

  const byPosition = (a: Concept, b: Concept) =>
    (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER);

  const strong = concepts.filter((concept) => STRONG_INTERVENTION_KEYS.has(concept.key));
  if (strong.length > 0) return [...strong].sort(byPosition)[0];

  const exercise = concepts.filter((concept) => EXERCISE_INTERVENTION_KEYS.has(concept.key));
  if (exercise.length > 0) return [...exercise].sort(byPosition)[0];

  const nonOutcome = concepts.filter((concept) => !OUTCOME_KEYS.has(concept.key));
  if (nonOutcome.length > 0) return [...nonOutcome].sort(byPosition)[0];

  return [...concepts].sort(byPosition)[0];
}

export function normalizeClaim(claim: string): string {
  return claim
    .replace(/[\u2018\u2019\u201c\u201d]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/[!?.,;:]+$/g, "")
    .trim();
}

export function detectClaimType(claim: string): ClaimType {
  const text = claim.toLowerCase();

  if (
    /\b(safe|safety|harm|harmful|adverse|side effects?|toxicity|toxic|damage|damages|damaged|risk|risks)\b/.test(
      text,
    )
  ) {
    return "safety";
  }

  if (
    /\b(cause|causes|caused|causing|trigger|triggers|triggered|lead to|leads to|led to|result in|results in|resulted in)\b/.test(
      text,
    )
  ) {
    return "causation";
  }

  if (
    /\b(improve|improves|improved|cure|cures|cured|treat|treats|treated|prevent|prevents|prevented|reduce|reduces|reduced|lower|lowers|lowered|boost|boosts|boosted|increase|increases|increased|raise|raises|raised|grow|grows|grew|build|builds|built|gain|gains|gained|benefit|benefits|beneficial|effective|efficacy)\b/.test(
      text,
    )
  ) {
    return "efficacy";
  }

  if (/\b(linked|associated|association|connection|correlation|correlated)\b/.test(text)) {
    return "association";
  }

  if (/\b(why|how|mechanism|pathway)\b/.test(text)) {
    return "mechanism";
  }

  return "other";
}

export function claimTypeLabel(claimType: ClaimType): string {
  return CLAIM_TYPE_LABELS[claimType];
}

function extractConcepts(claim: string, claimType: ClaimType): Concept[] {
  const lower = claim.toLowerCase();
  const concepts: Concept[] = [];
  const consumed = new Set<string>();

  // 1. Match multi-word concepts first. If every word in a later match has
  // already been consumed by a more specific concept (e.g. "cold water
  // immersion" before "cold water"), do not add a duplicate concept.
  for (const entry of MULTIWORD_CONCEPTS) {
    const match = lower.match(entry.pattern);
    if (!match) continue;

    const matchedWords = tokenize(match[0]);
    if (matchedWords.length > 0 && matchedWords.every((word) => consumed.has(word))) {
      continue;
    }

    const terms = SYNONYM_GROUPS[entry.key] ?? [entry.key.replace(/_/g, " ")];
    concepts.push({
      key: entry.key,
      terms: unique(terms),
      score: 6,
      position: lower.indexOf(match[0].toLowerCase()),
    });
    for (const word of matchedWords) consumed.add(word);
  }

  // 2. Tokenize the rest and fold in known synonym groups.
  const tokens = tokenize(lower).filter(
    (token) =>
      !STOPWORDS.has(token) &&
      !QUERY_NOISE.has(token) &&
      !consumed.has(token) &&
      token.length >= 3,
  );

  const seenKeys = new Set(concepts.map((concept) => concept.key));

  tokens.forEach((token, index) => {
    const canonical = singularize(token);
    const group = SYNONYM_GROUPS[canonical] ?? SYNONYM_GROUPS[token];

    if (group) {
      if (seenKeys.has(canonical)) return;
      seenKeys.add(canonical);
      concepts.push({
        key: canonical,
        terms: unique([canonical, ...group]),
        score: 4 + Math.min(2, index / 8),
        position: lower.indexOf(token),
      });
      return;
    }

    if (seenKeys.has(canonical)) return;
    seenKeys.add(canonical);
    concepts.push({
      key: canonical,
      terms: [canonical],
      score: 1.5 + Math.min(1.5, index / 10),
      position: lower.indexOf(token),
    });
  });

  // 3. Safety claims need a safety outcome concept even if the wording is
  // implicit ("creatine is fine for kidneys"). If the claim already names a
  // harm ("damages", "bloating", "toxicity"), do not add the opposite
  // "safe" concept to the query.
  const explicitHarm =
    /\b(damage|damages|damaged|harm|harmful|adverse|side effects?|toxicity|toxic|injur(?:y|ies)|bloat(?:ing|ed)?|risk|risks|disease|failure)\b/i.test(
      lower,
    );

  if (
    claimType === "safety" &&
    !explicitHarm &&
    !concepts.some((concept) => concept.key === "safe")
  ) {
    concepts.push({
      key: "safe",
      terms: SYNONYM_GROUPS.safe,
      score: 5,
      position: lower.length,
    });
  }

  // 4. Keep the query focused. Three OR-groups is a good precision/recall
  // balance for a claim-length query, but never drop the exposure just because
  // a claim names several outcomes. For example, "yoga, bench press, squat,
  // and strength" must not become a bench-press-and-squat query with no yoga.
  const topConcepts = [...concepts].sort((a, b) => b.score - a.score).slice(0, 3);
  const intervention = pickInterventionConcept(concepts);
  if (
    intervention &&
    !topConcepts.some((concept) => concept.key === intervention.key)
  ) {
    topConcepts[topConcepts.length - 1] = intervention;
  }
  const ranked = topConcepts.map((concept) => ({
    ...concept,
    terms: unique(concept.terms.map(normalizeTerm).filter(Boolean)).slice(0, 5),
  }));

  // If the claim was too short to yield concepts, fall back to content words.
  if (ranked.length === 0) {
    const fallback = tokenize(lower)
      .filter((token) => !STOPWORDS.has(token) && token.length >= 3)
      .slice(0, 3)
      .map((token) => ({
        key: token,
        terms: [token],
        score: 1,
        position: lower.indexOf(token),
      }));
    return fallback;
  }

  return ranked;
}

export function buildPubMedQuery(concepts: Concept[]): string {
  if (concepts.length === 0) return "";

  const groups = concepts.map((concept) => {
    const terms = concept.terms
      .slice(0, 4)
      .map((term) => `${quote(term)}[tiab]`)
      .join(" OR ");
    return `(${terms})`;
  });

  return `${groups.join(" AND ")} AND hasabstract[text] AND english[lang]`;
}

function buildBroadPubMedQuery(concepts: Concept[]): string {
  if (concepts.length === 0) return "";

  // Drop the weakest outcome rather than the exposure. An OR fallback for a
  // three-concept claim can return hundreds of thousands of records that match
  // only the outcome, which then drown the intervention.
  const intervention = pickInterventionConcept(concepts);
  const outcomes = concepts.filter(
    (concept) => concept.key !== intervention?.key,
  );
  const selected =
    concepts.length >= 3 && outcomes.length > 1
      ? [intervention, ...outcomes.slice(0, outcomes.length - 1)].filter(
          (concept): concept is Concept => Boolean(concept),
        )
      : concepts;
  const groups = selected.map((concept) => {
    const terms = concept.terms
      .slice(0, 4)
      .map((term) => quote(term))
      .join(" OR ");
    return `(${terms})`;
  });

  return `(${groups.join(" AND ")}) AND hasabstract[text] AND english[lang]`;
}

function quote(term: string): string {
  const cleaned = term.replace(/"/g, "").trim();
  return /\s|-/.test(cleaned) ? `"${cleaned}"` : cleaned;
}

function inferCategory(
  claim: string,
  concepts: Concept[],
  domain: EvidenceDomain,
): string {
  const keys = new Set(concepts.map((concept) => concept.key));

  if (keys.has("cold_plunge") || keys.has("recovery")) return "Recovery";
  if (keys.has("kidney")) return "Kidney health";
  if (keys.has("protein")) return "Protein";
  if (
    keys.has("hypertrophy") ||
    keys.has("strength") ||
    keys.has("resistance_training") ||
    keys.has("training_failure") ||
    keys.has("bench_press") ||
    keys.has("overhead_press") ||
    keys.has("squat") ||
    keys.has("deadlift") ||
    keys.has("vertical_jump") ||
    keys.has("endurance")
  ) {
    return "Muscle & strength";
  }
  if (keys.has("body_composition") || keys.has("caloric_deficit") || keys.has("bulking")) {
    return "Body composition";
  }
  if (keys.has("sleep")) return "Sleep";
  if (keys.has("gut") || keys.has("digestion")) return "Digestion";
  if (keys.has("heart") || keys.has("blood_pressure") || keys.has("cholesterol")) {
    return "Heart health";
  }
  if (keys.has("weight_loss") || keys.has("fasting") || keys.has("keto")) {
    return "Metabolism";
  }
  if (keys.has("creatine") || keys.has("collagen")) {
    return "Supplements";
  }
  if (keys.has("vitamin_d") || keys.has("magnesium") || keys.has("omega3")) {
    return "Nutrition";
  }
  if (keys.has("immune")) return "Immunity";
  if (keys.has("brain") || keys.has("depression") || keys.has("anxiety")) {
    return "Brain health";
  }
  if (keys.has("cancer")) return "Oncology";
  if (keys.has("diabetes") || keys.has("sugar")) return "Metabolic health";
  if (/vaccin|virus|covid|immun/i.test(claim)) return "Infectious disease";

  // Keep the category useful for claims that are clearly in the niche but
  // have no specific concept (for example, "is the gym bad for you?").
  if (domain.niche === "fitness") return "Training";
  if (domain.niche === "nutrition") return "Nutrition";
  if (domain.niche === "both") return "Nutrition & fitness";

  return "General health";
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function singularize(word: string): string {
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  if (/(ches|shes|xes|zes|ses)$/.test(word) && word.length > 4) {
    return word.slice(0, -2);
  }
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) {
    return word.slice(0, -1);
  }
  return word;
}

function normalizeTerm(term: string): string {
  return term.toLowerCase().replace(/\s+/g, " ").trim();
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}
