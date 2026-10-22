import { OPENALEX_BASE, OPENALEX_MAILTO } from "./config";
import type { RawArticle } from "./pubmed";
import { cleanText, fetchWithRetry } from "./utils";

interface OpenAlexWork {
  id: string;
  ids?: {
    doi?: string;
    pmid?: string;
    pmcid?: string;
  };
  title?: string;
  publication_year?: number;
  type?: string;
  cited_by_count?: number;
  open_access?: {
    is_oa?: boolean;
    oa_url?: string | null;
  };
  best_oa_location?: {
    pdf_url?: string | null;
    landing_page_url?: string | null;
    url?: string | null;
  } | null;
  authorships?: Array<{
    author?: { display_name?: string };
  }>;
  primary_location?: {
    source?: { display_name?: string } | null;
  } | null;
  abstract_inverted_index?: Record<string, number[]> | null;
}

interface OpenAlexResponse {
  results?: OpenAlexWork[];
  meta?: { count?: number };
}

export interface OpenAlexSearchResult {
  count: number;
  articles: RawArticle[];
}

export async function searchOpenAlex(
  query: string,
  perPage = 20,
): Promise<OpenAlexSearchResult> {
  if (!query.trim()) return { count: 0, articles: [] };

  const params = new URLSearchParams({
    search: query,
    "per-page": String(perPage),
    filter: "has_abstract:true,type:article",
    select:
      "id,ids,title,publication_year,type,cited_by_count,open_access,best_oa_location,authorships,primary_location,abstract_inverted_index",
  });

  if (OPENALEX_MAILTO) params.set("mailto", OPENALEX_MAILTO);

  const response = await fetchWithRetry(`${OPENALEX_BASE}/works?${params}`);
  if (!response.ok) {
    throw new Error(`OpenAlex search failed (${response.status})`);
  }

  const data = (await response.json()) as OpenAlexResponse;
  const articles = (data.results ?? [])
    .map(mapWork)
    .filter((article): article is RawArticle => article !== null);

  return { count: data.meta?.count ?? 0, articles };
}

function mapWork(work: OpenAlexWork): RawArticle | null {
  const title = cleanText(work.title ?? "");
  if (!title) return null;

  const abstract = reconstructAbstract(work.abstract_inverted_index);
  if (!abstract) return null;

  const pmid = extractId(work.ids?.pmid, /pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/);
  const pmcid = extractId(
    work.ids?.pmcid,
    /pmc\/articles\/(PMC\d+)/i,
  );
  const doi = (work.ids?.doi ?? "").replace(/^https?:\/\/doi\.org\//i, "");

  const authors =
    (work.authorships ?? [])
      .map((authorship) => authorship.author?.display_name ?? "")
      .filter(Boolean)
      .slice(0, 12)
      .join(", ") || "Authors not listed";

  const journal = work.primary_location?.source?.display_name ?? "Unknown journal";
  const isOpenAccess = Boolean(work.open_access?.is_oa);
  const openAccessUrl =
    work.best_oa_location?.pdf_url ??
    work.best_oa_location?.landing_page_url ??
    work.best_oa_location?.url ??
    work.open_access?.oa_url ??
    undefined;

  return {
    id: pmid ?? doi ?? work.id,
    pmid,
    pmcid,
    doi: doi || undefined,
    title,
    abstract,
    abstractSections: [{ label: "", text: abstract }],
    authors,
    journal,
    journalAbbrev: journal,
    year: work.publication_year ?? 0,
    pubTypes: work.type ? [work.type] : [],
    meshTerms: [],
    language: "eng",
    source: "OpenAlex",
    citedByCount: work.cited_by_count,
    isOpenAccess,
    openAccessUrl,
  };
}

function reconstructAbstract(index?: Record<string, number[]> | null): string {
  if (!index) return "";

  const words: string[] = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const position of positions) {
      if (position >= 0 && position < 5000) words[position] = word;
    }
  }

  return cleanText(words.filter(Boolean).join(" "));
}

function extractId(value: string | undefined, pattern: RegExp): string | undefined {
  if (!value) return undefined;
  const match = value.match(pattern);
  return match?.[1];
}
