# Testes

## Ambiente validado

- Site publicado em Framer Basic
- Chrome com `WebMCP for testing` habilitado
- Model Context Tool Inspector
- Gemini API configurada exclusivamente no Inspector para teste de agent selection

## Baseline v0.3

### Registro

Resultado esperado no Console:

```text
[Ad Rock WebMCP] Tool registrada: get_company_information
[Ad Rock WebMCP] Tool registrada: get_services
[Ad Rock WebMCP] Tool registrada: get_contact_information
```

### Discovery

```javascript
await document.modelContext.getTools()
```

Resultado validado na v0.3:

```text
length: 3
```

### Seleção automática

Prompt validado:

```text
What services does this company offer?
```

Resultado:

```text
AI calling tool "get_services" with {}
```

### Composição multi-tool

Prompt validado:

```text
Can you give me an overview of Ad Rock Digital Mkt, including the services they offer and how I can get in touch with them?
```

Resultado:

```text
get_company_information
get_services
get_contact_information
```

## Validação v0.4

Validação concluída em produção em 8 de setembro de 2026.

### Teste 1: registro

Resultado confirmado no site publicado:

```text
[Ad Rock WebMCP] Tool registrada: search_blog
```

Status: `OK`

### Teste 2: discovery

Execução:

```javascript
await document.modelContext.getTools()
```

Resultado confirmado:

```text
length: 4
```

As quatro tools permaneceram disponíveis:

```text
get_company_information
get_services
get_contact_information
search_blog
```

Status: `OK`

### Teste 3: execução manual com resultado

Execução:

```javascript
const tools = await document.modelContext.getTools();
const searchBlog = tools.find((tool) => tool.name === "search_blog");

await document.modelContext.executeTool(
  searchBlog,
  JSON.stringify({ query: "GA4 artificial intelligence" })
);
```

Resultado confirmado:

- `count: 5`
- resultados relacionados a GA4 e IA
- URLs do domínio `adrock.com.br`
- retorno com título, URL, descrição, tópicos, data e score

Status: `OK`

### Teste 4: execução manual sem resultado

Execução:

```javascript
await document.modelContext.executeTool(
  searchBlog,
  JSON.stringify({ query: "quantum computing superconducting qubits" })
);
```

Resultado confirmado:

```json
{
  "query": "quantum computing superconducting qubits",
  "count": 0,
  "results": []
}
```

Status: `OK`

### Teste 5: seleção automática pelo agente

Após Reset no Inspector, foi enviado:

```text
Does Ad Rock have any articles about GA4 and artificial intelligence?
```

O trace registrou:

```text
AI calling tool "search_blog" with {"query":"GA4 artificial intelligence"}
```

A tool retornou cinco artigos e o agente sintetizou os resultados em linguagem natural com links e tópicos relevantes.

Status: `OK`

### Teste 6: regressão

A discovery confirmou que as três tools da v0.3 continuam registradas ao lado da nova `search_blog`.

A implementação da v0.4 estende a baseline sem substituir `src/adrock-webmcp.js`.

Status: `OK`

## Critérios finais v0.4

```text
Tool discovery            OK
Schema com query          OK
Execução manual           OK
Seleção automática        OK
Busca relevante           OK
Busca sem resultado       OK
v0.3 sem regressão        OK
```

## Observação sobre erro 503

Durante testes da v0.3 ocorreu `503 UNAVAILABLE` por alta demanda do modelo Gemini. A chamada seguinte funcionou sem alteração no site ou no código, confirmando indisponibilidade temporária externa ao WebMCP da Ad Rock.
