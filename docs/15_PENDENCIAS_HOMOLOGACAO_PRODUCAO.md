# Pendências para homologação e produção

## P0 — antes de declarar ponta a ponta

1. Criar orquestrador seguro do ambiente B em 3334: guard real, secrets efêmeros, fixture rastreável, CORS localhost:3000, integrações externas desligadas e cleanup em `finally`.
2. Executar `npm run test:e2e:test-api` duas vezes e expandir a suíte para catálogo, checkout, pedido, status, pagamento, 409, permissões e reconexão Socket.

O antigo item de leitura de vínculos foi concluído na Etapa 6B com `GET /admin/produtos/:id/vinculos`; resta reiniciar a instância 3333 e exercitar o fluxo autenticado quando o ambiente browser TEST existir.

## P1 — Android/produção

- TalkBack, teclado virtual, fonte ampliada, retrato/paisagem, safe-area, instalação e atualização do service worker.
- HTTPS, domínio final, proxy, `ALLOWED_ORIGINS` exato e cookies Secure/SameSite/Domain compatíveis com a topologia.
- VAPID/Push real em Android, incluindo revogação de permissão e clique da notificação.
- Upload R2 real com tamanho/tipo/URL pública e política de retenção.
- Agente de impressão/QZ e impressora física, retry/lease e proteção do token.
- Observabilidade, alertas, rate limits atrás do proxy, rotação de segredos e backups/restauração Neon.

## P2 — manutenção

- Fixar explicitamente a intenção de TLS antes da futura mudança de semântica de `pg-connection-string`/`pg` para `sslmode=require`.
- Automatizar snapshot/guard/cleanup em CI protegido, sem disponibilizar banco TEST a forks não confiáveis.
- Revisar atualizações de dependências sem trocar majors durante homologação.
- Organizar e revisar o grande conjunto de mudanças ainda não commitadas; criar commits pequenos somente após revisão humana.

## Itens que não podem ser declarados aprovados nesta etapa

- Next.js autenticado/CRUD real contra uma API TEST persistente.
- Push entregue em Android, R2 real, QZ/impressora física e deploy.
- Igualdade criptográfica antes/depois do development; apenas o estado agregado read-only foi comparado.
