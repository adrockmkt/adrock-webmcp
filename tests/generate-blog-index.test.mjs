import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDeterministicIndex,
  canPublishGeneratedIndex,
  generateBlogIndex,
  fetchIndexableMetadata,
  isIndexableArticle,
  isTransientlyEmptyMetadata,
  normalizeIndexRecord,
} from "../scripts/generate-blog-index.mjs";

test("normalizes records without inventing metadata", () => {
  assert.deepEqual(normalizeIndexRecord({
    title: "Jev",
    slug: "jev",
    url: "https://adrock.com.br/blog/jev",
  }), {
    title: "Jev",
    slug: "jev",
    url: "https://adrock.com.br/blog/jev",
    description: null,
    category: null,
    published_at: null,
  });
});

test("builds a stable URL-sorted index and removes duplicate URLs", () => {
  const records = [
    { title: "B", slug: "b", url: "https://adrock.com.br/blog/b", published_at: "2026-01-02" },
    { title: "A old", slug: "a", url: "https://adrock.com.br/blog/a", published_at: "2026-01-01" },
    { title: "A", slug: "a", url: "https://adrock.com.br/blog/a", category: "SEO", published_at: "2026-01-01" },
  ];
  const index = buildDeterministicIndex(records);
  assert.equal(index.length, 2);
  assert.equal(index[0].title, "A");
  assert.equal(index[0].category, "SEO");
  assert.equal(index[1].title, "B");
});

test("combines discovery and metadata extraction while reporting failures", async () => {
  const urls = [
    "https://adrock.com.br/blog/a",
    "https://adrock.com.br/blog/b",
  ];
  const result = await generateBlogIndex({
    urls,
    metadataAttempts: 2,
    retryDelayMs: 0,
    fetchMetadata: async (url) => {
      if (url.endsWith("/b")) throw new Error("HTTP 500");
      return { title: "A", slug: "a", url, published_at: "2026-01-01" };
    },
  });
  assert.equal(result.discovered_count, 2);
  assert.equal(result.indexed_count, 1);
  assert.equal(result.error_count, 1);
  assert.equal(result.index.length, 1);
  assert.match(result.errors[0].error, /HTTP 500/);
});

test("excludes structural blog pages without publication date without retrying", async () => {
  let calls = 0;
  const result = await generateBlogIndex({
    urls: ["https://adrock.com.br/blog/seo-ia"],
    metadataAttempts: 5,
    retryDelayMs: 0,
    fetchMetadata: async (url) => {
      calls += 1;
      return {
        title: "SEO e IA",
        slug: "seo-ia",
        url,
        description: "Category landing page",
        category: null,
        published_at: null,
      };
    },
  });
  assert.equal(calls, 1);
  assert.equal(result.indexed_count, 0);
  assert.equal(result.skipped_count, 1);
  assert.equal(result.error_count, 0);
});

test("identifies only fully empty article metadata as transient", () => {
  assert.equal(isTransientlyEmptyMetadata({
    title: null,
    slug: "article",
    url: "https://adrock.com.br/blog/article",
    description: null,
    category: null,
    published_at: null,
  }), true);

  assert.equal(isTransientlyEmptyMetadata({
    title: "Category",
    slug: "category",
    url: "https://adrock.com.br/blog/category",
    description: null,
    category: null,
    published_at: null,
  }), false);
});

test("retries incomplete transient metadata until the article is indexable", async () => {
  let calls = 0;
  const result = await fetchIndexableMetadata(
    "https://adrock.com.br/blog/kiro",
    async (url) => {
      calls += 1;
      if (calls < 3) {
        return { title: null, slug: "kiro", url, description: null, category: null, published_at: null };
      }
      return { title: "Kiro", slug: "kiro", url, published_at: "2026-04-02" };
    },
    { metadataAttempts: 5, retryDelayMs: 0 },
  );

  assert.equal(calls, 3);
  assert.equal(result.error, null);
  assert.equal(result.attempts, 3);
  assert.equal(result.record.title, "Kiro");
});

test("promotes persistently empty metadata to an error after retries", async () => {
  let calls = 0;
  const result = await generateBlogIndex({
    urls: ["https://adrock.com.br/blog/incomplete"],
    metadataAttempts: 5,
    retryDelayMs: 0,
    fetchMetadata: async (url) => {
      calls += 1;
      return {
        title: null,
        slug: "incomplete",
        url,
        description: null,
        category: null,
        published_at: null,
      };
    },
  });

  assert.equal(calls, 5);
  assert.equal(result.indexed_count, 0);
  assert.equal(result.skipped_count, 0);
  assert.equal(result.error_count, 1);
  assert.match(result.errors[0].error, /empty article metadata/);
});

test("fails closed when generation has errors or unexpected skipped pages", () => {
  assert.equal(canPublishGeneratedIndex({ error_count: 0, skipped_count: 6 }), true);
  assert.equal(canPublishGeneratedIndex({ error_count: 1, skipped_count: 6 }), false);
  assert.equal(canPublishGeneratedIndex({ error_count: 0, skipped_count: 7 }), false);
});
