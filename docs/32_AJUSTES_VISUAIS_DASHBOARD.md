# Ajustes visuais da dashboard

Data: 29/10/2026. Escopo: frontend administrativo existente. Nenhuma variável de ambiente, API, migration, seed ou banco foi alterado.

## Diagnóstico anterior

- O status efetivo da loja aparecia somente dentro de um atalho e podia ser confundido com o controle manual.
- O formulário de pedido manual colocava nome, telefone e modalidade de recebimento no mesmo fluxo visual, sem grupos semânticos.
- O cabeçalho das tabelas desktop usava quase a mesma superfície do restante da página.
- A sidebar desktop já era funcional, mas precisava de uma superfície cinza-areia mais clara e um indicador ativo mais firme.
- Os formulários administrativos de recursos e loja já usavam `Field`, grade consistente e `fieldset` de bloqueio. Não exigiram reestruturação adicional.

## Decisões aplicadas

- Faixa de status efetivo no topo da dashboard com texto, ícone e borda semântica; aberto, fechado, carregando e indisponível são estados distintos.
- O texto explica que a API combina controle manual, horários e configuração mínima. O atalho passou a se chamar “Configurar loja”.
- A ação “Ver controles” continua protegida por `loja.visualizar`.
- Pedido manual dividido em `fieldset`/`legend`: “Dados do cliente” e “Recebimento”, com descrição curta, ritmo vertical e endereço separado.
- Resumo de erros do pedido manual é focável e recebe foco após falha de validação.
- Cabeçalhos desktop usam os tokens `--table-header-bg`, `--table-header-text` e `--table-header-divider`; cartões mobile foram preservados.
- Sidebar desktop usa cinza-areia, borda discreta e faixa terracota de 4 px no item ativo. A navegação inferior mobile não mudou.

## Evidências visuais

Antes:

- `ajustes-dashboard-antes-pedido-manual-360.png`
- `ajustes-dashboard-antes-pedido-manual-1024.png`
- `ajustes-dashboard-antes-tabela-390.png`
- `ajustes-dashboard-antes-tabela-1440.png`
- `ajustes-dashboard-antes-loja-aberta-1440.png`
- `ajustes-dashboard-antes-loja-fechada-1440.png`

Depois:

- `ajustes-dashboard-depois-pedido-manual-360.png`
- `ajustes-dashboard-depois-pedido-manual-1024.png`
- `ajustes-dashboard-depois-tabela-390.png`
- `ajustes-dashboard-depois-tabela-1440.png`
- `ajustes-dashboard-depois-loja-aberta-1440.png`
- `ajustes-dashboard-depois-loja-fechada-1440.png`

Todos os arquivos ficam em `docs/screenshots/` e são produzidos por um cenário Playwright com API mockada.

## Arquivos principais

- `src/features/admin/dashboard-page.tsx`
- `src/features/orders/manual-order-page.tsx`
- `src/app/globals.css`
- `tests/e2e/app.spec.ts`

## Validação

- Lint: aprovado.
- TypeScript: aprovado.
- Unitários: 31/31 aprovados.
- Build Next 16: aprovado, 30 rotas.
- Playwright focal: fluxo público e ajustes administrativos, 2/2 aprovados.
- Regressão Playwright completa: 27/27 aprovada, incluindo Axe WCAG A/AA e ausência de overflow nas larguras cobertas.

## Pendência não bloqueante

A referência visual de dashboard citada pelo pacote não estava presente no ZIP nem entre os anexos recebidos. Os ajustes foram implementados a partir das especificações textuais, das regras das skills e da interface atual. As duas referências de fotografia de produto foram recebidas e usadas.

