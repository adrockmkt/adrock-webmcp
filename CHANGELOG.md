# Changelog

## v0.4

- Adicionada `search_blog(query)` como primeira tool com parâmetro de entrada.
- Adicionado índice curado de posts em `data/blog-index.json`.
- Adicionado mecanismo de busca determinístico client-side em `src/blog-search.js`.
- Adicionado registro WebMCP isolado em `src/search-blog-tool.js`.
- Busca limitada aos cinco resultados mais relevantes.
- Mantida arquitetura sem backend e sem dependências externas em runtime.
- Validação em produção ainda pendente.

## v0.3

- Adicionada `get_contact_information`.
- Validada seleção automática de múltiplas tools por agente.
- Validada composição de resultados entre empresa, serviços e contato.

## v0.2

- Adicionada `get_services`.
- Validado retorno estruturado do portfólio de serviços.

## v0.1

- Implementada `get_company_information`.
- Validado registro, discovery e execução via WebMCP no Framer Basic.
