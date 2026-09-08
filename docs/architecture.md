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

## Decisão arquitetural

A v0.3 utiliza apenas tools read-only com dados públicos e estáticos.

Essa escolha reduz dependências e evita a necessidade de backend, autenticação ou persistência.

## Feature detection

O script só registra as tools quando `document.modelContext` está disponível.

Quando WebMCP não está disponível, o site continua funcionando normalmente.

## Limitações atuais

- WebMCP ainda é experimental.
- As informações da v0.3 são definidas no código e precisam ser atualizadas manualmente quando os dados públicos mudarem.
- Não existe busca dinâmica no CMS do Framer.
- Não existem ações transacionais.

## Evolução prevista

A próxima etapa técnica será uma tool `search_blog(query)` com entrada validada por schema.
