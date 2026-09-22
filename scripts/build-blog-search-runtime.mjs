import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export function renderBlogSearchRuntime(index) {
  if (!Array.isArray(index) || index.length === 0) {
    throw new Error("Blog index must be a non-empty array.");
  }

  const serializedIndex = JSON.stringify(index, null, 2);

  return `(function (global) {
  const BLOG_INDEX = ${serializedIndex};

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\\u0300-\\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  const TOKEN_ALIASES = Object.freeze({
    ai: ["ai", "ia", "artificial", "intelligence", "inteligencia"],
    ia: ["ia", "ai", "artificial", "intelligence", "inteligencia"],
    artificial: ["artificial", "ai", "ia"],
    intelligence: ["intelligence", "inteligencia", "ai", "ia"],
    inteligencia: ["inteligencia", "intelligence", "ia", "ai"]
  });

  function tokenize(value) {
    return [...new Set(normalize(value).split(/\\s+/).filter((token) => token.length >= 2))];
  }

  function tokenMatches(haystack, token) {
    const variants = TOKEN_ALIASES[token] || [token];
    return variants.some((variant) => haystack.includes(variant));
  }

  function fieldScore(field, tokens, weight) {
    const normalizedField = normalize(field);
    return tokens.reduce((score, token) => score + (normalizedField.includes(token) ? weight : 0), 0);
  }

  function searchableText(post) {
    return normalize([post.title, post.category, post.description, post.slug].filter(Boolean).join(" "));
  }

  function tokenCoverage(post, tokens) {
    if (!tokens.length) return 0;
    const haystack = searchableText(post);
    const matched = tokens.filter((token) => tokenMatches(haystack, token)).length;
    return matched / tokens.length;
  }

  function calculateScore(post, query, tokens) {
    const normalizedQuery = normalize(query);
    const normalizedTitle = normalize(post.title);
    const normalizedCategory = normalize(post.category);

    let score = 0;
    score += fieldScore(post.title, tokens, 5);
    score += fieldScore(post.category, tokens, 4);
    score += fieldScore(post.description, tokens, 2);
    score += fieldScore(post.slug, tokens, 1);

    if (normalizedQuery && normalizedTitle.includes(normalizedQuery)) score += 8;
    if (normalizedQuery && normalizedCategory.includes(normalizedQuery)) score += 6;

    return score;
  }

  function searchBlog(query, limit = 5) {
    const cleanQuery = String(query || "").trim();

    if (cleanQuery.length < 2) {
      return { query: cleanQuery, count: 0, results: [], error: "Query must contain at least 2 characters." };
    }

    const tokens = tokenize(cleanQuery);
    const ranked = BLOG_INDEX
      .map((post) => ({
        post,
        coverage: tokenCoverage(post, tokens),
        rawScore: calculateScore(post, cleanQuery, tokens)
      }))
      .filter((item) => item.rawScore > 0)
      .sort((a, b) => {
        if (b.coverage !== a.coverage) return b.coverage - a.coverage;
        if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
        return b.post.published_at.localeCompare(a.post.published_at);
      })
      .slice(0, limit);

    const maxScore = ranked.length ? ranked[0].rawScore : 0;
    const results = ranked.map(({ post, rawScore, coverage }) => ({
      title: post.title,
      url: post.url,
      description: post.description,
      category: post.category,
      published_at: post.published_at,
      coverage: Number(coverage.toFixed(3)),
      score: maxScore ? Number((rawScore / maxScore).toFixed(3)) : 0
    }));

    return { query: cleanQuery, count: results.length, results };
  }

  global.AdRockBlogSearch = Object.freeze({
    index: BLOG_INDEX,
    normalize,
    tokenize,
    tokenMatches,
    tokenCoverage,
    search: searchBlog
  });
})(globalThis);
`;
}

export async function buildBlogSearchRuntime({
  indexPath = "data/blog-index.generated.json",
  outputPath = "src/blog-search.generated.js"
} = {}) {
  const index = JSON.parse(await readFile(indexPath, "utf8"));
  const runtime = renderBlogSearchRuntime(index);
  await writeFile(outputPath, runtime, "utf8");
  return { output: outputPath, indexed_count: index.length };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await buildBlogSearchRuntime(), null, 2));
}
