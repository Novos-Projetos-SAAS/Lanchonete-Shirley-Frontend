# Etapa 7 — RBAC visual, rotas e consultas

Data: 2026-10-28.

## Regra aplicada

O backend continua sendo a autoridade. O frontend usa a mesma permissão em quatro camadas: item de navegação, limite da rota, consulta e ação. A rota administrativa monta o componente de página somente quando a permissão de leitura existe; assim, o estado 403 aparece sem disparar a consulta protegida. Administradores preservam o bypass já definido pelo contrato da sessão.

## Matriz principal

| Área | Leitura/rota | Ações adicionais |
| --- | --- | --- |
| Dashboard | `dashboard.visualizar` | novo pedido: `pedidos.criar`; atalhos: permissão do destino; Socket de pedidos: `pedidos.listar` |
| Pedidos | `pedidos.listar` | criar, status, pagamento e cancelamento usam `pedidos.criar`, `pedidos.status`, `pedidos.pagamento` e `pedidos.cancelar` |
| Produtos | `produtos.listar` | cadastro e vínculos: `produtos.gerenciar` |
| Categorias | `categorias.listar` | cadastro: `categorias.gerenciar` |
| Pães | `paes.listar` | cadastro: `paes.gerenciar` |
| Adicionais | `adicionais.listar` | cadastro: `adicionais.gerenciar` |
| Pagamentos | `metodos_pagamento.listar` | cadastro: `metodos_pagamento.gerenciar` |
| Loja | `loja.visualizar` | configuração: `loja.configurar`; abertura manual: `loja.status` |
| Equipe | `usuarios.listar` | criar, redefinir, desativar e permissões têm códigos próprios |
| Convites | `convites.listar` | criar, revogar, reemitir e consultar níveis: `convites.gerenciar` |
| Relatórios | `relatorios.visualizar` | consulta e CSV usam a mesma permissão |
| Auditoria | `logs.listar` | somente leitura |
| Avisos | `notificacoes.receber` | inbox e Push condicional |
| Impressões | `impressoes.listar` | solicitar comanda: `impressoes.solicitar` |
| Perfil | sessão autenticada | senha e logout pertencem ao próprio usuário |

## Consultas condicionais

- O catálogo de permissões só é buscado ao abrir a edição e com `permissoes.listar` + `permissoes.editar`.
- Níveis de acesso para convite só são buscados ao abrir o diálogo e com `convites.gerenciar`.
- Pães, adicionais e vínculos do produto só são buscados ao abrir “Opções”, dentro de `produtos.gerenciar`.
- O Socket.IO administrativo não conecta no dashboard sem `pedidos.listar`.
- Configuração da loja permanece consultável por `loja.visualizar`, mas todos os controles ficam desabilitados sem `loja.configurar`.

## Evidência

Os testes unitários provam que `PermissionBoundary` não monta o filho sem permissão. A integração real do backend exercita admin, atendente e entregador, incluindo 403 em módulos e convites não autorizados. O Playwright exercita navegação e ações administrativas com sessão administrativa mockada.

