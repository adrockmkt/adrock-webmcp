# Changelog

## v0.4

- Adicionada `search_blog(query)` como primeira tool com parâmetro de entrada.
- Adicionado índice curado de posts em `data/blog-index.json`.
- Adicionado mecanismo de busca determinístico client-side em `src/blog-search.js`.
- Adicionado registro WebMCP isolado em `src/search-blog-tool.js`.
- Busca limitada aos cinco resultados mais relevantes.
- Mantida arquitetura sem backend e sem dependências externas em runtime.
- Validado discovery com quatro tools no site publicado.
- Validada execução manual com consulta positiva e retorno estruturado.
- Validada consulta negativa com `count: 0` e `results: []`.
- Validada seleção automática de `search_blog` pelo agente.
- Validada geração automática do argumento `query` pelo agente.
- Validada síntese dos artigos em linguagem natural.
- Confirmada ausência de regressão das três tools da v0.3.
- Validação em produção concluída em 8 de setembro de 2026.

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
