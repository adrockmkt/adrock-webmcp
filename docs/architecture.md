# Arquitetura

## Objetivo

Adicionar uma camada WebMCP ao site da Ad Rock sem depender de acesso ao servidor do Framer.

## Modelo atual

A implementação é client-side e utiliza Custom Code do Framer.

```text
Browser
  ↓
adrock.com.br
  ↓
Framer runtime
  ↓
Custom Code
  ↓
document.modelContext.registerTool()
```

## Baseline v0.3

A v0.3 utiliza apenas tools read-only com dados públicos e estáticos:

```text
get_company_information()
get_services()
get_contact_information()
```

Essa escolha reduz dependências e evita backend, autenticação ou persistência.

## Extensão v0.4

A v0.4 introduz:

```text
search_blog({ query })
```

Fluxo:

```text
User intent
   ↓
Agent
   ↓
search_blog({ query })
   ↓
WebMCP
   ↓
client-side curated index
   ↓
deterministic ranking
   ↓
top 5 structured results
   ↓
Agent synthesis
```

O índice é embarcado no runtime para evitar chamadas de rede, CORS, disponibilidade de API e dependência de endpoints internos do Framer.

## Componentes da v0.4

```text
data/blog-index.json
        ↓ referência auditável
src/blog-search.js
        ↓ mecanismo client-side
src/search-blog-tool.js
        ↓ registro WebMCP
src/adrock-webmcp.js
        ↓ baseline v0.3 preservada
```

A ordem de runtime é:

```text
blog-search.js
adrock-webmcp.js
search-blog-tool.js
```

## Ranking

A busca é determinística e não utiliza embeddings ou chamadas a modelos externos.

Pesos iniciais:

```text
title        5
topics       4
description  2
slug         1
```

Há bônus adicionais para correspondência da consulta completa no título ou nos tópicos.

Os resultados são limitados aos cinco itens mais relevantes.

## Feature detection

Os scripts só registram tools quando `document.modelContext` está disponível.

Quando WebMCP não está disponível, o site continua funcionando normalmente.

`search-blog-tool.js` também verifica se `globalThis.AdRockBlogSearch` foi inicializado antes de registrar a nova tool.

## Segurança

Todas as tools continuam read-only.

`search_blog` opera apenas sobre conteúdo público curado e não modifica estado, não executa transações e não envia dados para serviços externos.

## Limitações atuais

- WebMCP ainda é experimental.
- O índice de blog precisa ser atualizado quando novos posts forem adicionados.
- A v0.4 não pesquisa o CMS completo em tempo real.
- Não existem ações transacionais.
- A sincronização automática entre CMS e índice fica fora do escopo desta versão.

## Evolução futura

Após validação da v0.4, possíveis evoluções incluem:

1. automatizar a atualização do índice de blog;
2. instrumentar chamadas WebMCP no GA4;
3. avaliar filtros adicionais de busca somente se houver necessidade real;
4. introduzir backend apenas para capacidades que exigirem dados dinâmicos ou ações com side effects.
