# Correções de Equipe, Convites, navegação e paginação — Etapa 10

Data: 31/10/2026.

## Equipe

- A listagem administrativa aceita `ativo=true`, `ativo=false` ou todos e preserva o valor booleano `false` até o backend.
- Busca por nome/e-mail, filtro de situação e página são enviados juntos; qualquer mudança de filtro volta à página 1.
- A API administrativa inclui registros inativos/soft-deleted somente nessa listagem, sem reabrir acesso a detalhes protegidos.
- Ordenação por nome ganhou desempate por ID e exclusão do último item corrige a página corrente.

## Convites e menus de ação

- Convite aceito, sem ação aplicável, exibe `Sem ações` em vez de um menu vazio.
- Convites pendentes/expirados/revogados continuam expondo apenas as ações permitidas.
- `RowActions` ignora filhos vazios, fecha por Escape e clique externo e devolve o foco ao acionador.

## Navegação móvel

- A barra inferior mantém quatro destinos primários e um botão `Mais`, sem índices dependentes da ordem do array.
- `Mais` abre um Drawer com todos os destinos restantes autorizados pelo RBAC, incluindo `Meu perfil` como opção — não como redirecionamento automático.
- Escolher um destino fecha o Drawer e navega; perfis admin, atendente e entregador recebem somente suas rotas permitidas.

## Paginação

- Tabelas administrativas e relatórios usam 10 registros por página no frontend e no backend.
- Seletores internos de produtos/categorias/pães/adicionais continuam com limites maiores deliberados; não são tabelas de listagem.
- Repositórios aplicam ordenação determinística com ID como desempate para evitar repetição/salto entre páginas.

## Arquivos centrais

- `src/components/layout/admin-shell.tsx`
- `src/components/ui/index.tsx`
- `src/services/admin-service.ts`
- `src/features/admin/users-page.tsx`
- `src/features/admin/invitations-page.tsx`
- `tests/e2e/app.spec.ts`

Nenhuma variável de ambiente, migration, seed ou dado real foi alterado.
