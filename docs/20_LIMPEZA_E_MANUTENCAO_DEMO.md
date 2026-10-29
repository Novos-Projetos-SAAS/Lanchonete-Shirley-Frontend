# Limpeza e manutenção da demonstração

## Operação segura

Execute os comandos no backend irmão. Eles carregam as URLs somente do ambiente local protegido; nunca copie valores para terminal, documentação ou Git.

```powershell
npm run demo:dry-run

$env:RUN_DEMO_SHIRLEY='true'
$env:CONFIRM_DEMO_DEVELOPMENT='true'
try {
  npm run demo:apply
  npm run demo:cleanup:dry-run
  # Execute a linha abaixo apenas quando a remoção do catálogo for desejada.
  # npm run demo:cleanup
}
finally {
  Remove-Item Env:RUN_DEMO_SHIRLEY -ErrorAction SilentlyContinue
  Remove-Item Env:CONFIRM_DEMO_DEVELOPMENT -ErrorAction SilentlyContinue
}
```

## O que a limpeza remove

- Apenas os 14 produtos e 8 adicionais rastreados em `.local/demo-shirley-state.json` e ainda portadores do marcador.
- Vínculos desses registros, pela mesma transação.
- O acréscimo demonstrativo do pão francês é restaurado somente se o valor não tiver sido alterado por outra operação.

Logs de auditoria são preservados. Categorias, pães seed, pagamentos, usuários, pedidos, migrations e seeds não são removidos. Se existir referência em item de pedido ou divergência de marcador/identidade, a limpeza falha fechada.

## Manutenção

- Reaplicar `demo:apply` é idempotente e serve como verificação de drift.
- Antes de nova homologação, confirme loja fechada e rode `npm run test:demo:real` no frontend.
- Nunca use esses comandos em produção. Não execute seed/migration para manter o catálogo demo.
- O restart de 28/10/2026 foi confirmado: o OpenAPI 3333 contém `GET /admin/produtos/{id}/vinculos` com base `/api/v1` e autenticação por cookie.
