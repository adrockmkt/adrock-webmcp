# Ad Rock WebMCP

POC técnica para tornar o site da Ad Rock Digital Mkt compatível com agentes que suportam WebMCP.

## Estado atual

Baseline validada em produção: `v0.3`

Versão em implementação e validação: `v0.4`

A implementação usa Framer Basic e Custom Code, sem backend próprio.

Tools:

- `get_company_information`
- `get_services`
- `get_contact_information`
- `search_blog(query)` na v0.4

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

A busca do blog da v0.4 permanece client-side. Um índice curado de posts é embarcado no runtime e pesquisado por ranking determinístico, sem API externa, embeddings ou backend.

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

`src/adrock-webmcp.js` preserva a baseline v0.3. A v0.4 é uma extensão composta por `blog-search.js` e `search-blog-tool.js`.

## Ordem de carregamento da v0.4

No Custom Code do Framer, os arquivos devem ser concatenados nesta ordem dentro do mesmo `<script>`:

```text
src/blog-search.js
src/adrock-webmcp.js
src/search-blog-tool.js
```

Assim o mecanismo de busca é inicializado antes do registro da tool `search_blog`.

## Validações concluídas na v0.3

- Registro das tools
- Discovery via `document.modelContext.getTools()`
- Execução manual via `document.modelContext.executeTool()`
- Detecção pelo Model Context Tool Inspector
- Seleção automática de tool por intenção
- Execução de múltiplas tools no mesmo prompt
- Composição dos resultados pelo agente

## Critérios de validação da v0.4

- Discovery de `search_blog`
- Schema com `query` obrigatório
- Execução manual com resultado relevante
- Execução manual sem resultado
- Seleção automática pelo agente
- Preservação das três tools da v0.3

## Status

POC v0.3 funcional e validada em setembro de 2026. A v0.4 está implementada no repositório e aguarda validação no Framer e no Model Context Tool Inspector.
