# Implantação e pendências

Nenhum deploy foi executado.

## Variável

`NEXT_PUBLIC_API_URL` deve incluir `/api/v1`; `NEXT_PUBLIC_SITE_URL` define a origem canônica usada em metadata/sitemap. Ambas são públicas e nunca devem conter credenciais. Não colocar `DATABASE_URL`, segredos JWT/CSRF, senha admin, VAPID privada, token de impressão ou chaves R2 no frontend.

## Topologia recomendada

Servir frontend e API por HTTPS, preferencialmente no mesmo domínio-base. Se forem origins diferentes, revisar CORS com origin exato, `credentials`, atributos `SameSite`/`Secure`/Domain/Path dos cookies e proteção CSRF. Um proxy/BFF só deve ser adotado após revisão; não pode ser aberto, alterar o contrato nem armazenar tokens.

## Checklist de homologação

1. Executar `npm ci`, `npm run check` e `npm run test:e2e`.
2. Configurar API de homologação e testar login, refresh, logout e perfis.
3. Criar pedido exclusivamente com dados de teste; validar idempotência e conflito `409`.
4. Testar CRUDs, CSV, Socket e status da loja.
5. Validar HTTPS, manifest, instalação e Push em Android.
6. Configurar R2 somente no backend e validar URLs/hosts de imagens.
7. Validar agente de impressão separado e fallback de visualização 58 mm.
8. Revisar headers no provedor, observabilidade sem PII, robots e domínio canônico.

## Pendências operacionais

- Credenciais/domínio de homologação e política final de cookies.
- VAPID e aparelho Android para Push.
- Bucket/CDN R2 e fluxo de upload fornecido pelo backend.
- Agente/servidor de impressão e impressora 58 mm.
- Cardápio, horários e usuários reais — devem ser cadastrados pelo processo autorizado, não por seed do frontend.
