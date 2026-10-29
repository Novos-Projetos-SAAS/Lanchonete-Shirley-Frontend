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
