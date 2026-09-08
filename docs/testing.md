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

A v0.4 só deve ser marcada como validada depois dos testes abaixo no site publicado.

### Teste 1: registro

O Console deve adicionar:

```text
[Ad Rock WebMCP] Tool registrada: search_blog
```

### Teste 2: discovery

```javascript
const tools = await document.modelContext.getTools();
tools.map((tool) => tool.name);
```

Resultado esperado:

```text
[
  "get_company_information",
  "get_services",
  "get_contact_information",
  "search_blog"
]
```

### Teste 3: execução manual com resultado

```javascript
const tools = await document.modelContext.getTools();
const searchBlog = tools.find((tool) => tool.name === "search_blog");

await document.modelContext.executeTool(
  searchBlog,
  JSON.stringify({ query: "GA4 artificial intelligence" })
);
```

Resultado esperado:

- `count` maior que zero
- resultados relacionados a GA4 e IA
- URLs do domínio `adrock.com.br`

### Teste 4: execução manual sem resultado

```javascript
await document.modelContext.executeTool(
  searchBlog,
  JSON.stringify({ query: "quantum computing superconducting qubits" })
);
```

Resultado esperado:

```json
{
  "query": "quantum computing superconducting qubits",
  "count": 0,
  "results": []
}
```

### Teste 5: seleção automática pelo agente

Após Reset no Inspector:

```text
Does Ad Rock have any articles about GA4 and artificial intelligence?
```

Resultado esperado no trace:

```text
AI calling tool "search_blog" with {"query":"..."}
```

O texto exato da query pode ser reformulado pelo modelo. O critério é que `search_blog` seja selecionada e receba um argumento semanticamente compatível.

### Teste 6: regressão

Repetir o prompt multi-tool da v0.3 e confirmar que as três tools anteriores continuam disponíveis e funcionais.

## Observação sobre erro 503

Durante testes da v0.3 ocorreu `503 UNAVAILABLE` por alta demanda do modelo Gemini. A chamada seguinte funcionou sem alteração no site ou no código, confirmando indisponibilidade temporária externa ao WebMCP da Ad Rock.
