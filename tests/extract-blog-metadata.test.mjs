import assert from "node:assert/strict";
import test from "node:test";

import { extractArticleMetadata } from "../scripts/extract-blog-metadata.mjs";

test("extracts Open Graph and article metadata", () => {
  const html = `<!doctype html>
  <html><head>
    <title>Fallback title</title>
    <meta property="og:title" content="GA4 &amp; IA">
    <meta property="og:description" content="Descrição técnica sobre GA4 e IA.">
    <meta property="og:url" content="https://adrock.com.br/blog/ga4-ia?ref=test">
    <meta property="article:published_time" content="2026-09-22T10:00:00-03:00">
    <meta property="article:section" content="Analytics">
  </head></html>`;

  assert.deepEqual(
    extractArticleMetadata(html, "https://adrock.com.br/blog/ga4-ia"),
    {
      title: "GA4 & IA",
      description: "Descrição técnica sobre GA4 e IA.",
      category: "Analytics",
      published_at: "2026-09-22T13:00:00.000Z",
      slug: "ga4-ia",
      url: "https://adrock.com.br/blog/ga4-ia",
    },
  );
});

test("falls back to standard title and description metadata", () => {
  const html = `<!doctype html>
  <html><head>
    <title>Artigo de SEO</title>
    <meta name="description" content="Descrição do artigo">
  </head></html>`;

  assert.deepEqual(
    extractArticleMetadata(html, "https://adrock.com.br/blog/artigo-seo?utm_source=x#top"),
    {
      title: "Artigo de SEO",
      description: "Descrição do artigo",
      category: null,
      published_at: null,
      slug: "artigo-seo",
      url: "https://adrock.com.br/blog/artigo-seo",
    },
  );
});

test("returns nullable metadata instead of inventing missing values", () => {
  const record = extractArticleMetadata(
    "<html><head><title>Minimal</title></head></html>",
    "https://adrock.com.br/blog/minimal",
  );

  assert.equal(record.title, "Minimal");
  assert.equal(record.description, null);
  assert.equal(record.category, null);
  assert.equal(record.published_at, null);
  assert.equal(record.slug, "minimal");
});


test("falls back to visible Framer article header metadata", () => {
  const html = `<!doctype html><html><head>
    <title>Ad Rock Digital Mkt - Marketing Digital e ações 360.</title>
    <meta property="og:title" content="Ad Rock Digital Mkt - Marketing Digital e ações 360.">
    <meta property="og:description" content="Consultoria de Marketing Digital: SEO, Inbound Marketing, Google Ads, Facebook Ads, Web Analytics e Planejamento de Mídia. Clique aqui!">
  </head><body><main>
    <div>SEO e IA</div><div>8 de set. de 2026</div><div>Go back</div>
    <h1>WebMCP: como a web está se preparando para agentes de inteligência artificial</h1>
  </main></body></html>`;
  assert.deepEqual(extractArticleMetadata(html, "https://adrock.com.br/blog/webmcp-web-agentes-inteligencia-artificial"), {
    title: "WebMCP: como a web está se preparando para agentes de inteligência artificial",
    description: null,
    category: "SEO e IA",
    published_at: "2026-09-08",
    slug: "webmcp-web-agentes-inteligencia-artificial",
    url: "https://adrock.com.br/blog/webmcp-web-agentes-inteligencia-artificial",
  });
});
