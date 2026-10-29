# Etapa 7 — convites e segurança

Data: 2026-10-28.

## Fluxo entregue

1. Um administrador ou perfil com `convites.gerenciar` informa e-mail e nível.
2. A API normaliza o e-mail, gera 32 bytes com CSPRNG e persiste somente SHA-256 do token.
3. O token bruto aparece apenas na resposta imediata de criação ou reemissão. Não existe integração de e-mail nesta etapa.
4. O frontend forma localmente `/convite#token=...`. O fragmento não é enviado no request HTTP inicial.
5. A página remove o fragmento com `history.replaceState` antes de validar.
6. Validação e aceite enviam o token somente no corpo de POST.
7. O aceite cria a senha com Argon2id, marca o convite como aceito e exige login normal.

## Controles

| Ameaça | Controle |
| --- | --- |
| Vazamento no banco | hash SHA-256 único; token bruto nunca persistido |
| Vazamento em URL/referrer | fragmento, remoção imediata, `Referrer-Policy: no-referrer` |
| Cache/indexação | `Cache-Control: no-store`, `Pragma: no-cache`, `X-Robots-Tag: noindex, nofollow` e metadata noindex |
| Reuso/concorrência | transação, lock do registro e estado terminal; duas aceitações paralelas criam uma conta |
| Convites duplicados | lock transacional por e-mail normalizado |
| Expiração/revogação | validade configurável, padrão 48 h; revogação imediata; reemissão revoga o registro anterior |
| Enumeração | erro público genérico para inexistente, expirado, revogado, aceito ou conta concorrente |
| Força bruta | rate limit separado para validar e aceitar, com chave HMAC de privacidade |
| Escalada de privilégio | RBAC, CSRF e Origin no administrativo; somente admin convida outro admin |
| Segredo em observabilidade | redaction do logger; auditoria contém somente IDs e ação |
| Senha fraca | mínimo de 12 caracteres, maiúscula, minúscula e número; hash Argon2id |

## Contrato HTTP

- `GET /api/v1/admin/convites`: lista sem token/hash.
- `POST /api/v1/admin/convites`: cria e devolve o token uma vez.
- `GET /api/v1/admin/convites/niveis-acesso`: níveis ativos para o formulário.
- `POST /api/v1/admin/convites/:id/reemitir`: revoga o anterior e devolve um novo token uma vez.
- `POST /api/v1/admin/convites/:id/revogar`: revogação idempotente enquanto não aceito.
- `POST /api/v1/convites/validar`: validação pública genérica.
- `POST /api/v1/convites/aceitar`: aceite público atômico.

## Persistência controlada

A única migration nova é `026_convites_usuarios.js`; o único seed novo é `009_permissoes_convites.js`. As migrations 001–025 e seeds 001–008 não foram alterados. A preparação foi autorizada e executada somente em TEST após comparação da identidade real com development. Nenhuma migration ou seed foi executada em development.

