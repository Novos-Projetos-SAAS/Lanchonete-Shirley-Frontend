# Relatório da carga demo

Data da execução: 27–28/10/2026. Destino: banco de **development** validado por identidade real e distinto de TEST. Nenhuma URL, credencial ou identidade de usuário foi registrada.

## Resultado

| Verificação | Resultado |
|---|---|
| Dry-run inicial | aprovado após guardas |
| Primeira aplicação | 14 produtos e 8 adicionais criados; pão francês atualizado |
| Segunda aplicação | zero criações/atualizações; estado reconhecido como inalterado |
| Vínculos | 14 de pão e 42 de adicionais |
| Divisão dos produtos | 7 lanches, 3 porções, 4 bebidas |
| Loja | fechada |
| Pedidos criados | 0 |
| Cleanup dry-run | 14 produtos e 8 adicionais selecionados; restauração do pão prevista; não executado |

O catálogo foi mantido intencionalmente para a homologação. A API real confirmou por GET: 3 categorias, 14 produtos, dois pães por lanche, pão francês `+2.50`, oito adicionais distintos, 42 vínculos e quatro métodos de pagamento.

## Observação operacional

O baseline anterior tinha um administrador e, no momento da carga, havia dois administradores ativos. O mecanismo não leu nem exibiu PII e não alterou usuários; a guarda foi ajustada para exigir ao menos um administrador ativo, não uma contagem fixa. Essa descoberta reforçou a decisão de não criar pedidos em development.
