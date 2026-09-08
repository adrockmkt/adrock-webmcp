# Roadmap Ad Rock WebMCP

## Objetivo

Evoluir a POC WebMCP da Ad Rock de uma camada de informações estruturadas para uma interface agent-native capaz de discovery, retrieval, mensuração e, somente depois de validação, ações transacionais.

A baseline estável atual é a `v0.4`, validada em produção em 8 de setembro de 2026.

## Princípio de evolução

Cada versão deve provar uma capacidade nova antes da próxima ser iniciada.

```text
v0.4  Blog search parametrizada          CONCLUÍDA
  ↓
v0.5  Dynamic Content Discovery
  ↓
GATE: WebMCP melhora Agent Discovery?
  ↓
v0.6  Content Retrieval
  ↓
v0.7  Agent Analytics
  ↓
v0.8  Action Layer
  ↓
v0.9  Commercial Agent Journey
  ↓
v1.0  Ad Rock Agent Interface
```

## v0.5: Dynamic Content Discovery

### Objetivos

1. Eliminar a manutenção manual do índice do blog.
2. Fazer novos conteúdos publicados pela Ad Rock entrarem no mecanismo de discovery com o mínimo possível de intervenção manual.
3. Medir se WebMCP melhora de forma observável a capacidade de agentes encontrarem e utilizarem conteúdo da Ad Rock.

### Estado atual

```text
data/blog-index.json
        ↓
blog-search.js
        ↓
search_blog(query)
```

O índice é curado e versionado manualmente.

### Estado desejado

```text
Conteúdo publicado pela Ad Rock
             ↓
      índice atualizado
             ↓
        search_blog()
             ↓
           agente
```

### Benchmark Agent Discovery

Criar uma bateria fixa de perguntas, incluindo:

```text
Does Ad Rock have content about GA4 and AI?
What does Ad Rock recommend for GA4 auditing?
Has Ad Rock written about MCP and analytics?
What does Ad Rock say about AI and SEO?
Does Ad Rock have technical content about automation?
Find Ad Rock articles about Google Ads tracking.
```

Comparar, quando tecnicamente possível, três condições:

```text
A. agente usando página/DOM
B. agente usando navegação ou busca convencional
C. agente usando WebMCP
```

Avaliar:

- conteúdo correto encontrado
- melhor artigo recuperado
- quantidade de etapas
- seleção da capability adequada
- qualidade dos parâmetros gerados
- presença de conteúdo inventado
- uso de fontes da Ad Rock
- capacidade de aprofundar a resposta
- tempo e número de interações quando mensuráveis

### Gate de decisão

A v0.6 somente deve avançar depois da análise dos resultados da v0.5.

O objetivo é obter evidência defensável sobre a hipótese:

> Quando um agente interage com a Ad Rock, WebMCP aumenta sua capacidade de localizar e utilizar corretamente o conteúdo do site.

Não faz parte da hipótese afirmar que WebMCP melhora ranking orgânico em Google ou Bing.

## v0.6: Content Retrieval

### Objetivo

Permitir que o agente passe do discovery de um artigo para a recuperação estruturada do seu conteúdo.

Capability proposta:

```text
get_blog_article({ slug })
```

Fluxo esperado:

```text
pergunta
   ↓
search_blog()
   ↓
artigo encontrado
   ↓
get_blog_article()
   ↓
conteúdo estruturado
   ↓
resposta fundamentada
```

Separação conceitual:

```text
search_blog()         discovery
get_blog_article()    retrieval
```

## v0.7: Agent Analytics

### Objetivo

Mensurar o uso da camada WebMCP e transformar as interações de agentes em dados analíticos.

Arquitetura candidata:

```text
WebMCP
  ↓
dataLayer
  ↓
GTM
  ↓
GA4
  ↓
Looker Studio
```

Eventos candidatos:

```text
webmcp_tool_call
webmcp_search
webmcp_search_no_results
webmcp_article_retrieved
```

Dimensões candidatas:

```text
tool_name
query
result_count
article_slug
page_location
```

Um caso prioritário é identificar pesquisas sem resultado para apoiar decisões editoriais.

## v0.8: Action Layer

### Objetivo

Adicionar a primeira capability com efeito externo.

Possibilidades:

```text
request_contact()
request_proposal()
request_seo_audit()
```

Essa versão exige uma revisão arquitetural porque deixa de ser puramente read-only.

Requisitos esperados:

- backend ou API externa
- validação de entrada
- confirmação adequada de ações
- rate limiting
- proteção contra abuso
- análise de prompt injection
- tratamento de dados pessoais
- logging e observabilidade

Nenhuma action tool deve ser implementada apenas no client-side do Framer.

## v0.9: Commercial Agent Journey

### Objetivo

Combinar discovery, knowledge e actions em uma jornada comercial agent-native.

Exemplo:

```text
necessidade do usuário
        ↓
get_services()
        ↓
search_blog()
        ↓
get_blog_article()
        ↓
agente compreende expertise
        ↓
request_contact()
        ↓
lead
```

## v1.0: Ad Rock Agent Interface

A versão 1.0 somente deve ser considerada quando três camadas estiverem comprovadas:

```text
DISCOVERY
search_blog()

KNOWLEDGE
get_company_information()
get_services()
get_contact_information()
get_blog_article()

ACTION
request_contact() ou equivalente
```

Além disso, a implementação deve possuir:

- analytics
- segurança
- documentação
- testes
- versionamento
- tratamento de erros
- estratégia de fallback

Arquitetura conceitual:

```text
                 AD ROCK
                    │
        ┌───────────┴───────────┐
        │                       │
   Interface humana       Interface agente
        │                       │
      Framer                  WebMCP
        │                       │
        │          ┌────────────┼────────────┐
        │          │            │            │
        │       Discovery    Knowledge     Actions
        │          │            │            │
        │     search_blog   get_article   contact
        │          │            │            │
        └──────────┴────────────┴────────────┘
                           │
                       Analytics
                           │
                         GA4
```

## Regras do roadmap

- Preservar a v0.4 como baseline estável.
- Planejar cada versão antes de implementar código.
- Não introduzir backend até uma capability realmente exigir backend.
- Não adicionar complexidade sem hipótese ou critério de validação definido.
- Manter as capabilities read-only enquanto o projeto estiver nas fases de discovery, retrieval e analytics.
- Versionar arquitetura, implementação, testes e resultados no GitHub.
- Não tratar WebMCP como substituto de SEO tradicional.
- Separar claramente Search Engine Discovery de Agent Discovery.
