# Testes

## Ambiente validado

- Site publicado em Framer Basic
- Chrome com `WebMCP for testing` habilitado
- Model Context Tool Inspector
- Gemini API configurada exclusivamente no Inspector para teste de agent selection

## Teste 1: registro

Resultado esperado no Console:

```text
[Ad Rock WebMCP] Tool registrada: get_company_information
[Ad Rock WebMCP] Tool registrada: get_services
[Ad Rock WebMCP] Tool registrada: get_contact_information
```

## Teste 2: discovery

Executar:

```javascript
await document.modelContext.getTools()
```

Resultado esperado:

```text
length: 3
```

## Teste 3: execução manual

Executar uma tool com `document.modelContext.executeTool()` e confirmar retorno JSON estruturado.

## Teste 4: seleção automática

Prompt:

```text
What services does this company offer?
```

Resultado validado:

```text
AI calling tool "get_services" with {}
```

## Teste 5: composição multi-tool

Após resetar o contexto do Inspector, enviar:

```text
Can you give me an overview of Ad Rock Digital Mkt, including the services they offer and how I can get in touch with them?
```

Resultado validado:

```text
get_company_information
get_services
get_contact_information
```

As três function calls ocorreram no mesmo ciclo e os três resultados foram utilizados na resposta final.

## Observação sobre erro 503

Durante um teste ocorreu `503 UNAVAILABLE` por alta demanda do modelo Gemini. A chamada seguinte funcionou sem alteração no site ou no código, confirmando indisponibilidade temporária externa ao WebMCP da Ad Rock.
