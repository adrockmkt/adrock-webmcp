#!/usr/bin/env node

const DEFAULT_USER_AGENT = "adrock-webmcp-content-extractor/0.6";

function decodeHtml(value = "") {
  const entities = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => entities[name.toLowerCase()] ?? match);
}

function stripNonEditorial(html) {
  return html
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/<(script|style|noscript|svg|canvas|iframe|form|button)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(nav|header|footer|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, " ");
}

function textFromHtml(html) {
  return decodeHtml(
    stripNonEditorial(html)
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/(p|h[1-6]|li|blockquote|pre|section|article|div)>/gi, "\n")
      .replace(/<li\b[^>]*>/gi, "- ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function candidateBodies(html) {
  const candidates = [];

  // Extract semantic article blocks independently. A broad parent such as
  // <main> must not compete with its child articles.
  const articlePattern = /<article\\b[^>]*>([\\s\\S]*?)<\\/article>/gi;
  for (const match of html.matchAll(articlePattern)) {
    candidates.push(match[1] ?? "");
  }

  // Framer may expose the editorial body through a named/classed container
  // instead of a semantic <article>. Use this only when no article exists,
  // avoiding parent containers that aggregate multiple editorial blocks.
  if (candidates.length === 0) {
    const namedContainerPattern =
      /<div\\b[^>]*(?:data-framer-name|class)=(["'])[^"']*(?:article|post|content|rich-text)[^"']*\\1[^>]*>([\\s\\S]*?)<\\/div>/gi;

    for (const match of html.matchAll(namedContainerPattern)) {
      candidates.push(match[2] ?? "");
    }
  }

  return candidates;
}

function scoreCandidate(fragment) {
  const text = textFromHtml(fragment);
  const paragraphs = (fragment.match(/<p\b/gi) ?? []).length;
  const headings = (fragment.match(/<h[1-6]\b/gi) ?? []).length;
  return { text, score: text.length + paragraphs * 300 + headings * 120 };
}

function fallbackFromH1(html) {
  const h1 = html.search(/<h1\b/i);
  if (h1 < 0) return "";
  const endMarkers = [
    html.indexOf("<footer", h1),
    html.indexOf("</main>", h1),
    html.indexOf("</article>", h1),
  ].filter((value) => value > h1);
  const end = endMarkers.length ? Math.min(...endMarkers) : html.length;
  return html.slice(h1, end);
}

export function extractArticleContent(html) {
  if (typeof html !== "string") throw new TypeError("Article HTML must be a string.");

  const scored = candidateBodies(html)
    .map(scoreCandidate)
    .filter(({ text }) => text.length >= 200)
    .sort((a, b) => b.score - a.score);

  if (scored.length) return scored[0].text;

  return textFromHtml(fallbackFromH1(html));
}

export async function fetchArticleContent(pageUrl, fetchImpl = fetch) {
  const url = new URL(pageUrl);
  if (url.protocol !== "https:" || url.hostname !== "adrock.com.br" || !url.pathname.startsWith("/blog/")) {
    throw new Error("Only public Ad Rock blog URLs are allowed.");
  }

  const response = await fetchImpl(url.href, {
    headers: {
      accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
      "user-agent": DEFAULT_USER_AGENT,
    },
  });
  if (!response.ok) throw new Error(`Unable to fetch article content: HTTP ${response.status} ${url.href}`);

  return extractArticleContent(await response.text());
}

async function main() {
  const urls = process.argv.slice(2);
  if (!urls.length) throw new Error("Provide at least one Ad Rock blog URL.");

  const records = [];
  for (const url of urls) {
    const content = await fetchArticleContent(url);
    records.push({ url, content, content_length: content.length });
  }
  process.stdout.write(JSON.stringify(records, null, 2) + "\n");
}

const isDirectExecution = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isDirectExecution) {
  main().catch((error) => {
    console.error(`[Ad Rock WebMCP] ${error.message}`);
    process.exitCode = 1;
  });
}
