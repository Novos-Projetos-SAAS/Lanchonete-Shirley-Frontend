# Plano de dados de demonstração

## Objetivo e marcador

O conjunto `demo-shirley-v1` permite homologar o frontend com dados persistentes e identificáveis em **development**, sem seeds e sem migrations. Produtos e adicionais carregam o marcador `[DEMO-SHIRLEY-V1]`; o estado local de IDs/snapshot fica em `.local/`, ignorado pelo Git e sem credenciais.

## Catálogo previsto

- 3 categorias seed reutilizadas: lanches, porções e bebidas.
- 14 produtos: 7 lanches, 3 porções e 4 bebidas.
- 8 adicionais; 42 vínculos distribuídos apenas entre os lanches.
- 2 pães por lanche: hambúrguer sem acréscimo e francês com `2.50`.
- Porções e bebidas sem pães nem adicionais.
- Loja fechada, impressão automática desligada e zero pedidos criados pelo mecanismo.

## Guardas

O comando é dry-run por padrão. Escrita exige simultaneamente `RUN_DEMO_SHIRLEY=true`, confirmação de development e `--apply`. Antes da transação, o mecanismo compara a identidade real de development e TEST, recusa produção, TLS/destinos inseguros, migrations/seeds divergentes, integrações Push/R2/QZ habilitadas, loja aberta, impressão automática, pedidos existentes ou catálogo não demonstrativo inesperado.

Aplicação e limpeza são transacionais e idempotentes. A limpeza aceita somente IDs rastreados e marcador correto, recusa itens referenciados por pedidos, restaura o acréscimo anterior do pão francês quando ainda é seguro e preserva logs de auditoria.

## Pedidos demonstrativos

Não foram criados. A etapa encontrou dois administradores ativos no development e não há garantia de que um pedido não alcance inbox, Socket, Push, impressão ou relatório usado por uma pessoa real. O catálogo atende à homologação pública sem ampliar esse risco; pedidos permanecem reservados ao banco TEST isolado.
