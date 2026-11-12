# Relatório — correções da homologação manual

Data: 10/11/2026. Escopo: frontend e backend da Lanchonete Shirley. O aplicativo Android não foi alterado.

## Resultado

As correções foram implementadas e validadas localmente e no PostgreSQL TEST isolado. Nenhum dado de development/produção foi alterado; não houve migration, seed, mudança de `.env`, deploy, commit ou push.

## Diagnóstico e correções

| Problema | Causa confirmada | Correção |
| --- | --- | --- |
| Categorias do cardápio | O frontend mantinha todas as seções visíveis ao selecionar uma categoria | `visibleMenuCategories` combina categoria e busca, mantém seções distintas em “Todos” e remove seções vazias |
| Produtos no painel | A listagem não aceitava categoria/arquivamento e o formulário exigia ID manual | Filtros combináveis de estado, categoria e busca; coluna de categoria; seletor carregado da API |
| Dois tipos de pão | A tela de vínculos consultava apenas pães ativos, ocultando o pão francês ainda não configurado | Todos os pães aparecem no editor; pães inativos/sem preço ficam desabilitados com orientação. Nada foi ativado e nenhum preço foi inventado |
| Desativação irreversível | A ação antiga preenchia `deletado_em` e a listagem ocultava o registro | Desativar agora mantém o registro; arquivar é separado; reativar valida preço/categoria/pão; restaurar preserva ID e vínculos e retorna inativo/indisponível |
| Dois menus ativos | Correspondência por prefixo fazia `/admin/pedidos/novo` também marcar Pedidos | Regra única de rota ativa: criação marca só Novo pedido; lista/detalhe marcam Pedidos |
| Código de acompanhamento perdido | A confirmação existia apenas em `sessionStorage` | Nova rota `/meus-pedidos`, histórico versionado no `localStorage`, máximo 10 referências, expiração em 30 dias, validação, limpeza e consulta de status na API |
| UUID em erro comum | A UI exibia qualquer `request_id` | Referência aparece somente em respostas `5xx`; o contrato da API foi preservado |
| Olho da senha | O botão herdava borda/sombra e não estava integrado ao campo | Botão absoluto centralizado, sem borda normal, foco acessível, área de toque preservada e espaço reservado no input |
| Erro repetido e fora da visão | Resumo e campo podiam repetir a mesma mensagem; modal não reposicionava o conteúdo | Deduplicação normalizada, erro inline preservado, foco no resumo e rolagem do corpo do modal ao topo; rodapé permanece visível em retrato e paisagem |

## Arquivos principais alterados

- Catálogo/admin: `src/features/catalog/menu-page.tsx`, `src/features/admin/resource-page.tsx`, `src/services/admin-service.ts`.
- Pedidos recentes: `src/lib/recent-orders.ts`, `src/features/orders/recent-orders-page.tsx`, `src/app/(public)/meus-pedidos/page.tsx`, checkout, confirmação e shell público.
- Navegação/feedback: `src/components/layout/admin-shell.tsx`, `src/components/ui/index.tsx`, `src/lib/api-errors.ts`, `src/app/globals.css`.
- Regressão: testes unitários correspondentes e `tests/e2e/app.spec.ts`; capturas existentes foram regeneradas pelos cenários Playwright.
- Backend irmão: repository/service/controller/rotas/schemas de catálogo, OpenAPI e testes de catálogo/paginação.

## Contrato de API

Novas operações administrativas, protegidas por autenticação, CSRF e `produtos.gerenciar`:

- `PATCH /api/v1/admin/produtos/:id/desativar`
- `POST /api/v1/admin/produtos/:id/reativar`
- `POST /api/v1/admin/produtos/:id/restaurar`

`GET /api/v1/admin/produtos` agora aceita `categoria_id` e `arquivado`, além de `ativo`, `busca`, `page` e `limit`, e retorna `categoria_nome`. O `DELETE` existente foi mantido por compatibilidade e agora está explicitamente documentado como arquivamento lógico. Não houve mudança destrutiva de schema.

## Testes executados

- Frontend: lint, TypeScript, 18 arquivos/66 testes unitários e build Next.js de 31 rotas — aprovados. Uma tentativa confinada do build recebeu `EPERM` ao criar diretório gerado em `.next`; a repetição com permissão de escrita normal concluiu sem erro de código.
- Frontend `npm run test:e2e`: 34/34 — aprovado, incluindo Axe A/AA, 320–1440 px, retrato/paisagem do modal, filtros/ciclo de produtos, senha e histórico após reload.
- Backend `npm run check`: lint e 18 arquivos/119 testes unitários — aprovado.
- Backend `RUN_DB_INTEGRATION=true npm run test:integration`: 10 arquivos/53 testes no `DATABASE_TEST_URL` isolado — aprovado; fixtures removidas pela suíte.
- `git diff --check` — aprovado. O driver PostgreSQL emitiu apenas aviso preventivo sobre semântica futura de `sslmode`; não houve falha TLS.

## Pendências externas

- Configurar manualmente o preço real do pão francês e os vínculos desejados no painel; a implementação não inventa preço nem publica produto.
- Recuperação em outro aparelho continua dependendo do link/código. OTP por SMS/WhatsApp não foi criado porque não existe provedor configurado.
- Repetir homologação em Render/Vercel após autorização de deploy e com conta administrativa real.

## Implantação e rollback

Ordem recomendada: publicar primeiro o backend, validar health/OpenAPI e as novas rotas autenticadas; depois publicar o frontend e executar o checklist abaixo. Não executar migrations ou seeds para esta entrega.

Rollback é somente de código: restaurar os releases anteriores de backend e frontend. Como não há migration nem escrita automática em dados, não existe rollback de banco. Produtos arquivados/restaurados por usuários após o deploy devem ser tratados como ações comerciais legítimas, não revertidos em massa.

## Checklist manual

1. Em Produtos, combinar categoria, busca e cada estado; confirmar paginação.
2. Desativar um produto de teste e confirmar que continua listado e sai do cardápio.
3. Reativar e confirmar validações; liberar “Disponível hoje” somente de forma explícita.
4. Arquivar/restaurar e confirmar mesmo ID, vínculos e retorno inativo.
5. Configurar os dois pães em um lanche de teste e conferir preço final calculado pelo backend.
6. No público, testar Todos, uma categoria e busca; verificar seções e ausência de categorias vazias.
7. Finalizar pedido de teste, fechar/reabrir o navegador, consultar em Meus pedidos, compartilhar link e limpar histórico.
8. Conferir Novo pedido/lista/detalhe em desktop e mobile: somente um item ativo.
9. Testar senha, erro de login comum sem UUID e erro de produto no modal em retrato/paisagem.

