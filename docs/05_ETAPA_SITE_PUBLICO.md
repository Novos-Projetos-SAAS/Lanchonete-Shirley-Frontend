# Etapa do site público

## Rotas e recursos

- `/`: status da loja, cardápio dinâmico, categorias, busca e carrinho flutuante.
- `/produto/[id]`: placeholder/foto, pão obrigatório somente para `LANCHE`, adicionais com limite, quantidade, observação e estimativa.
- `/carrinho`: itens por configuração, quantidade, remoção e persistência sem PII.
- `/finalizar`: retirada/entrega, endereço condicional, pagamento, troco condicional, validação Zod e bloqueio de envio duplicado.
- `/pedido/confirmado`: resumo seguro retornado pelo servidor e código opaco.
- `/acompanhar` e `/acompanhar/[codigo]`: busca e polling moderado condicionado à visibilidade.

## Regras sensíveis

`src/lib/order-rules.ts` valida pão e limite de adicionais. A estimativa do navegador é rotulada e reconciliada pelo retorno da API. A chave de idempotência é preservada para o mesmo body/tentativa e renovada quando o conteúdo muda. O checkout não inclui campos financeiros autoritativos. Loja fechada bloqueia envio, mas não consulta do menu.

## Testes

Unitários cobrem dinheiro, stepper, pão, adicionais, carrinho, idempotência e offline. E2E mockado percorre categoria → produto → pão francês → bacon → carrinho → checkout → confirmação, além de loja fechada e erro de rede. Nenhum pedido real foi enviado.
