# Etapa base e autenticação

## Implementado

- Scaffold App Router diretamente na raiz, TypeScript estrito, ESLint, Tailwind, providers e layouts.
- Cliente HTTP único em `src/lib/api-client.ts`, com timeout de 15 s, AbortController, envelope e erros estruturados.
- Sessão via `/auth/me`; login seguro; logout, logout-all e alteração de senha.
- `credentials: "include"`; nenhum JWT, senha, cookie ou refresh token em storage.
- Token CSRF somente em memória, compartilhamento da requisição em andamento e envio em mutações.
- Uma única promessa coordenada de refresh e uma única repetição da chamada original após `401`.
- Guard de sessão no shell administrativo e `PermissionGate`/menus por `modulo.acao`; admin recebe acesso visual integral.
- Mensagem de login sem enumeração de e-mail.

## Testado localmente

Vitest cobre CSRF, refresh coordenado, erro `409` e RBAC visual. Playwright cobre login e navegação protegida com API mockada. O build não exige `.env` real.

## Não comprovado nesta etapa

Não houve sessão contra o backend real. A persistência e atributos dos cookies, política de Origin, revogação em logout-all e permissões de perfis reais devem ser homologados sob HTTPS.
