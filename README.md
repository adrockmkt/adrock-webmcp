# Ad Rock WebMCP

POC técnica para tornar o site da Ad Rock Digital Mkt compatível com agentes que suportam WebMCP.

## Estado atual

Baseline validada em produção: `v0.4`

A implementação usa Framer Basic e Custom Code, sem backend próprio.

Tools:

- `get_company_information`
- `get_services`
- `get_contact_information`
- `search_blog(query)`

Todas são read-only e utilizam `readOnlyHint: true`.

## Arquitetura

```text
Agente compatível
       ↓
Chrome com WebMCP
       ↓
adrock.com.br
       ↓
Framer Basic
       ↓
Custom Code
       ↓
document.modelContext
       ↓
get_company_information()
get_services()
get_contact_information()
search_blog({ query })
```

A busca do blog permanece client-side. Um índice curado de posts é embarcado no runtime e pesquisado por ranking determinístico, sem API externa, embeddings ou backend.

## Busca do blog

A primeira versão recebe somente:

```json
{
  "query": "GA4 artificial intelligence"
}
```

O ranking considera:

- título: peso 5
- tópicos: peso 4
- descrição: peso 2
- slug: peso 1
- bônus para correspondência da consulta completa

A tool devolve no máximo cinco resultados, com título, URL, descrição, tópicos, data e score relativo.

## Estrutura

```text
adrock-webmcp/
├── README.md
├── CHANGELOG.md
├── data/
│   └── blog-index.json
├── src/
│   ├── adrock-webmcp.js
│   ├── blog-search.js
│   └── search-blog-tool.js
├── docs/
│   ├── architecture.md
│   ├── implementation.md
│   └── testing.md
└── examples/
    └── agent-trace.md
```

`src/adrock-webmcp.js` preserva a baseline funcional das três tools estáticas. A v0.4 adiciona `blog-search.js` e `search-blog-tool.js` como extensão parametrizada.

## Ordem de carregamento da v0.4

No Custom Code do Framer, os arquivos são concatenados nesta ordem dentro do mesmo `<script>`:

```text
src/blog-search.js
src/adrock-webmcp.js
src/search-blog-tool.js
```

Assim o mecanismo de busca é inicializado antes do registro da tool `search_blog`.

## Validações concluídas

- Registro das quatro tools
- Discovery via `document.modelContext.getTools()` com `length: 4`
- Execução manual via `document.modelContext.executeTool()`
- Detecção pelo Model Context Tool Inspector
- Seleção automática das tools estáticas por intenção
- Execução de múltiplas tools no mesmo prompt
- Composição dos resultados pelo agente
- Schema obrigatório com parâmetro `query` em `search_blog`
- Execução manual de busca com cinco resultados relevantes
- Execução manual sem resultado com `count: 0` e `results: []`
- Seleção automática de `search_blog` pelo agente
- Geração automática da query `GA4 artificial intelligence`
- Síntese dos artigos em linguagem natural
- Preservação das três tools anteriores sem regressão

## Teste de agente validado na v0.4

Prompt enviado após Reset no Inspector:

```text
Does Ad Rock have any articles about GA4 and artificial intelligence?
```

Trace observado:

```text
AI calling tool "search_blog" with {"query":"GA4 artificial intelligence"}
```

A tool retornou cinco artigos e o agente utilizou esse payload para produzir uma resposta com títulos, links e síntese temática.

## Status

POC v0.4 funcional e validada em produção em 8 de setembro de 2026.
