# Ad Rock WebMCP

POC técnica para tornar o site da Ad Rock Digital Mkt compatível com agentes que suportam WebMCP.

## Estado atual

Versão baseline: `v0.3`

Implementação validada em produção no site `https://adrock.com.br/` usando Framer Basic e Custom Code, sem backend próprio.

Tools atuais:

- `get_company_information`
- `get_services`
- `get_contact_information`

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
```

## Validações concluídas

- Registro das tools
- Discovery via `document.modelContext.getTools()`
- Execução manual via `document.modelContext.executeTool()`
- Detecção pelo Model Context Tool Inspector
- Seleção automática de tool por intenção
- Execução de múltiplas tools no mesmo prompt
- Composição dos resultados pelo agente

## Teste multi-tool validado

Prompt usado:

```text
Can you give me an overview of Ad Rock Digital Mkt, including the services they offer and how I can get in touch with them?
```

O agente selecionou automaticamente:

```text
get_company_information()
get_services()
get_contact_information()
```

Os três resultados foram usados para gerar uma resposta consolidada.

## Estrutura

```text
adrock-webmcp/
├── README.md
├── CHANGELOG.md
├── src/
│   └── adrock-webmcp.js
├── docs/
│   ├── architecture.md
│   ├── implementation.md
│   └── testing.md
└── examples/
    └── agent-trace.md
```

## Próximos passos

1. Preservar a v0.3 como baseline estável.
2. Implementar `search_blog(query)` como primeira tool com parâmetro de entrada.
3. Avaliar instrumentação de chamadas WebMCP no GA4.
4. Somente depois avaliar tools capazes de enviar dados ou executar ações.

## Status

POC funcional e validada em setembro de 2026.
