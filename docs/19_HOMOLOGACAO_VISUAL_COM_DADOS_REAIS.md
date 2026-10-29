# Homologação visual com dados reais

Executada em 28/10/2026 com Next.js local e API development `localhost:3333`. O Playwright registrou todos os requests dirigidos à API e exigiu que cada método fosse `GET` ou `OPTIONS`.

## Fluxos aprovados

1. Home em 390 × 844 e 1280 × 900: loja fechada, 3 filtros/categorias e 14 cards reais.
2. Busca por X-Salada e abertura do detalhe real.
3. Seleção do pão francês `+ R$ 2,50`, Bacon e quantidade 2 do produto.
4. Carrinho com 2 × X-Salada, pão francês, 1 × Bacon por unidade e total estimado coerente.
5. Navegação para finalizar; o frontend mostrou “A loja não está aceitando pedidos”. Nenhum POST foi enviado.
6. Axe no cardápio real: zero violações sérias/críticas. A regressão mockada cobre WCAG A/AA e ausência de overflow em 320, 360, 375, 390, 414, 430, 768, 1024 e 1440 px.

## Evidências

- `screenshots/demo-cardapio-real-390.png`
- `screenshots/demo-cardapio-real-1280.png`
- `screenshots/demo-produto-real-390.png`
- `screenshots/demo-carrinho-real-390.png`
- `screenshots/demo-checkout-fechado-real-390.png`

## Gates

| Comando | Resultado |
|---|---|
| `npm run check` | lint, TypeScript, 9 arquivos/20 unitários e build de 28 rotas aprovados |
| `npm run test:e2e` | 16 cenários aprovados |
| `npm run test:homologation:readonly` | 5 smokes GET, contrato demo e 2 Playwright reais aprovados |
| backend `npm run check` | lint e 12 arquivos/71 unitários aprovados; sem acesso a banco |

O conjunto visual preserva a linguagem “ficha da chapa”, hierarquia, contraste e alvos de toque existentes. Não foi introduzido fallback fictício no cliente.
