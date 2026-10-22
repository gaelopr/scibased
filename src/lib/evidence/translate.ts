/**
 * Lightweight, privacy-preserving query translation.
 *
 * The literature is overwhelmingly indexed in English, so a Spanish claim is
 * translated locally into search concepts before it reaches PubMed/OpenAlex.
 * This is deliberately a glossary, not a general translator: it covers common
 * health-claim vocabulary and never sends the user's wording to a translation
 * service. Evidence returned by the APIs is always shown in its original
 * English form.
 */

const SPANISH_MARKERS = new Set(
  `el la los las un una unos unas de del al que y o en con para por es son está están
  ser puede pueden hace hacen causa causan mejora mejoran ayuda ayudan previene previenen
  trata tratan cura curan aumenta aumentan reduce reducen baja bajan sube suben daña dañan
  protege protegen seguro segura seguros seguras saludable saludables riñón riñones sueño
  magnesio creatina agua hielo frío fría intestino digestión hinchazón gases vacuna vacunas
  autismo sarampión paperas rubéola aceite semilla semillas inflamación azúcar sangre corazón
  presión colesterol cerebro depresión ansiedad sistema inmune peso pérdida ejercicio músculo
  huesos embarazo niños niñas mujeres hombres riesgo efectos secundarios hígado metabolismo
  estrés melatonina cafeína alcohol tabaco vapeo dieta ayuno intermitente proteína colágeno
  vitamina omega cáncer diabetes renal función adultos sanos sanas personas gente todos todas
  siempre nunca dramáticamente dramático dramática cura milagro milagrosa milagroso
  suefio sueno sueiio rinon rinones dana danan`
    .split(/\s+/)
    .filter(Boolean),
);

const PHRASES: Array<[string, string]> = [
  ["agua con hielo", "ice water"],
  ["agua fría", "cold water"],
  ["agua fria", "cold water"],
  ["sueño profundo", "deep sleep"],
  ["pérdida de peso", "weight loss"],
  ["perdida de peso", "weight loss"],
  ["presión arterial", "blood pressure"],
  ["presion arterial", "blood pressure"],
  ["presión sanguínea", "blood pressure"],
  ["efectos secundarios", "side effects"],
  ["efectos adversos", "adverse effects"],
  ["salud renal", "kidney health"],
  ["función renal", "kidney function"],
  ["funcion renal", "kidney function"],
  ["sistema inmunitario", "immune system"],
  ["sistema inmune", "immune system"],
  ["aceite de semilla", "seed oil"],
  ["aceites de semillas", "seed oils"],
  ["aceite de semillas", "seed oil"],
  ["ayuno intermitente", "intermittent fasting"],
  ["vitamina d", "vitamin d"],
  ["omega 3", "omega-3"],
  ["omega-3", "omega-3"],
  ["células madre", "stem cells"],
  ["celulas madre", "stem cells"],
  ["pérdida de memoria", "memory loss"],
  ["perdida de memoria", "memory loss"],
  ["salud mental", "mental health"],
  ["enfermedad cardíaca", "heart disease"],
  ["enfermedad cardiaca", "heart disease"],
  ["azúcar en sangre", "blood sugar"],
  ["azucar en sangre", "blood sugar"],
  ["niveles de azúcar", "blood sugar levels"],
  ["niveles de azucar", "blood sugar levels"],
  ["peso corporal", "body weight"],
  ["masa muscular", "muscle mass"],
  ["colesterol alto", "high cholesterol"],
  ["riesgo de", "risk of"],
  ["falta de sueño", "sleep deprivation"],
  ["dolor de cabeza", "headache"],
  ["dolor de espalda", "back pain"],
  ["sistema digestivo", "digestive system"],
  ["flora intestinal", "gut flora"],
  ["microbiota intestinal", "gut microbiome"],
  ["niveles de energía", "energy levels"],
  ["niveles de energia", "energy levels"],
  ["pérdida de cabello", "hair loss"],
  ["perdida de cabello", "hair loss"],
  ["déficit de", "deficiency of"],
  ["deficiencia de", "deficiency of"],
  ["defectos de nacimiento", "birth defects"],
  ["muerte súbita", "sudden death"],
  ["muerte subita", "sudden death"],
];

const WORDS: Record<string, string> = {
  el: "",
  la: "",
  los: "",
  las: "",
  un: "a",
  una: "a",
  unos: "some",
  unas: "some",
  de: "of",
  del: "of",
  al: "to",
  que: "that",
  y: "and",
  o: "or",
  en: "in",
  con: "with",
  para: "for",
  por: "by",
  es: "is",
  son: "are",
  está: "is",
  estan: "are",
  están: "are",
  ser: "be",
  puede: "can",
  pueden: "can",
  hace: "does",
  hacen: "do",
  causa: "cause",
  causan: "cause",
  causar: "cause",
  mejora: "improves",
  mejoran: "improve",
  mejorar: "improve",
  ayuda: "helps",
  ayudan: "help",
  ayudar: "help",
  previene: "prevents",
  previenen: "prevent",
  tratar: "treat",
  trata: "treats",
  tratan: "treat",
  cura: "cures",
  curan: "cure",
  curar: "cure",
  aumenta: "increases",
  aumentan: "increase",
  aumentar: "increase",
  reduce: "reduces",
  reducen: "reduce",
  reducir: "reduce",
  baja: "lowers",
  bajan: "lower",
  bajar: "lower",
  sube: "raises",
  suben: "raise",
  subir: "raise",
  daña: "damages",
  dañan: "damage",
  dana: "damages",
  danan: "damage",
  dañar: "damage",
  protege: "protects",
  protegen: "protect",
  proteger: "protect",
  seguro: "safe",
  segura: "safe",
  seguros: "safe",
  seguras: "safe",
  saludable: "healthy",
  saludables: "healthy",
  riñón: "kidney",
  riñones: "kidneys",
  rinon: "kidney",
  rinones: "kidneys",
  sueño: "sleep",
  suefio: "sleep",
  sueno: "sleep",
  sueiio: "sleep",
  magnesio: "magnesium",
  creatina: "creatine",
  agua: "water",
  hielo: "ice",
  frío: "cold",
  fría: "cold",
  frio: "cold",
  fria: "cold",
  intestino: "gut",
  digestión: "digestion",
  digestion: "digestion",
  hinchazón: "bloating",
  hinchazon: "bloating",
  gases: "gas",
  vacuna: "vaccine",
  vacunas: "vaccines",
  autismo: "autism",
  sarampión: "measles",
  sarampion: "measles",
  paperas: "mumps",
  rubéola: "rubella",
  rubeola: "rubella",
  aceite: "oil",
  semilla: "seed",
  semillas: "seeds",
  inflamación: "inflammation",
  inflamacion: "inflammation",
  azúcar: "sugar",
  azucar: "sugar",
  sangre: "blood",
  corazón: "heart",
  corazon: "heart",
  presión: "pressure",
  presion: "pressure",
  colesterol: "cholesterol",
  cerebro: "brain",
  depresión: "depression",
  depresion: "depression",
  ansiedad: "anxiety",
  sistema: "system",
  inmune: "immune",
  peso: "weight",
  pérdida: "loss",
  perdida: "loss",
  ejercicio: "exercise",
  músculo: "muscle",
  musculo: "muscle",
  huesos: "bones",
  hueso: "bone",
  embarazo: "pregnancy",
  niños: "children",
  ninos: "children",
  niñas: "girls",
  ninas: "girls",
  mujeres: "women",
  hombres: "men",
  adultos: "adults",
  personas: "people",
  gente: "people",
  riesgo: "risk",
  efectos: "effects",
  secundarios: "side effects",
  hígado: "liver",
  higado: "liver",
  metabolismo: "metabolism",
  estrés: "stress",
  estres: "stress",
  melatonina: "melatonin",
  cafeína: "caffeine",
  cafeina: "caffeine",
  alcohol: "alcohol",
  tabaco: "tobacco",
  vapeo: "vaping",
  dieta: "diet",
  ayuno: "fasting",
  intermitente: "intermittent",
  proteína: "protein",
  proteina: "protein",
  colágeno: "collagen",
  colageno: "collagen",
  vitamina: "vitamin",
  vitaminas: "vitamins",
  omega: "omega",
  cáncer: "cancer",
  cancer: "cancer",
  diabetes: "diabetes",
  salud: "health",
  renal: "kidney",
  función: "function",
  funcion: "function",
  sanos: "healthy",
  sanas: "healthy",
  siempre: "always",
  nunca: "never",
  dramáticamente: "dramatically",
  dramaticamente: "dramatically",
  dramático: "dramatic",
  dramatico: "dramatic",
  dramática: "dramatic",
  dramatica: "dramatic",
  milagro: "miracle",
  milagrosa: "miracle",
  milagroso: "miracle",
  profundo: "deep",
  profunda: "deep",
  rápido: "fast",
  rapido: "fast",
  rápida: "fast",
  rapida: "fast",
  lentamente: "slowly",
  poco: "little",
  mucho: "much",
  más: "more",
  mas: "more",
  menos: "less",
  todos: "all",
  todas: "all",
  algunos: "some",
  algunas: "some",
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replacePhrase(text: string, from: string, to: string): string {
  return text.replace(
    new RegExp(`(?<![a-záéíóúüñ])${escapeRegExp(from)}(?![a-záéíóúüñ])`, "gi"),
    to,
  );
}

function detectSpanish(text: string): boolean {
  const lower = text.toLowerCase();
  if (/[ñáéíóúü¿¡]/.test(lower)) return true;
  const words = lower.match(/[a-záéíóúüñ]+/g) ?? [];
  const markers = words.filter((word) => SPANISH_MARKERS.has(word)).length;
  return markers >= 2;
}

export interface SearchTranslation {
  text: string;
  translated: boolean;
  detected: "en" | "es";
}

export function translateClaimForSearch(claim: string): SearchTranslation {
  if (!detectSpanish(claim)) {
    return { text: claim, translated: false, detected: "en" };
  }

  let translated = claim;
  for (const [from, to] of PHRASES) {
    translated = replacePhrase(translated, from, to);
  }

  translated = translated.replace(
    /(?<![a-záéíóúüñ])[a-záéíóúüñ]+(?![a-záéíóúüñ])/gi,
    (word) => {
      const key = word.toLowerCase();
      return WORDS[key] ?? word;
    },
  );

  translated = translated
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/[¿¡]/g, "")
    .replace(/^[\s,.;:!?]+/, "")
    .trim();

  return {
    text: translated || claim,
    translated: translated.toLowerCase() !== claim.toLowerCase(),
    detected: "es",
  };
}
