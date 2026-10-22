import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

export type Language = "en" | "es";

const STORAGE_KEY = "scibased-language";

const en = {
  "language.label": "Language",
  "language.english": "English",
  "language.spanish": "Español",
  "language.note": "The interface switches; papers and quotes stay in English.",
  "header.tagline": "Science-based receipts for your feed",
  "header.evidence": "Peer-reviewed evidence",
  "common.paper": "paper",
  "common.papers": "papers",
  "app.homeTitle": "SciBased — Science-based receipts for your feed",
  "app.loadingTitle": "Checking the papers · SciBased",
  "app.readingScreenshot": "Reading the claim from your screenshot…",
  "app.openingScreenshot": "Opening your screenshot on this device",
  "app.preparingSearch": "Preparing a focused literature search",
  "app.noClaim":
    "We couldn't read a claim from that input. Paste the claim text and try again.",
  "app.genericError":
    "We couldn't complete that analysis. Please check your connection and try again.",

  "home.eyebrow": "For the science side of TikTok",
  "home.heroLead": "Science, not",
  "home.heroAccent": "screenshots.",
  "home.body":
    "Drop the screenshot. Paste the claim. SciBased searches PubMed and OpenAlex, reads the open-access full text, and shows you the receipts — methods, results, limitations, and all.",
  "home.pastAbstract": "Reads past the abstract",
  "home.noSignup": "No sign-up",
  "home.worksWith": "Works with",
  "home.screenshots": "screenshots",
  "home.built":
    "Built for the claims that take over your group chat. Every verdict is grounded in peer-reviewed research — not a vibe check. Full text is read only when it is legally open access.",

  "trending.eyebrow": "On your FYP",
  "trending.title": "Trending Verifications",
  "trending.body": "The claims flooding your feed, checked against the papers.",
  "trending.sample": "Sample",
  "trending.preview": "Preview",

  "claim.title": "Drop the claim",
  "claim.subtitle": "Screenshot or text — whatever you've got.",
  "claim.free": "Free",
  "claim.fileTypeError":
    "That file type isn't supported. Please use a PNG, JPG, or WebP image.",
  "claim.fileSizeError":
    "That screenshot is larger than 10 MB. Try a smaller image.",
  "claim.previewAlt": "Preview of the uploaded claim screenshot",
  "claim.ready": "Screenshot ready",
  "claim.replace": "Replace image",
  "claim.remove": "Remove uploaded screenshot",
  "claim.dragActive": "Drop your screenshot",
  "claim.drop": "Drop a screenshot here",
  "claim.or": "or",
  "claim.browse": "browse your files",
  "claim.formats": "PNG · JPG · WebP · 10 MB",
  "claim.orPaste": "or paste the claim",
  "claim.textareaLabel": "Paste or type the scientific claim",
  "claim.placeholder": "Or paste the claim here...",
  "claim.cta": "Check the science",
  "claim.receipts": "Receipts included — papers, quotes, caveats",
  "claim.time": "Usually 10–30 seconds",
  "claim.searchNote":
    "Spanish claims are translated for the literature search. Papers and quotes stay in English.",

  "demo.preview": "Preview a verdict",
  "demo.group": "Preview one of three sample verdicts",
  "demo.title": "Run a sample {verdict} analysis",
  "demo.aria": "Preview a {verdict} verdict",

  "loading.claimUnder": "Claim under review",
  "loading.heading": "Reading the evidence",
  "loading.defaultMessage":
    "Preparing the search and checking which full texts are legally open access.",
  "loading.progressAria": "Evidence analysis progress",
  "loading.stepScreenshot": "Reading your screenshot",
  "loading.stepParse": "Parsing the claim",
  "loading.stepSearch": "Searching PubMed + OpenAlex",
  "loading.stepRead": "Reading the papers",
  "loading.stepWeigh": "Weighing the evidence",
  "loading.note":
    "Checking the papers, not just the headline. This can take 10–30 seconds.",

  "results.newCheck": "New check",
  "results.share": "Share",
  "results.copied": "Copied",
  "results.claimUnder": "Claim under review",
  "results.live": "Live evidence scan",
  "results.sample": "Sample",
  "results.fromScreenshot": "From screenshot",
  "results.sampleNotice":
    "This is a preloaded sample verdict, not a live evidence scan. Use the claim box on the home screen to run a live search against PubMed, OpenAlex, and open-access full text.",
  "results.englishNote":
    "Study titles, quotes, the generated write-up, and the evidence summary stay in English.",
  "results.evidenceSummary": "Evidence summary (English)",
  "results.breakdownTitle": "The Breakdown",
  "results.plainEnglish": "Plain English",
  "results.breakdownBadge": "Plain English",
  "results.breakdownBody":
    "What the research actually shows — and where the viral version stretches it.",
  "results.worthRemembering": "Worth remembering:",
  "results.evidenceEyebrow": "Scientific evidence & papers",
  "results.receipts": "The receipts",
  "results.papersIncluded": "{count} papers included",
  "results.sources": "{count} peer-reviewed sources",
  "results.liveEvidenceBody":
    "Each card shows the study design, sample, key result, methods, and limitations. Where the full text was legally open, the quoted passages come from the paper itself — not just the abstract's conclusion.",
  "results.sampleEvidenceBody":
    "Original research and systematic reviews, linked directly to their PubMed records.",
  "results.noReceipts": "No receipts yet.",
  "results.noReceiptsBody":
    "That doesn’t mean the claim is false. It means the search needs a more concrete claim — name the exposure, population, and outcome. For example: “Does creatine affect kidney function in healthy adults?” Then run it again.",
  "results.fullTextNote":
    "Full text was read for {read} of {total} included papers. The remaining papers were assessed from their abstracts only. No unauthorized full-text source was used.",
  "results.sampleEvidenceNote":
    "Sample evidence set. Study details are taken from the indexed abstracts.",
  "results.keepDigging": "Keep digging",
  "results.nextClaim": "Check the next claim",
  "results.nextBody":
    "Screenshot, quote, or a late-night health tip — get the evidence before you share.",
  "results.newClaim": "New claim",
  "results.shareReceipts": "Share the receipts",

  "claimType.safety": "Safety claim",
  "claimType.efficacy": "Efficacy claim",
  "claimType.causation": "Causal claim",
  "claimType.association": "Association claim",
  "claimType.mechanism": "Mechanism claim",
  "claimType.other": "Health claim",

  "verdict.verified": "Verified",
  "verdict.context": "Needs context",
  "verdict.debunked": "Debunked",
  "verdict.shortVerified": "Verified",
  "verdict.shortContext": "Context",
  "verdict.shortDebunked": "Debunked",

  "verdictCard.demo": "Demo result",
  "verdictCard.live": "Live scan",
  "verdictCard.claimSupport": "Claim support",
  "verdictCard.noEvidence": "No evidence",
  "verdictCard.verdict": "SciBased verdict",
  "verdictCard.scoreAria": "Claim support score: {score} out of 100",
  "verdictCard.noScoreAria":
    "No evidence score available because no studies were included",
  "verdictCard.papersIncluded": "{count} papers included",
  "verdictCard.papers": "{count} peer-reviewed papers",
  "verdictCard.certainty": "{value} certainty",

  "certainty.high": "High",
  "certainty.moderate": "Moderate",
  "certainty.low": "Low",
  "certainty.veryLow": "Very low",
  "certainty.lowToModerate": "Low to moderate",

  "category.sleep": "Sleep",
  "category.kidney": "Kidney health",
  "category.digestion": "Digestion",
  "category.heart": "Heart health",
  "category.metabolism": "Metabolism",
  "category.supplements": "Supplements",
  "category.nutrition": "Nutrition",
  "category.immunity": "Immunity",
  "category.brain": "Brain health",
  "category.oncology": "Oncology",
  "category.metabolic": "Metabolic health",
  "category.infectious": "Infectious disease",
  "category.general": "General health",

  "evidenceCheck.eyebrow": "The evidence check",
  "evidenceCheck.title": "How we checked it",
  "evidenceCheck.databasesFallback": "Literature search",
  "evidenceCheck.papersIncluded": "Papers included",
  "evidenceCheck.abstractsScreened": "{count} abstracts screened",
  "evidenceCheck.fullPapersRead": "Full papers read",
  "evidenceCheck.openAccessLinks": "{count} open-access links available",
  "evidenceCheck.howSure": "How sure we are",
  "evidenceCheck.automatedAssessment": "Automated GRADE-like assessment",
  "evidenceCheck.whatFound": "What the papers found",
  "evidenceCheck.supporting": "supporting",
  "evidenceCheck.mixed": "mixed",
  "evidenceCheck.contradicting": "contradicting",
  "evidenceCheck.whichWay": "Which way the evidence points",
  "evidenceCheck.classified": "{count} classified",
  "evidenceCheck.supports": "Supports {count}",
  "evidenceCheck.contradicts": "Contradicts {count}",
  "evidenceCheck.unclear": "Unclear {count}",
  "evidenceCheck.chartAria":
    "{supports} supporting, {contradicts} contradicting, {mixed} mixed, {unclear} unclear",
  "evidenceCheck.scopeLabel": "Scope:",
  "evidenceCheck.scopeBody":
    "this is a structured automated evidence scan, not a registered systematic review. It reads abstracts for every included study and full text only for legally open-access papers. Use the study cards to check the exact quotes and methods before relying on the verdict.",
  "evidenceCheck.details": "Search coverage, methodology & limitations",
  "evidenceCheck.searchDate": "Search date",
  "evidenceCheck.recordsFound": "Records found",
  "evidenceCheck.publicationYears": "Publication years",
  "evidenceCheck.noDatedStudies": "No dated studies",
  "evidenceCheck.querySent": "Query sent to PubMed",
  "evidenceCheck.translatedNote":
    "The Spanish claim was translated locally into this English literature query. Papers and quotes are not translated.",
  "evidenceCheck.methodology": "How the verdict was produced",
  "evidenceCheck.scoreCalculation": "Score calculation",
  "evidenceCheck.limitations": "What this scan cannot tell you",
  "evidenceCheck.englishNote":
    "Study titles, quotes, methodology, and limitations stay in English.",

  "study.supports": "Supports claim",
  "study.contradicts": "Contradicts claim",
  "study.mixed": "Mixed result",
  "study.unclear": "Unclear",
  "study.fullTextRead": "Full text read",
  "study.openAccess": "Open access available",
  "study.abstractOnly": "Abstract only",
  "study.direct": "Direct test",
  "study.partial": "Proxy / partial outcome",
  "study.indirect": "Indirect evidence",
  "study.sample": "Sample",
  "study.notReported": "Not reported",
  "study.directness": "Directness",
  "study.certainty": "Certainty",
  "study.population": "Population:",
  "study.whatFound": "What this study found",
  "study.howTested": "How it was tested",
  "study.limitations": "Limitations & bias",
  "study.moreEvidence": "More quoted evidence from this paper ({count} excerpts)",
  "study.pubmed": "PubMed record",
  "study.openFull": "Open full text",
  "study.openAccessLink": "Open-access link",
  "study.publisher": "Publisher / DOI",
  "study.scholar": "Google Scholar",
  "study.fullTextNote": "Open-access full text read",
  "study.linkedNote": "Full text linked, abstract read",
  "study.paywalledNote": "Paywalled: abstract read only",

  "paper.openAccess": "Open access",
  "paper.whatFound": "What it found",
  "paper.viewVia": "View Paper via {source}",
  "paper.newTab": "Opens in a new tab",

  "footer.disclaimer":
    "Science-based receipts for the claims in your feed. Not medical advice — for personal health decisions, talk to a qualified clinician.",
  "footer.evidenceVia": "Evidence via",
} as const;

export type TranslationKey = keyof typeof en;

const es: Record<TranslationKey, string> = {
  "language.label": "Idioma",
  "language.english": "English",
  "language.spanish": "Español",
  "language.note": "La interfaz cambia; los artículos y las citas se muestran en inglés.",
  "header.tagline": "Pruebas científicas para tu feed",
  "header.evidence": "Evidencia revisada por pares",
  "common.paper": "estudio",
  "common.papers": "estudios",
  "app.homeTitle": "SciBased — Pruebas científicas para tu feed",
  "app.loadingTitle": "Revisando los estudios · SciBased",
  "app.readingScreenshot": "Leyendo la afirmación de tu captura…",
  "app.openingScreenshot": "Abriendo tu captura en este dispositivo",
  "app.preparingSearch": "Preparando una búsqueda enfocada en la literatura",
  "app.noClaim":
    "No pudimos leer una afirmación de esa entrada. Pega el texto de la afirmación e inténtalo de nuevo.",
  "app.genericError":
    "No pudimos completar ese análisis. Revisa tu conexión e inténtalo de nuevo.",

  "home.eyebrow": "Para el lado científico de TikTok",
  "home.heroLead": "Ciencia, no",
  "home.heroAccent": "capturas.",
  "home.body":
    "Suelta la captura. Pega la afirmación. SciBased busca en PubMed y OpenAlex, lee el texto completo de acceso abierto y te muestra las pruebas: métodos, resultados, limitaciones y todo.",
  "home.pastAbstract": "Lee más allá del resumen",
  "home.noSignup": "Sin registro",
  "home.worksWith": "Funciona con",
  "home.screenshots": "capturas",
  "home.built":
    "Hecho para las afirmaciones que se apoderan de tu chat. Cada veredicto se basa en investigación revisada por pares, no en una corazonada. Solo leemos el texto completo cuando es de acceso abierto legal.",

  "trending.eyebrow": "En tu FYP",
  "trending.title": "Verificaciones en tendencia",
  "trending.body": "Las afirmaciones que inundan tu feed, contrastadas con los estudios.",
  "trending.sample": "Ejemplo",
  "trending.preview": "Ver",

  "claim.title": "Suelta la afirmación",
  "claim.subtitle": "Captura o texto: lo que tengas.",
  "claim.free": "Gratis",
  "claim.fileTypeError":
    "Ese tipo de archivo no es compatible. Usa una imagen PNG, JPG o WebP.",
  "claim.fileSizeError":
    "Esa captura pesa más de 10 MB. Prueba con una imagen más pequeña.",
  "claim.previewAlt": "Vista previa de la captura subida",
  "claim.ready": "Captura lista",
  "claim.replace": "Cambiar imagen",
  "claim.remove": "Quitar captura subida",
  "claim.dragActive": "Suelta tu captura",
  "claim.drop": "Suelta una captura aquí",
  "claim.or": "o",
  "claim.browse": "busca en tus archivos",
  "claim.formats": "PNG · JPG · WebP · 10 MB",
  "claim.orPaste": "o pega la afirmación",
  "claim.textareaLabel": "Pega o escribe la afirmación científica",
  "claim.placeholder": "O pega la afirmación aquí...",
  "claim.cta": "Revisa la ciencia",
  "claim.receipts": "Incluye pruebas: artículos, citas y advertencias",
  "claim.time": "Normalmente 10–30 segundos",
  "claim.searchNote":
    "Las afirmaciones en español se traducen para buscar en la literatura. Los artículos y las citas se muestran en inglés.",

  "demo.preview": "Prueba un veredicto",
  "demo.group": "Mira uno de los tres veredictos de ejemplo",
  "demo.title": "Ejecutar un análisis de ejemplo: {verdict}",
  "demo.aria": "Ver un veredicto de ejemplo: {verdict}",

  "loading.claimUnder": "Afirmación en revisión",
  "loading.heading": "Leyendo la evidencia",
  "loading.defaultMessage":
    "Preparando la búsqueda y comprobando qué textos completos son de acceso abierto legal.",
  "loading.progressAria": "Progreso del análisis de evidencia",
  "loading.stepScreenshot": "Leyendo tu captura",
  "loading.stepParse": "Analizando la afirmación",
  "loading.stepSearch": "Buscando en PubMed + OpenAlex",
  "loading.stepRead": "Leyendo los estudios",
  "loading.stepWeigh": "Sopesando la evidencia",
  "loading.note":
    "Revisamos los estudios, no solo el titular. Esto puede tardar 10–30 segundos.",

  "results.newCheck": "Nuevo chequeo",
  "results.share": "Compartir",
  "results.copied": "Copiado",
  "results.claimUnder": "Afirmación en revisión",
  "results.live": "Escaneo de evidencia en vivo",
  "results.sample": "Ejemplo",
  "results.fromScreenshot": "Desde captura",
  "results.sampleNotice":
    "Este es un veredicto de ejemplo precargado, no un escaneo de evidencia en vivo. Usa el cuadro de la pantalla de inicio para buscar en PubMed, OpenAlex y textos completos de acceso abierto.",
  "results.englishNote":
    "Los títulos, las citas, el análisis generado y el resumen de la evidencia se mantienen en inglés.",
  "results.evidenceSummary": "Resumen de evidencia (inglés)",
  "results.breakdownTitle": "El desglose",
  "results.plainEnglish": "Lenguaje claro",
  "results.breakdownBadge": "Inglés",
  "results.breakdownBody":
    "Lo que realmente muestra la investigación y dónde la versión viral la estira.",
  "results.worthRemembering": "Vale recordar:",
  "results.evidenceEyebrow": "Evidencia científica y artículos",
  "results.receipts": "Las pruebas",
  "results.papersIncluded": "{count} estudios incluidos",
  "results.sources": "{count} fuentes revisadas por pares",
  "results.liveEvidenceBody":
    "Cada tarjeta muestra el diseño del estudio, la muestra, el resultado clave, los métodos y las limitaciones. Cuando el texto completo era de acceso abierto legal, las citas provienen del propio artículo, no solo de la conclusión del resumen.",
  "results.sampleEvidenceBody":
    "Investigación original y revisiones sistemáticas, enlazadas directamente a sus registros de PubMed.",
  "results.noReceipts": "Todavía no hay pruebas.",
  "results.noReceiptsBody":
    "Eso no significa que la afirmación sea falsa. Significa que la búsqueda necesita una afirmación más concreta: nombra la exposición, la población y el resultado. Por ejemplo: «¿La creatina afecta la función renal en adultos sanos?». Vuelve a intentarlo.",
  "results.fullTextNote":
    "Se leyó el texto completo de {read} de {total} estudios incluidos. El resto se evaluó solo con sus resúmenes. No se usó ninguna fuente no autorizada.",
  "results.sampleEvidenceNote":
    "Conjunto de evidencia de ejemplo. Los detalles provienen de los resúmenes indexados.",
  "results.keepDigging": "Sigue cavando",
  "results.nextClaim": "Revisa la próxima afirmación",
  "results.nextBody":
    "Una captura, una cita o un consejo de salud de madrugada: mira la evidencia antes de compartirlo.",
  "results.newClaim": "Nueva afirmación",
  "results.shareReceipts": "Comparte las pruebas",

  "claimType.safety": "Afirmación de seguridad",
  "claimType.efficacy": "Afirmación de eficacia",
  "claimType.causation": "Afirmación causal",
  "claimType.association": "Afirmación de asociación",
  "claimType.mechanism": "Afirmación de mecanismo",
  "claimType.other": "Afirmación de salud",

  "verdict.verified": "Verificado",
  "verdict.context": "Falta contexto",
  "verdict.debunked": "Desmentido",
  "verdict.shortVerified": "Verificado",
  "verdict.shortContext": "Contexto",
  "verdict.shortDebunked": "Desmentido",

  "verdictCard.demo": "Resultado de ejemplo",
  "verdictCard.live": "Escaneo en vivo",
  "verdictCard.claimSupport": "Apoyo a la afirmación",
  "verdictCard.noEvidence": "Sin evidencia",
  "verdictCard.verdict": "Veredicto de SciBased",
  "verdictCard.scoreAria": "Puntaje de apoyo a la afirmación: {score} de 100",
  "verdictCard.noScoreAria":
    "No hay puntaje de evidencia porque no se incluyeron estudios",
  "verdictCard.papersIncluded": "{count} estudios incluidos",
  "verdictCard.papers": "{count} estudios revisados por pares",
  "verdictCard.certainty": "Certeza {value}",

  "certainty.high": "Alta",
  "certainty.moderate": "Moderada",
  "certainty.low": "Baja",
  "certainty.veryLow": "Muy baja",
  "certainty.lowToModerate": "Baja a moderada",

  "category.sleep": "Sueño",
  "category.kidney": "Salud renal",
  "category.digestion": "Digestión",
  "category.heart": "Salud del corazón",
  "category.metabolism": "Metabolismo",
  "category.supplements": "Suplementos",
  "category.nutrition": "Nutrición",
  "category.immunity": "Inmunidad",
  "category.brain": "Salud cerebral",
  "category.oncology": "Oncología",
  "category.metabolic": "Salud metabólica",
  "category.infectious": "Enfermedades infecciosas",
  "category.general": "Salud general",

  "evidenceCheck.eyebrow": "La revisión de evidencia",
  "evidenceCheck.title": "Cómo lo comprobamos",
  "evidenceCheck.databasesFallback": "Búsqueda de literatura",
  "evidenceCheck.papersIncluded": "Estudios incluidos",
  "evidenceCheck.abstractsScreened": "{count} resúmenes revisados",
  "evidenceCheck.fullPapersRead": "Textos completos leídos",
  "evidenceCheck.openAccessLinks": "{count} enlaces de acceso abierto",
  "evidenceCheck.howSure": "Qué tan seguros estamos",
  "evidenceCheck.automatedAssessment": "Evaluación automatizada tipo GRADE",
  "evidenceCheck.whatFound": "Qué encontraron los estudios",
  "evidenceCheck.supporting": "apoyan",
  "evidenceCheck.mixed": "mixtos",
  "evidenceCheck.contradicting": "contradicen",
  "evidenceCheck.whichWay": "Hacia dónde apunta la evidencia",
  "evidenceCheck.classified": "{count} clasificados",
  "evidenceCheck.supports": "Apoyan {count}",
  "evidenceCheck.contradicts": "Contradicen {count}",
  "evidenceCheck.unclear": "Poco claros {count}",
  "evidenceCheck.chartAria":
    "{supports} apoyan, {contradicts} contradicen, {mixed} mixtos, {unclear} poco claros",
  "evidenceCheck.scopeLabel": "Alcance:",
  "evidenceCheck.scopeBody":
    "este es un escaneo estructurado y automatizado de evidencia, no una revisión sistemática registrada. Lee los resúmenes de todos los estudios incluidos y el texto completo solo de artículos de acceso abierto legal. Usa las tarjetas de estudio para comprobar las citas y los métodos exactos antes de confiar en el veredicto.",
  "evidenceCheck.details": "Cobertura, metodología y limitaciones",
  "evidenceCheck.searchDate": "Fecha de búsqueda",
  "evidenceCheck.recordsFound": "Registros encontrados",
  "evidenceCheck.publicationYears": "Años de publicación",
  "evidenceCheck.noDatedStudies": "Sin estudios con fecha",
  "evidenceCheck.querySent": "Consulta enviada a PubMed",
  "evidenceCheck.translatedNote":
    "La afirmación en español se tradujo localmente a esta consulta en inglés. Los artículos y las citas no se traducen.",
  "evidenceCheck.methodology": "Cómo se produjo el veredicto",
  "evidenceCheck.scoreCalculation": "Cálculo del puntaje",
  "evidenceCheck.limitations": "Lo que este escaneo no puede decirte",
  "evidenceCheck.englishNote":
    "Los títulos, las citas, la metodología y las limitaciones se muestran en inglés.",

  "study.supports": "Apoya la afirmación",
  "study.contradicts": "Contradice la afirmación",
  "study.mixed": "Resultado mixto",
  "study.unclear": "Poco claro",
  "study.fullTextRead": "Texto completo leído",
  "study.openAccess": "Acceso abierto disponible",
  "study.abstractOnly": "Solo resumen",
  "study.direct": "Prueba directa",
  "study.partial": "Proxy / resultado parcial",
  "study.indirect": "Evidencia indirecta",
  "study.sample": "Muestra",
  "study.notReported": "No reportado",
  "study.directness": "Directitud",
  "study.certainty": "Certeza",
  "study.population": "Población:",
  "study.whatFound": "Qué encontró este estudio",
  "study.howTested": "Cómo se probó",
  "study.limitations": "Limitaciones y sesgo",
  "study.moreEvidence": "Más citas de este artículo ({count} extractos)",
  "study.pubmed": "Registro de PubMed",
  "study.openFull": "Abrir texto completo",
  "study.openAccessLink": "Enlace de acceso abierto",
  "study.publisher": "Editorial / DOI",
  "study.scholar": "Google Scholar",
  "study.fullTextNote": "Texto completo de acceso abierto leído",
  "study.linkedNote": "Texto completo enlazado, resumen leído",
  "study.paywalledNote": "De pago: solo se leyó el resumen",

  "paper.openAccess": "Acceso abierto",
  "paper.whatFound": "Qué encontró",
  "paper.viewVia": "Ver artículo vía {source}",
  "paper.newTab": "Se abre en una pestaña nueva",

  "footer.disclaimer":
    "Pruebas científicas para las afirmaciones de tu feed. No es consejo médico: para decisiones de salud personal, habla con un profesional cualificado.",
  "footer.evidenceVia": "Evidencia vía",
};

const dictionaries: Record<Language, Record<TranslationKey, string>> = { en, es };

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, variables?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function initialLanguage(): Language {
  if (typeof window === "undefined") return "en";
  let saved: string | null = null;
  try {
    saved = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage can be blocked in private browsing; fall back to the browser language.
  }
  if (saved === "en" || saved === "es") return saved;
  return window.navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(initialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Storage can be unavailable in private browsing; the switch still works.
    }
  }, [language]);

  const t = useCallback(
    (key: TranslationKey, variables: Record<string, string | number> = {}) => {
      const template = dictionaries[language][key] ?? dictionaries.en[key];
      return template.replace(/\{(\w+)\}/g, (_, name: string) =>
        String(variables[name] ?? `{${name}}`),
      );
    },
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}

export function verdictLabel(
  t: LanguageContextValue["t"],
  verdict: "verified" | "context" | "debunked",
): string {
  if (verdict === "verified") return t("verdict.verified");
  if (verdict === "debunked") return t("verdict.debunked");
  return t("verdict.context");
}

export function verdictShortLabel(
  t: LanguageContextValue["t"],
  verdict: "verified" | "context" | "debunked",
): string {
  if (verdict === "verified") return t("verdict.shortVerified");
  if (verdict === "debunked") return t("verdict.shortDebunked");
  return t("verdict.shortContext");
}

export function certaintyLabel(
  t: LanguageContextValue["t"],
  certainty: string,
): string {
  switch (certainty) {
    case "High":
      return t("certainty.high");
    case "Moderate":
      return t("certainty.moderate");
    case "Low to moderate":
      return t("certainty.lowToModerate");
    case "Low":
      return t("certainty.low");
    case "Very low":
      return t("certainty.veryLow");
    default:
      return certainty;
  }
}

export function categoryLabel(
  t: LanguageContextValue["t"],
  category: string,
): string {
  const keys: Record<string, TranslationKey> = {
    Sleep: "category.sleep",
    "Kidney health": "category.kidney",
    Digestion: "category.digestion",
    "Heart health": "category.heart",
    Metabolism: "category.metabolism",
    Supplements: "category.supplements",
    Nutrition: "category.nutrition",
    Immunity: "category.immunity",
    "Brain health": "category.brain",
    Oncology: "category.oncology",
    "Metabolic health": "category.metabolic",
    "Infectious disease": "category.infectious",
    "General health": "category.general",
  };
  return keys[category] ? t(keys[category]) : category;
}
