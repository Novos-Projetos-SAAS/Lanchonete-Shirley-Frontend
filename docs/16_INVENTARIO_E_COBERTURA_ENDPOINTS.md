# Inventário e cobertura de endpoints — Etapa 6B

Atualizado em 28/10/2026. O inventário cruza `src/services`, telas consumidoras, rotas do backend irmão e evidência automatizada. Os níveis usados são: **REAL-GET** (API development 3333), **TEST-DB** (integração backend em PostgreSQL isolado), **MOCK-E2E**, **UNIT** e **BLOCKED**.

| Domínio | Métodos e paths consumidos | Tela/serviço | Evidência atual |
|---|---|---|---|
| Saúde e contrato | `GET /health`, `/openapi.json` | scripts de smoke | REAL-GET |
| Loja pública | `GET /loja/status` | home e checkout | REAL-GET + MOCK-E2E |
| Cardápio | `GET /cardapio`, `/cardapio/produtos/:id` | home e personalização | REAL-GET com 14 produtos + MOCK-E2E |
| Pagamentos | `GET /metodos-pagamento` | checkout | REAL-GET com 4 métodos + MOCK-E2E |
| Pedido web | `POST /pedidos` | checkout | TEST-DB + MOCK-E2E; não enviado em development |
| Tracking | `GET /pedidos/acompanhar/:codigo` | acompanhamento | TEST-DB + MOCK-E2E |
| Autenticação | `GET /auth/csrf`, `/auth/me`; `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/logout-all`, `/auth/alterar-senha` | AuthProvider/perfil | UNIT + TEST-DB; browser TEST BLOCKED |
| Dashboard | `GET /admin/dashboard` | painel | TEST-DB + MOCK-E2E |
| Pedidos admin | `GET /admin/pedidos`, `/:id`; `POST /admin/pedidos`, `/:id/cancelar`; `PATCH /:id/status`, `/:id/pagamento` | fila, detalhe e pedido manual | TEST-DB + MOCK-E2E parcial |
| Catálogo CRUD | `GET/POST/PATCH/DELETE /admin/{categorias,produtos,tipos-pao,adicionais,metodos-pagamento}` | cadastros | TEST-DB + MOCK-E2E |
| Vínculos de produto | `GET /admin/produtos/:id/vinculos`; `PUT /:id/tipos-pao`, `/:id/adicionais` | diálogo “Opções” | GET/DTO publicado no OpenAPI real 3333; MOCK-E2E comprova pré-carga |
| Loja admin | `GET/PATCH /admin/loja/configuracoes`; `GET/PUT /admin/loja/horarios`; `PATCH /admin/loja/status` | operação da loja | TEST-DB |
| Usuários/RBAC | CRUD de `/admin/usuarios`; `PATCH /:id/permissoes`; `POST /:id/redefinir-senha`; `GET /admin/niveis-acesso`, `/admin/permissoes` | equipe | TEST-DB + MOCK-E2E parcial |
| Relatórios | `GET /admin/relatorios/{vendas,produtos,adicionais,pagamentos,horarios}` e `/vendas.csv` | relatórios | TEST-DB; browser real BLOCKED |
| Auditoria | `GET /admin/logs` | logs | TEST-DB |
| Notificações | `GET /admin/notificacoes`, `/nao-lidas`; `PATCH /:id/lida` | inbox | TEST-DB |
| Push | `GET /admin/push/configuracao`; `POST/DELETE /admin/push/inscricoes` | opt-in Push | contrato/TEST-DB; entrega Android BLOCKED |
| Impressão | `GET /admin/impressoes`; `POST /admin/pedidos/:id/impressoes` | fila/comanda | TEST-DB; hardware BLOCKED |
| Tempo real | Socket.IO `/admin` | pedidos, loja e inbox | TEST-DB; browser real BLOCKED |

## Correção do editor de vínculos

O frontend deixou de abrir o formulário presumindo conjunto vazio. Ao abrir o diálogo, dispara em paralelo os catálogos de pães/adicionais e `GET /admin/produtos/:id/vinculos`; o botão de salvar fica desabilitado durante carga ou erro. A pré-carga é inicializada no callback assíncrono da abertura, compatível com React 19, e o teste E2E valida pão francês marcado, pão de hambúrguer desmarcado, Bacon marcado e limite `2`.

## Limites honestos

- Após o restart informado pelo usuário, o OpenAPI real confirmou `GET /admin/produtos/{id}/vinculos` sob `server_base=/api/v1`, protegido por cookie.
- Development recebeu somente o catálogo demonstrativo autorizado. O navegador real fez apenas GET/OPTIONS e não criou pedidos.
- O elo Next autenticado → API TEST 3334 continua bloqueado até existir orquestração segura de fixture, credenciais efêmeras e cleanup.
