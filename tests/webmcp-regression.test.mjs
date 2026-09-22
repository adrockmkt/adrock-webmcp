import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import fs from "node:fs";

const companySource = fs.readFileSync(new URL("../src/adrock-webmcp.js", import.meta.url), "utf8");
const searchToolSource = fs.readFileSync(new URL("../src/search-blog-tool.js", import.meta.url), "utf8");

function createModelContext() {
  const tools = [];
  return {
    tools,
    async registerTool(tool) {
      tools.push(tool);
    },
    async getTools() {
      return tools;
    }
  };
}

async function settle() {
  await new Promise(resolve => setTimeout(resolve, 0));
}

test("registers the three v0.3 read-only tools", async () => {
  const modelContext = createModelContext();
  const context = vm.createContext({
    document: { modelContext },
    console
  });

  vm.runInContext(companySource, context);
  await settle();

  assert.deepEqual(
    modelContext.tools.map(tool => tool.name),
    ["get_company_information", "get_services", "get_contact_information"]
  );

  for (const tool of modelContext.tools) {
    assert.equal(tool.annotations?.readOnlyHint, true);
    assert.equal(tool.inputSchema?.additionalProperties, false);
  }
});

test("static tools still execute and return structured JSON", async () => {
  const modelContext = createModelContext();
  const context = vm.createContext({
    document: { modelContext },
    console
  });

  vm.runInContext(companySource, context);
  await settle();

  for (const tool of modelContext.tools) {
    const payload = JSON.parse(await tool.execute({}));
    assert.equal(typeof payload, "object");
    assert.ok(payload);
  }
});

test("search_blog preserves its public query contract and executes runtime search", async () => {
  const modelContext = createModelContext();
  const calls = [];
  const context = vm.createContext({
    document: { modelContext },
    console,
    AdRockBlogSearch: {
      search(query, limit) {
        calls.push({ query, limit });
        return { query, count: 1, results: [{ title: "Example" }] };
      }
    }
  });

  vm.runInContext(searchToolSource, context);
  await settle();

  assert.equal(modelContext.tools.length, 1);
  const tool = modelContext.tools[0];
  assert.equal(tool.name, "search_blog");
  assert.deepEqual(Array.from(tool.inputSchema.required), ["query"]);
  assert.equal(tool.inputSchema.additionalProperties, false);
  assert.equal(tool.annotations?.readOnlyHint, true);

  const payload = JSON.parse(await tool.execute({ query: "GA4 artificial intelligence" }));
  assert.equal(payload.count, 1);
  assert.deepEqual(calls, [{ query: "GA4 artificial intelligence", limit: 5 }]);
});

test("search_blog fails closed when the external search runtime is unavailable", async () => {
  const modelContext = createModelContext();
  const errors = [];
  const context = vm.createContext({
    document: { modelContext },
    console: {
      info() {},
      error(...args) {
        errors.push(args);
      }
    }
  });

  vm.runInContext(searchToolSource, context);
  await settle();

  assert.equal(modelContext.tools.length, 0);
  assert.ok(errors.some(args => String(args[0]).includes("Blog search engine não carregado")));
});

test("WebMCP scripts do not register tools when modelContext is unavailable", async () => {
  const context = vm.createContext({
    document: {},
    console
  });

  vm.runInContext(companySource, context);
  vm.runInContext(searchToolSource, context);
  await settle();

  assert.equal("modelContext" in context.document, false);
});
