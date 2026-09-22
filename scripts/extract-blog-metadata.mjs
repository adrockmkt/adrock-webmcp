#!/usr/bin/env node

const DEFAULT_USER_AGENT = "adrock-webmcp-metadata-extractor/0.5";

function decodeHtml(value = "") {
  const entities = {
    amp: "&",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
    nbsp: " ",
  };

  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(parseInt(code, 16)),
    )
    .replace(/&([a-z]+);/gi, (match, name) => entities[name.toLowerCase()] ?? match);
}

function cleanText(value) {
  if (typeof value !== "string") return null;
  const cleaned = decodeHtml(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || null;
}

function getMeta(html, key, attribute = "property") {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of tags) {
    const attrs = Object.fromEntries(
      [...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gi)].map((match) => [
        match[1].toLowerCase(),
        match[3],
      ]),
    );

    if ((attrs[attribute] ?? "").toLowerCase() === key.toLowerCase()) {
      return cleanText(attrs.content);
    }
  }

  return null;
}

function getH1(html) {
  const match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  return cleanText(match?.[1]);
}

function isGenericSiteTitle(value) {
  return Boolean(value && /^Ad Rock Digital Mkt - Marketing Digital e ações 360\.?$/i.test(value));
}

function getTitle(html) {
  const ogTitle = getMeta(html, "og:title");
  if (ogTitle && !isGenericSiteTitle(ogTitle)) return ogTitle;
  const h1 = getH1(html);
  if (h1) return h1;
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = cleanText(match?.[1]);
  return isGenericSiteTitle(title) ? null : title;
}

function isGenericSiteDescription(value) {
  return Boolean(value && /^Consultoria de Marketing Digital:/i.test(value));
}

function getDescription(html) {
  const candidates = [
    getMeta(html, "og:description"),
    getMeta(html, "description", "name"),
  ];
  return candidates.find((value) => value && !isGenericSiteDescription(value)) ?? null;
}

function getVisibleArticleHeader(html) {
  const h1Match = html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/i);
  if (!h1Match || h1Match.index == null) return null;
  return cleanText(html.slice(Math.max(0, h1Match.index - 6000), h1Match.index));
}

function getVisibleCategory(html) {
  const header = getVisibleArticleHeader(html);
  if (!header) return null;

  const dateMatch = header.match(/(\d{1,2} de [a-zç.]+ de \d{4})\s+Go back$/i);
  if (!dateMatch || dateMatch.index == null) return null;

  const beforeDate = header.slice(0, dateMatch.index);
  const blogMarker = beforeDate.lastIndexOf("Blog ");
  if (blogMarker >= 0) {
    return cleanText(beforeDate.slice(blogMarker + "Blog ".length));
  }

  const styleEnd = beforeDate.lastIndexOf("}");
  let visibleText = cleanText(beforeDate.slice(styleEnd >= 0 ? styleEnd + 1 : 0));
  if (!visibleText) return null;

  const genericTitle = "Ad Rock Digital Mkt - Marketing Digital e ações 360.";
  if (visibleText.startsWith(genericTitle)) {
    visibleText = cleanText(visibleText.slice(genericTitle.length));
  }

  return visibleText;
}

function getVisiblePublishedAt(html) {
  const header = getVisibleArticleHeader(html);
  if (!header) return null;
  const match = header.match(/(\d{1,2} de [a-zç.]+ de \d{4})\s+Go back$/i);
  return cleanText(match?.[1]);
}

function getPublishedAt(html) {
  return (
    getMeta(html, "article:published_time") ??
    getMeta(html, "date", "name") ??
    getVisiblePublishedAt(html) ??
    null
  );
}

function getCategory(html) {
  return (
    getMeta(html, "article:section") ??
    getMeta(html, "category", "name") ??
    getVisibleCategory(html) ??
    null
  );
}

function normalizePublishedAt(value) {
  if (!value) return null;
  const ptBr = value.match(/^(\d{1,2}) de ([a-zç.]+) de (\d{4})$/i);
  if (ptBr) {
    const months = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 };
    const month = months[ptBr[2].toLowerCase().replace(".", "").slice(0, 3)];
    if (month) return `${ptBr[3]}-${String(month).padStart(2, "0")}-${String(ptBr[1]).padStart(2, "0")}`;
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;
  return new Date(timestamp).toISOString();
}

export function extractArticleMetadata(html, pageUrl) {
  if (typeof html !== "string") {
    throw new TypeError("Article HTML must be a string.");
  }

  const url = new URL(pageUrl);
  const canonical = getMeta(html, "og:url");
  let normalizedUrl = url;

  if (canonical) {
    try {
      normalizedUrl = new URL(canonical, url.origin);
    } catch {
      normalizedUrl = url;
    }
  }

  normalizedUrl.hash = "";
  normalizedUrl.search = "";

  const segments = normalizedUrl.pathname.split("/").filter(Boolean);
  const blogIndex = segments.indexOf("blog");
  const slug = blogIndex >= 0 ? segments[blogIndex + 1] ?? null : null;

  return {
    title: getTitle(html),
    description: getDescription(html),
    category: getCategory(html),
    published_at: normalizePublishedAt(getPublishedAt(html)),
    slug,
    url: normalizedUrl.href.replace(/\/$/, ""),
  };
}

export async function fetchArticleMetadata(pageUrl, fetchImpl = fetch) {
  const response = await fetchImpl(pageUrl, {
    headers: {
      accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
      "user-agent": DEFAULT_USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch article: HTTP ${response.status} ${pageUrl}`);
  }

  const html = await response.text();
  return extractArticleMetadata(html, pageUrl);
}

async function main() {
  const urls = process.argv.slice(2);

  if (urls.length === 0) {
    throw new Error("Provide at least one Ad Rock blog URL.");
  }

  const records = [];
  for (const url of urls) {
    records.push(await fetchArticleMetadata(url));
  }

  process.stdout.write(JSON.stringify(records, null, 2) + "\n");
}

const isDirectExecution =
  process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isDirectExecution) {
  main().catch((error) => {
    console.error(`[Ad Rock WebMCP] ${error.message}`);
    process.exitCode = 1;
  });
}
