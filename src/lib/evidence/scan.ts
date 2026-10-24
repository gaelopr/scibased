import type {
  AnalysisProgress,
  Directness,
  SearchCoverage,
  SearchRedirect,
  Study,
  VerdictResult,
} from "../../types";
import {
  MAX_FULL_TEXTS,
  MAX_STUDIES,
} from "./config";
import { articleDomainBoost, isNicheDomain } from "./domain";
import { buildStudy, detectDesign } from "./extract";
import { fetchEuropePmcFullText } from "./fullText";
import { synthesizeResult } from "./grade";
import { searchOpenAlex } from "./openalex";
import { fetchPubMedArticles, searchPubMed } from "./pubmed";
import type { RawArticle } from "./pubmed";
import { parseClaim, buildPubMedQuery, type ParsedClaim } from "./query";
import {
  buildOutcomeRedirect,
  type OutcomeRedirectPlan,
} from "./redirect";
import { translateClaimForSearch } from "./translate";
import { escapeRegExp, normalizeTitle, pct } from "./utils";

export type { AnalysisProgress };

interface ScanOptions {
  onProgress?: (progress: AnalysisProgress) => void;
  language?: "en" | "es";
}

interface LiteratureSearch {
  count: number;
  ids: string[];
  query: string;
  articles: RawArticle[];
}

interface RankedArticle {
  article: RawArticle;
  directness: Directness;
  weight: number;
  year: number;
  /** How clearly the extracted finding is about the redirected outcome. */
  relevance: number;
  /** How clearly the extracted finding or title names the intervention. */
  interventionRelevance: number;
  /** The result sentence used to judge whether the finding is on-topic. */
  finding: string;
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
    message: isNicheDomain(claim.domain)
      ? copy(
          "Focusing the search on nutrition, training, and sports-science evidence",
          "Enfocando la búsqueda en evidencia de nutrición, entrenamiento y ciencias del deporte",
        )
      : copy(
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

  const primaryMerged = mergeArticles(pubmed.articles, openAlex.articles);
  const primaryScreened = screenArticles(primaryMerged, claim).slice(
    0,
    MAX_STUDIES,
  );
  const primaryPreliminary = primaryScreened.map((article) =>
    buildStudy(article, null, claim),
  );
  const directPrimary = primaryPreliminary.filter(
    (study) => study.directness === "direct",
  ).length;

  let redirectPlan: OutcomeRedirectPlan | null = null;
  let redirectMerged: RawArticle[] = [];
  let redirectScreened: RawArticle[] = [];
  let redirectPubmedCount = 0;
  let redirectOpenAlexCount = 0;

  if (directPrimary === 0) {
    redirectPlan = buildOutcomeRedirect(claim);

    if (redirectPlan) {
      report(onProgress, {
        step: "search",
        message: copy(
          `No direct ${redirectPlan.from} study passed screening. Widening the search to ${redirectPlan.to.join(", ")}`,
          `Ningún estudio directo sobre ${redirectPlan.from} superó la selección. Ampliamos la búsqueda a ${redirectPlan.to.join(", ")}`,
        ),
        percent: 28,
      });

      const [redirectPubmedResult, redirectOpenAlexResult] =
        await Promise.allSettled([
          searchPubMedForRedirect(redirectPlan),
          searchOpenAlex(redirectPlan.openAlexQuery),
        ]);

      const redirectPubmed =
        redirectPubmedResult.status === "fulfilled"
          ? redirectPubmedResult.value
          : {
              count: 0,
              ids: [],
              query: redirectPlan.query,
              articles: [] as RawArticle[],
            };
      const redirectOpenAlex =
        redirectOpenAlexResult.status === "fulfilled"
          ? redirectOpenAlexResult.value
          : { count: 0, articles: [] as RawArticle[] };

      redirectPubmedCount = redirectPubmed.count;
      redirectOpenAlexCount = redirectOpenAlex.count;
      redirectMerged = mergeArticles(
        redirectPubmed.articles,
        redirectOpenAlex.articles,
      );
      redirectScreened = screenArticles(
        redirectMerged,
        redirectPlan.searchClaim,
      ).slice(0, MAX_STUDIES);

      for (const article of redirectScreened) {
        article.redirectedOutcome = redirectPlan.outcomeLabel;
        article.redirectNote = redirectPlan.outcomeNote;
      }

      report(onProgress, {
        step: "search",
        message: copy(
          `The widened search found ${redirectPubmed.count.toLocaleString()} PubMed and ${redirectOpenAlex.count.toLocaleString()} OpenAlex records for related outcomes`,
          `La búsqueda ampliada encontró ${redirectPubmed.count.toLocaleString()} registros en PubMed y ${redirectOpenAlex.count.toLocaleString()} en OpenAlex sobre resultados relacionados`,
        ),
        percent: 32,
      });
    }
  }

  const selected = selectArticles(
    primaryScreened,
    redirectScreened,
    claim,
    redirectPlan,
  );
  const screenedCount = primaryMerged.length + redirectMerged.length;

  report(onProgress, {
    step: "screen",
    message: copy(
      `Screening ${screenedCount} abstracts for relevance and study quality`,
      `Revisando ${screenedCount} resúmenes por relevancia y calidad del estudio`,
    ),
    percent: 35,
  });

  let studies: Study[] = [];
  let fullTextsRead = 0;

  for (let index = 0; index < selected.length; index += 1) {
    const article = selected[index];
    const canReadFullText =
      Boolean(article.pmcid) && fullTextsRead < MAX_FULL_TEXTS;

    report(onProgress, {
      step: "fulltext",
      message: canReadFullText
        ? copy(
            article.redirectedOutcome
              ? `Reading related-outcome full text ${index + 1} of ${selected.length}`
              : `Reading open-access full text ${index + 1} of ${selected.length}`,
            article.redirectedOutcome
              ? `Leyendo el texto completo relacionado ${index + 1} de ${selected.length}`
              : `Leyendo el texto completo de acceso abierto ${index + 1} de ${selected.length}`,
          )
        : copy(
            article.redirectedOutcome
              ? `Reading related-outcome abstract ${index + 1} of ${selected.length}`
              : `Reading abstract ${index + 1} of ${selected.length}`,
            article.redirectedOutcome
              ? `Leyendo el resumen relacionado ${index + 1} de ${selected.length}`
              : `Leyendo el resumen ${index + 1} de ${selected.length}`,
          ),
      percent: pct(40 + (index / Math.max(1, selected.length)) * 45),
      current: index + 1,
      total: selected.length,
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

    // Related-outcome papers are read against the related outcome so the
    // quoted finding and direction are about the proxy construct, not an
    // incidental mention of the original outcome. They are still downgraded
    // to partial evidence for the exact claim.
    const studyClaim =
      article.redirectedOutcome && redirectPlan
        ? redirectPlan.searchClaim
        : claim;
    const study = buildStudy(article, fullText, studyClaim, {
      outcomeFocused: Boolean(article.redirectedOutcome),
    });
    if (article.redirectedOutcome) {
      study.directness = "partial";
    }
    studies.push(study);
  }

  report(onProgress, {
    step: "synthesize",
    message: copy(
      "Weighing study design, sample size, directness, and consistency",
      "Sopesando el diseño del estudio, el tamaño de la muestra, la directitud y la consistencia",
    ),
    percent: 90,
  });

  const finalDirectCount = studies.filter(
    (study) => study.directness === "direct",
  ).length;
  let activeRedirect: SearchRedirect | undefined;

  if (redirectPlan && finalDirectCount === 0) {
    const relatedStudies = studies.filter((study) => study.redirectedOutcome);
    activeRedirect = {
      from: redirectPlan.from,
      to: redirectPlan.to,
      query: redirectPlan.query,
      directStudiesFound: 0,
      relatedStudiesFound: relatedStudies.length,
      explanation: redirectPlan.explanation,
    };
  } else if (redirectPlan) {
    // Full-text reading can reveal a direct test that the abstract did not
    // expose. In that case, keep any direct studies and remove the related-only
    // papers so the final result is not labelled as a redirected search.
    studies = studies
      .filter(
        (study) => !study.redirectedOutcome || study.directness === "direct",
      )
      .map((study) =>
        study.redirectedOutcome
          ? { ...study, redirectedOutcome: undefined, redirectNote: undefined }
          : study,
      );
  }

  const includedFullTexts = studies.filter((study) => study.fullTextRead).length;
  const coverage = buildCoverage(
    claim,
    pubmed.query,
    pubmed.count +
      openAlex.count +
      redirectPubmedCount +
      redirectOpenAlexCount,
    screenedCount,
    studies,
    includedFullTexts,
    pubmedResult.status === "fulfilled",
    openAlexResult.status === "fulfilled",
    searchTranslation.translated ? "Spanish" : undefined,
    activeRedirect,
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
): Promise<LiteratureSearch> {
  let search = await searchPubMed(claim.pubmedQuery);

  if (search.ids.length === 0 && claim.broadPubMedQuery) {
    search = await searchPubMed(claim.broadPubMedQuery);
  }

  if (search.ids.length === 0 && claim.concepts.length >= 3) {
    // Last-resort focused pair: the exposure/intervention concept plus the
    // final outcome concept. This is still an AND search, not an OR dump.
    const pair =
      claim.intervention && claim.outcomes?.length
        ? [claim.intervention, claim.outcomes[claim.outcomes.length - 1]]
        : [claim.concepts[0], claim.concepts[claim.concepts.length - 1]];
    const pairQuery = buildPubMedQuery(pair);
    if (pairQuery) search = await searchPubMed(pairQuery);
  }

  const articles = await fetchPubMedArticles(search.ids);

  return { ...search, articles };
}

async function searchPubMedForRedirect(
  plan: OutcomeRedirectPlan,
): Promise<LiteratureSearch> {
  let search = await searchPubMed(plan.query).catch(() => ({
    count: 0,
    ids: [] as string[],
    query: plan.query,
  }));

  if (search.ids.length === 0 && plan.broadQuery) {
    search = await searchPubMed(plan.broadQuery).catch(() => ({
      count: 0,
      ids: [] as string[],
      query: plan.broadQuery,
    }));
  }

  if (search.ids.length === 0 && plan.fallbackQuery) {
    search = await searchPubMed(plan.fallbackQuery).catch(() => ({
      count: 0,
      ids: [] as string[],
      query: plan.fallbackQuery,
    }));
  }

  const articles = await fetchPubMedArticles(search.ids);

  return { ...search, articles };
}

function relatedOutcomeKeywords(plan: OutcomeRedirectPlan): string[] {
  const stopWords = new Set([
    "and",
    "the",
    "with",
    "from",
    "this",
    "that",
    "related",
    "outcome",
    "outcomes",
  ]);
  const words = new Set<string>();
  const phrases = [
    plan.outcomeLabel,
    ...plan.to,
    ...(plan.searchClaim.outcomes ?? []).flatMap((concept) => concept.terms),
  ];

  for (const phrase of phrases) {
    for (const word of phrase.toLowerCase().split(/[^a-z0-9]+/)) {
      if ((word.length >= 4 || /\d/.test(word)) && !stopWords.has(word)) {
        words.add(word);
      }
    }
  }

  return [...words];
}

function relatedRelevance(study: Study, plan: OutcomeRedirectPlan): number {
  const keywords = relatedOutcomeKeywords(plan);
  const text = (study.finding || study.title).toLowerCase();
  return keywords.filter((keyword) =>
    new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "i").test(text),
  ).length;
}

/**
 * A related-outcome study still has to be about the intervention. A review of
 * Ayurveda that happens to mention yoga in its title is a weaker basis for a
 * yoga claim than a study whose extracted finding is actually about yoga.
 */
function interventionRelevance(study: Study, claim: ParsedClaim): number {
  const terms = (claim.intervention ?? claim.concepts[0])?.terms ?? [];
  const finding = study.finding.toLowerCase();
  const title = study.title.toLowerCase();
  if (terms.some((term) => finding.includes(term.toLowerCase()))) return 2;
  if (terms.some((term) => title.includes(term.toLowerCase()))) return 1;
  return 0;
}

function rankArticles(
  articles: RawArticle[],
  claim: ParsedClaim,
  redirectPlan?: OutcomeRedirectPlan | null,
): RankedArticle[] {
  return articles
    .map((article) => {
      const isRedirected = Boolean(article.redirectedOutcome && redirectPlan);
      const study = buildStudy(
        article,
        null,
        isRedirected && redirectPlan ? redirectPlan.searchClaim : claim,
        { outcomeFocused: isRedirected },
      );
      return {
        article,
        directness: study.directness,
        weight: study.weight,
        year: study.year,
        relevance:
          isRedirected && redirectPlan
            ? relatedRelevance(study, redirectPlan)
            : 0,
        interventionRelevance: isRedirected
          ? interventionRelevance(study, claim)
          : 0,
        finding: study.finding,
      };
    })
    .sort((a, b) => {
      const directnessRank = (value: Directness) =>
        value === "direct" ? 0 : value === "partial" ? 1 : 2;
      return (
        b.interventionRelevance - a.interventionRelevance ||
        b.relevance - a.relevance ||
        directnessRank(a.directness) - directnessRank(b.directness) ||
        b.weight - a.weight ||
        b.year - a.year
      );
    });
}

function selectArticles(
  primary: RawArticle[],
  redirected: RawArticle[],
  claim: ParsedClaim,
  redirectPlan?: OutcomeRedirectPlan | null,
): RawArticle[] {
  const primaryRanked = rankArticles(primary, claim);
  const redirectRanked = rankArticles(redirected, claim, redirectPlan);
  const relevantRedirect = redirectRanked.filter(
    (entry) => entry.relevance > 0,
  );
  const redirectPool =
    relevantRedirect.length > 0 ? relevantRedirect : redirectRanked;
  // A paper whose extracted finding and title never name the intervention is
  // not useful evidence, even if the intervention appeared somewhere in the
  // abstract. Keep the fallback so a sparse literature set is not erased.
  const interventionTerms =
    (claim.intervention ?? claim.concepts[0])?.terms ?? [];
  const primaryOnTopic = primaryRanked.filter((entry) => {
    const text = `${entry.finding} ${entry.article.title}`.toLowerCase();
    return interventionTerms.some((term) =>
      text.includes(term.toLowerCase()),
    );
  });
  const primaryPool =
    primaryOnTopic.length >= 2 ? primaryOnTopic : primaryRanked;
  // Redirected papers are graded against the related outcome, so they must
  // never satisfy the "direct evidence" branch for the original claim.
  const direct = primaryPool.filter(
    (entry) => entry.directness === "direct",
  );
  if (direct.length > 0) {
    return uniqueArticles([...direct, ...primaryPool, ...redirectPool]).slice(
      0,
      MAX_STUDIES,
    );
  }

  if (redirectPool.length === 0) {
    return primaryPool.slice(0, MAX_STUDIES).map((entry) => entry.article);
  }

  // When the exact outcome is absent, the related-outcome papers are the
  // closest evidence and should lead the synthesis. Primary records fill the
  // remaining slots only when their extracted finding is on-topic.
  return uniqueArticles([...redirectPool, ...primaryPool]).slice(
    0,
    MAX_STUDIES,
  );
}

function uniqueArticles(entries: RankedArticle[]): RawArticle[] {
  const seen = new Set<string>();
  const result: RawArticle[] = [];
  for (const entry of entries) {
    const key = articleKey(entry.article);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(entry.article);
  }
  return result;
}

function articleKey(article: RawArticle): string {
  return article.pmid
    ? `pmid:${article.pmid}`
    : article.doi
      ? `doi:${article.doi.toLowerCase()}`
      : `title:${normalizeTitle(article.title)}`;
}

function mergeArticles(primary: RawArticle[], secondary: RawArticle[]): RawArticle[] {
  const merged: RawArticle[] = [];
  const seen = new Map<string, RawArticle>();

  for (const article of [...primary, ...secondary]) {
    const key = articleKey(article);
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

const HUMAN_CONTEXT_SIGNALS =
  /\b(human|humans|adults|participants?|patients?|individuals?|men|women|subjects?|volunteers?|respondents?|athletes?|cohort|NHANES|randomi[sz]ed|clinical trial|self-reported|survey|questionnaire|serum|plasma|LDL|cholesterol|BMI|body mass index|case series|case study)\b/i;

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
      if (
        /\b(narratives?|media coverage|discourse|qualitative|content analysis|communicat\w*|public opinion|controversy|social media|content creators?|influencers?|posts?|tweets?|youtube|tiktok|instagram)\b/.test(
          title,
        )
      ) {
        return false;
      }

      const abstract = article.abstract.toLowerCase();
      const abstractMatches = claim.concepts.filter((concept) =>
        concept.terms.some((term) => abstract.includes(term.toLowerCase())),
      ).length;
      if (abstractMatches < requiredMatches) return false;

      const haystack = `${title} ${abstract}`;

      // "Carnivore" is also an ecology term. A human diet claim must not be
      // answered with quolls, scat surveys, or food-web studies.
      if (claim.concepts.some((concept) => concept.key === "carnivore_diet")) {
        // A human diet question needs a human study. This also filters animal
        // ecology records that use "carnivore" in its zoological sense.
        if (!HUMAN_CONTEXT_SIGNALS.test(haystack)) return false;
        const design = detectDesign(article, null);
        if (design === "animal" || design === "in-vitro") return false;
      }

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

  const orderedConcepts = claim.intervention
    ? [claim.intervention, ...(claim.outcomes ?? [])]
    : claim.concepts;

  orderedConcepts.forEach((concept, index) => {
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

  // A soft domain bias, never a hard filter: records from nutrition, exercise,
  // and sports science rise when the claim belongs to SciBased's niche, while
  // directly relevant papers from other fields can still be included.
  score += articleDomainBoost(article, claim.domain);

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
  redirect?: SearchRedirect,
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

  if (redirect) {
    limitations.push(
      `No direct ${redirect.from} study passed screening. The search was widened to ${redirect.to.join(", ")}; related-outcome evidence cannot confirm or refute the exact claim.`,
    );
    if (redirect.relatedStudiesFound > 0) {
      limitations.push(
        "Some included studies measured a related outcome rather than the exact claim and are marked as indirect or proxy evidence.",
      );
    }
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
    searchFocus: isNicheDomain(claim.domain) ? "nutrition-fitness" : undefined,
    redirect,
  };
}

function report(
  onProgress: ScanOptions["onProgress"],
  progress: AnalysisProgress,
): void {
  onProgress?.(progress);
}
