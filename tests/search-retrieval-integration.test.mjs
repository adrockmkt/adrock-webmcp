import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import fs from "node:fs";

import { renderBlogSearchRuntime } from "../scripts/build-blog-search-runtime.mjs";

const searchToolSource = fs.readFileSync(new URL("../src/search-blog-tool.js", import.meta.url), "utf8");
const articleRuntimeSource = fs.readFileSync(new URL("../src/blog-articles.js", import.meta.url), "utf8");
const articleToolSource = fs.readFileSync(new URL("../src/get-blog-article-tool.js", import.meta.url), "utf8");

const anomalousIndex = [{
  title: "Google Sponsored Results nova interface",
  slug: "google-sponso%E2%80%8Bred-results-nova-interface-anuncios",
  url: "https://adrock.com.br/blog/google-sponso%E2%80%8Bred-results-nova-interface-anuncios",
  description: "Google Sponsored Results e nova interface de anúncios.",
  category: "Mídia e Performance",
  published_at: "2026-01-01",
}];

const canonicalSlug = "google-sponsored-results-nova-interface-anuncios";
const content = "Conteúdo íntegro do artigo sobre Google Sponsored Results.";
const contentBytes = new TextEncoder().encode(content).length;

function modelContext() {
  const tools = [];
  return {
    tools,
    async registerTool(tool) { tools.push(tool); },
  };
}

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

test("integrates search_blog with get_blog_article using the canonical retrieval slug", async () => {
  const mc = modelContext();
  const fetchCalls = [];
  const fetch = async (url) => {
    fetchCalls.push(url);
    if (url.endsWith("/blog-articles-manifest.json")) {
      return {
        ok: true,
        json: async () => ({
          schema_version: 1,
          article_count: 1,
          articles: [{
            slug: canonicalSlug,
            url: anomalousIndex[0].url,
            path: `blog-articles/${canonicalSlug}.json`,
            content_length: content.length,
            content_bytes: contentBytes,
          }],
        }),
      };
    }
    if (url.endsWith(`/blog-articles/${canonicalSlug}.json`)) {
      return {
        ok: true,
        json: async () => ({
          slug: canonicalSlug,
          url: anomalousIndex[0].url,
          title: anomalousIndex[0].title,
          description: anomalousIndex[0].description,
          category: anomalousIndex[0].category,
          published_at: anomalousIndex[0].published_at,
          content,
          content_length: content.length,
          content_bytes: contentBytes,
        }),
      };
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };

  const context = vm.createContext({
    document: { modelContext: mc },
    console,
    fetch,
    URL,
    TextEncoder,
  });

  vm.runInContext(renderBlogSearchRuntime(anomalousIndex), context);
  vm.runInContext(searchToolSource, context);
  vm.runInContext(articleRuntimeSource, context);
  vm.runInContext(articleToolSource, context);
  await settle();

  const searchTool = mc.tools.find((tool) => tool.name === "search_blog");
  const getTool = mc.tools.find((tool) => tool.name === "get_blog_article");
  assert.ok(searchTool);
  assert.ok(getTool);

  const search = JSON.parse(await searchTool.execute({ query: "Google Sponsored Results" }));
  assert.equal(search.count, 1);
  assert.equal(search.results[0].slug, canonicalSlug);
  assert.equal(search.results[0].url, anomalousIndex[0].url);

  const article = JSON.parse(await getTool.execute({ slug: search.results[0].slug }));
  assert.equal(article.slug, canonicalSlug);
  assert.equal(article.url, anomalousIndex[0].url);
  assert.equal(article.content, content);
  assert.equal(article.content_length, content.length);
  assert.equal(article.content_bytes, contentBytes);

  assert.deepEqual(fetchCalls, [
    "https://adrockmkt.github.io/adrock-webmcp/blog-articles-manifest.json",
    `https://adrockmkt.github.io/adrock-webmcp/blog-articles/${canonicalSlug}.json`,
  ]);
});
