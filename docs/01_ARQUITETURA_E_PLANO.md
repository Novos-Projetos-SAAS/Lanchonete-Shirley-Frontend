# Arquitetura e plano executado

## Base técnica

Projeto único na raiz, com Next.js 16.4.3, React 19.3.0, TypeScript 5.9.3 em modo estrito, Tailwind CSS 4.3.3, npm e App Router. Node usado: 24.14.1; npm: 11.10.1. A compatibilidade mínima declarada é Node 20.9.0.

Dependências centrais: TanStack Query para dados remotos; React Hook Form + Zod para formulários; Zustand para carrinho; Radix Dialog/Slot para primitivas acessíveis; Socket.IO Client; Lucide para ícones; Vitest/Testing Library e Playwright/axe para testes.

## Estrutura real

- `src/app/`: páginas, layouts, metadata, manifest, erros e carregamento.
- `src/components/`: primitivas de UI, shells público/admin, marca, permissões e toasts.
- `src/features/`: autenticação, catálogo, carrinho, checkout, pedidos, administração, notificações, PWA e impressão.
- `src/lib/`: cliente HTTP, dinheiro, datas, idempotência, regras e query keys.
- `src/services/`: fachadas pública e administrativa da API.
- `src/store/`: persistência local segura do carrinho.
- `src/types/`: envelopes, DTOs e domínio.
- `public/`: service worker, página offline e ícones próprios.
- `tests/e2e/`: jornadas com rede interceptada; `docs/screenshots/`: evidências visuais.

## Fluxo de dados

Componentes chamam serviços por TanStack Query. Os serviços passam por um único cliente HTTP, que normaliza o envelope, inclui cookies, controla timeout/CSRF/refresh e lança `ApiError`. O backend permanece a autoridade de preços, frete, abertura da loja, permissões e transições. Zustand persiste apenas itens e escolhas comerciais; dados pessoais e sessão não entram no storage.

## Decisões

- Sem BFF neste estágio: o navegador chama `NEXT_PUBLIC_API_URL`. Em produção, frontend e API devem preferir mesmo domínio-base/HTTPS ou uma topologia de proxy revisada.
- Fontes variáveis Bricolage Grotesque e Nunito Sans são empacotadas via Fontsource, sem dependência de CDN em runtime.
- PWA manual e conservadora: nenhum endpoint de API ou página administrativa é cacheado.
- O primeiro scaffold do Create Next App gerou o commit local `0f1bb4a`; as implementações atuais permanecem sem novo commit e sem push.

## Comandos

Consulte o `README.md`. A barreira principal é `npm run check`; a suíte de navegador é `npm run test:e2e`.
