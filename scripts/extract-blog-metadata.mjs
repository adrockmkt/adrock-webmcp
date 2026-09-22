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

function getTitle(html) {
  const ogTitle = getMeta(html, "og:title");
  if (ogTitle) return ogTitle;

  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return cleanText(match?.[1]);
}

function getDescription(html) {
  return (
    getMeta(html, "og:description") ??
    getMeta(html, "description", "name") ??
    null
  );
}

function getPublishedAt(html) {
  return (
    getMeta(html, "article:published_time") ??
    getMeta(html, "date", "name") ??
    null
  );
}

function getCategory(html) {
  return (
    getMeta(html, "article:section") ??
    getMeta(html, "category", "name") ??
    null
  );
}

function normalizePublishedAt(value) {
  if (!value) return null;
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
