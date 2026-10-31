# Status atual

Atualizado em 30/10/2026.

## Etapa 9 — impressão automática Android Bluetooth

**IMPLEMENTADA NO CÓDIGO; MIGRATION E HOMOLOGAÇÃO FÍSICA PENDENTES.** O painel `/admin/impressoes` agora apresenta método ativo, fila, alertas de resultado indeterminado, aparelhos/turno, pareamento temporário, revogação, impressão de teste e 2ª via confirmada. A loja permite escolher Android Bluetooth, agente legado ou desabilitado e controlar separadamente pedidos criados no painel.

O backend irmão recebeu a migration versionada 040, credencial hash-only por aparelho, pareamento de uso único, heartbeat/SSE, lease atômica, backoff e fronteira conservadora de envio. Foi criado o projeto irmão Kotlin/Compose `Lanchonete-Shirley-Android-Print`, com Android Keystore, foreground service e adaptador SPP/ESC-POS 58/80 mm.

Gates web: frontend lint, TypeScript, 13 arquivos/35 testes e build de 30 rotas aprovados; backend lint e unitários aprovados. Android não foi compilado porque Gradle, SDK e ADB não existem neste host. A migration 040 não foi executada, a Neon não foi acessada, testes de integração não rodaram e nenhuma `.env`, seed ou dado foi alterado. Leia os documentos backend 40–45.

## Etapa 8 — relatórios PDF e regras de pedidos

**IMPLEMENTADO E APROVADO NO ESCOPO LOCAL.** O painel recebeu catálogo dinâmico com 12 relatórios gerenciais/cadastrais, formulário orientado por metadados, prévia paginada responsiva, totais e exportação PDF autenticada usando os mesmos filtros confirmados. O CSV legado foi preservado.

Pedidos agora permitem salto direto apenas para estados posteriores válidos da modalidade; cancelamento continua separado e exige motivo. `PENDENTE -> PAGO` não pede justificativa e `PAGO -> ESTORNADO` continua exigindo motivo e confirmação destrutiva.

Gates: frontend `npm.cmd run check` aprovado (lint, TypeScript, 13 arquivos/35 testes e build de 30 rotas); Playwright 29/29 e Axe WCAG A/AA aprovados. Backend irmão: lint e 14 arquivos/81 testes unitários aprovados; PDFs fictícios inspecionados em retrato e paisagem. Integração real não foi executada porque o processo não tinha opt-in nem `DATABASE_TEST_URL`. Nenhuma variável de ambiente, migration, seed ou banco foi alterado/executado.

Documentos técnicos: backend `docs/32_ANALISE_ETAPA_8.md` a `docs/37_PENDENCIAS_MIGRATIONS_ETAPA_8.md`. Evidências frontend: `etapa-8-relatorio-preview-390.png` e `etapa-8-pedido-salto-430.png`.

## Etapa 7C — dashboard e imagens demonstrativas

**APROVADO NO ESCOPO LOCAL.** O painel administrativo agora separa o status efetivo da loja dos controles manuais, agrupa semanticamente cliente e recebimento no pedido manual, reforça o cabeçalho das tabelas e usa sidebar cinza-areia com faixa terracota ativa. Há evidências antes/depois em 360, 390, 1024 e 1440 px.

Foram geradas e integradas imagens WebP 900 × 900 para os 14 produtos do catálogo `DEMO-SHIRLEY-V1`, com URL cadastrada sempre prioritária e associação local limitada por marcador + nome conhecido. A primeira versão do X-Salada foi rejeitada por sugerir molho; o código usa somente a versão corrigida. Bebidas são representações genéricas sem rótulos ou marcas. Todas são demonstrações de IA e devem ser substituídas por fotos reais antes de divulgação comercial.

Gates finais: `npm.cmd run check` aprovado (lint, TypeScript, 12 arquivos/31 testes unitários e build Next 16 de 30 rotas); Playwright 27/27 aprovado, incluindo Axe WCAG A/AA, fluxos existentes, imagens carregadas e responsividade. Nenhuma variável de ambiente, API de escrita, backend, migration, seed, banco, deploy, commit ou push foi alterado/executado.

Documentos: `32_AJUSTES_VISUAIS_DASHBOARD.md` e `IMAGENS_PRODUTOS.md`.

## Etapa 7B — redesign do frontend público

**APROVADO NO ESCOPO LOCAL.** Todas as páginas públicas foram redesenhadas para o conceito “balcão digital limpo”, com superfícies neutras, hero compacto, busca limpável, navegação por categorias, cards contidos, resumo sticky do carrinho no desktop e barra explícita no mobile. O painel administrativo foi preservado.

O fluxo de produto agora adiciona uma única vez e retorna ao cardápio, sem abrir o carrinho. Busca, categoria e rolagem são restauradas com URL/sessionStorage sem PII; o retorno é restrito à raiz pública e acesso direto usa fallback `/`. O checkout usa `Field`/`FieldGroup`, e confirmação/tracking foram refinados.

Gates: `npm.cmd run check` aprovado (lint, TypeScript, 28 unitários e build Next de 30 páginas); Playwright 26/26, Axe público/login aprovado e sete rotas sem overflow em 320, 360, 375, 390, 414, 430, 768, 1024, 1280 e 1440 px. Nenhum backend, banco, migration, seed, `.env`, pedido real ou deploy foi alterado.

Documentos: `27_REDESIGN_PUBLICO_DIAGNOSTICO.md` a `31_PENDENCIAS_PUBLICO.md`.

## Etapa 7 — redesign, RBAC e convites

**APROVADO NO ESCOPO LOCAL E NO BANCO TEST ISOLADO.** O frontend recebeu o design “balcão operacional sóbrio”, tabelas desktop/cartões mobile, formulários alinhados, cardápio público por categoria, perfil simplificado e RBAC aplicado em navegação, rota, consulta, Socket e ação. O fluxo de convites cobre administração e aceite público em `/convite`, sem persistir ou registrar o token bruto.

O backend recebeu somente a migration 026 e o seed 009 novos, endpoints de convite, CSPRNG de 32 bytes, hash-only, Argon2id, expiração configurável, locks para uso único, rate limit, CSRF/RBAC e respostas no-store/no-referrer. Uma regressão detectou e corrigiu a reemissão de convite expirado para revogar explicitamente o registro anterior.

Gates finais: frontend lint/TypeScript/build, 24 unitários e 21 Playwright; backend lint, 76 unitários e 48 integrações reais em TEST. O guard confirmou TEST isolado e o preparou em 26 migrations/9 seeds; development permaneceu inalterado em 25/8. Nenhum seed/migration foi executado em development, e nenhum `.env`, deploy, commit ou push foi realizado.

Documentos da etapa: `21_SKILLS_E_AUDITORIA_VISUAL.md` a `26_RELATORIO_FINAL_ETAPA_7.md`, além de `HANDOFF_PROXIMA_SESSAO.md`.

## Etapa 6B — catálogo real e correção do editor

**APROVADO COM RESSALVAS EXTERNAS.** O catálogo `demo-shirley-v1` está persistido no development validado: 14 produtos (7 lanches, 3 porções, 4 bebidas), 8 adicionais, 2 pães por lanche e pão francês `+2.50`. A loja permaneceu fechada e nenhum pedido foi criado.

O frontend real consumiu a API 3333 somente por GET/OPTIONS. O fluxo X-Salada → pão francês → Bacon → quantidade 2 → carrinho → checkout fechado passou em Playwright; há evidências em 390 px e 1280 px. Gates atuais: lint/typecheck/build aprovados, 20 unitários, 16 E2E mockados e 2 E2E reais aprovados.

O editor administrativo agora lê `GET /admin/produtos/:id/vinculos` antes de permitir a substituição integral. O endpoint/DTO foi implementado no backend, o frontend tem regressão E2E para a pré-carga e, após o restart, o OpenAPI real 3333 confirmou a rota protegida por cookie.

Documentos da etapa: `16_INVENTARIO_E_COBERTURA_ENDPOINTS.md`, `17_PLANO_DADOS_DEMONSTRACAO.md`, `18_RELATORIO_CARGA_DEMO.md`, `19_HOMOLOGACAO_VISUAL_COM_DADOS_REAIS.md` e `20_LIMPEZA_E_MANUTENCAO_DEMO.md`.

## Fechamento da Etapa 6 — histórico

Homologação classificada como **APROVADO COM RESSALVAS**. O frontend consumiu a API real de development somente por GET, com CORS/shape válidos e Playwright real em 390 × 844. O backend foi validado duas vezes contra o PostgreSQL TEST isolado (43 integrações por rodada) e terminou sem fixtures. A regressão frontend passou com 20 unitários e 15 E2E mockados. Lint, TypeScript e Axe estão verdes; o build final é registrado no handoff.

As ressalvas são objetivas: não havia uma instância HTTP TEST persistente e seguramente orquestrada para ligar o Next.js autenticado ao banco TEST. Assim, login/CRUD/pedido pelo browser real permanecem BLOCKED; a suíte opt-in `test:e2e:test-api` foi preparada, mas não executada. Push Android, R2, QZ/impressora e deploy também não foram homologados.

Documentação da etapa: `10_PRE_FLIGHT_HOMOLOGACAO.md`, `11_MATRIZ_CONTRATO_API.md`, `12_HOMOLOGACAO_FLUXOS_REAIS.md`, `13_CORRECOES_INTEGRACAO.md`, `14_RESPONSIVIDADE_ACESSIBILIDADE.md` e `15_PENDENCIAS_HOMOLOGACAO_PRODUCAO.md`.

## Histórico anterior à homologação real

### Situação registrada antes da Etapa 6

Implementação local consolidada: site público, painel administrativo, PWA, cliente HTTP e testes automatizados estão no projeto. Lint, TypeScript, 16 testes unitários, 15 cenários E2E mockados e build são a barreira local de qualidade. A integração foi construída a partir do código e dos documentos atuais do backend irmão, mas não foi exercitada contra uma API/Neon real nesta etapa.

## Funciona no ambiente local

- Cardápio, personalização, carrinho, checkout, confirmação e acompanhamento.
- Login e shell administrativo responsivo com visibilidade por permissão.
- Fila/detalhe de pedidos, mudança de status/pagamento/cancelamento com `versao`, CRUDs, loja, usuários, relatórios, logs, inbox, Push condicional, impressão e perfil.
- Manifest, ícones, service worker, página offline, Socket.IO e opt-in de Push.
- Estados de carregamento, vazio, erro, loja fechada, offline e conflito `409`.
- Capturas em `docs/screenshots/` e verificação sem rolagem horizontal nos breakpoints definidos.

## Ainda requer validação externa

- Cookies, CORS/Origin, CSRF e todos os DTOs em uma instância real da API.
- Instalação e Push em Android/Chrome com HTTPS e VAPID habilitado.
- Socket.IO em reconexão real, upload R2 e impressão física por agente externo.
- Auditoria manual ampliada de teclado/leitor de tela e homologação com o cardápio real.
- Topologia de domínio, variáveis de hospedagem e deploy; nenhum deploy foi feito.

## Bloqueios

Não há bloqueio para desenvolvimento local. As validações acima dependem de ambiente de homologação, configurações externas e/ou aparelho físico.

## Próximos 3 passos

1. Subir frontend e backend de homologação sob HTTPS e executar smoke tests somente com dados de teste.
2. Validar instalação PWA, Push e navegação operacional em um Android real.
3. Definir domínio/cookies, R2 e agente de impressão antes do deploy.
