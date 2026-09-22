import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildFramerSnippet } from "../scripts/build-framer-snippet.mjs";

test("builds one Framer script from the validated runtime and WebMCP tools", async () => {
  const dir = await mkdtemp(join(tmpdir(), "adrock-webmcp-"));
  const output = join(dir, "framer.html");

  const result = await buildFramerSnippet({ outputPath: output });
  const content = await readFile(output, "utf8");

  assert.equal(result.source_count, 3);
  assert.ok(content.startsWith("<script>"));
  assert.ok(content.trimEnd().endsWith("</script>"));

  for (const marker of [
    "AdRockBlogSearch",
    "get_company_information",
    "get_services",
    "get_contact_information",
    "search_blog"
  ]) {
    assert.ok(content.includes(marker), `missing marker: ${marker}`);
  }
});

test("keeps runtime and tool registration in deployment order", async () => {
  const dir = await mkdtemp(join(tmpdir(), "adrock-webmcp-"));
  const output = join(dir, "framer.html");

  await buildFramerSnippet({ outputPath: output });
  const content = await readFile(output, "utf8");

  const runtime = content.indexOf("AdRockBlogSearch");
  const company = content.indexOf('name: "get_company_information"');
  const search = content.indexOf('name: "search_blog"');

  assert.ok(runtime >= 0);
  assert.ok(company > runtime);
  assert.ok(search > company);
});
