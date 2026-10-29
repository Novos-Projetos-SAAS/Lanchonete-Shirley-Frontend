# Testes e validação visual do público — Etapa 7B

Data: 2026-10-28.

## Gates automatizados

| Comando | Resultado |
|---|---|
| `npm.cmd run check` | aprovado: lint, TypeScript, 11 arquivos/28 testes Vitest e build Next 16 com 30 páginas geradas |
| `npm.cmd run test:e2e` | aprovado: 26/26 cenários Chromium |

A suíte E2E intercepta `/api/v1/**`; pedidos e autenticação são simulados. Nenhum teste desta etapa escreveu na API ou em banco real.

## Fluxos obrigatórios cobertos

- Cardápio → X-Bacon → pão francês → queijo extra → adicionar.
- Retorno ao cardápio sem abrir carrinho, com toast, busca, categoria, rolagem, quantidade e subtotal preservados.
- Segundo produto → retorno → abertura explícita do carrinho → duas configurações corretas.
- Checkout e confirmação com escrita simulada.
- Acesso direto ao produto com fallback `/`.
- Retorno externo malformado recusado.
- Seleção inválida permanece no produto e foca o resumo.
- Dois cliques síncronos não duplicam o item.
- Loja fechada e erro de rede continuam com recuperação explícita.
- Axe WCAG A/AA no cardápio, produto, carrinho, checkout, confirmação, busca de pedido, tracking e login.
- Regressão administrativa visual e funcional.

## Larguras

As sete rotas públicas principais foram exercitadas sem overflow horizontal em:

`320`, `360`, `375`, `390`, `414`, `430`, `768`, `1024`, `1280` e `1440` px.

A cobertura detectou um overflow real do CTA de produto em 768/1024 px. A grade foi corrigida para manter quantidade/total na primeira linha e o CTA em largura total abaixo. A repetição direcionada e a regressão completa passaram.

## Evidências

- `docs/screenshots/redesign-publico-cardapio-390.png`
- `docs/screenshots/redesign-publico-cardapio-1280.png`
- `docs/screenshots/redesign-publico-produto-390.png`
- `docs/screenshots/redesign-publico-carrinho-390.png`
- `docs/screenshots/redesign-publico-checkout-390.png`
- `docs/screenshots/redesign-publico-confirmacao-390.png`
- `docs/screenshots/redesign-publico-acompanhamento-1280.png`
- `docs/screenshots/redesign-publico-regressao-admin-1440.png`

## Inspeção humana

As capturas foram abertas em resolução original. A inspeção confirmou:

- primeira dobra neutra e compacta;
- hierarquia clara entre status, busca, categorias e produtos;
- resumo lateral visível no desktop e ausente no mobile;
- cards sem corte de texto ou CTA;
- checkout com grupos e espaçamento previsíveis;
- confirmação/tracking legíveis e sem decoração excessiva;
- painel administrativo visualmente preservado.

A inspeção também encontrou um selo sobreposto ao placeholder do produto; o selo passou a existir somente quando há imagem real.

