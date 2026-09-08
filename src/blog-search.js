(function (global) {
  const BLOG_INDEX = [
    {
      title: "GA4, GTM, MCP e o Futuro da Mensuração com IA: O Que Mudou e Como se Preparar",
      slug: "ga4-mcp-google-analytics-mensuracao-ia",
      url: "https://adrock.com.br/blog/ga4-mcp-google-analytics-mensuracao-ia",
      description: "Como a IA está transformando o GA4, GTM e Search Console, com foco em MCP, mensuração e novas jornadas digitais.",
      topics: ["GA4", "Google Analytics 4", "GTM", "Google Tag Manager", "MCP", "Artificial Intelligence", "IA", "Analytics", "Measurement"],
      published_at: "2025-08-15"
    },
    {
      title: "Como dominar relatórios, atribuição e automação no GA4 com IA e Python",
      slug: "ga4-relatorios-atribuicao-automacao-ia",
      url: "https://adrock.com.br/blog/ga4-relatorios-atribuicao-automacao-ia",
      description: "Guia sobre relatórios estratégicos, atribuição e automação de análises usando GA4, IA, API e Python.",
      topics: ["GA4", "Google Analytics 4", "Artificial Intelligence", "IA", "Python", "Automation", "Automação", "Attribution", "Analytics"],
      published_at: "2025-11-06"
    },
    {
      title: "De bot de consultas a analista com IA: a evolução do GA4 Assistant Bot com RAG",
      slug: "evolucao-ga4-assistant-bot-rag",
      url: "https://adrock.com.br/blog/evolucao-ga4-assistant-bot-rag",
      description: "Evolução do GA4 Assistant Bot com RAG para transformar dados do Google Analytics em análises inteligentes baseadas em contexto real.",
      topics: ["GA4", "Google Analytics 4", "Artificial Intelligence", "IA", "RAG", "Assistant", "Automation", "Analytics"],
      published_at: "2026-04-16"
    },
    {
      title: "Google Tag (GT-): o que muda na implementação e como isso impacta GA4 e Google Ads",
      slug: "google-tag-gt-implementacao-ga4-google-ads",
      url: "https://adrock.com.br/blog/google-tag-gt-implementacao-ga4-google-ads",
      description: "Explica a consolidação da Google Tag, a integração com GA4 e Google Ads e os impactos técnicos na implementação de tracking.",
      topics: ["GA4", "Google Analytics 4", "Google Tag", "GTM", "Google Ads", "Tracking", "Analytics"],
      published_at: "2026-04-14"
    },
    {
      title: "Checklist de Auditoria GA4 2026: o framework técnico completo da Ad Rock para analytics, IA e tracking moderno",
      slug: "checklist-auditoria-ga4-2026",
      url: "https://adrock.com.br/blog/checklist-auditoria-ga4-2026",
      description: "Framework técnico para auditoria de GA4, GTM, IA, automação, mídia paga, tracking e governança de dados.",
      topics: ["GA4", "Google Analytics 4", "Audit", "Auditoria", "Artificial Intelligence", "IA", "GTM", "Tracking", "Governance", "Analytics"],
      published_at: "2026-05-20"
    },
    {
      title: "Guia oficial do Google para AI Search: o que realmente importa para otimizar sites para IA",
      slug: "guia-oficial-google-ai-search-seo",
      url: "https://adrock.com.br/blog/guia-oficial-google-ai-search-seo",
      description: "Análise do guia oficial do Google para AI Search, com fundamentos de SEO técnico, conteúdo útil, renderização, entidades e GEO.",
      topics: ["SEO", "AI Search", "Artificial Intelligence", "IA", "Google", "GEO", "AI Overviews", "Technical SEO"],
      published_at: "2026-06-05"
    },
    {
      title: "Search Console ganha relatório de AI Search: Google passa a mostrar dados de AI Mode e experiências generativas",
      slug: "search-console-relatorio-ai-search-ai-mode",
      url: "https://adrock.com.br/blog/search-console-relatorio-ai-search-ai-mode",
      description: "Explica os relatórios de AI Search e AI Mode no Search Console e o impacto da mensuração de experiências generativas para SEO.",
      topics: ["Google Search Console", "AI Search", "AI Mode", "Artificial Intelligence", "IA", "SEO", "Measurement", "Analytics"],
      published_at: "2026-06-10"
    },
    {
      title: "O Google acabou de revelar acidentalmente como seus sistemas de busca por IA realmente funcionam",
      slug: "como-funciona-o-ranqueamento-da-ia-do-google",
      url: "https://adrock.com.br/blog/como-funciona-o-ranqueamento-da-ia-do-google",
      description: "Análise técnica do pipeline de ranqueamento da IA do Google, incluindo sinais de ranking, discovery e impacto no SEO.",
      topics: ["SEO", "Google", "Artificial Intelligence", "IA", "AI Search", "Ranking", "Discovery", "Technical SEO"],
      published_at: "2026-02-12"
    }
  ];

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function tokenize(value) {
    return [...new Set(normalize(value).split(/\s+/).filter((token) => token.length >= 2))];
  }

  function fieldScore(field, tokens, weight) {
    const normalizedField = normalize(field);
    return tokens.reduce((score, token) => score + (normalizedField.includes(token) ? weight : 0), 0);
  }

  function calculateScore(post, query, tokens) {
    const normalizedQuery = normalize(query);
    const normalizedTitle = normalize(post.title);
    const normalizedTopics = normalize(post.topics.join(" "));

    let score = 0;
    score += fieldScore(post.title, tokens, 5);
    score += fieldScore(post.topics.join(" "), tokens, 4);
    score += fieldScore(post.description, tokens, 2);
    score += fieldScore(post.slug, tokens, 1);

    if (normalizedQuery && normalizedTitle.includes(normalizedQuery)) {
      score += 8;
    }

    if (normalizedQuery && normalizedTopics.includes(normalizedQuery)) {
      score += 6;
    }

    return score;
  }

  function searchBlog(query, limit = 5) {
    const cleanQuery = String(query || "").trim();

    if (cleanQuery.length < 2) {
      return {
        query: cleanQuery,
        count: 0,
        results: [],
        error: "Query must contain at least 2 characters."
      };
    }

    const tokens = tokenize(cleanQuery);

    const ranked = BLOG_INDEX
      .map((post) => ({
        post,
        rawScore: calculateScore(post, cleanQuery, tokens)
      }))
      .filter((item) => item.rawScore > 0)
      .sort((a, b) => {
        if (b.rawScore !== a.rawScore) {
          return b.rawScore - a.rawScore;
        }
        return b.post.published_at.localeCompare(a.post.published_at);
      })
      .slice(0, limit);

    const maxScore = ranked.length ? ranked[0].rawScore : 0;

    const results = ranked.map(({ post, rawScore }) => ({
      title: post.title,
      url: post.url,
      description: post.description,
      topics: post.topics,
      published_at: post.published_at,
      score: maxScore ? Number((rawScore / maxScore).toFixed(3)) : 0
    }));

    return {
      query: cleanQuery,
      count: results.length,
      results
    };
  }

  global.AdRockBlogSearch = Object.freeze({
    index: BLOG_INDEX,
    normalize,
    tokenize,
    search: searchBlog
  });
})(globalThis);
