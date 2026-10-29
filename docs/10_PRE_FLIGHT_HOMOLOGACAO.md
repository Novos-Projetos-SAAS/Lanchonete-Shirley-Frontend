# Pré-voo da homologação

Data: 27/10/2026.

## Repositórios e estado

- Frontend: `Lanchonete-Shirley-Frontend`, Next.js 16.4.3/React 19.3.0/TypeScript estrito.
- Backend irmão: `Lanchonete-Shirley-Backend`, Express/Knex/PostgreSQL.
- O frontend já possuía mudanças extensas não commitadas. Elas foram preservadas; nenhum `git add`, commit, reset, rebase ou push foi executado.
- O backend permaneceu sem alterações locais nesta etapa.
- `.env` e `.env.local` não foram lidos, impressos ou modificados. Nenhuma credencial, cookie, URL Neon ou segredo foi incluído em código, log ou documentação.

## Ambiente A — development

- API observada: `http://localhost:3333/api/v1`.
- Origem esperada do frontend: `http://localhost:3000`.
- Chamadas executadas, sempre GET: `/health`, `/loja/status`, `/cardapio`, `/metodos-pagamento` e `/openapi.json` na raiz do host.
- Resultado nas duas rodadas do smoke: HTTP 200, formato esperado, `Access-Control-Allow-Origin` exato e `Access-Control-Allow-Credentials: true`.
- O navegador real carregou `/`, status e cardápio em 390 × 844. A suíte registrou os métodos enviados ao host 3333 e aceitou somente GET/OPTIONS.
- Não houve login, sessão, seed, pedido, mutação, migration ou teste de carga nesse ambiente.

Snapshot estritamente somente leitura antes e depois dos testes de integração confirmou o mesmo estado agregado esperado: 27 tabelas, 25 migrations, 8 seeds, 1 usuário/administrador ativo, 0 produtos, 0 pedidos e loja fechada. A comparação criptográfica entre os dois momentos não foi retida; portanto a prova relatada é de estado agregado, não de igualdade byte a byte.

## Ambiente B — TEST isolado

O guard read-only confirmou `safe=true`, `isolated=true`, banco distinto do development, 25 migrations, 8 seeds, 1 administrador ativo, loja fechada e zero fixtures residuais. O opt-in foi fornecido somente ao processo de teste.

Foram executadas duas rodadas consecutivas da suíte de integração real do backend, via Supertest/PostgreSQL TEST e Socket.IO real no processo de teste: 9 arquivos e 43 testes em cada rodada. As fixtures usam identificadores rastreáveis, credenciais efêmeras `example.invalid`, cleanup seletivo e restauração da loja. A verificação final confirmou `fixtures_remaining=0`.

Não foi iniciada uma API persistente na porta 3334 para o navegador. O bootstrap seguro existente cria segredos e fixtures dentro do runner Vitest; não existe, ainda, um orquestrador que exponha essas credenciais efêmeras ao Playwright e garanta cleanup ao encerrar uma instância HTTP separada. Por isso, nenhum login ou CRUD real foi feito pelo Next.js contra TEST.

## Suíte opt-in preparada para 3334

`npm run test:e2e:test-api` está pronta para validar login, cookie HttpOnly, ausência de token em LocalStorage e logout quando um orquestrador seguro fornecer:

- API TEST exatamente em `http://localhost:3334/api/v1`;
- `RUN_REAL_TEST_E2E=true`;
- `TEST_DATABASE_ISOLATION_VERIFIED=true` após o guard real;
- credencial efêmera terminada em `@example.invalid`.

O launcher recusa outras URLs e credenciais. A suíte não foi executada nesta etapa e não substitui a necessidade de fixture/cleanup do backend.

## Proteções mantidas

- CORS não foi relaxado e CSRF/RBAC/TLS/rate limit não foram desligados.
- Push, R2, QZ e worker externo permaneceram fora dos testes.
- Nenhum seed foi executado.
- O aviso do driver PostgreSQL sobre futura mudança semântica de `sslmode=require` foi registrado como risco operacional; a conexão atual também verifica canal criptografado/autorizado.
