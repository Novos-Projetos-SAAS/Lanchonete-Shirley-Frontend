# Testes e usabilidade — Etapa 10

Data: 31/10/2026.

## Resultados automatizados

| Gate | Resultado |
| --- | --- |
| `npm.cmd run lint` | Aprovado |
| `npm.cmd run typecheck -- --incremental false` | Aprovado; `--incremental false` evitou escrita bloqueada do `tsbuildinfo` no sandbox |
| `npm.cmd run test` | 15 arquivos, 43 testes aprovados |
| `npm.cmd run build` | Aprovado; 30 rotas Next.js |
| `npm.cmd run test:e2e` | 31/31 Playwright mockados aprovados |
| Backend `npm.cmd run lint` | Aprovado |
| Backend `npm.cmd run check` | Aprovado: lint e 15 arquivos/88 testes unitários |

Os testes novos cobrem `ativo=false`, busca+filtro, 10 por página, segunda página da Equipe, convite aceito sem menu, ações de convite pendente, Drawer `Mais` para admin/atendente/entregador, rotas permitidas, Escape, ausência de overflow e Axe WCAG A/AA no Drawer. A suíte existente preserva Axe nas telas públicas/login e responsividade geral.

## Evidências sem dados reais

- `docs/screenshots/etapa-10-equipe-filtros-1440.png`
- `docs/screenshots/etapa-10-convites-acoes-1440.png`
- `docs/screenshots/etapa-10-mais-390.png`

As imagens usam fixtures `example.invalid`; não contêm credenciais ou dados da Neon.

## O que não foi testado

- API autenticada contra banco real; todos os cenários Playwright desta etapa são mockados.
- Integração PostgreSQL e migration 040, deliberadamente não executadas.
- Android, Bluetooth e impressão física. Android Studio, SDK, Gradle, wrapper, ADB e Kotlinc não estão disponíveis neste host.
- Auditoria manual completa por leitor de tela; os checks automatizados não substituem homologação assistiva.

## Checklist manual futuro

1. Repetir Equipe com dados de TEST isolado, inclusive nomes acentuados conforme collation do PostgreSQL.
2. Testar o Drawer com os três perfis reais e navegação Back/gestos em 320–430 px.
3. Confirmar ações de convites pendentes/expirados/revogados/aceitos no TEST.
4. Após autorização futura da migration 040, validar painel de impressão com telefone e impressora reais.
