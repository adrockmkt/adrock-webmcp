#!/usr/bin/env node

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchArticleContent } from "./extract-blog-content.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const INDEX_PATH = join(ROOT, "data", "blog-index.generated.json");
const OUTPUT_DIR = join(ROOT, "data", "blog-articles");
const MANIFEST_PATH = join(ROOT, "data", "blog-articles-manifest.json");
const DEFAULT_CONCURRENCY = 6;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function canonicalizeSlug(slug) {
  if (typeof slug !== "string" || !slug) return null;
  let decoded;
  try { decoded = decodeURIComponent(slug); } catch { return null; }

  const cleaned = decoded
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (!SLUG_PATTERN.test(cleaned)) return null;
  return cleaned;
}

export function normalizeArticleRecord(article, content) {
  const slug = canonicalizeSlug(article?.slug);
  if (!article || !slug) {
    throw new Error(`Invalid article slug: ${article?.slug ?? "<missing>"}`);
  }
  if (typeof content !== "string" || !content.trim()) {
    throw new Error(`No extractable content for slug: ${slug}`);
  }

  return {
    slug,
    url: article.url,
    title: article.title ?? null,
    description: article.description ?? null,
    category: article.category ?? null,
    published_at: article.published_at ?? null,
    content,
    content_length: content.length,
    content_bytes: Buffer.byteLength(content, "utf8"),
  };
}

export function buildManifest(records) {
  return {
    schema_version: 1,
    article_count: records.length,
    articles: [...records]
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .map(({ slug, url, content_length, content_bytes }) => ({
        slug,
        url,
        path: `blog-articles/${slug}.json`,
        content_length,
        content_bytes,
      })),
  };
}

async function mapConcurrent(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await mapper(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function generateArticleStore(index, options = {}) {
  const fetchContent = options.fetchContent ?? fetchArticleContent;
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  const records = await mapConcurrent(index, concurrency, async (article) =>
    normalizeArticleRecord(article, await fetchContent(article.url)),
  );
  records.sort((a, b) => a.slug.localeCompare(b.slug));
  return { records, manifest: buildManifest(records) };
}

export async function writeArticleStore(store, options = {}) {
  const outputDir = options.outputDir ?? OUTPUT_DIR;
  const manifestPath = options.manifestPath ?? MANIFEST_PATH;

  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  for (const record of store.records) {
    await writeFile(join(outputDir, `${record.slug}.json`), JSON.stringify(record, null, 2) + "\n");
  }
  await writeFile(manifestPath, JSON.stringify(store.manifest, null, 2) + "\n");
}

async function main() {
  const index = JSON.parse(await readFile(INDEX_PATH, "utf8"));
  const store = await generateArticleStore(index);
  await writeArticleStore(store);
  process.stdout.write(JSON.stringify({
    article_count: store.records.length,
    output_dir: OUTPUT_DIR,
    manifest: MANIFEST_PATH,
  }, null, 2) + "\n");
}

const isDirectExecution = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isDirectExecution) {
  main().catch((error) => {
    console.error(`[Ad Rock WebMCP] ${error.message}`);
    process.exitCode = 1;
  });
}
