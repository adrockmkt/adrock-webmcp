import test from "node:test";
import assert from "node:assert/strict";
import { extractArticleContent, fetchArticleContent } from "../scripts/extract-blog-content.mjs";

test("extracts editorial article text and removes layout/scripts", () => {
  const html = `<!doctype html><html><body>
    <header>Global navigation</header>
    <main><article>
      <h1>GA4 auditing</h1>
      <p>This is the first substantive paragraph about analytics and tracking.</p>
      <h2>Implementation</h2>
      <p>This is the second substantive paragraph with enough editorial content for extraction.</p>
      <ul><li>Validate events</li><li>Validate conversions</li></ul>
      <script>window.secret = "not editorial"</script>
    </article></main>
    <footer>Global footer</footer>
  </body></html>`;
  const content = extractArticleContent(html);
  assert.match(content, /GA4 auditing/);
  assert.match(content, /Validate events/);
  assert.doesNotMatch(content, /Global navigation/);
  assert.doesNotMatch(content, /window\.secret/);
  assert.doesNotMatch(content, /Global footer/);
});

test("prefers the richer editorial candidate", () => {
  const html = `<main>
    <article><h1>Short card</h1><p>Short text.</p></article>
    <article><h1>Full article</h1>
      <p>${"Editorial paragraph ".repeat(20)}</p>
      <p>${"Second paragraph ".repeat(20)}</p>
    </article>
  </main>`;
  const content = extractArticleContent(html);
  assert.match(content, /Full article/);
  assert.doesNotMatch(content, /^Short card/);
});

test("falls back from h1 when semantic containers are absent", () => {
  const html = `<body><div>Menu</div><h1>Article title</h1>
    <div><p>${"Useful body text ".repeat(20)}</p></div><footer>Footer</footer></body>`;
  const content = extractArticleContent(html);
  assert.match(content, /^Article title/);
  assert.match(content, /Useful body text/);
  assert.doesNotMatch(content, /Menu/);
  assert.doesNotMatch(content, /Footer/);
});

test("rejects non-Ad-Rock and non-blog URLs before fetching", async () => {
  let called = false;
  const fakeFetch = async () => { called = true; };
  await assert.rejects(() => fetchArticleContent("https://example.com/blog/test", fakeFetch), /Only public Ad Rock blog URLs/);
  await assert.rejects(() => fetchArticleContent("https://adrock.com.br/contato", fakeFetch), /Only public Ad Rock blog URLs/);
  assert.equal(called, false);
});

test("reports HTTP failures explicitly", async () => {
  const fakeFetch = async () => ({ ok: false, status: 503 });
  await assert.rejects(
    () => fetchArticleContent("https://adrock.com.br/blog/test", fakeFetch),
    /HTTP 503/,
  );
});
