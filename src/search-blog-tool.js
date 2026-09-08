(async function () {
  if (!("modelContext" in document)) {
    return;
  }

  if (!globalThis.AdRockBlogSearch) {
    console.error("[Ad Rock WebMCP] Blog search engine não carregado.");
    return;
  }

  try {
    await document.modelContext.registerTool({
      name: "search_blog",
      title: "Search Ad Rock blog",
      description:
        "Searches the public Ad Rock Digital Mkt blog for articles relevant to a topic or technical question. Use this tool when the user asks whether Ad Rock has articles, posts, guides or technical content about a subject.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            minLength: 2,
            maxLength: 200,
            description:
              "Search terms describing the subject the user wants to find in the Ad Rock blog."
          }
        },
        required: ["query"],
        additionalProperties: false
      },
      annotations: {
        readOnlyHint: true
      },
      execute: async ({ query }) => {
        return JSON.stringify(globalThis.AdRockBlogSearch.search(query, 5));
      }
    });

    console.info("[Ad Rock WebMCP] Tool registrada: search_blog");
  } catch (error) {
    console.error("[Ad Rock WebMCP] Erro ao registrar search_blog:", error);
  }
})();
