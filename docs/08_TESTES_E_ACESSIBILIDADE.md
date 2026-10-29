# Testes e acessibilidade

## Ambiente

- Windows/PowerShell; Node 24.14.1; npm 11.10.1.
- Chromium instalado pelo Playwright.
- Testes de navegador com API mockada em `tests/e2e/app.spec.ts`; nenhum backend ou banco real foi acessado.

## Resultados finais

- `npm run lint`: passou sem warnings.
- `npm run typecheck`: passou.
- `npm run test`: 8 arquivos, 16 testes passaram.
- `npm run build`: passou e gerou as rotas App Router.
- `npm run test:e2e`: 15 cenários Playwright passaram.
- `npm install`: 502 pacotes auditados, 0 vulnerabilidades reportadas pelo npm.

Os E2E cobrem jornada pública, loja fechada, erro de rede, login, filtro/detalhe/status de pedido, empty state admin e responsividade. O teste axe não detectou violações WCAG A/AA no cardápio e login. Durante a inclusão do axe, ele encontrou o nome acessível da marca divergente do texto visível; `src/components/shared/brand-mark.tsx` foi corrigido antes do resultado final.

## Breakpoints e imagens

Sem overflow horizontal em 320, 360, 375, 390, 414, 430, 768, 1024 e 1440 px. Evidências:

- `screenshots/cardapio-390.png`
- `screenshots/personalizacao-390.png`
- `screenshots/checkout-390.png`
- `screenshots/login-360.png`
- `screenshots/pedidos-360.png`
- `screenshots/pedido-detalhe-360.png`
- `screenshots/catalogo-admin-1024.png`

## Acessibilidade não automatizada

Há HTML semântico, labels, foco visível, skip link, avisos não apenas por cor, alvos de toque e movimento reduzido. Axe cobre duas telas críticas, não todas as combinações de estado. Ainda é necessário validar teclado completo, TalkBack/leitor de tela, zoom, contraste com imagens reais e teclado virtual Android em homologação.
