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
