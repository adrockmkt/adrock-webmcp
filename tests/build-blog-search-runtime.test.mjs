import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { renderBlogSearchRuntime } from "../scripts/build-blog-search-runtime.mjs";

const index = [
  {
    title: "Ad Rock Digital Mkt - Blog - Jev: o modelo de IA criado para tomar decisões dentro de softwares",
    slug: "jev-ia-modelos-decisao-software",
    url: "https://adrock.com.br/blog/jev-ia-modelos-decisao-software",
    description: "Modelo de IA voltado para decisões probabilísticas, automações, agentes e sistemas.",
    category: "Código e Automação",
    published_at: "2026-09-21"
  },
  {
    title: "Ad Rock Digital Mkt - Blog - Checklist de Auditoria GA4 2026",
    slug: "checklist-auditoria-ga4-2026",
    url: "https://adrock.com.br/blog/checklist-auditoria-ga4-2026",
    description: "Framework técnico para auditoria de GA4, IA e tracking moderno.",
    category: "Analytics e Dados",
    published_at: "2026-05-20"
  }
];

function loadRuntime(records = index) {
  const context = vm.createContext({});
  vm.runInContext(renderBlogSearchRuntime(records), context);
  return context.AdRockBlogSearch;
}

test("generated runtime embeds the generated index", () => {
  const runtime = loadRuntime();
  assert.equal(runtime.index.length, 2);
  assert.equal(runtime.index[0].slug, "jev-ia-modelos-decisao-software");
});

test("search finds content that was not part of the v0.4 curated index", () => {
  const runtime = loadRuntime();
  const result = runtime.search("Jev decisões probabilísticas");
  assert.ok(result.count > 0);
  assert.equal(result.results[0].url, "https://adrock.com.br/blog/jev-ia-modelos-decisao-software");
});

test("GA4 and AI regression search still returns a relevant article", () => {
  const runtime = loadRuntime();
  const result = runtime.search("GA4 artificial intelligence");
  assert.ok(result.count > 0);
  assert.match(result.results[0].url, /ga4/);
});

test("unknown topic returns no results", () => {
  const runtime = loadRuntime();
  const result = runtime.search("quantum superconducting qubits");
  assert.equal(result.count, 0);
  assert.deepEqual(Array.from(result.results), []);
});


test("query coverage outranks a stronger partial lexical match", () => {
  const runtime = loadRuntime([
    {
      title: "GA4 GA4 GA4 analytics tracking",
      slug: "ga4-tracking",
      url: "https://adrock.com.br/blog/ga4-tracking",
      description: "GA4 measurement and reporting.",
      category: "Analytics e Dados",
      published_at: "2026-09-20"
    },
    {
      title: "GA4 and artificial intelligence",
      slug: "ga4-artificial-intelligence",
      url: "https://adrock.com.br/blog/ga4-artificial-intelligence",
      description: "Using artificial intelligence with GA4.",
      category: "Analytics e Dados",
      published_at: "2026-09-19"
    }
  ]);

  const result = runtime.search("GA4 artificial intelligence");
  assert.equal(result.results[0].url, "https://adrock.com.br/blog/ga4-artificial-intelligence");
  assert.equal(result.results[0].coverage, 1);
  assert.ok(result.results[1].coverage < 1);
});


test("AI and IA variants count as equivalent concepts for coverage", () => {
  const runtime = loadRuntime([
    {
      title: "GA4 com IA para análise contextual",
      slug: "ga4-ia-analise-contextual",
      url: "https://adrock.com.br/blog/ga4-ia-analise-contextual",
      description: "Inteligência artificial aplicada ao Google Analytics.",
      category: "Analytics e Dados",
      published_at: "2026-09-22"
    },
    {
      title: "AI powered ad creatives",
      slug: "ai-powered-ad-creatives",
      url: "https://adrock.com.br/blog/ai-powered-ad-creatives",
      description: "Artificial intelligence for advertising.",
      category: "Mídia e Performance",
      published_at: "2026-09-21"
    }
  ]);

  const result = runtime.search("GA4 artificial intelligence");
  assert.equal(result.results[0].url, "https://adrock.com.br/blog/ga4-ia-analise-contextual");
  assert.equal(result.results[0].coverage, 1);
});


test("search returns the canonical slug required by get_blog_article", () => {
  const runtime = loadRuntime([
    {
      title: "Google Sponsored Results nova interface",
      slug: "google-sponso%E2%80%8Bred-results-nova-interface-anuncios",
      url: "https://adrock.com.br/blog/google-sponso%E2%80%8Bred-results-nova-interface-anuncios",
      description: "Google Sponsored Results.",
      category: "Mídia e Performance",
      published_at: "2026-01-01"
    }
  ]);

  const result = runtime.search("Google Sponsored Results");
  assert.equal(result.count, 1);
  assert.equal(
    result.results[0].slug,
    "google-sponsored-results-nova-interface-anuncios",
  );
  assert.equal(
    result.results[0].url,
    "https://adrock.com.br/blog/google-sponso%E2%80%8Bred-results-nova-interface-anuncios",
  );
});
