import type {
  AnalysisProgress,
  SearchCoverage,
  Study,
  VerdictResult,
} from "../../types";
import {
  MAX_FULL_TEXTS,
  MAX_STUDIES,
} from "./config";
import { buildStudy, detectDesign } from "./extract";
import { fetchEuropePmcFullText } from "./fullText";
import { synthesizeResult } from "./grade";
import { searchOpenAlex } from "./openalex";
import { fetchPubMedArticles, searchPubMed } from "./pubmed";
import type { RawArticle } from "./pubmed";
import { parseClaim, buildPubMedQuery, type ParsedClaim } from "./query";
import { translateClaimForSearch } from "./translate";
import { normalizeTitle, pct } from "./utils";

export type { AnalysisProgress };

interface ScanOptions {
  onProgress?: (progress: AnalysisProgress) => void;
  language?: "en" | "es";
}

export async function runEvidenceScan(
  claimText: string,
  { onProgress, language = "en" }: ScanOptions = {},
): Promise<VerdictResult> {
  const copy = (en: string, es: string) => (language === "es" ? es : en);
  const searchTranslation = translateClaimForSearch(claimText);
  const parsedClaim = parseClaim(searchTranslation.text);
  const claim: ParsedClaim = {
    ...parsedClaim,
    // Keep the user's wording for display, while the English search concepts
    // above drive the literature query and the evidence extraction.
    original: claimText.trim(),
  };

  report(onProgress, {
    step: "query",
    message: copy(
      "Turning the claim into a focused literature query",
      "Convirtiendo la afirmación en una búsqueda enfocada en la literatura",
    ),
    percent: 5,
  });

  const [pubmedResult, openAlexResult] = await Promise.allSettled([
    searchPubMedWithFallback(claim),
    searchOpenAlex(claim.openAlexQuery),
  ]);

  const pubmed =
    pubmedResult.status === "fulfilled"
      ? pubmedResult.value
      : { count: 0, ids: [], query: claim.pubmedQuery, articles: [] as RawArticle[] };

  const openAlex =
    openAlexResult.status === "fulfilled"
      ? openAlexResult.value
      : { count: 0, articles: [] as RawArticle[] };

  if (pubmed.articles.length === 0 && openAlex.articles.length === 0) {
    if (pubmedResult.status === "rejected" && openAlexResult.status === "rejected") {
      throw new Error(
        copy(
          "The literature databases could not be reached.",
          "No se pudo conectar con las bases de datos de literatura.",
        ),
      );
    }
  }

  report(onProgress, {
    step: "search",
    message: copy(
      `Found ${pubmed.count.toLocaleString()} PubMed records and ${openAlex.count.toLocaleString()} OpenAlex records`,
      `Encontramos ${pubmed.count.toLocaleString()} registros en PubMed y ${openAlex.count.toLocaleString()} en OpenAlex`,
    ),
    percent: 20,
  });

  const merged = mergeArticles(pubmed.articles, openAlex.articles);
  const screened = screenArticles(merged, claim).slice(0, MAX_STUDIES);

  report(onProgress, {
    step: "screen",
    message: copy(
      `Screening ${merged.length} abstracts for relevance and study quality`,
      `Revisando ${merged.length} resúmenes por relevancia y calidad del estudio`,
    ),
    percent: 35,
  });

  const studies: Study[] = [];
  let fullTextsRead = 0;

  for (let index = 0; index < screened.length; index += 1) {
    const article = screened[index];
    const canReadFullText =
      Boolean(article.pmcid) && fullTextsRead < MAX_FULL_TEXTS;

    report(onProgress, {
      step: "fulltext",
      message: canReadFullText
        ? copy(
            `Reading open-access full text ${index + 1} of ${screened.length}`,
            `Leyendo el texto completo de acceso abierto ${index + 1} de ${screened.length}`,
          )
        : copy(
            `Reading abstract ${index + 1} of ${screened.length}`,
            `Leyendo el resumen ${index + 1} de ${screened.length}`,
          ),
      percent: pct(40 + (index / Math.max(1, screened.length)) * 45),
      current: index + 1,
      total: screened.length,
    });

    let fullText = null;
    if (canReadFullText && article.pmcid) {
      try {
        fullText = await fetchEuropePmcFullText(article.pmcid);
      } catch {
        fullText = null;
      }
      if (fullText) fullTextsRead += 1;
    }

    studies.push(buildStudy(article, fullText, claim));
  }

  report(onProgress, {
    step: "synthesize",
    message: copy(
      "Weighing study design, sample size, directness, and consistency",
      "Sopesando el diseño del estudio, el tamaño de la muestra, la directitud y la consistencia",
    ),
    percent: 90,
  });

  const coverage = buildCoverage(
    claim,
    pubmed.query,
    pubmed.count + openAlex.count,
    merged.length,
    studies,
    fullTextsRead,
    pubmedResult.status === "fulfilled",
    openAlexResult.status === "fulfilled",
    searchTranslation.translated ? "Spanish" : undefined,
  );

  const result = synthesizeResult(studies, claim, coverage);

  report(onProgress, {
    step: "done",
    message: copy("Evidence scan complete", "Escaneo de evidencia completado"),
    percent: 100,
  });

  return result;
}

async function searchPubMedWithFallback(
  claim: ParsedClaim,
): Promise<{ count: number; ids: string[]; query: string; articles: RawArticle[] }> {
  let search = await searchPubMed(claim.pubmedQuery);

  if (search.ids.length === 0 && claim.broadPubMedQuery) {
    search = await searchPubMed(claim.broadPubMedQuery);
  }

  if (search.ids.length === 0 && claim.concepts.length >= 3) {
    // Last-resort focused pair: the exposure/intervention concept plus the
    // final outcome concept. This is still an AND search, not an OR dump.
    const pair = [claim.concepts[0], claim.concepts[claim.concepts.length - 1]];
    const pairQuery = buildPubMedQuery(pair);
    if (pairQuery) search = await searchPubMed(pairQuery);
  }

  const articles = await fetchPubMedArticles(search.ids);

  return { ...search, articles };
}

function mergeArticles(primary: RawArticle[], secondary: RawArticle[]): RawArticle[] {
  const merged: RawArticle[] = [];
  const seen = new Map<string, RawArticle>();

  const keyFor = (article: RawArticle): string =>
    article.pmid
      ? `pmid:${article.pmid}`
      : article.doi
        ? `doi:${article.doi.toLowerCase()}`
        : `title:${normalizeTitle(article.title)}`;

  for (const article of [...primary, ...secondary]) {
    const key = keyFor(article);
    const existing = seen.get(key);

    if (existing) {
      // Prefer the PubMed record, but keep OpenAlex's citation and OA metadata.
      if (!existing.citedByCount && article.citedByCount) {
        existing.citedByCount = article.citedByCount;
      }
      if (!existing.openAccessUrl && article.openAccessUrl) {
        existing.openAccessUrl = article.openAccessUrl;
      }
      if (article.isOpenAccess) existing.isOpenAccess = true;
      continue;
    }

    seen.set(key, article);
    merged.push(article);
  }

  return merged;
}

function screenArticles(articles: RawArticle[], claim: ParsedClaim): RawArticle[] {
  const requiredMatches = Math.min(2, claim.concepts.length);

  return articles
    .filter((article) => {
      const title = article.title.toLowerCase();
      const pubTypes = article.pubTypes.join(" ").toLowerCase();
      if (
        /\b(correction|erratum|retraction|retracted|retracts?|comment on|reply to|letter to the editor|editorial|news|book review|study protocol|annotated bibliography|bibliography|commentary|perspective|viewpoint|opinion|fraudulent|falsification)\b/.test(
          title,
        )
      ) {
        return false;
      }
      if (
        /\b(letter|comment|editorial|news|published erratum|retraction of publication|retracted publication|biography|interview)\b/.test(
          pubTypes,
        )
      ) {
        return false;
      }

      // Communication and media studies do not directly test a health effect.
      if (/\b(narratives?|media coverage|discourse|qualitative|content analysis|communicat\w*|public opinion|controversy)\b/.test(title)) {
        return false;
      }

      const abstract = article.abstract.toLowerCase();
      const abstractMatches = claim.concepts.filter((concept) =>
        concept.terms.some((term) => abstract.includes(term.toLowerCase())),
      ).length;
      if (abstractMatches < requiredMatches) return false;

      const haystack = `${title} ${abstract}`;
      if (claim.concepts.some((concept) => concept.key === "cold_water")) {
        const coldWater =
          "(?:cold water|ice water|iced water|cold fluid|chilled water)";
        const ingestion =
          "(?:drink|drinking|drank|beverage|ingest|ingestion|intake|consume|consumption|swallow|meal)";
        const exposureContext = new RegExp(
          `${coldWater}[^.]{0,120}${ingestion}|${ingestion}[^.]{0,120}${coldWater}`,
          "i",
        );

        if (!exposureContext.test(haystack)) return false;
      }

      return article.abstract.trim().length >= 80;
    })
    .map((article) => ({ article, ...scoreArticle(article, claim) }))
    .filter(
      (entry) =>
        entry.score > 0 && entry.matchedConcepts >= requiredMatches,
    )
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.article);
}

function scoreArticle(
  article: RawArticle,
  claim: ParsedClaim,
): { score: number; matchedConcepts: number } {
  const title = article.title.toLowerCase();
  const abstract = article.abstract.toLowerCase();
  const design = detectDesign(article, null);

  let score = 0;
  let matchedConcepts = 0;

  claim.concepts.forEach((concept, index) => {
    const weight = index === 0 ? 2.4 : 1.6;
    const inTitle = concept.terms.some((term) => title.includes(term.toLowerCase()));
    const inAbstract = concept.terms.some((term) =>
      abstract.includes(term.toLowerCase()),
    );

    if (inTitle) {
      score += 3 * weight;
      matchedConcepts += 1;
    } else if (inAbstract) {
      score += 1.4 * weight;
      matchedConcepts += 1;
    }
  });

  switch (design) {
    case "meta-analysis":
      score += 2.5;
      break;
    case "systematic-review":
      score += 2.1;
      break;
    case "rct":
      score += 1.8;
      break;
    case "cohort":
      score += 1.1;
      break;
    case "case-control":
      score += 0.9;
      break;
    case "cross-sectional":
      score += 0.6;
      break;
    case "review":
      score += 0.5;
      break;
    case "animal":
    case "in-vitro":
      score -= 0.3;
      break;
    default:
      break;
  }

  if (article.source === "PubMed") score += 0.6;
  if (article.year >= new Date().getFullYear() - 10) score += 0.2;
  if (article.citedByCount) score += Math.min(1.2, Math.log10(article.citedByCount + 1) * 0.45);
  if (article.isOpenAccess || article.pmcid) score += 0.2;

  return { score, matchedConcepts };
}

function buildCoverage(
  claim: ParsedClaim,
  query: string,
  recordsFound: number,
  recordsScreened: number,
  studies: Study[],
  fullTextsRead: number,
  pubmedWorked: boolean,
  openAlexWorked: boolean,
  translatedFrom?: "Spanish",
): SearchCoverage {
  const years = studies
    .map((study) => study.year)
    .filter((year) => year > 1900)
    .sort((a, b) => a - b);

  const databases: string[] = [];
  if (pubmedWorked) databases.push("PubMed");
  if (openAlexWorked) databases.push("OpenAlex");
  if (fullTextsRead > 0) databases.push("Europe PMC (full text)");

  const limitations = [
    "Search is limited to PubMed-indexed and OpenAlex-indexed literature written in English; relevant papers in other databases or languages may be missing.",
    "Only records with abstracts were screened. Paywalled full texts were not read; their assessment relies on the abstract and metadata.",
    "Direction labels are automated screening aids, not expert appraisals. Publication bias and grey literature were not formally assessed.",
  ];

  if (studies.some((study) => study.design === "animal" || study.design === "in-vitro")) {
    limitations.push(
      "Some included evidence comes from animal or laboratory models, which may not translate to humans.",
    );
  }

  if (studies.some((study) => study.access === "abstract-only")) {
    limitations.push(
      "One or more included studies were assessed from an abstract only, so methods and limitations may be incomplete.",
    );
  }

  return {
    databases,
    query: query || claim.pubmedQuery || claim.normalized,
    searchedAt: new Date().toISOString(),
    recordsFound,
    recordsScreened,
    studiesIncluded: studies.length,
    fullTextsRead,
    openAccessAvailable: studies.filter((study) => study.access !== "abstract-only").length,
    dateRange:
      years.length > 0 ? `${years[0]}–${years[years.length - 1]}` : "No dated studies",
    limitations,
    translatedFrom,
  };
}

function report(
  onProgress: ScanOptions["onProgress"],
  progress: AnalysisProgress,
): void {
  onProgress?.(progress);
}
