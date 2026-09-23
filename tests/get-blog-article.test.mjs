import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const runtimeSource = await readFile(new URL("../src/blog-articles.js", import.meta.url), "utf8");
const toolSource = await readFile(new URL("../src/get-blog-article-tool.js", import.meta.url), "utf8");

function runtimeContext(fetchImpl) {
  const context = { fetch: fetchImpl, console };
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
        articles: [{
          slug: "known-article",
          url: "https://adrock.com.br/blog/known-article",
          path: "blog-articles/known-article.json",
        }],
      }) };
    }
    return { ok: true, json: async () => ({
      slug: "known-article",
      url: "https://adrock.com.br/blog/known-article",
      content: "Grounded editorial body",
      content_length: 23,
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
    return { ok: true, json: async () => ({ schema_version: 1, articles: [] }) };
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
      articles: [{
        slug: "known-article",
        url: "https://adrock.com.br/blog/known-article",
        path: "../secret.json",
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
