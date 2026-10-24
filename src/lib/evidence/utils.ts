export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

const ALLOWED_API_ORIGINS = new Set([
  "https://eutils.ncbi.nlm.nih.gov",
  "https://www.ebi.ac.uk",
  "https://api.openalex.org",
]);

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 20000,
): Promise<Response> {
  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    throw new Error("Blocked malformed literature request");
  }
  if (!ALLOWED_API_ORIGINS.has(origin)) {
    throw new Error("Blocked literature request to an unapproved origin");
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      credentials: "omit",
      referrerPolicy: "no-referrer",
      ...options,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  { retries = 2, timeoutMs = 20000 } = {},
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, options, timeoutMs);
      if (response.ok) return response;

      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(`Request failed with ${response.status}`);
        await sleep(700 * (attempt + 1));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(700 * (attempt + 1));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed");
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  laquo: "«",
  raquo: "»",
  copy: "©",
  reg: "®",
  trade: "™",
  plusmn: "±",
  times: "×",
  divide: "÷",
  micro: "µ",
  deg: "°",
  sup1: "¹",
  sup2: "²",
  sup3: "³",
  frac12: "½",
  frac14: "¼",
  frac34: "¾",
  ge: "≥",
  le: "≤",
  ne: "≠",
  asymp: "≈",
  infin: "∞",
  middot: "·",
  bull: "•",
  dagger: "†",
  Dagger: "‡",
  permil: "‰",
  prime: "′",
  Prime: "″",
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  epsilon: "ε",
  theta: "θ",
  lambda: "λ",
  mu: "μ",
  pi: "π",
  sigma: "σ",
  omega: "ω",
  aacute: "á",
  eacute: "é",
  iacute: "í",
  oacute: "ó",
  uacute: "ú",
  ntilde: "ñ",
  uuml: "ü",
  Aacute: "Á",
  Eacute: "É",
  Iacute: "Í",
  Oacute: "Ó",
  Uacute: "Ú",
  Ntilde: "Ñ",
  Uuml: "Ü",
  iexcl: "¡",
  iquest: "¿",
};

export function decodeHtmlEntities(text: string): string {
  // Decode only known entities and numeric references. Building an HTML
  // document from untrusted API text is unnecessary and turns a text decoder
  // into an HTML injection sink; this keeps the operation inert.
  return text.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z][a-z0-9]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const isHex = entity[1]?.toLowerCase() === "x";
      const codePoint = Number.parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      if (
        Number.isFinite(codePoint) &&
        codePoint > 0 &&
        codePoint <= 0x10ffff &&
        !(codePoint >= 0xd800 && codePoint <= 0xdfff)
      ) {
        return String.fromCodePoint(codePoint);
      }
      return match;
    }

    return NAMED_ENTITIES[entity] ?? match;
  });
}

/**
 * Only allow explicit HTTPS URLs from third-party metadata. This prevents a
 * malformed or hostile record from producing a javascript:, data:, http:, or
 * file: link in the UI.
 */
export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return url.href;
  } catch {
    // Ignore malformed URLs and render no link.
  }
  return null;
}

export function stripTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, " "));
}

export function cleanText(text: string): string {
  return stripTags(text)
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}

export function truncate(text: string, maxLength: number): string {
  const cleaned = cleanText(text);
  if (cleaned.length <= maxLength) return cleaned;
  const cut = cleaned.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 40 ? lastSpace : maxLength).trim()}…`;
}

export function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = key(item);
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Approximate sentence splitting that is resilient to common medical abbreviations. */
export function splitSentences(text: string): string[] {
  const protectedText = text
    // PubMed abstracts sometimes concatenate a section heading directly to
    // the next sentence ("performed.ResultsThe results..."). Break those
    // headings before sentence splitting so the headline quote is not a run-on.
    .replace(
      /\b(Results|Conclusion|Conclusions|Methods|Background|Objectives?|Discussion|Introduction)(?=[A-Z])/g,
      "$1. ",
    )
    .replace(/\b(e\.g|i\.e|vs|et al|Dr|Prof|approx|ca|no)\./gi, "$1<DOT>")
    .replace(/(\b[A-Z])\./g, "$1<DOT>")
    .replace(/(\d)\.(\d)/g, "$1<DOT>$2");

  return protectedText
    .split(/(?<=[.!?])\s+(?=[A-Z0-9“"(])/)
    .map((sentence) => sentence.replace(/<DOT>/g, ".").replace(/\s+/g, " ").trim())
    .filter((sentence) => sentence.length >= 20);
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function pct(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
