# Etapa do painel administrativo

## Navegação e páginas

O shell em `src/components/layout/admin-shell.tsx` usa sidebar no desktop e barra inferior com safe area no Android. As rotas entregues são:

- `/admin`: indicadores, loja e atalhos.
- `/admin/pedidos`, `/novo` e `/[id]`: filtros, pedido manual, detalhe, transições, pagamento, cancelamento, conflito de versão e comanda.
- `/admin/produtos`, `/categorias`, `/paes`, `/adicionais`, `/metodos-pagamento`: telas separadas de CRUD.
- `/admin/loja`: configurações, abrir/fechar, horários e impressão.
- `/admin/usuarios`: cadastro, ativação, nível/permissões e redefinição de senha.
- `/admin/relatorios`: período, indicadores, gráficos responsivos, dados e CSV oficial.
- `/admin/logs`, `/notificacoes`, `/impressoes` e `/perfil`.

## Regras

Produtos `LANCHE` novos são enviados inativos; a interface orienta associar pão antes de ativar. Vínculos de pães/adicionais avisam que a operação substitui o conjunto. Ações aparecem conforme permissões, sem assumir que isso substitui RBAC no servidor. Relatórios consomem totais oficiais; cancelados não são recalculados pelo browser.

## Evidência e limites

Playwright cobre login, filtro de pedidos, detalhe, atualização de status e catálogo vazio/responsivo. Os formulários chamam serviços reais em runtime, mas os testes usam interceptação. CRUD, CSV, redefinição de senha, upload de imagem e impressão ainda precisam de smoke test contra homologação; upload R2 dedicado não foi ativado.
