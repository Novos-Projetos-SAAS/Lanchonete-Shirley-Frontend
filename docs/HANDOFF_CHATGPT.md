# Handoff para análise

Data: 30/10/2026. Projeto: `Lanchonete-Shirley-Frontend`. Baseline do scaffold: `0f1bb4a`; alterações atuais ainda não foram commitadas nem enviadas.

## Etapa 9 — handoff prioritário

**Código implementado; banco e hardware pendentes.** Leia primeiro `docs/40_ARQUITETURA_IMPRESSAO_AUTOMATICA_ANDROID.md` a `45_MIGRATIONS_PENDENTES_IMPRESSAO.md` no backend irmão.

- Backend: migration 040 apenas versionada; `dispositivos_impressao`, pareamento hash-only/uso único, bearer exclusivo, heartbeat, SSE como sinal, reserva com lease, `envio_iniciado_em`, retry apenas antes do envio e `RESULTADO_INDETERMINADO` terminal.
- Frontend: painel de aparelhos/fila/alertas, código/deep link, revogação, teste e 2ª via; configuração separa Android, legado e pedidos PAINEL.
- Android: projeto irmão Kotlin/Compose, token no Keystore, HTTPS obrigatório, foreground service `connectedDevice`, reconciliação de 15 s, SPP/RFCOMM, CP860/CP850, 58/80 mm e corte opcional.
- Gates: frontend lint/typecheck/35 testes/build aprovados; backend lint e unitários aprovados. Android não compilado por ausência de toolchain. Integração/banco e impressora física não testados.
- Proibições respeitadas: nenhuma migration executada, nenhum seed, `.env`, Neon, APK instalado, deploy, commit ou push.

Próximo passo seguro: autorizar e aplicar 040 primeiro em TEST isolado, executar integração, configurar backend HTTPS, compilar no Android Studio e seguir a matriz física do documento 44. Só depois avaliar desenvolvimento/produção.

## Etapa 8 — handoff prioritário

**Resultado: IMPLEMENTADO E APROVADO NO ESCOPO LOCAL.** Leia primeiro os documentos 32–37 do backend irmão.

- Frontend: `/admin/relatorios` consome o catálogo; `/admin/relatorios/[codigo]` monta filtros e colunas por metadados, apresenta prévia em tabela desktop/cartões mobile e baixa PDF por `Blob` autenticado. Alterar filtro invalida a prévia; o corpo enviado a `gerar` e `pdf` é o mesmo.
- Backend: tabela de catálogo na migration 027, 12 funções `SECURITY INVOKER` nas migrations 028–039, seed idempotente 010, registro fixo de SQL, validação Zod, auditoria sem conteúdo e PDFKit server-side.
- Pedidos: salto somente para estado posterior coerente; cancelamento separado com motivo; pagamento sem motivo; estorno com motivo.
- Gates locais: backend lint + 81 unitários; frontend lint/TypeScript + 35 unitários + build; Playwright 29/29 e Axe aprovados. PDFs falsos foram inspecionados em 1 página retrato e 4 páginas paisagem.
- Banco: nenhuma migration/seed foi executada. Integração foi corretamente omitida porque `RUN_DB_INTEGRATION` não estava habilitado e `DATABASE_TEST_URL` não estava presente no processo. Não aplicar 027–039/010 sem validação do destino e autorização explícita.

Arquivos centrais: `src/services/reportRegistry.js`, `src/services/reportPdfService.js`, `src/config/reportCatalog.js` no backend; `src/features/admin/reports-page.tsx`, `src/services/admin-service.ts` e `src/features/orders/order-detail-page.tsx` no frontend.

## Etapa 7C — handoff prioritário

**Resultado: APROVADO NO ESCOPO LOCAL.** Leia primeiro `32_AJUSTES_VISUAIS_DASHBOARD.md` e `IMAGENS_PRODUTOS.md`.

- Dashboard: faixa de status efetivo aberto/fechado/erro, separada do controle manual; atalho “Configurar loja”; sidebar cinza-areia; cabeçalhos de tabela neutros com contraste; pedido manual dividido em grupos semânticos e resumo de erro focável.
- Catálogo demo: 14 WebP 900 × 900 em `public/images/produtos/`. `src/lib/product-images.ts` exige marcador `DEMO-SHIRLEY-V1` e nome conhecido; `imagem_url` da API vence sempre. Produto comercial homônimo permanece sem fallback demo.
- `src/components/shared/product-image.tsx` usa `next/image` nos ativos locais, preserva URLs remotas existentes sem ampliar hosts permitidos e cai para “Imagem em breve” em falha.
- X-Salada: `x-salada.webp` foi rejeitado e não é referenciado; `x-salada-corrigido.webp` é o ativo aprovado.
- Evidências antes/depois usam o prefixo `docs/screenshots/ajustes-dashboard-*`; a evidência pública atualizada mostra X-Bacon e refrigerante carregados.
- Gates: `npm.cmd run check` aprovado (lint, TypeScript, 31 unitários e build de 30 rotas); Playwright 27/27 aprovado.

Pendência: substituir imagens de IA por fotos reais autorizadas, com produto, marca e sabor efetivamente vendidos, antes de divulgação comercial. A referência visual de dashboard citada pelo pacote não foi fornecida; isso não bloqueou a implementação textual. Nenhuma `.env`, API de escrita, migration, seed, Neon, deploy, commit ou push foi tocado.

## Etapa 7B — handoff prioritário

**Resultado: APROVADO NO ESCOPO LOCAL.** Leia primeiro os documentos 27–31. O público agora usa o design “balcão digital limpo”; o painel administrativo permaneceu visualmente preservado. O fluxo adicionar → voltar ao cardápio foi implementado com retorno interno saneado, busca/categoria na URL, rolagem em sessionStorage e trava contra duplo clique. Carrinho só abre por ação explícita.

Frontend final: `npm.cmd run check` aprovado (lint, TypeScript, 11 arquivos/28 testes unitários e build Next 16 com 30 páginas); Playwright 26/26; Axe em todas as telas públicas e login; sete rotas públicas sem overflow nas dez larguras de 320 a 1440 px. Evidências usam o prefixo `docs/screenshots/redesign-publico-*`.

Não houve chamada de escrita à API real, backend, banco, migration, seed, `.env`, deploy, commit ou push. A imagem de referência citada no prompt não estava presente; isso permanece documentado em `31_PENDENCIAS_PUBLICO.md`.

## Etapa 7 — handoff prioritário

**Resultado: APROVADO NO ESCOPO LOCAL E NO TEST ISOLADO.** Leia `HANDOFF_PROXIMA_SESSAO.md` e os documentos 21–26 antes do histórico abaixo. Frontend: redesign responsivo, RBAC granular e convites; gates com 24 unitários, build e 21 Playwright. Backend: migration 026/seed 009, convite hash-only/Argon2id/uso único; 76 unitários e 48 integrações aprovadas. TEST está em 26 migrations/9 seeds; development permaneceu inalterado em 25/8. Não execute 026/009 em development sem autorização futura explícita.

## Etapa 6B — handoff prioritário

**Resultado: APROVADO COM RESSALVAS EXTERNAS.**

- Development validado contém `demo-shirley-v1`: 3 categorias, 14 produtos (7/3/4), 8 adicionais, 14 vínculos de pão e 42 vínculos de adicionais. Cada lanche tem pão de hambúrguer `0.00` e francês `2.50`.
- Loja fechada e zero pedidos criados. Pedidos demo foram deliberadamente bloqueados porque há dois administradores ativos e não se pode garantir ausência de inbox/Socket/Push/impressão/relatório real.
- API 3333: health, status, cardápio, detalhe X-Salada, pagamentos e OpenAPI responderam por GET. O navegador real observou apenas GET/OPTIONS.
- Frontend: `npm run check` passou (lint, TypeScript, 9 arquivos/20 unitários e build com 28 rotas); `npm run test:e2e` passou 16/16; `npm run test:homologation:readonly` passou 5 smokes, contrato demo e 2/2 Playwright reais.
- Evidências: `demo-cardapio-real-390.png`, `demo-cardapio-real-1280.png`, `demo-produto-real-390.png`, `demo-carrinho-real-390.png` e `demo-checkout-fechado-real-390.png`.
- Editor de produto: frontend lê vínculos existentes, bloqueia salvar durante carga/erro e preserva limites. Backend possui o novo `GET /admin/produtos/:id/vinculos`; lint e 71 unitários passaram. Após o restart, o OpenAPI real 3333 confirmou a rota com base `/api/v1` e autenticação por cookie.
- Browser autenticado contra TEST continua **BLOCKED**: não existe API 3334 persistentemente orquestrada com fixture/credencial efêmera/cleanup. Android Push, R2, QZ/impressora física e deploy também seguem externos.
- Nenhum `.env` foi modificado; nenhuma credencial foi exibida; nenhum seed/migration foi executado nesta etapa. O cleanup do catálogo foi apenas simulado e o demo permanece disponível.

Leia primeiro os documentos 16 a 20 desta pasta. Para remover o demo futuramente, siga `20_LIMPEZA_E_MANUTENCAO_DEMO.md`; a limpeza é seletiva e deve começar por dry-run.

## Etapa 6 — resumo verificável

**Avaliação: APROVADO COM RESSALVAS.**

- Development 3333: disponível. Duas rodadas GET em health, status, cardápio, pagamentos e OpenAPI passaram com HTTP 200, CORS exato/credenciais e formato válido. Um Playwright real Next 3000 → API 3333 passou em 390 × 844 e enviou somente GET/OPTIONS. Não houve login nem escrita nesse ambiente.
- TEST: o guard confirmou destino real isolado, ambiente não produtivo, 25 migrations e 8 seeds. Backend real: 69 unitários aprovados; 43 integrações aprovadas duas vezes (9 arquivos por rodada), incluindo PostgreSQL e Socket. Verificação final: loja fechada e zero fixtures residuais.
- Frontend: lint e typecheck aprovados; 20 unitários (9 arquivos), 15 E2E mockados e 1 E2E real somente leitura aprovados. Axe passou e nove larguras não apresentaram overflow. Build de produção aprovado no fechamento.
- Browser autenticado contra TEST: BLOCKED. Não foi improvisada uma API 3334 sem orquestração segura de secrets/fixture/cleanup. Foi entregue uma suíte opt-in que recusa URL diferente de 3334, ausência de opt-in/isolamento e credencial fora de `example.invalid`.
- Development permaneceu com o mesmo estado agregado read-only antes/depois: 27 tabelas, 25 migrations, 8 seeds, 1 usuário, 0 produtos, 0 pedidos e loja fechada. Não se afirma comparação criptográfica entre os dois momentos.

Correções principais: URL 3333; refresh de `/auth/me` com expiração controlada; limpeza após troca de senha; troco apenas em DINHEIRO; detalhe de usuário antes de substituir permissões; bloqueio de self-reset/desativação; controle manual da loja separado do status efetivo; ARIA em controles compostos; falso alerta offline; navegação Push limitada à mesma origem; tipos públicos alinhados.

Risco principal: ainda falta o elo browser Next autenticado → API TEST persistente para provar CRUDs/pedidos ponta a ponta. Também continuam pendentes Android/Push, R2, impressão e deploy.

Compartilhe primeiro: `docs/HANDOFF_CHATGPT.md`, `docs/STATUS_ATUAL.md`, `docs/10_PRE_FLIGHT_HOMOLOGACAO.md`, `docs/12_HOMOLOGACAO_FLUXOS_REAIS.md` e `docs/15_PENDENCIAS_HOMOLOGACAO_PRODUCAO.md`. Para contrato/correções, acrescente `docs/11_MATRIZ_CONTRATO_API.md` e `docs/13_CORRECOES_INTEGRACAO.md`.

## Histórico de implementação anterior

## Entrega

Frontend Next.js/App Router criado diretamente na raiz, com identidade “ficha da chapa”, site público completo e painel Android-first. Rotas públicas cobrem cardápio, produto, carrinho, checkout, confirmação e tracking. O painel inclui dashboard, pedidos, catálogo, loja, equipe, relatórios, auditoria, avisos, impressões e perfil.

Segurança implementada: cookies `HttpOnly` consumidos com `credentials: include`, CSRF em memória, refresh coordenado, erros estruturados, RBAC visual, carrinho sem PII, idempotência estável, conflito `409` com refetch e service worker sem cache de API/dados privados.

PWA/tempo real: manifest, ícones próprios, SW/offline, Push opt-in condicional e Socket.IO `/admin` com reconciliação REST/deduplicação.

## Evidência

- Node 24.14.1; npm 11.10.1; Next 16.4.3; React 19.3.0.
- Lint e typecheck passaram.
- Vitest: 8 arquivos/16 testes passaram.
- Playwright: 15 cenários mockados passaram, incluindo axe A/AA em cardápio/login e 9 larguras.
- Build de produção passou.
- Screenshots em `docs/screenshots/`.

O contrato foi validado estaticamente contra documentos, OpenAPI em código, rotas, schemas e services do backend irmão. Não houve chamada à API/Neon real, seed, pedido real ou deploy.

## Limitações e próximo passo

Homologar cookies/CORS/CSRF e DTOs contra uma API de teste sob HTTPS. Depois, validar Android/PWA/Push, R2, Socket e impressão física. O frontend não contém segredos nem conexão direta a banco.

Para uma análise mais profunda, envie primeiro:

1. `docs/STATUS_ATUAL.md`
2. este `docs/HANDOFF_CHATGPT.md`
3. `docs/03_CONTRATO_API_E_DECISOES.md`
4. `docs/08_TESTES_E_ACESSIBILIDADE.md`
5. `docs/09_IMPLANTACAO_E_PENDENCIAS.md`

Se a revisão for de código, inclua também `src/lib/api-client.ts`, `src/types/domain.ts`, `src/services/`, `src/features/checkout/checkout-page.tsx` e `tests/e2e/app.spec.ts`.
