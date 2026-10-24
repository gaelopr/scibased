import type { PaperSource } from "../../types";
import { PUBMED_BASE, PUBMED_RETMAX } from "./config";
import { cleanText, fetchWithRetry } from "./utils";

export interface AbstractSection {
  label: string;
  text: string;
}

export interface RawArticle {
  id: string;
  pmid?: string;
  pmcid?: string;
  doi?: string;
  title: string;
  abstract: string;
  abstractSections: AbstractSection[];
  authors: string;
  journal: string;
  journalAbbrev: string;
  year: number;
  pubTypes: string[];
  meshTerms: string[];
  language: string;
  source: PaperSource;
  citedByCount?: number;
  openAccessUrl?: string;
  isOpenAccess?: boolean;
  /** Set when the article came from an outcome-redirect search. */
  redirectedOutcome?: string;
  /** Plain-language explanation attached by the redirect planner. */
  redirectNote?: string;
}

export interface PubMedSearchResult {
  count: number;
  ids: string[];
  query: string;
}

export async function searchPubMed(
  query: string,
  retmax = PUBMED_RETMAX,
): Promise<PubMedSearchResult> {
  if (!query.trim()) return { count: 0, ids: [], query };

  const params = new URLSearchParams({
    db: "pubmed",
    term: query,
    retmode: "json",
    retmax: String(retmax),
    sort: "relevance",
    tool: "scibased",
  });

  const response = await fetchWithRetry(`${PUBMED_BASE}/esearch.fcgi?${params}`);
  if (!response.ok) {
    throw new Error(`PubMed search failed (${response.status})`);
  }

  const data = (await response.json()) as {
    esearchresult?: { count?: string; idlist?: string[]; ERROR?: string };
  };

  if (data.esearchresult?.ERROR) {
    throw new Error(data.esearchresult.ERROR);
  }

  return {
    count: Number(data.esearchresult?.count ?? 0),
    ids: data.esearchresult?.idlist ?? [],
    query,
  };
}

export async function fetchPubMedArticles(ids: string[]): Promise<RawArticle[]> {
  if (ids.length === 0) return [];

  const params = new URLSearchParams({
    db: "pubmed",
    id: ids.join(","),
    retmode: "xml",
    tool: "scibased",
  });

  const response = await fetchWithRetry(`${PUBMED_BASE}/efetch.fcgi?${params}`);
  if (!response.ok) {
    throw new Error(`PubMed fetch failed (${response.status})`);
  }

  const xml = await response.text();
  return parsePubMedXml(xml);
}

export function parsePubMedXml(xml: string): RawArticle[] {
  if (!xml.trim()) return [];

  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) return [];

  return Array.from(doc.getElementsByTagName("PubmedArticle"))
    .map(parseArticle)
    .filter((article): article is RawArticle => article !== null);
}

function parseArticle(node: Element): RawArticle | null {
  const citation = node.getElementsByTagName("MedlineCitation")[0];
  const articleNode = citation?.getElementsByTagName("Article")[0];
  if (!citation || !articleNode) return null;

  const pmid = text(citation.getElementsByTagName("PMID")[0]);
  const title = text(articleNode.getElementsByTagName("ArticleTitle")[0]);

  const abstractSections = Array.from(articleNode.getElementsByTagName("AbstractText"))
    .map((element) => ({
      label: element.getAttribute("Label") ?? "",
      text: text(element),
    }))
    .filter((section) => section.text.length > 0);

  const abstract = abstractSections
    .map((section) => (section.label ? `${section.label}: ${section.text}` : section.text))
    .join(" ");

  const authors = Array.from(articleNode.getElementsByTagName("Author"))
    .map((author) => {
      const collective = text(author.getElementsByTagName("CollectiveName")[0]);
      if (collective) return collective;
      const last = text(author.getElementsByTagName("LastName")[0]);
      const initials = text(author.getElementsByTagName("Initials")[0]);
      return [last, initials].filter(Boolean).join(" ");
    })
    .filter(Boolean)
    .join(", ");

  const journalNode = articleNode.getElementsByTagName("Journal")[0];
  const journal = text(journalNode?.getElementsByTagName("Title")[0]);
  const journalAbbrev = text(journalNode?.getElementsByTagName("ISOAbbreviation")[0]);

  const pubDate = journalNode?.getElementsByTagName("PubDate")[0];
  const year = extractYear(
    text(pubDate?.getElementsByTagName("Year")[0]) ||
      text(pubDate?.getElementsByTagName("MedlineDate")[0]),
  );

  const articleIds = getOwnArticleIds(node);
  const doi =
    text(articleIds.find((element) => element.getAttribute("IdType") === "doi")) ||
    text(
      Array.from(articleNode.getElementsByTagName("ELocationID")).find(
        (element) => element.getAttribute("EIdType") === "doi",
      ),
    );
  const pmcid = text(articleIds.find((element) => element.getAttribute("IdType") === "pmc"));

  const pubTypes = Array.from(articleNode.getElementsByTagName("PublicationType"))
    .map((element) => text(element))
    .filter(Boolean);

  const meshTerms = Array.from(citation.getElementsByTagName("DescriptorName"))
    .map((element) => text(element))
    .filter(Boolean);

  const language = text(articleNode.getElementsByTagName("Language")[0]);

  if (!pmid || !title) return null;

  return {
    id: pmid,
    pmid,
    pmcid: pmcid || undefined,
    doi: doi || undefined,
    title,
    abstract,
    abstractSections,
    authors,
    journal: journal || journalAbbrev || "Unknown journal",
    journalAbbrev,
    year,
    pubTypes,
    meshTerms,
    language,
    source: "PubMed",
  };
}

function getOwnArticleIds(node: Element): Element[] {
  const pubmedData = node.getElementsByTagName("PubmedData")[0];
  if (!pubmedData) return [];

  const idList = Array.from(pubmedData.children).find(
    (child) => child.tagName.toLowerCase() === "articleidlist",
  );
  if (!idList) return [];

  return Array.from(idList.children).filter(
    (child) => child.tagName.toLowerCase() === "articleid",
  );
}

function extractYear(value: string): number {
  const match = value.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : 0;
}

function text(element?: Element | null): string {
  if (!element) return "";
  return cleanText(element.textContent ?? "");
}
