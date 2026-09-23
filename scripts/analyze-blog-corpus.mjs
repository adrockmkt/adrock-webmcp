#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { fetchArticleContent } from "./extract-blog-content.mjs";

const INDEX_PATH = new URL("../data/blog-index.generated.json", import.meta.url);
const DEFAULT_CONCURRENCY = 6;

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

export function summarizeCorpus(records) {
  const valid = records.filter((record) => Number.isFinite(record.content_length) && record.content_length >= 0);
  const lengths = valid.map((record) => record.content_length).sort((a, b) => a - b);
  const bytes = valid.map((record) => record.content_bytes ?? Buffer.byteLength(record.content ?? "", "utf8")).sort((a, b) => a - b);
  const totalChars = lengths.reduce((sum, value) => sum + value, 0);
  const totalBytes = bytes.reduce((sum, value) => sum + value, 0);

  return {
    article_count: valid.length,
    total_chars: totalChars,
    total_bytes: totalBytes,
    average_chars: valid.length ? Math.round(totalChars / valid.length) : 0,
    min_chars: lengths[0] ?? 0,
    p50_chars: percentile(lengths, 50),
    p75_chars: percentile(lengths, 75),
    p90_chars: percentile(lengths, 90),
    p95_chars: percentile(lengths, 95),
    p99_chars: percentile(lengths, 99),
    max_chars: lengths.at(-1) ?? 0,
    p95_bytes: percentile(bytes, 95),
    max_bytes: bytes.at(-1) ?? 0,
  };
}

async function mapConcurrent(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function analyzeCorpus(index, options = {}) {
  const fetchContent = options.fetchContent ?? fetchArticleContent;
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;

  const records = await mapConcurrent(index, concurrency, async (article) => {
    try {
      const content = await fetchContent(article.url);
      return {
        slug: article.slug,
        url: article.url,
        content_length: content.length,
        content_bytes: Buffer.byteLength(content, "utf8"),
      };
    } catch (error) {
      return {
        slug: article.slug,
        url: article.url,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  const successful = records.filter((record) => !record.error);
  const failures = records.filter((record) => record.error);

  return {
    generated_at: new Date().toISOString(),
    discovered_articles: index.length,
    successful_articles: successful.length,
    failed_articles: failures.length,
    summary: summarizeCorpus(successful),
    largest_articles: [...successful]
      .sort((a, b) => b.content_bytes - a.content_bytes)
      .slice(0, 10),
    failures,
  };
}

async function main() {
  const index = JSON.parse(await readFile(INDEX_PATH, "utf8"));
  const result = await analyzeCorpus(index);
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  if (result.failed_articles) process.exitCode = 2;
}

const isDirectExecution = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isDirectExecution) {
  main().catch((error) => {
    console.error(`[Ad Rock WebMCP] ${error.message}`);
    process.exitCode = 1;
  });
}
