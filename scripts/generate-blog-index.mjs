#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import { discoverPublishedBlogUrls } from "./discover-blog-urls.mjs";
import { fetchArticleMetadata } from "./extract-blog-metadata.mjs";

const DEFAULT_OUTPUT = "data/blog-index.generated.json";

export function normalizeIndexRecord(record) {
  return {
    title: record.title ?? null,
    slug: record.slug ?? null,
    url: record.url ?? null,
    description: record.description ?? null,
    category: record.category ?? null,
    published_at: record.published_at ?? null,
  };
}

export function buildDeterministicIndex(records) {
  const byUrl = new Map();
  for (const record of records) {
    const normalized = normalizeIndexRecord(record);
    if (!normalized.url || !normalized.slug) continue;
    byUrl.set(normalized.url, normalized);
  }
  return [...byUrl.values()].sort((a, b) => a.url.localeCompare(b.url, "en"));
}

export async function generateBlogIndex(options = {}) {
  const urls = options.urls ?? await discoverPublishedBlogUrls(options);
  const fetchMetadata = options.fetchMetadata ?? fetchArticleMetadata;
  const records = [];
  const errors = [];

  for (const url of urls) {
    try {
      records.push(await fetchMetadata(url));
    } catch (error) {
      errors.push({ url, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return {
    index: buildDeterministicIndex(records),
    discovered_count: urls.length,
    indexed_count: records.length,
    error_count: errors.length,
    errors,
  };
}

async function main() {
  const output = process.argv[2] ?? DEFAULT_OUTPUT;
  const result = await generateBlogIndex();
  await writeFile(output, JSON.stringify(result.index, null, 2) + "\n", "utf8");

  process.stdout.write(JSON.stringify({
    output,
    discovered_count: result.discovered_count,
    indexed_count: result.indexed_count,
    error_count: result.error_count,
    errors: result.errors,
  }, null, 2) + "\n");

  if (result.error_count > 0) process.exitCode = 2;
}

const isDirectExecution =
  process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isDirectExecution) {
  main().catch((error) => {
    console.error(`[Ad Rock WebMCP] ${error.message}`);
    process.exitCode = 1;
  });
}
