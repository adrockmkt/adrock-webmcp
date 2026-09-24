#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import { discoverPublishedBlogUrls } from "./discover-blog-urls.mjs";
import { fetchArticleMetadata } from "./extract-blog-metadata.mjs";

const DEFAULT_OUTPUT = "data/blog-index.generated.json";
const DEFAULT_METADATA_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 500;

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

export function isIndexableArticle(record) {
  return Boolean(record?.url && record?.slug && record?.title && record?.published_at);
}

export function buildDeterministicIndex(records) {
  const byUrl = new Map();
  for (const record of records) {
    const normalized = normalizeIndexRecord(record);
    if (!isIndexableArticle(normalized)) continue;
    byUrl.set(normalized.url, normalized);
  }
  return [...byUrl.values()].sort((a, b) => a.url.localeCompare(b.url, "en"));
}

async function wait(ms) {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchIndexableMetadata(url, fetchMetadata, options = {}) {
  const attempts = options.metadataAttempts ?? DEFAULT_METADATA_ATTEMPTS;
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  let lastRecord = null;
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      lastRecord = normalizeIndexRecord(await fetchMetadata(url));
      if (isIndexableArticle(lastRecord)) {
        return { record: lastRecord, attempts: attempt, error: null };
      }
      lastError = new Error("Incomplete article metadata");
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    if (attempt < attempts) await wait(retryDelayMs * attempt);
  }

  return { record: lastRecord, attempts, error: lastError };
}

export async function generateBlogIndex(options = {}) {
  const urls = options.urls ?? await discoverPublishedBlogUrls(options);
  const fetchMetadata = options.fetchMetadata ?? fetchArticleMetadata;
  const records = [];
  const errors = [];

  for (const url of urls) {
    const result = await fetchIndexableMetadata(url, fetchMetadata, options);
    if (result.record) records.push(result.record);
    if (result.error && !result.record) {
      errors.push({ url, attempts: result.attempts, error: result.error.message });
    }
  }

  const index = buildDeterministicIndex(records);
  const indexedUrls = new Set(index.map((record) => record.url));
  const skipped = records
    .map(normalizeIndexRecord)
    .filter((record) => !indexedUrls.has(record.url));

  return {
    index,
    discovered_count: urls.length,
    indexed_count: index.length,
    skipped_count: skipped.length,
    error_count: errors.length,
    skipped,
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
    skipped_count: result.skipped_count,
    error_count: result.error_count,
    skipped: result.skipped,
    errors: result.errors,
  }, null, 2) + "\n");

  if (result.error_count > 0 || result.skipped_count > 6) process.exitCode = 2;
}

const isDirectExecution =
  process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isDirectExecution) {
  main().catch((error) => {
    console.error(`[Ad Rock WebMCP] ${error.message}`);
    process.exitCode = 1;
  });
}
