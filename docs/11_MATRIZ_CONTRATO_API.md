# Matriz de contrato frontend ↔ API

Fonte de verdade consultada em 27/10/2026: rotas, schemas, controllers, services, repositories e OpenAPI do backend irmão, mais HTTP real somente leitura em 3333. `credentials: include` é usado em todas as chamadas; CSRF é exigido nas mutações autenticadas.

| Tela/operação | Função frontend | Método e path real | Entrada/retorno relevante | Autorização | Evidência/status | Divergência/correção |
|---|---|---|---|---|---|---|
| Saúde | smoke | `GET /health` | envelope `status/data` | pública | PASS HTTP real A | nenhuma |
| Status da loja | `publicService.status` | `GET /loja/status` | `aberta`, `mensagem`, loja/horários | pública | PASS HTTP real A | botão admin passou a usar `aceitar_pedidos`, sem confundir com abertura efetiva por horário |
| Cardápio | `publicService.menu` | `GET /cardapio` | categorias/produtos; IDs e dinheiro como string | pública | PASS HTTP real com 3 categorias/14 produtos | `ativo`/`disponivel_hoje` de opções públicas agora são opcionais nos tipos |
| Produto | `publicService.product` | `GET /cardapio/produtos/:id` | produto, pães vinculados, adicionais/limites | pública | PASS HTTP real no X-Salada + E2E real | dois pães e cinco adicionais confirmados no detalhe |
| Pagamentos | `publicService.paymentMethods` | `GET /metodos-pagamento` | `id`, `codigo`, `nome` | pública | PASS HTTP real A | troco agora só aparece/é enviado para `DINHEIRO` |
| Criar pedido web | `publicService.createOrder` | `POST /pedidos` | `Idempotency-Key`, cliente, entrega, pagamento, itens | pública, escrita | PASS backend TEST; frontend mockado; browser TEST BLOCKED | frontend preserva chave para o mesmo payload e limpa ao concluir |
| Acompanhar pedido | `publicService.track` | `GET /pedidos/acompanhar/:codigo` | código opaco e resumo | pública | contrato + mock | código não é tratado como ID incremental |
| CSRF | `getCsrfToken` | `GET /auth/csrf` | `csrf_token`, mantido só em memória | pública/sessão | unitário + backend TEST | nenhuma |
| Login | `AuthProvider.login` | `POST /auth/login` | email/senha → `usuario`; cookies HttpOnly | pública, rate limit | backend TEST; browser TEST BLOCKED | nenhum token em storage |
| Sessão | `AuthProvider` | `GET /auth/me` | usuário, nível e permissões | cookie | unitário | corrigido para tentar refresh coordenado uma vez |
| Refresh | `apiRequest` | `POST /auth/refresh` | cookie refresh + CSRF | cookie/CSRF | unitário + backend TEST | falha agora limpa estado e redireciona ao login; sem loop |
| Logout/logout-all | `AuthProvider.logout` | `POST /auth/logout[-all]` | 204/envelope conforme rota | cookie/CSRF | backend TEST + mock | cache/CSRF local são limpos |
| Alterar senha | `adminService.changePassword` | `POST /auth/alterar-senha` | atual/nova/confirmação | autenticada/CSRF | contrato | passou a aceitar refresh; UI limpa sessão revogada antes do login |
| Dashboard | `adminService.dashboard` | `GET /admin/dashboard` | período e agregados decimais | `dashboard.visualizar` | backend TEST + mock | nenhuma |
| Lista/detalhe de pedidos | `orders/order` | `GET /admin/pedidos[/:id]` | paginação/filtros/detalhe | `pedidos.listar` | backend TEST + mock | REST permanece fonte durável após Socket |
| Pedido manual | `adminService.createOrder` | `POST /admin/pedidos` | mesmo núcleo de regras, canal PAINEL | `pedidos.criar` + CSRF | backend TEST + mock parcial | homologação browser real pendente |
| Status | `updateOrderStatus` | `PATCH /admin/pedidos/:id/status` | `status`, motivo, `versao` | `pedidos.status` + CSRF | backend TEST + mock | 409 dispara refetch e nova decisão, sem replay silencioso |
| Pagamento | `updatePayment` | `PATCH /admin/pedidos/:id/pagamento` | status, motivo, `versao` | `pedidos.pagamento` + CSRF | backend TEST | IDs/dinheiro permanecem string |
| Cancelamento | `cancelOrder` | `POST /admin/pedidos/:id/cancelar` | motivo e `versao` | `pedidos.cancelar` + CSRF | backend TEST | nenhuma |
| CRUD de catálogo | `list/create/update/deleteResource` | `/admin/{categorias,produtos,tipos-pao,adicionais,metodos-pagamento}` | schemas específicos | permissões por recurso + CSRF em escrita | backend TEST + UI mockada | sem mudança de paths |
| Leitura de vínculos | `productLinks` | `GET /admin/produtos/:id/vinculos` | pães/adicionais atuais, ativos e inativos, limites | `produtos.listar` | OpenAPI real 3333 + backend implementado + E2E mockado | DTO explícito elimina a presunção de conjunto vazio |
| Vínculos produto/pão | `replaceProductBreads` | `PUT /admin/produtos/:id/tipos-pao` | lista completa de vínculos | `produtos.gerenciar` + CSRF | backend TEST + E2E mockado | salvar só é habilitado depois da leitura atual |
| Vínculos adicionais | `replaceProductAdditionals` | `PUT /admin/produtos/:id/adicionais` | vínculo, máximo, ativo | `produtos.gerenciar` + CSRF | backend TEST + E2E mockado | limites existentes são pré-carregados antes da substituição |
| Configuração da loja | `storeConfig/updateStoreConfig` | `GET/PATCH /admin/loja/configuracoes` | singleton de configuração | `loja.visualizar/configurar` | backend TEST | controle manual separado do status efetivo |
| Horários/status manual | `schedules/setStoreStatus` | `GET/PUT /admin/loja/horarios`; `PATCH /admin/loja/status` | horários; `aceitar_pedidos` | `loja.configurar/status` + CSRF | backend TEST | rótulo agora diz “permitir no horário” |
| Usuários | recursos genéricos | `/admin/usuarios` | usuário sem hash | permissões de usuários | backend TEST | ações de reset/desativar ocultas para a própria conta |
| Permissões do usuário | `setUserPermissions` | `PATCH /admin/usuarios/:id/permissoes` | nomes de permissão, substituição integral | `permissoes.editar` + CSRF | contrato | detalhe é buscado antes de abrir; evita apagar permissões ausentes na listagem |
| Reset de senha | `resetUserPassword` | `POST /admin/usuarios/:id/redefinir-senha` | `nova_senha` | `usuarios.redefinir_senha` + CSRF | backend TEST | self-reset impedido também na UX |
| Níveis/permissões | `accessLevels/permissionCatalog` | `GET /admin/niveis-acesso`; `GET /admin/permissoes` | catálogos | autenticada/permissões | contrato | usa `nome` como código real quando aplicável |
| Relatórios/CSV | `report/salesCsv` | `GET /admin/relatorios/*` e `/vendas.csv` | período; JSON ou `Response` binária | `relatorios.visualizar` | backend TEST | CSV não passa pelo parser de envelope |
| Logs | recurso admin | `GET /admin/logs` | filtros/paginação | `logs.visualizar` | backend TEST | somente leitura |
| Inbox | `notifications/unread/markRead` | `/admin/notificacoes*` | paginação/contador/leitura | autenticada + CSRF na marcação | backend TEST | Socket apenas invalida/reconcilia |
| Push | `pushConfig/subscribe/unsubscribe` | `/admin/push/configuracao` e `/inscricoes` | chave pública/PushSubscription | autenticada + CSRF | configuração desabilitada; entrega real BLOCKED | UI explica indisponibilidade |
| Impressões | `printJobs/requestPrint` | `/admin/impressoes`; `/pedidos/:id/impressoes` | fila/comanda | permissões + CSRF | backend TEST; física BLOCKED | QZ/agente externo não homologado |
| Upload | serviço de catálogo | rota admin de upload conforme OpenAPI | multipart/limites 413 | permissão + CSRF | contrato; R2 real BLOCKED | não houve upload real |
| Socket admin | `useAdminRealtime` | namespace `/admin` | `novo_pedido_recebido`, `pedido_atualizado`, `loja_atualizada`, `notificacao_recebida` | cookie e salas privadas | PASS backend TEST | deduplica `event_id` e invalida REST |
| Socket público | não obrigatório na UI atual | namespace `/publico` | status público | público | backend TEST/contrato | frontend mantém polling de 60 s; conexão browser real não exercitada |

## Envelopes e erros

Sucesso usa `status: "success"` e `data`. Erros usam `status`, `code`, `message`, `details` e `request_id`. O cliente preserva `status/code/request_id/details` em `ApiError`, diferencia timeout/rede e não tenta refresh em login, refresh, logout ou CSRF. Estados 400, 401, 403, 404, 409, 413, 422, 429 e 500 são tratados por mensagem estruturada; 409 de versão tem fluxo específico.

## Regras mantidas

- IDs bigint e valores monetários continuam strings.
- Backend recalcula preço, frete, total, disponibilidade e abertura.
- LANCHE exige pão vinculado; outros tipos não enviam pão; adicionais respeitam vínculo/máximo.
- ENTREGA exige endereço; RETIRADA envia `endereco: null`; troco depende de DINHEIRO.
- Cookies HttpOnly, CSRF em mutações e RBAC no servidor não foram enfraquecidos.
