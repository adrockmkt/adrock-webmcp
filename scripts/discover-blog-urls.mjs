#!/usr/bin/env node

const DEFAULT_SITEMAP_URL = "https://adrock.com.br/sitemap.xml";
const BLOG_PATH_PREFIX = "/blog/";

function normalizeUrl(value) {
  const url = new URL(value);
  url.hash = "";
  return url;
}

export function extractLocValues(xml) {
  if (typeof xml !== "string") {
    throw new TypeError("Sitemap content must be a string.");
  }

  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
    .map((match) => match[1].trim())
    .filter(Boolean);
}

export function discoverBlogUrls(xml, options = {}) {
  const origin = options.origin ?? "https://adrock.com.br";
  const pathPrefix = options.pathPrefix ?? BLOG_PATH_PREFIX;
  const expectedOrigin = new URL(origin).origin;

  const urls = new Set();

  for (const value of extractLocValues(xml)) {
    let url;

    try {
      url = normalizeUrl(value);
    } catch {
      continue;
    }

    if (url.origin !== expectedOrigin) continue;
    if (!url.pathname.startsWith(pathPrefix)) continue;
    if (url.pathname === pathPrefix || url.pathname === pathPrefix.slice(0, -1)) {
      continue;
    }

    url.search = "";
    urls.add(url.href.replace(/\/$/, ""));
  }

  return [...urls].sort((a, b) => a.localeCompare(b, "en"));
}

export async function fetchSitemap(url = DEFAULT_SITEMAP_URL, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    headers: {
      accept: "application/xml,text/xml;q=0.9,*/*;q=0.1",
      "user-agent": "adrock-webmcp-content-discovery/0.5",
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch sitemap: HTTP ${response.status}`);
  }

  return response.text();
}

export async function discoverPublishedBlogUrls(options = {}) {
  const sitemapUrl = options.sitemapUrl ?? DEFAULT_SITEMAP_URL;
  const xml = await fetchSitemap(sitemapUrl, options.fetchImpl ?? fetch);

  return discoverBlogUrls(xml, {
    origin: options.origin ?? new URL(sitemapUrl).origin,
    pathPrefix: options.pathPrefix ?? BLOG_PATH_PREFIX,
  });
}

async function main() {
  const sitemapUrl = process.argv[2] ?? DEFAULT_SITEMAP_URL;
  const urls = await discoverPublishedBlogUrls({ sitemapUrl });

  process.stdout.write(
    JSON.stringify(
      {
        sitemap: sitemapUrl,
        count: urls.length,
        urls,
      },
      null,
      2,
    ) + "\n",
  );
}

const isDirectExecution =
  process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isDirectExecution) {
  main().catch((error) => {
    console.error(`[Ad Rock WebMCP] ${error.message}`);
    process.exitCode = 1;
  });
}
