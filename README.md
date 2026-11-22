# Lanchonete Shirley — Frontend

Frontend mobile-first do cardápio, checkout e painel operacional da Lanchonete Shirley. O projeto usa Next.js App Router, React, TypeScript estrito, TanStack Query, React Hook Form/Zod, Zustand, Socket.IO e recursos PWA.

## Requisitos e execução

- Node.js `>=20.9.0` (desenvolvido com `24.14.1`)
- npm (desenvolvido com `11.10.1`)
- API compatível com o contrato do backend Shirley

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Abra `http://localhost:3000`. `NEXT_PUBLIC_API_URL` deve apontar para o prefixo `/api/v1` da API e `NEXT_PUBLIC_SITE_URL` informa a origem canônica do frontend. Ambas são públicas e não devem conter segredo.

## Rotas principais

- Público: `/`, `/produto/[id]`, `/carrinho`, `/finalizar`, `/pedido/confirmado`, `/acompanhar` e `/acompanhar/[codigo]`.
- Painel: `/admin/login`, `/admin`, pedidos, produtos, categorias, pães, adicionais, pagamentos, loja, usuários, relatórios, logs, notificações, impressões e perfil sob `/admin/*`.

## Comandos

```powershell
npm run dev          # servidor de desenvolvimento
npm run lint         # ESLint sem warnings
npm run typecheck    # TypeScript sem emissão
npm run test         # Vitest + Testing Library
npm run test:e2e     # Playwright com API interceptada
npm run test:smoke:dev       # GETs seguros contra development em localhost:3333
npm run test:demo:real       # confere o catálogo demo real, sem escrita
npm run test:e2e:readonly    # Next real + API 3333, somente leitura
npm run test:homologation:readonly # smoke + demo + Playwright real GET-only
npm run test:e2e:test-api    # opt-in; exige API TEST segura em localhost:3334
npm run build        # build de produção
npm run start        # serve o build
npm run check        # lint + typecheck + unitários + build
npm run icons:generate
```

`test:e2e` usa mocks em `tests/e2e/app.spec.ts`, inclusive para provar que o editor de produto lê os vínculos existentes antes de substituí-los. `test:demo:real` e `test:e2e:readonly` chamam somente rotas públicas GET do development e auditam o catálogo/fluxo real. `test:e2e:test-api` é bloqueado por padrão e só aceita a instância TEST local 3334 após opt-in, prova de isolamento e credencial efêmera `example.invalid`; consulte `docs/10_PRE_FLIGHT_HOMOLOGACAO.md`. O cliente real não usa dados fictícios como fallback.

## Arquitetura e segurança

- `src/app`: rotas e layouts App Router.
- `src/features`: fluxos por domínio.
- `src/services`: chamadas tipadas ao contrato HTTP.
- `src/lib/api-client.ts`: cookies `HttpOnly` via `credentials: include`, CSRF em memória, timeout e refresh coordenado.
- `src/store/cart-store.ts`: somente configuração comercial do carrinho, sem PII ou tokens.
- `public/sw.js`: cache conservador de assets; API, painel e dados privados não são cacheados.

Nenhuma credencial, JWT, URL Neon ou chave privada pertence a este repositório. A validação contra o backend real e os testes em Android físico dependem do ambiente operacional.

Comece o acompanhamento por [docs/HANDOFF_CHATGPT.md](docs/HANDOFF_CHATGPT.md) e [docs/STATUS_ATUAL.md](docs/STATUS_ATUAL.md).

## Checkout InfinitePay

Para homologação com dois Quick Tunnels, exponha as origens sem caminho: frontend `http://127.0.0.1:3000` e backend `http://127.0.0.1:3333`. `NEXT_PUBLIC_API_URL` continua sendo a URL HTTPS do túnel backend com `/api/v1`; `NEXT_PUBLIC_SITE_URL` é a origem HTTPS do frontend. Quando essa origem é `*.trycloudflare.com`, o Next encaminha API e Socket.IO pela origem do frontend. Isso preserva cookies `SameSite=Lax` sem depender de cookies de terceiros. Não use URLs antigas de túneis encerrados. As origens comuns de produção mantêm a conexão existente.

Em desenvolvimento, o service worker continua disponível para Push, mas não armazena módulos/HMR. Após atualizar o worker ou trocar o túnel, recarregue a página. O cache de produção continua limitado a recursos estáticos, sem API, painel ou sessão.

`/finalizar` identifica as modalidades online pelo campo `online_habilitado` da API. Após criar ou recuperar o pedido com `Idempotency-Key`, salva o código de acompanhamento e abre somente um checkout HTTPS oficial. Com a integração desligada, os métodos tradicionais continuam disponíveis.

Em **Painel → Métodos de pagamento → InfinitePay**, configure InfiniteTag, API Key, origem HTTPS pública do backend e retorno `https://<frontend>/pedido/confirmado`. A origem do retorno precisa constar no `ALLOWED_ORIGINS` existente no backend. A chave salva nunca é devolvida; deixe o campo vazio para mantê-la. O formulário exige permissões InfinitePay e envia CSRF e versão. As três opções só entram em vigor após salvar; mantenha a ativação desligada até autorizar o teste real.

O backend acrescenta o código do pedido ao retorno e configura o webhook em `/api/v1/pagamentos/webhook/infinitepay`. O retorno encaminha apenas `order_nsu`, `transaction_nsu` e `slug` para a consulta oficial no backend; nenhum parâmetro do navegador confirma pagamento. `/acompanhar/[codigo]` consulta o pedido, permite reabrir o mesmo link e mantém a produção oculta até a liberação oficial. Erros e expiração não geram outro pedido ou checkout. As modalidades no checkout são atualizadas pela configuração do backend, com consulta a cada 30 segundos.

Pix online também oferece cartão no checkout hospedado. Selecionar crédito solicita somente cartão. A configuração, InfiniteTag, API Key e a chave de criptografia permanecem exclusivamente no backend. Este frontend não ativa a integração nem armazena dados de cartão.

Validação local sem pagamentos reais:

```powershell
rtk proxy npm run lint
rtk proxy npm run typecheck
rtk proxy npm test -- --run src/lib/infinitepay.test.ts src/features/orders/tracking-page.test.tsx src/lib/idempotency.test.ts src/lib/api-client.test.ts
```

`tests/e2e/infinitepay.spec.ts` executa navegador e Express reais com transporte InfinitePay simulado. Exige o checkout irmão `../Lanchonete-Shirley-Backend`, porta 3100 livre e uma porta exclusiva para a API de teste. Defina `NEXT_PUBLIC_API_URL` temporariamente para `http://127.0.0.1:<porta exclusiva>/api/v1` no build e no teste; a porta DEV 3333 é bloqueada. Exige também `RUN_DB_INTEGRATION=true`, `DATABASE_URL` de referência local e `DATABASE_TEST_URL` de uma base local descartável exclusiva cujo nome contenha `checkout_mvp`. As duas conexões devem comprovar identidades distintas e TLS autorizado. A base de teste deve estar vazia de pedidos, preparada com 46 migrations e 14 seeds. Não use DEV, produção ou uma base de testes compartilhada. As fixtures permanecem no descartável para preservar a imutabilidade do ledger.

Após comprovar esse isolamento e autorizar as fixtures no descartável:

```powershell
rtk proxy npx playwright test tests/e2e/infinitepay.spec.ts --workers=1
```

O teste cria somente credenciais efêmeras e configurações simuladas na base descartável. O próprio teste inicia o Express na porta exclusiva, preservando o backend habitual. Para homologação com o provedor, faltam credenciais oficiais, URLs HTTPS acessíveis de retorno/webhook e ativação administrativa deliberada. Não há cobrança real nos testes automatizados.
