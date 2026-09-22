import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDeterministicIndex,
  generateBlogIndex,
  isIndexableArticle,
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


test("excludes structural blog pages without publication date", () => {
  const categoryPage = {
    title: "SEO e IA",
    slug: "seo-ia",
    url: "https://adrock.com.br/blog/seo-ia",
    description: "Category landing page",
    category: null,
    published_at: null,
  };
  assert.equal(isIndexableArticle(categoryPage), false);
  assert.deepEqual(buildDeterministicIndex([categoryPage]), []);
});

test("reports structurally skipped pages separately from HTTP errors", async () => {
  const result = await generateBlogIndex({
    urls: ["https://adrock.com.br/blog/seo-ia"],
    fetchMetadata: async (url) => ({
      title: "SEO e IA",
      slug: "seo-ia",
      url,
      description: "Category landing page",
      category: null,
      published_at: null,
    }),
  });
  assert.equal(result.discovered_count, 1);
  assert.equal(result.indexed_count, 0);
  assert.equal(result.skipped_count, 1);
  assert.equal(result.error_count, 0);
});
