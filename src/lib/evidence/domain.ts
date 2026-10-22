/**
 * Nutrition / fitness domain bias.
 *
 * SciBased is built for nutrition, training, hypertrophy, and supplement
 * claims. The literature search itself must not be restricted to those topics:
 * a safety or mechanism question can be answered by papers indexed under other
 * headings. Instead, we detect the claim's domain and give matching records a
 * ranking boost. That keeps general claims working while making the selected
 * evidence feel native to the niche.
 */

export type EvidenceNiche = "fitness" | "nutrition" | "both" | "general";

export interface EvidenceDomain {
  niche: EvidenceNiche;
  matchedTerms: string[];
}

interface WeightedSignal {
  term: string;
  regex: RegExp;
  weight: number;
}

interface DomainArticle {
  title: string;
  abstract: string;
  meshTerms?: string[];
}

function signal(term: string, weight: number): WeightedSignal {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return {
    term,
    regex: new RegExp(`\\b${escaped}\\b`, "i"),
    weight,
  };
}

/**
 * Strong signals get more weight than broad context words. A paper about
 * creatine and hypertrophy should outrank a generic exercise survey, but a
 * paper that only mentions "training" in passing should not dominate.
 */
const FITNESS_SIGNALS: WeightedSignal[] = [
  signal("hypertrophy", 1.2),
  signal("muscle growth", 1.2),
  signal("muscle gain", 1.1),
  signal("build muscle", 1.1),
  signal("gain muscle", 1.1),
  signal("muscle mass", 1.1),
  signal("muscle strength", 1.1),
  signal("resistance training", 1.1),
  signal("strength training", 1.1),
  signal("weight training", 1.0),
  signal("lean mass", 1.0),
  signal("body composition", 0.9),
  signal("muscle protein synthesis", 0.9),
  signal("training volume", 0.8),
  signal("training frequency", 0.8),
  signal("progressive overload", 0.8),
  signal("one-repetition maximum", 0.7),
  signal("1rm", 0.7),
  signal("bodybuilding", 0.8),
  signal("powerlifting", 0.8),
  signal("athlete", 0.6),
  signal("athletes", 0.6),
  signal("athletic", 0.6),
  signal("sports performance", 0.7),
  signal("exercise performance", 0.7),
  signal("physical performance", 0.6),
  signal("resistance exercise", 0.7),
  signal("weightlifting", 0.7),
  signal("gym", 0.6),
  signal("workout", 0.6),
  signal("exercise", 0.45),
  signal("training", 0.4),
  signal("cardio", 0.5),
  signal("aerobic exercise", 0.5),
  signal("running", 0.4),
  signal("cycling", 0.4),
  signal("squat", 0.6),
  signal("deadlift", 0.6),
  signal("bench press", 0.6),
  signal("recovery", 0.45),
  signal("muscle soreness", 0.6),
  signal("doms", 0.6),
  signal("mobility", 0.4),
  signal("stretching", 0.4),
  signal("injury prevention", 0.5),
];

const NUTRITION_SIGNALS: WeightedSignal[] = [
  signal("creatine", 1.2),
  signal("protein", 1.0),
  signal("dietary protein", 1.0),
  signal("whey", 0.9),
  signal("casein", 0.8),
  signal("supplement", 0.7),
  signal("supplements", 0.7),
  signal("supplementation", 0.7),
  signal("sports nutrition", 0.9),
  signal("nutrition", 0.6),
  signal("diet", 0.5),
  signal("dietary", 0.4),
  signal("calorie", 0.6),
  signal("calories", 0.6),
  signal("caloric", 0.6),
  signal("energy intake", 0.6),
  signal("macronutrient", 0.6),
  signal("carbohydrate", 0.6),
  signal("carbohydrates", 0.6),
  signal("fiber", 0.5),
  signal("meal", 0.45),
  signal("meals", 0.45),
  signal("food", 0.35),
  signal("fasting", 0.6),
  signal("intermittent fasting", 0.7),
  signal("keto", 0.6),
  signal("ketogenic", 0.6),
  signal("hydration", 0.6),
  signal("electrolyte", 0.6),
  signal("electrolytes", 0.6),
  signal("vitamin", 0.5),
  signal("vitamins", 0.5),
  signal("mineral", 0.4),
  signal("minerals", 0.4),
  signal("magnesium", 0.6),
  signal("omega-3", 0.6),
  signal("fish oil", 0.6),
  signal("caffeine", 0.6),
  signal("beta-alanine", 0.7),
  signal("citrulline", 0.7),
  signal("amino acid", 0.7),
  signal("bcaa", 0.8),
  signal("eaa", 0.8),
  signal("collagen", 0.6),
  signal("sugar", 0.4),
  signal("sweetener", 0.5),
  signal("seed oil", 0.6),
  signal("ultra-processed", 0.6),
  signal("weight loss", 0.6),
  signal("lose weight", 0.6),
  signal("fat loss", 0.7),
  signal("lose fat", 0.7),
  signal("obesity", 0.4),
  signal("overweight", 0.4),
];

function countSignals(text: string, signals: WeightedSignal[]): string[] {
  const lower = text.toLowerCase();
  return signals
    .filter((entry) => entry.regex.test(lower))
    .map((entry) => entry.term);
}

export function detectEvidenceDomain(claim: string): EvidenceDomain {
  const fitnessMatches = countSignals(claim, FITNESS_SIGNALS);
  const nutritionMatches = countSignals(claim, NUTRITION_SIGNALS);
  const matchedTerms = [...new Set([...fitnessMatches, ...nutritionMatches])];

  if (fitnessMatches.length > 0 && nutritionMatches.length > 0) {
    return { niche: "both", matchedTerms };
  }
  if (fitnessMatches.length > 0) {
    return { niche: "fitness", matchedTerms };
  }
  if (nutritionMatches.length > 0) {
    return { niche: "nutrition", matchedTerms };
  }
  return { niche: "general", matchedTerms: [] };
}

export function isNicheDomain(domain: EvidenceDomain): boolean {
  return domain.niche !== "general";
}

/**
 * Score how strongly a record belongs to the claim's niche. Title matches
 * matter more than abstract matches; the cap prevents this signal from
 * overwhelming study design and directness.
 */
export function articleDomainBoost(
  article: DomainArticle,
  domain: EvidenceDomain,
): number {
  if (!isNicheDomain(domain)) return 0;

  const title = article.title.toLowerCase();
  const abstract = article.abstract.toLowerCase();
  const metadata = (article.meshTerms ?? []).join(" ").toLowerCase();
  const signals =
    domain.niche === "fitness"
      ? FITNESS_SIGNALS
      : domain.niche === "nutrition"
        ? NUTRITION_SIGNALS
        : [...FITNESS_SIGNALS, ...NUTRITION_SIGNALS];

  let boost = 0;
  for (const entry of signals) {
    if (entry.regex.test(title)) {
      boost += entry.weight;
    } else if (entry.regex.test(abstract)) {
      boost += entry.weight * 0.4;
    } else if (entry.regex.test(metadata)) {
      boost += entry.weight * 0.2;
    }
  }

  return Math.min(3.2, boost);
}

/** Exposed for focused tests and for the coverage note. */
export function domainLabel(domain: EvidenceDomain): string {
  switch (domain.niche) {
    case "fitness":
      return "Training & performance";
    case "nutrition":
      return "Nutrition & supplements";
    case "both":
      return "Nutrition & fitness";
    default:
      return "General health";
  }
}
