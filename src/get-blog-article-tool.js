(async function () {
  if (!("modelContext" in document)) {
    return;
  }

  if (!globalThis.AdRockBlogArticles) {
    console.error("[Ad Rock WebMCP] Article retrieval runtime não carregado.");
    return;
  }

  try {
    await document.modelContext.registerTool({
      name: "get_blog_article",
      title: "Get Ad Rock blog article",
      description:
        "Retrieves the normalized public content of a specific Ad Rock blog article by slug. Use after search_blog when the article body is needed to answer a question accurately from Ad Rock's published content.",
      inputSchema: {
        type: "object",
        properties: {
          slug: {
            type: "string",
            pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
            description:
              "Canonical article slug returned by search_blog."
          }
        },
        required: ["slug"],
        additionalProperties: false
      },
      annotations: {
        readOnlyHint: true
      },
      execute: async ({ slug }) => {
        return JSON.stringify(await globalThis.AdRockBlogArticles.get(slug));
      }
    });

    console.info("[Ad Rock WebMCP] Tool registrada: get_blog_article");
  } catch (error) {
    console.error("[Ad Rock WebMCP] Erro ao registrar get_blog_article:", error);
  }
})();