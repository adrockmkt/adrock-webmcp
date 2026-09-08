# Implementação no Framer

## Configuração utilizada

Custom Code do Framer:

```text
Name: Ad Rock WebMCP POC v0.1
Placement: End of <body>
Page: All
Run: Once
```

O nome histórico do snippet foi preservado no Framer durante os testes. O baseline do código documentado neste repositório corresponde à v0.3 funcional.

## Instalação

O conteúdo de `src/adrock-webmcp.js` deve ser inserido entre tags `script` no Custom Code do Framer.

Exemplo:

```html
<script>
  // conteúdo de src/adrock-webmcp.js
</script>
```

## Tools registradas

### get_company_information

Retorna informações públicas sobre a empresa, localização e áreas de atuação.

### get_services

Retorna os principais serviços da Ad Rock com categoria, descrição e URL pública relacionada.

### get_contact_information

Retorna canais públicos de contato comercial, WhatsApp, telefone, página de contato, Calendly e contato de privacidade.

## Segurança

As três tools usam:

```javascript
annotations: {
  readOnlyHint: true
}
```

Nenhuma delas modifica estado, envia formulário ou executa transações.
