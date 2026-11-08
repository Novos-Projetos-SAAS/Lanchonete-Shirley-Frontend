# Padronização de erros e feedback

Data: 08/11/2026.

## Causa e solução

`ApiError` transportava `code`, `request_id` e `details`, mas os formulários normalmente consumiam apenas `message`. No editor de produto o modal permanecia aberto, porém o usuário recebia um resumo sem vínculo com `Preço base`. Foram criados um normalizador reutilizável e um resumo acessível, preservando a arquitetura atual.

O fluxo crítico agora:

1. impede preventivamente a ativação sem preço quando a informação já está no cliente;
2. continua aceitando e exibindo o `422` do backend como fonte de verdade;
3. mantém o diálogo e todos os valores;
4. mostra “Não foi possível ativar o produto. Informe o preço base antes de ativar o produto.”;
5. marca `Preço base` com `aria-invalid`, associa a mensagem com `aria-describedby`, rola e move o foco;
6. limpa o erro quando o campo é corrigido e conclui normalmente no reenvio.

## Componentes e fluxos

- `src/lib/api-errors.ts`: mensagens por status/rede/timeout, mapeamento de `details`, compatibilidade por `code` e limpeza por campo.
- `src/lib/api-client.ts`: valida envelope não confiável e aplica fallback para 400, 401, 403, 404, 409, 413, 422, 429 e 5xx.
- `FormErrorSummary`: alerta persistente, links para campos, referência `request_id`, foco e rolagem; permanece visível em diálogo longo.
- `Field`: reutilizado para erro inline, `aria-invalid` e `aria-describedby`.
- Aplicado a catálogo, vínculos de produto, usuários, convites administrativos/públicos, login, alteração de senha, configurações da loja, checkout e pedido manual.
- Ações rápidas de relatórios, pedidos e impressão usam o mesmo fallback seguro.
- O build usa o fallback oficial Webpack (`next build --webpack`) porque o Turbopack entrou em panic ao criar processos CSS neste Windows; não houve mudança funcional da aplicação.

## Testes

- `npm run check`: lint, TypeScript, 58 unitários e build de 30 rotas aprovados.
- Playwright: 32/32 aprovados no conjunto completo; o caso novo cobre viewport 390 px, validação preventiva, resposta API `422`, modal aberto, valores preservados, ausência de sucesso indevido, foco no preço e reenvio correto.
- Axe e testes de ausência de overflow existentes continuam aprovados.

## Cuidados

Não trocar mensagens específicas do backend por mensagens genéricas. Ao criar novo formulário, usar `toFormError`, `FormErrorSummary` e `Field error`. Manter o refresh 401 coordenado; não repetir automaticamente pedidos, pagamentos ou impressão. Nenhum `.env`, banco, migration, seed, deploy ou API real foi alterado.
