(function () {
  const BASE_URL = "https://adrockmkt.github.io/adrock-webmcp";
  const MANIFEST_URL = `${BASE_URL}/blog-articles-manifest.json`;
  let manifestPromise;

  function validSlug(slug) {
    return typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  }

  async function loadManifest() {
    if (!manifestPromise) {
      manifestPromise = fetch(MANIFEST_URL, { credentials: "omit" }).then(async (response) => {
        if (!response.ok) throw new Error(`Article manifest unavailable (HTTP ${response.status})`);
        const manifest = await response.json();
        if (!manifest || manifest.schema_version !== 1 || !Array.isArray(manifest.articles)) {
          throw new Error("Invalid article manifest");
        }
        return manifest;
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
    if (!article || article.slug !== slug || article.url !== entry.url || typeof article.content !== "string") {
      throw new Error("Invalid article artifact");
    }

    return article;
  }

  globalThis.AdRockBlogArticles = Object.freeze({ get });
})();