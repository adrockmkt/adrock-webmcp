import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const runtimeSource = await readFile(new URL("../src/blog-articles.js", import.meta.url), "utf8");
const toolSource = await readFile(new URL("../src/get-blog-article-tool.js", import.meta.url), "utf8");

function runtimeContext(fetchImpl) {
  const context = { fetch: fetchImpl, console, URL, TextEncoder };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(runtimeSource, context);
  return context;
}

test("retrieves only a manifest-approved article artifact", async () => {
  const calls = [];
  const context = runtimeContext(async (url) => {
    calls.push(url);
    if (url.endsWith("blog-articles-manifest.json")) {
      return { ok: true, json: async () => ({
        schema_version: 1,
        article_count: 1,
        articles: [{
          slug: "known-article",
          url: "https://adrock.com.br/blog/known-article",
          path: "blog-articles/known-article.json",
          content_length: 23,
          content_bytes: 23,
        }],
      }) };
    }
    return { ok: true, json: async () => ({
      slug: "known-article",
      url: "https://adrock.com.br/blog/known-article",
      content: "Grounded editorial body",
      content_length: 23,
      content_bytes: 23,
    }) };
  });

  const article = await context.AdRockBlogArticles.get("known-article");
  assert.equal(article.content, "Grounded editorial body");
  assert.equal(calls.length, 2);
  assert.match(calls[1], /blog-articles\/known-article\.json$/);
});

test("rejects unsafe and unknown slugs without arbitrary article fetch", async () => {
  let calls = 0;
  const context = runtimeContext(async () => {
    calls++;
    return { ok: true, json: async () => ({ schema_version: 1, article_count: 0, articles: [] }) };
  });

  await assert.rejects(() => context.AdRockBlogArticles.get("../admin"), /Invalid article slug/);
  assert.equal(calls, 0);

  await assert.rejects(() => context.AdRockBlogArticles.get("unknown-article"), /Unknown article slug/);
  assert.equal(calls, 1);
});

test("fails closed on a tampered manifest path", async () => {
  const context = runtimeContext(async () => ({
    ok: true,
    json: async () => ({
      schema_version: 1,
      article_count: 1,
      articles: [{
        slug: "known-article",
        url: "https://adrock.com.br/blog/known-article",
        path: "../secret.json",
        content_length: 4,
        content_bytes: 4,
      }],
    }),
  }));

  await assert.rejects(() => context.AdRockBlogArticles.get("known-article"), /Invalid article manifest path/);
});

test("registers get_blog_article with the frozen public contract", async () => {
  let registered;
  const context = {
    console,
    globalThis: {
      AdRockBlogArticles: { get: async (slug) => ({ slug, content: "Body" }) },
    },
    document: {
      modelContext: {
        registerTool: async (tool) => { registered = tool; },
      },
    },
  };
  vm.createContext(context);
  vm.runInContext(toolSource, context);
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(registered.name, "get_blog_article");
  assert.deepEqual([...registered.inputSchema.required], ["slug"]);
  assert.equal(registered.inputSchema.additionalProperties, false);
  assert.equal(registered.annotations.readOnlyHint, true);
  const result = JSON.parse(await registered.execute({ slug: "known-article" }));
  assert.equal(result.slug, "known-article");
});

test("does not register when WebMCP or retrieval runtime is unavailable", async () => {
  let calls = 0;
  for (const context of [
    { console, globalThis: {}, document: {} },
    { console, globalThis: {}, document: { modelContext: { registerTool: async () => { calls++; } } } },
  ]) {
    vm.createContext(context);
    vm.runInContext(toolSource, context);
    await new Promise((resolve) => setImmediate(resolve));
  }
  assert.equal(calls, 0);
});


test("rejects manifest entries pointing outside the public Ad Rock blog", async () => {
  const context = runtimeContext(async () => ({
    ok: true,
    json: async () => ({
      schema_version: 1,
      article_count: 1,
      articles: [{
        slug: "known-article",
        url: "https://evil.example/blog/known-article",
        path: "blog-articles/known-article.json",
        content_length: 4,
        content_bytes: 4,
      }],
    }),
  }));

  await assert.rejects(() => context.AdRockBlogArticles.get("known-article"), /Invalid article manifest/);
});

test("rejects manifest count mismatches and duplicate slugs", async () => {
  for (const manifest of [
    {
      schema_version: 1,
      article_count: 2,
      articles: [{
        slug: "known-article",
        url: "https://adrock.com.br/blog/known-article",
        path: "blog-articles/known-article.json",
        content_length: 4,
        content_bytes: 4,
      }],
    },
    {
      schema_version: 1,
      article_count: 2,
      articles: [1, 2].map(() => ({
        slug: "known-article",
        url: "https://adrock.com.br/blog/known-article",
        path: "blog-articles/known-article.json",
        content_length: 4,
        content_bytes: 4,
      })),
    },
  ]) {
    const context = runtimeContext(async () => ({ ok: true, json: async () => manifest }));
    await assert.rejects(() => context.AdRockBlogArticles.get("known-article"), /Invalid article manifest/);
  }
});

test("rejects tampered article length and byte metadata", async () => {
  const context = runtimeContext(async (url) => {
    if (url.endsWith("blog-articles-manifest.json")) {
      return { ok: true, json: async () => ({
        schema_version: 1,
        article_count: 1,
        articles: [{
          slug: "known-article",
          url: "https://adrock.com.br/blog/known-article",
          path: "blog-articles/known-article.json",
          content_length: 4,
          content_bytes: 4,
        }],
      }) };
    }
    return { ok: true, json: async () => ({
      slug: "known-article",
      url: "https://adrock.com.br/blog/known-article",
      content: "Body!",
      content_length: 4,
      content_bytes: 4,
    }) };
  });

  await assert.rejects(() => context.AdRockBlogArticles.get("known-article"), /Invalid article artifact/);
});

test("validates UTF-8 byte length independently from character length", async () => {
  const content = "ação";
  const byteLength = new TextEncoder().encode(content).length;
  const context = runtimeContext(async (url) => {
    if (url.endsWith("blog-articles-manifest.json")) {
      return { ok: true, json: async () => ({
        schema_version: 1,
        article_count: 1,
        articles: [{
          slug: "known-article",
          url: "https://adrock.com.br/blog/known-article",
          path: "blog-articles/known-article.json",
          content_length: content.length,
          content_bytes: byteLength,
        }],
      }) };
    }
    return { ok: true, json: async () => ({
      slug: "known-article",
      url: "https://adrock.com.br/blog/known-article",
      content,
      content_length: content.length,
      content_bytes: byteLength,
    }) };
  });

  const article = await context.AdRockBlogArticles.get("known-article");
  assert.equal(article.content, content);
});
