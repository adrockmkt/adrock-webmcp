import assert from "node:assert/strict";
import test from "node:test";

import { discoverBlogUrls, extractLocValues } from "../scripts/discover-blog-urls.mjs";

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<urlset>
  <url><loc>https://adrock.com.br/</loc></url>
  <url><loc>https://adrock.com.br/blog</loc></url>
  <url><loc>https://adrock.com.br/blog/post-b</loc></url>
  <url><loc>https://adrock.com.br/blog/post-a?utm_source=test</loc></url>
  <url><loc>https://adrock.com.br/blog/post-b#section</loc></url>
  <url><loc>https://example.com/blog/external</loc></url>
  <url><loc>not-a-url</loc></url>
</urlset>`;

test("extractLocValues reads sitemap loc entries", () => {
  assert.equal(extractLocValues(SAMPLE).length, 7);
});

test("discoverBlogUrls keeps only unique published Ad Rock blog article URLs", () => {
  assert.deepEqual(discoverBlogUrls(SAMPLE), [
    "https://adrock.com.br/blog/post-a",
    "https://adrock.com.br/blog/post-b",
  ]);
});

test("discoverBlogUrls is deterministic regardless of sitemap order", () => {
  const reversed = `<urlset>
    <url><loc>https://adrock.com.br/blog/zeta</loc></url>
    <url><loc>https://adrock.com.br/blog/alpha</loc></url>
  </urlset>`;

  assert.deepEqual(discoverBlogUrls(reversed), [
    "https://adrock.com.br/blog/alpha",
    "https://adrock.com.br/blog/zeta",
  ]);
});
