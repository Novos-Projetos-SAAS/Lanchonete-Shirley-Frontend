# Implementação do site público — Etapa 7B

Data: 2026-10-28.

## Resultado

O frontend público foi redesenhado como um **balcão digital limpo**, preservando o painel administrativo e todos os contratos de negócio. O antigo hero creme/amarelo foi substituído por uma abertura curta, neutra e orientada a status real da loja. O terracota ficou restrito a CTA, seleção e destaques funcionais.

## Alterações por fluxo

### Shell público

- Cabeçalho compacto com marca, cardápio, acompanhamento e carrinho.
- Quantidade e subtotal são derivados do store real; nenhum valor foi inventado.
- Rodapé simplificado e neutro.
- Alvos de toque, foco, safe-area e `prefers-reduced-motion` preservados.

### Cardápio

- Status, mensagem, estimativa e endereço vêm da API pública.
- Busca com ação explícita de limpar.
- Categorias são navegação por âncora na mesma página, não abas que escondem o restante do cardápio.
- Cards compactos usam imagem da API ou placeholder honesto.
- Desktop a partir de 1024 px mostra resumo sticky do carrinho ao lado do cardápio.
- Mobile usa barra inferior “Ver carrinho” somente quando há itens.

### Contexto e navegação

- Busca e categoria são refletidas em query string com `history.replaceState`.
- O link de produto carrega apenas um retorno interno saneado.
- A rolagem é salva temporariamente em `sessionStorage`, vinculada ao mesmo contexto e consumida uma única vez.
- Retornos externos, protocol-relative, para rotas administrativas ou com parâmetros desconhecidos são descartados.
- Acesso direto ao produto usa `/` como fallback.

### Produto e adição

- Seleção inválida continua na tela e move o foco ao resumo de erros.
- Clique válido adiciona uma vez, mostra toast e usa `router.replace(retornoSeguro)` para voltar ao cardápio.
- O carrinho não é aberto automaticamente.
- Uma trava síncrona por `ref` mais o estado visual do botão impede duplicidade em cliques rápidos.
- O subtotal, badge do cabeçalho, resumo desktop e barra mobile atualizam pelo mesmo store.

### Carrinho, checkout, confirmação e tracking

- Carrinho e resumos usam hierarquia neutra, preço alinhado e CTA principal explícito.
- O checkout agora usa os componentes compartilhados `Field` e `FieldGroup`, mantendo rótulo, dica, obrigatoriedade e erro associados ao controle correto.
- Regras de entrega, pagamento, troco, idempotência e payload foram preservadas.
- Confirmação e acompanhamento receberam cartões contidos, estados claros e linha do tempo com contraste AA.

## Arquivos principais

- `src/app/globals.css`: escopo visual 7B e breakpoints públicos.
- `src/components/layout/public-shell.tsx`: cabeçalho/rodapé e resumo do carrinho.
- `src/components/ui/index.tsx`: novo `FieldGroup` acessível.
- `src/features/catalog/menu-page.tsx`: cardápio, busca, âncoras e resumo responsivo.
- `src/features/catalog/product-card.tsx`: links com retorno contextual.
- `src/features/catalog/product-customizer.tsx`: novo comportamento pós-adição e proteção contra duplicidade.
- `src/features/checkout/checkout-page.tsx`: composição previsível dos grupos de formulário.
- `src/lib/menu-context.ts`: serialização, saneamento e restauração de contexto.
- `src/lib/menu-context.test.ts`: regressões unitárias do contexto.
- `tests/e2e/app.spec.ts`: fluxo completo, acessibilidade, responsividade e evidências.

## Isolamento mantido

Não houve alteração no backend, banco, migrations, seeds, `.env`, contratos HTTP, deploy, commit ou push. Os testes de escrita usam interceptações Playwright; nenhuma escrita foi enviada à API real.

