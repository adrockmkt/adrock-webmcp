import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  assertUniqueCanonicalSlugs,
  buildManifest,
  canonicalizeSlug,
  generateArticleStore,
  normalizeArticleRecord,
  writeArticleStore,
} from "../scripts/generate-blog-article-store.mjs";


test("canonicalizes percent-encoded invisible characters in public slugs", () => {
  assert.equal(
    canonicalizeSlug("google-sponso%E2%80%8Bred-results-nova-interface-anuncios"),
    "google-sponsored-results-nova-interface-anuncios",
  );
  assert.equal(canonicalizeSlug("%E0%A4%A"), null);
});

test("normalizes an article without inventing optional metadata", () => {
  const record = normalizeArticleRecord({
    slug: "ga4-audit",
    url: "https://adrock.com.br/blog/ga4-audit",
    title: "GA4 Audit",
  }, "Editorial content.");

  assert.equal(record.slug, "ga4-audit");
  assert.equal(record.description, null);
  assert.equal(record.category, null);
  assert.equal(record.content_length, 18);
  assert.equal(record.content_bytes, 18);
});

test("rejects invalid slugs and empty content", () => {
  assert.throws(
    () => normalizeArticleRecord({ slug: "../admin", url: "https://adrock.com.br/blog/x" }, "content"),
    /Invalid article slug/,
  );
  assert.throws(
    () => normalizeArticleRecord({ slug: "valid-slug", url: "https://adrock.com.br/blog/valid-slug" }, "  "),
    /No extractable content/,
  );
});

test("builds a deterministic slug-sorted manifest", () => {
  const manifest = buildManifest([
    { slug: "z", url: "https://adrock.com.br/blog/z", content_length: 2, content_bytes: 2 },
    { slug: "a", url: "https://adrock.com.br/blog/a", content_length: 1, content_bytes: 1 },
  ]);
  assert.equal(manifest.schema_version, 1);
  assert.deepEqual(manifest.articles.map((x) => x.slug), ["a", "z"]);
  assert.equal(manifest.articles[0].path, "blog-articles/a.json");
});

test("generates records deterministically from the index", async () => {
  const index = [
    { slug: "b", url: "https://adrock.com.br/blog/b", title: "B" },
    { slug: "a", url: "https://adrock.com.br/blog/a", title: "A" },
  ];
  const store = await generateArticleStore(index, {
    concurrency: 2,
    fetchContent: async (url) => `Content for ${url}`,
  });
  assert.deepEqual(store.records.map((x) => x.slug), ["a", "b"]);
  assert.equal(store.manifest.article_count, 2);
});

test("writes one JSON artifact per slug plus manifest", async () => {
  const root = await mkdtemp(join(tmpdir(), "webmcp-store-"));
  const outputDir = join(root, "blog-articles");
  const manifestPath = join(root, "manifest.json");
  const store = await generateArticleStore([
    { slug: "article-a", url: "https://adrock.com.br/blog/article-a", title: "A" },
  ], { fetchContent: async () => "Article body" });

  await writeArticleStore(store, { outputDir, manifestPath });
  const article = JSON.parse(await readFile(join(outputDir, "article-a.json"), "utf8"));
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  assert.equal(article.content, "Article body");
  assert.equal(manifest.article_count, 1);
  assert.equal(manifest.articles[0].slug, "article-a");
});


test("rejects canonical slug collisions before fetching article content", async () => {
  const index = [
    {
      slug: "google-sponso%E2%80%8Bred-results",
      url: "https://adrock.com.br/blog/google-sponso%E2%80%8Bred-results",
      title: "Encoded",
    },
    {
      slug: "google-sponsored-results",
      url: "https://adrock.com.br/blog/google-sponsored-results",
      title: "Canonical",
    },
  ];

  assert.throws(
    () => assertUniqueCanonicalSlugs(index),
    /Canonical slug collision/,
  );

  let fetches = 0;
  await assert.rejects(
    () => generateArticleStore(index, {
      fetchContent: async () => {
        fetches += 1;
        return "Body";
      },
    }),
    /Canonical slug collision/,
  );
  assert.equal(fetches, 0);
});
