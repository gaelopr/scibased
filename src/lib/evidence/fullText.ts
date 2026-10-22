import { EUROPEPMC_BASE } from "./config";
import { cleanText, fetchWithTimeout } from "./utils";

export interface FullTextSection {
  title: string;
  text: string;
}

export interface FullText {
  pmcid: string;
  title: string;
  abstract: string;
  sections: FullTextSection[];
  methodsText: string;
  resultsText: string;
  discussionText: string;
  conclusionText: string;
  limitationsText: string;
  bodyText: string;
}

const MAX_XML_BYTES = 4_000_000;

export async function fetchEuropePmcFullText(pmcid: string): Promise<FullText | null> {
  if (!pmcid) return null;

  const response = await fetchWithTimeout(
    `${EUROPEPMC_BASE}/${encodeURIComponent(pmcid)}/fullTextXML`,
    {},
    25000,
  );

  if (!response.ok) return null;

  const xml = await response.text();
  if (!xml || xml.length > MAX_XML_BYTES || !xml.includes("<article")) return null;

  return parseJatsFullText(xml, pmcid);
}

export function parseJatsFullText(xml: string, pmcid = ""): FullText | null {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) return null;

  const title = text(doc.getElementsByTagName("article-title")[0]);
  const abstractNode = doc.getElementsByTagName("abstract")[0];
  const abstract = abstractNode
    ? Array.from(abstractNode.getElementsByTagName("p"))
        .map((paragraph) => paragraphText(paragraph))
        .filter(Boolean)
        .join(" ")
    : "";

  const sections: FullTextSection[] = [];
  const body = doc.getElementsByTagName("body")[0];

  if (body) {
    const topSections = Array.from(body.children).filter(
      (element) => element.tagName.toLowerCase() === "sec",
    );

    for (const section of topSections) {
      walkSection(section, [], sections);
    }

    if (topSections.length === 0) {
      const paragraphs = Array.from(body.getElementsByTagName("p"))
        .map((paragraph) => paragraphText(paragraph))
        .filter(Boolean);
      if (paragraphs.length > 0) {
        sections.push({ title: "Main text", text: paragraphs.join(" ") });
      }
    }
  }

  if (sections.length === 0 && !abstract) return null;

  const bodyText = sections.map((section) => section.text).join(" ");

  return {
    pmcid,
    title,
    abstract,
    sections,
    methodsText: joinMatchingSections(sections, /method|materials|patients|participants|study design|procedure|intervention|setting/i),
    resultsText: joinMatchingSections(sections, /result|findings|outcome/i),
    discussionText: joinMatchingSections(sections, /discussion|interpretation/i),
    conclusionText: joinMatchingSections(sections, /conclusion|summary/i),
    limitationsText: joinMatchingSections(sections, /limitation|strength|weakness/i),
    bodyText,
  };
}

function walkSection(
  node: Element,
  parents: string[],
  out: FullTextSection[],
): void {
  const directTitle = Array.from(node.children).find(
    (child) => child.tagName.toLowerCase() === "title",
  );
  const title = directTitle ? text(directTitle) : "";
  const path = [...parents, title].filter(Boolean);

  const paragraphs = Array.from(node.children)
    .filter((child) => child.tagName.toLowerCase() === "p")
    .map((paragraph) => paragraphText(paragraph))
    .filter(Boolean);

  if (paragraphs.length > 0) {
    out.push({
      title: path.join(" › ") || "Body",
      text: paragraphs.join(" "),
    });
  }

  const childSections = Array.from(node.children).filter(
    (child) => child.tagName.toLowerCase() === "sec",
  );

  for (const child of childSections) {
    walkSection(child, path, out);
  }
}

function joinMatchingSections(
  sections: FullTextSection[],
  pattern: RegExp,
): string {
  return sections
    .filter((section) => pattern.test(section.title))
    .map((section) => section.text)
    .join(" ");
}

function paragraphText(paragraph: Element): string {
  const clone = paragraph.cloneNode(true) as Element;
  const embedded = [
    "table-wrap",
    "table",
    "fig",
    "supplementary-material",
    "media",
    "graphic",
  ];

  for (const tag of embedded) {
    const nodes = Array.from(clone.getElementsByTagName(tag));
    for (const node of nodes) {
      node.parentNode?.removeChild(node);
    }
  }

  return text(clone);
}

function text(element?: Element | null): string {
  if (!element) return "";
  return cleanText(element.textContent ?? "");
}
