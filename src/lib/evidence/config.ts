import type { ClaimType, StudyDesign } from "../../types";

export const PUBMED_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
export const EUROPEPMC_BASE = "https://www.ebi.ac.uk/europepmc/webservices/rest";
export const OPENALEX_BASE = "https://api.openalex.org";

export const NCBI_TOOL = "scibased";
export const OPENALEX_MAILTO = "";

/** How many PubMed records to retrieve before screening. */
export const PUBMED_RETMAX = 30;
/** How many studies are included in the final evidence synthesis. */
export const MAX_STUDIES = 10;
/** Cap full-text downloads so the scan stays responsive. */
export const MAX_FULL_TEXTS = 8;

export const STOPWORDS = new Set(
  `a an the and or but if then than that this those these there here
  is are was were be been being am do does did doing have has had having
  i me my we our you your he she it its they them their
  to of in on at by for with without from into over under after before during between through about against
  as so such not no yes can could would should may might will just only also even still yet ever never
  very more most less least much many some any all every each few own same other another
  get gets got make makes made take takes use uses using work works
  really actually basically literally truly dramatically drastically massively hugely significantly greatly deeply quickly rapidly slowly suddenly totally completely absolutely definitely certainly clearly obviously naturally clinically
  claim claims post posts viral social media internet online video videos
  people person someone everybody everyone thing things
  good bad better worse best worst new old big small huge
  health healthy human humans body bodies daily day days week weeks month months year years
  science scientific research study studies evidence paper papers article articles
  doctor doctors expert experts scientist scientists
  true false fact facts myth myths fake
  stop stops start starts cause causes caused causing
  supplement supplements supplementation
  help helps helped improve improves improved improving
  show shows showed shown suggest suggests suggested
  find finds found report reports reported
  say says said according`
    .split(/\s+/)
    .filter(Boolean),
);

/**
 * Small, deliberately conservative synonym table. It is used only to widen the
 * literature search; the verdict is still based on the retrieved papers.
 */
export const SYNONYM_GROUPS: Record<string, string[]> = {
  kidney: ["kidney", "renal", "nephro", "nephron"],
  gut: ["gut", "gastrointestinal", "gastric", "digestive", "intestine", "bowel"],
  damage: ["damage", "injury", "harm", "adverse", "impairment", "detrimental"],
  bloating: ["bloating", "bloat", "abdominal distension", "abdominal bloating"],
  digestion: ["digestion", "digestive", "gastric emptying", "gastrointestinal"],
  sleep: ["sleep", "insomnia", "sleep quality", "sleep duration", "deep sleep", "slow wave sleep", "slow-wave sleep", "sleep architecture"],
  creatine: ["creatine", "creatine monohydrate"],
  magnesium: ["magnesium"],
  safe: ["safe", "safety", "adverse", "harm", "toxicity", "tolerability", "side effects"],
  blood_pressure: ["blood pressure", "hypertension", "hypertensive"],
  weight_loss: ["weight loss", "body weight", "obesity", "overweight"],
  sugar: ["sugar", "sucrose", "glucose", "fructose", "added sugar"],
  heart: ["heart", "cardiovascular", "cardiac", "coronary"],
  liver: ["liver", "hepatic", "hepatotoxicity"],
  brain: ["brain", "cognitive", "cognition", "neurological"],
  immune: ["immune", "immunity", "immunological"],
  vitamin_d: ["vitamin d", "cholecalciferol", "25-hydroxyvitamin d"],
  omega3: ["omega-3", "omega 3", "fish oil", "epa", "dha"],
  protein: ["protein", "whey", "casein", "dietary protein", "protein supplementation", "protein intake"],
  hypertrophy: ["hypertrophy", "muscle growth", "muscle mass", "muscle size", "cross-sectional area", "muscle protein synthesis", "lean mass"],
  strength: ["strength", "muscle strength", "maximal strength", "one-repetition maximum", "1rm"],
  resistance_training: ["resistance training", "strength training", "weight training", "resistance exercise", "weightlifting", "weight lifting"],
  training_failure: ["training to failure", "repetition failure", "muscular failure", "failure training"],
  recovery: ["recovery", "post-exercise recovery", "muscle soreness", "doms"],
  body_composition: ["body composition", "body fat", "fat mass", "fat-free mass"],
  fasted_cardio: ["fasted cardio", "fasted exercise", "fasted-state exercise", "exercise in the fasted state"],
  cold_plunge: ["cold water immersion", "cold plunge", "ice bath", "ice baths", "cold exposure"],
  calories: ["calories", "energy intake", "caloric intake", "energy balance"],
  caloric_deficit: ["caloric deficit", "calorie deficit", "energy deficit"],
  bulking: ["bulking", "caloric surplus", "energy surplus", "weight gain"],
  carbohydrate: ["carbohydrate", "carbohydrates", "carbs", "glycogen"],
  fiber: ["fiber", "fibre", "dietary fiber"],
  cardio: ["cardio", "aerobic exercise", "aerobic training", "endurance training"],
  running: ["running", "run", "jogging"],
  gym: ["gym", "resistance training", "strength training"],
  gains: ["muscle gain", "hypertrophy", "strength gains", "lean mass"],
  caffeine: ["caffeine", "coffee"],
  exercise: ["exercise", "physical activity", "training"],
  cold_water: ["cold water", "ice water", "iced water", "cold fluid", "chilled water"],
  depression: ["depression", "depressive", "mood"],
  anxiety: ["anxiety", "anxious", "stress"],
  inflammation: ["inflammation", "inflammatory", "c-reactive protein", "crp"],
  cholesterol: ["cholesterol", "ldl", "hdl", "triglycerides", "lipid"],
  diabetes: ["diabetes", "diabetic", "glycemic", "blood glucose", "insulin"],
  cancer: ["cancer", "carcinoma", "tumor", "tumour", "neoplasm"],
  covid: ["covid-19", "sars-cov-2", "coronavirus"],
  fasting: ["fasting", "intermittent fasting", "calorie restriction"],
  keto: ["keto", "ketogenic", "low-carb"],
  probiotic: ["probiotic", "probiotics", "microbiome", "gut microbiota"],
  collagen: ["collagen", "collagen peptides"],
  melatonin: ["melatonin"],
  turmeric: ["turmeric", "curcumin"],
  ashwagandha: ["ashwagandha", "withania somnifera"],
};

/** Multi-word concepts need to be matched before individual tokens. */
export const MULTIWORD_CONCEPTS: Array<{ pattern: RegExp; key: string }> = [
  // Fitness-specific concepts must be matched before generic words such as
  // "water" or "weight" can consume their tokens.
  { pattern: /\b(muscle growth|muscle hypertrophy|muscle mass|muscle size|muscle gain|build muscle|gain muscle)\b/i, key: "hypertrophy" },
  { pattern: /\b(muscle soreness|muscle recovery|post-exercise recovery)\b/i, key: "recovery" },
  { pattern: /\b(resistance training|strength training|weight training|weightlifting|weight lifting)\b/i, key: "resistance_training" },
  { pattern: /\b(training to failure|repetition failure|muscular failure|failure training)\b/i, key: "training_failure" },
  { pattern: /\b(protein intake|protein supplementation|dietary protein|whey protein)\b/i, key: "protein" },
  { pattern: /\b(caloric deficit|calorie deficit|energy deficit)\b/i, key: "caloric_deficit" },
  { pattern: /\b(caloric surplus|calorie surplus|energy surplus)\b/i, key: "bulking" },
  { pattern: /\b(fasted cardio|fasted exercise)\b/i, key: "fasted_cardio" },
  { pattern: /\b(cold plunge|cold plunges|cold water immersion|cold water immersions|ice bath|ice baths|cold-water immersion|cold exposure)\b/i, key: "cold_plunge" },
  { pattern: /\b(body composition|body fat|fat mass|fat-free mass)\b/i, key: "body_composition" },
  { pattern: /\b(progressive overload|training volume|training frequency)\b/i, key: "resistance_training" },
  { pattern: /\b(ice water|cold water|iced water|cold drink|cold fluid|chilled water)\b/i, key: "cold_water" },
  { pattern: /\b(blood pressure|hypertension)\b/i, key: "blood_pressure" },
  { pattern: /\b(weight loss|body weight|obesity|overweight)\b/i, key: "weight_loss" },
  { pattern: /\b(vitamin d|cholecalciferol)\b/i, key: "vitamin_d" },
  { pattern: /\b(omega[- ]?3|fish oil)\b/i, key: "omega3" },
  { pattern: /\b(intermittent fasting|calorie restriction)\b/i, key: "fasting" },
  { pattern: /\b(keto|ketogenic|low[- ]carb)\b/i, key: "keto" },
  { pattern: /\b(probiotics?|microbiome|gut microbiota)\b/i, key: "probiotic" },
  { pattern: /\b(gut health|gut issues?|digestive issues?)\b/i, key: "gut" },
  { pattern: /\b(deep sleep|slow[- ]wave sleep)\b/i, key: "sleep" },
];

export const DESIGN_LABELS: Record<StudyDesign, string> = {
  "meta-analysis": "Meta-analysis",
  "systematic-review": "Systematic review",
  rct: "Randomized controlled trial",
  cohort: "Cohort study",
  "case-control": "Case-control study",
  "cross-sectional": "Cross-sectional study",
  "case-report": "Case report",
  review: "Narrative review",
  animal: "Animal study",
  "in-vitro": "In vitro study",
  other: "Other study",
};

export const DESIGN_WEIGHTS: Record<StudyDesign, number> = {
  "meta-analysis": 5,
  "systematic-review": 4.2,
  rct: 3.6,
  cohort: 2.4,
  "case-control": 2,
  "cross-sectional": 1.5,
  "case-report": 0.8,
  review: 1.2,
  animal: 0.9,
  "in-vitro": 0.6,
  other: 1,
};

export const DESIGN_LABEL_TO_TYPE: Record<string, StudyDesign> = {
  "meta-analysis": "meta-analysis",
  "systematic review": "systematic-review",
  "randomized controlled trial": "rct",
  "randomised controlled trial": "rct",
  "clinical trial": "rct",
  "cohort study": "cohort",
  "observational study": "cohort",
  "case-control study": "case-control",
  "cross-sectional study": "cross-sectional",
  "case reports": "case-report",
  "case report": "case-report",
  review: "review",
};

export const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  safety: "Safety claim",
  efficacy: "Efficacy claim",
  causation: "Causal claim",
  association: "Association claim",
  mechanism: "Mechanism claim",
  other: "Health claim",
};

export const SOURCE_LABELS = {
  pubmed: "PubMed",
  europepmc: "Europe PMC",
  openalex: "OpenAlex",
} as const;
