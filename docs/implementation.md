# Implementação no Framer

## Configuração utilizada

Custom Code do Framer:

```text
Name: Ad Rock WebMCP POC v0.1
Placement: End of <body>
Page: All
Run: Once
```

O nome histórico do snippet foi preservado no Framer durante os testes. O baseline validado corresponde à v0.3.

## v0.3

A baseline utiliza apenas `src/adrock-webmcp.js` dentro de uma tag `script`.

## v0.4

A v0.4 adiciona a busca client-side do blog sem alterar as três tools já validadas.

A ordem de carregamento deve ser:

```text
1. src/blog-search.js
2. src/adrock-webmcp.js
3. src/search-blog-tool.js
```

No Framer, os três conteúdos podem ser concatenados dentro do mesmo bloco:

```html
<script>
  // conteúdo de src/blog-search.js
  // conteúdo de src/adrock-webmcp.js
  // conteúdo de src/search-blog-tool.js
</script>
```

`blog-search.js` precisa vir primeiro porque disponibiliza `globalThis.AdRockBlogSearch`, utilizado por `search-blog-tool.js`.

## Índice

`data/blog-index.json` mantém uma representação auditável do conjunto de posts usado na busca.

O runtime da v0.4 contém o mesmo conjunto de dados embarcado em `src/blog-search.js`, evitando `fetch()`, CORS e dependências externas durante a POC.

## Tools registradas

### get_company_information

Retorna informações públicas sobre a empresa, localização e áreas de atuação.

### get_services

Retorna os principais serviços da Ad Rock com categoria, descrição e URL pública relacionada.

### get_contact_information

Retorna canais públicos de contato comercial, WhatsApp, telefone, página de contato, Calendly e contato de privacidade.

### search_blog

Recebe:

```json
{
  "query": "GA4 artificial intelligence"
}
```

O schema exige uma string entre 2 e 200 caracteres.

A busca normaliza texto, remove acentos, tokeniza a consulta e aplica ranking determinístico em título, tópicos, descrição e slug.

O retorno contém até cinco resultados.

## Segurança

As quatro tools usam `readOnlyHint: true`.

`search_blog` consulta apenas um índice público curado e não executa chamadas de rede, escrita, navegação ou transações.
