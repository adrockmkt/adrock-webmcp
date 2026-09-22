import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowPath = new URL("../.github/workflows/sync-blog-index.yml", import.meta.url);

test("automated sync supports manual and scheduled execution", async () => {
  const workflow = await readFile(workflowPath, "utf8");
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /cron:/);
});

test("automated sync has repository write permission and concurrency protection", async () => {
  const workflow = await readFile(workflowPath, "utf8");
  assert.match(workflow, /contents:\s*write/);
  assert.match(workflow, /group:\s*webmcp-blog-index-sync/);
  assert.match(workflow, /cancel-in-progress:\s*false/);
});

test("automated sync tests, generates and validates before commit", async () => {
  const workflow = await readFile(workflowPath, "utf8");
  const tests = workflow.indexOf("Run index generator tests");
  const generate = workflow.indexOf("Generate public blog index");
  const validate = workflow.indexOf("Validate generated index");
  const commit = workflow.indexOf("Commit updated index");

  assert.ok(tests >= 0 && generate > tests && validate > generate && commit > validate);
  assert.match(workflow, /git status --porcelain -- data\/blog-index\.generated\.json/);
  assert.match(workflow, /if: steps\.changes\.outputs\.changed == 'true'/);
});


test("change detection includes an untracked first generated index", async () => {
  const workflow = await readFile(workflowPath, "utf8");
  assert.match(workflow, /git status --porcelain/);
  assert.doesNotMatch(workflow, /git diff --quiet -- data\/blog-index\.generated\.json/);
});
