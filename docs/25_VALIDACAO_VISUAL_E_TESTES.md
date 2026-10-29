# Etapa 7 — validação visual e testes

Data: 2026-10-28.

## Resultado automatizado

| Gate | Resultado |
| --- | --- |
| Frontend ESLint | aprovado, zero warnings |
| Frontend TypeScript | aprovado sem emissão |
| Frontend Vitest | 10 arquivos, 24 testes aprovados |
| Frontend build Next.js | aprovado, 30 rotas geradas |
| Frontend Playwright mockado | 21 cenários aprovados |
| Axe WCAG A/AA | zero violações detectáveis no cardápio e login |
| Backend ESLint | aprovado |
| Backend Vitest unitário | 13 arquivos, 76 testes aprovados |
| Backend integração PostgreSQL TEST | 10 arquivos, 48 testes aprovados, com cleanup final |

O Playwright verificou o cardápio nas larguras 320, 360, 375, 390, 414, 430, 768, 1024 e 1440 px. A tabela de convites também foi exercitada em 320, 768 e 1440 px. Nenhuma dessas páginas apresentou rolagem horizontal.

## Inspeção visual

As capturas foram abertas em resolução original e revisadas depois dos testes:

- `convites-admin-1440.png`: tabela semântica, filtros compactos, menu de linha e sidebar neutra.
- `convites-admin-390.png`: cartão compacto, ação primária larga e navegação inferior.
- `convite-publico-390.png`: formulário focado, autofill, visibilidade de senha e token ausente da URL/captura.
- `cardapio-390.png`: categorias agrupadas e cartões sem fotos inventadas.
- `checkout-390.png`: seções espaçadas, alvos de toque e resumo próximo da confirmação.

A captura do checkout foi ajustada para fechar o toast transitório antes do registro, evitando ocultar um campo na evidência visual.

## Banco e privacidade

O guard classificou o banco TEST anterior como atualizável, confirmou que não era produção nem o mesmo destino de development e aplicou apenas 026/009. Resultado: 26 migrations, 9 seeds e 38 permissões em TEST. O processo reportou `development_unchanged: true`. Nenhuma URL, credencial, cookie, token bruto ou dado pessoal real foi registrado na documentação.

A verificação final somente leitura confirmou 28 tabelas, loja fechada e `fixtures_remaining: 0`.

## Limites externos

Não houve deploy, envio de e-mail, Push Android físico, R2, QZ Tray ou impressão física. O driver PostgreSQL emitiu aviso não bloqueante sobre mudança futura na semântica de `sslmode`; nenhuma conexão falhou. A API de development não recebeu a migration 026 por decisão explícita desta etapa.

