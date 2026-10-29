# Contrato da API e decisões

## Fontes consultadas

Leitura estática, sem abrir `.env`, no projeto irmão `Lanchonete-Shirley-Backend`: `docs/CONTRATO_FRONTEND_PWA.md`, `FRONTEND_CHECKLIST.md`, `ROTAS_E_PERMISSOES.md`, `MODELO_DE_DADOS.md`, `NOTIFICACOES_ANDROID.md`, além de `src/docs/openapi.js`, rotas, schemas, constantes, controllers e services atuais. A API real não foi iniciada; `/openapi.json` não foi consultado por HTTP.

## Convenções aplicadas

- Base pública configurável e terminada em `/api/v1`.
- Sucesso `{ status: "success", data }`; erro normalizado com `code`, `message`, `request_id` e `details`.
- IDs são strings; dinheiro é string decimal. Conversão numérica só produz estimativa visual, nunca valor autoritativo.
- Datas e abertura da loja vêm do servidor; regra de negócio não depende do fuso do navegador.
- Cookies de sessão são `HttpOnly`; todas as chamadas usam `credentials: "include"` e `cache: "no-store"`.

## Público

`src/services/public-service.ts` usa:

- `GET /loja/status`, `/cardapio`, `/cardapio/produtos/:id`, `/metodos-pagamento`.
- `POST /pedidos` com `Idempotency-Key` estável.
- `GET /pedidos/acompanhar/:codigo` com código opaco.

O payload de pedido contém cliente, modalidade, endereço condicional, pagamento/troco, observações e referências dos itens. Não envia preços, total, frete, status, usuário ou campos calculados.

## Autenticação e administração

`src/lib/api-client.ts`, `src/features/auth/auth-provider.tsx` e `src/services/admin-service.ts` implementam `/auth/me`, login, logout, logout-all, alteração de senha, CSRF e refresh, além de:

- dashboard e pedidos, incluindo status, pagamento, cancelamento e impressão;
- CRUD de produtos, categorias, pães, adicionais e métodos de pagamento;
- substituição integral de vínculos produto–pães e produto–adicionais;
- loja/configurações/horários/status;
- usuários, níveis, permissões e redefinição de senha;
- relatórios/CSV, logs, notificações, Push e fila de impressões.

Alterações de pedido carregam `versao`. `409 ORDER_VERSION_CONFLICT` mostra aviso e refaz o GET antes de nova tentativa.

## Pontos para homologação

- Confirmar CORS/Origin e caminhos/atributos de cookies na URL escolhida.
- Comparar novamente os DTOs de recursos genéricos com `/openapi.json` da versão implantada.
- Confirmar resposta binária do CSV, configuração R2 e disponibilidade do agente de impressão.
- Exercitar permissões de cada perfil com contas de teste. Nenhuma divergência conhecida foi “corrigida” inventando endpoint no frontend.
