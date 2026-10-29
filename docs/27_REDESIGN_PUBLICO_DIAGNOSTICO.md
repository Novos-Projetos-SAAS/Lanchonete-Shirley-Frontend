# Diagnóstico do redesign público — Etapa 7B

Data: 2026-10-28.

## Escopo auditado

O escopo desta etapa é exclusivamente o frontend público: cardápio, produto, carrinho, checkout, confirmação e acompanhamento. O painel administrativo, o backend, migrations, seeds, bancos e arquivos `.env` ficam fora do escopo e não devem ser alterados.

Foram revisados o shell público, todas as rotas em `src/app/(public)`, os componentes de catálogo, carrinho, checkout e pedidos, o store persistido, os serviços públicos, os testes Vitest/Playwright e os estilos globais. Também foram consultadas as guias locais do Next.js 16 sobre navegação, Server/Client Components, CSS e imagens.

## Limitação da referência visual

O prompt cita `referencias_visuais/site_publico_referencia.png`, mas o arquivo não existe no projeto nem no caminho de Downloads informado. Portanto, não foi possível fazer comparação pixel a pixel. A implementação seguirá o briefing textual e a interface atual, sem inventar fotografia ou conteúdo comercial. A ausência da referência também será mantida em `31_PENDENCIAS_PUBLICO.md`.

## Estado anterior

- O painel administrativo já usa superfícies neutras, bordas discretas e controles contidos; ele deve permanecer inalterado visual e funcionalmente.
- O público ainda redefine os tokens para creme (`#fffaf3`) e usa um hero alto em amarelo claro, ornamentos circulares, bilhete decorativo e sombras que dominam a primeira dobra.
- O cabeçalho funciona, mas não oferece um resumo suficientemente claro do pedido em andamento.
- O cardápio já agrupa produtos por categoria, porém os filtros escondem seções e não preservam busca/categoria/rolagem ao entrar e sair do produto.
- A busca não possui ação explícita de limpar.
- O desktop não possui resumo do carrinho ao lado do cardápio; o atalho flutuante é o mesmo em todas as larguras.
- Os cards são compactos, mas a ação é apenas uma seta e o retorno de navegação não carrega contexto.
- Ao adicionar um produto, `ProductCustomizer` chama `router.push('/carrinho')`; isso viola o novo fluxo, que deve retornar ao cardápio, manter contexto e só abrir o carrinho mediante ação explícita.
- Não há trava síncrona contra cliques muito rápidos antes da navegação.
- O carrinho, checkout, confirmação e tracking funcionam, mas ainda carregam partes da linguagem visual anterior e podem ganhar hierarquia mais previsível.
- `Field` já associa rótulo, dica e erro por ARIA; o checkout precisa manter esse contrato e organizar os grupos com espaçamento estável.
- A suíte E2E atual valida o redirecionamento automático ao carrinho e precisa ser substituída pela regressão pedida na Etapa 7B.

## Restrições de dados e integração

- O carrinho persiste apenas dados do pedido, sem dados pessoais do checkout.
- O contexto do cardápio deve guardar somente busca, categoria e posição de rolagem; nada de PII.
- A API de desenvolvimento pode ser consultada somente por `GET`/`OPTIONS`. Escritas permanecem simuladas nos testes locais.
- Nenhuma alteração de backend, banco, seed, migration, `.env`, deploy, commit ou push faz parte desta etapa.

## Riscos e decisões

1. **Histórico inseguro:** `router.back()` não garante retorno ao cardápio. Será usado um destino interno validado, com fallback `/`.
2. **Estado obsoleto:** categoria e busca precisam ser validadas contra dados carregados; categoria inexistente volta para “Todos”.
3. **Rolagem prematura:** a restauração deve aguardar o cardápio renderizar e ser limitada à altura real do documento.
4. **Duplicidade:** o clique de adicionar terá trava imediata e o botão ficará desabilitado durante a transição.
5. **Regressão administrativa:** estilos novos serão escopados em `.site-shell`/classes públicas, e uma captura do painel será comparada visualmente.
6. **Imagens remotas:** os produtos continuarão exibindo a URL fornecida pela API ou um placeholder honesto; nenhuma fotografia será inventada.

## Critérios de saída

- Adicionar produto retorna ao cardápio com toast, badge e subtotal atualizados.
- Carrinho abre somente por ação explícita.
- Busca, categoria e rolagem sobrevivem ao fluxo de personalização.
- Acesso direto a produto usa fallback seguro para `/`.
- Validação inválida permanece no produto e aponta os erros.
- Cliques rápidos não duplicam item.
- Todas as telas públicas passam em 320, 360, 375, 390, 414, 430, 768, 1024, 1280 e 1440 px sem overflow horizontal.
- Axe, lint, TypeScript, unitários, build e E2E ficam verdes.

