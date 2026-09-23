import test from "node:test";
import assert from "node:assert/strict";
import { analyzeCorpus, summarizeCorpus } from "../scripts/analyze-blog-corpus.mjs";

test("summarizes corpus size deterministically", () => {
  const records = [100, 200, 300, 400, 1000].map((content_length) => ({
    content_length,
    content_bytes: content_length,
  }));
  const summary = summarizeCorpus(records);
  assert.equal(summary.article_count, 5);
  assert.equal(summary.total_chars, 2000);
  assert.equal(summary.average_chars, 400);
  assert.equal(summary.p50_chars, 300);
  assert.equal(summary.p95_chars, 1000);
  assert.equal(summary.max_chars, 1000);
});

test("analyzes successful articles and preserves failures", async () => {
  const index = [
    { slug: "a", url: "https://adrock.com.br/blog/a" },
    { slug: "b", url: "https://adrock.com.br/blog/b" },
  ];
  const result = await analyzeCorpus(index, {
    concurrency: 1,
    fetchContent: async (url) => {
      if (url.endsWith("/b")) throw new Error("HTTP 503");
      return "conteudo editorial";
    },
  });

  assert.equal(result.discovered_articles, 2);
  assert.equal(result.successful_articles, 1);
  assert.equal(result.failed_articles, 1);
  assert.equal(result.summary.article_count, 1);
  assert.equal(result.failures[0].slug, "b");
  assert.match(result.failures[0].error, /503/);
});

test("reports the largest articles by bytes", async () => {
  const index = [
    { slug: "small", url: "https://adrock.com.br/blog/small" },
    { slug: "large", url: "https://adrock.com.br/blog/large" },
  ];
  const result = await analyzeCorpus(index, {
    concurrency: 2,
    fetchContent: async (url) => url.endsWith("/large") ? "ç".repeat(100) : "a".repeat(10),
  });

  assert.equal(result.largest_articles[0].slug, "large");
  assert.equal(result.largest_articles[0].content_bytes, 200);
  assert.equal(result.summary.max_bytes, 200);
});
