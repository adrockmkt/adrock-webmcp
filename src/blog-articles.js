(function () {
  const BASE_URL = "https://adrockmkt.github.io/adrock-webmcp";
  const MANIFEST_URL = `${BASE_URL}/blog-articles-manifest.json`;
  const PUBLIC_ARTICLE_ORIGIN = "https://adrock.com.br";
  let manifestPromise;

  function validSlug(slug) {
    return typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  }

  function validPublicArticleUrl(url) {
    if (typeof url !== "string") return false;
    try {
      const parsed = new URL(url);
      return parsed.origin === PUBLIC_ARTICLE_ORIGIN && parsed.pathname.startsWith("/blog/");
    } catch {
      return false;
    }
  }

  function validNonNegativeInteger(value) {
    return Number.isSafeInteger(value) && value >= 0;
  }

  function validManifestEntry(entry) {
    return Boolean(
      entry &&
      validSlug(entry.slug) &&
      validPublicArticleUrl(entry.url) &&
      entry.path === `blog-articles/${entry.slug}.json` &&
      validNonNegativeInteger(entry.content_length) &&
      validNonNegativeInteger(entry.content_bytes)
    );
  }

  function validateManifest(manifest) {
    if (
      !manifest ||
      manifest.schema_version !== 1 ||
      !Number.isSafeInteger(manifest.article_count) ||
      manifest.article_count < 0 ||
      !Array.isArray(manifest.articles) ||
      manifest.article_count !== manifest.articles.length
    ) {
      throw new Error("Invalid article manifest");
    }

    const seen = new Set();
    for (const entry of manifest.articles) {
      if (!validManifestEntry(entry) || seen.has(entry.slug)) {
        throw new Error("Invalid article manifest");
      }
      seen.add(entry.slug);
    }
    return manifest;
  }

  async function loadManifest() {
    if (!manifestPromise) {
      manifestPromise = fetch(MANIFEST_URL, { credentials: "omit" }).then(async (response) => {
        if (!response.ok) throw new Error(`Article manifest unavailable (HTTP ${response.status})`);
        return validateManifest(await response.json());
      }).catch((error) => {
        manifestPromise = undefined;
        throw error;
      });
    }
    return manifestPromise;
  }

  async function get(slug) {
    if (!validSlug(slug)) {
      throw new Error("Invalid article slug");
    }

    const manifest = await loadManifest();
    const entry = manifest.articles.find((article) => article.slug === slug);
    if (!entry) {
      throw new Error("Unknown article slug");
    }

    const expectedPath = `blog-articles/${slug}.json`;
    if (entry.path !== expectedPath) {
      throw new Error("Invalid article manifest path");
    }

    const response = await fetch(`${BASE_URL}/${expectedPath}`, { credentials: "omit" });
    if (!response.ok) {
      throw new Error(`Article artifact unavailable (HTTP ${response.status})`);
    }

    const article = await response.json();
    if (
      !article ||
      article.slug !== slug ||
      article.url !== entry.url ||
      !validPublicArticleUrl(article.url) ||
      typeof article.content !== "string" ||
      !article.content.trim() ||
      article.content.length !== entry.content_length ||
      new TextEncoder().encode(article.content).length !== entry.content_bytes ||
      article.content_length !== entry.content_length ||
      article.content_bytes !== entry.content_bytes
    ) {
      throw new Error("Invalid article artifact");
    }

    return article;
  }

  globalThis.AdRockBlogArticles = Object.freeze({ get });
})();