# Sistema visual público — Etapa 7B

Data: 2026-10-28.

## Direção

**Balcão digital limpo:** uma interface de pedido rápida, legível e comercial, com cara de lanchonete real sem depender de decoração temática. A assinatura visual é o resumo compacto do pedido, presente no cardápio desktop e como barra de ação no mobile.

A busca de referência da skill de UI sugeriu uma direção “vibrante e blocada”, com vermelho/rosa intensos e tipografia alternativa. Ela foi descartada por conflitar com o briefing, com o painel existente e com a necessidade de continuidade. Permanecem Bricolage Grotesque nos títulos, Nunito Sans no corpo e o terracota já adotado pela marca.

## Tokens públicos

Os tokens raiz continuam atendendo ao painel. Dentro de `.site-shell`, o público deve usar:

| Papel | Valor | Uso |
|---|---:|---|
| fundo | `#f7f7f8` | fundo geral neutro |
| superfície | `#ffffff` | cards, cabeçalho e formulários |
| superfície secundária | `#f2f4f7` | placeholders e agrupamentos discretos |
| texto | `#25272b` | títulos e texto principal |
| texto secundário | `#667085` | descrições e metadados |
| borda | `#e4e7ec` | separação leve |
| terracota | `#a9342b` | CTA, seleção e links importantes |
| terracota hover | `#8d2e28` | feedback de hover/press |
| terracota suave | `#f8e9e7` | seleção discreta |
| mostarda | `#d6a34b` | detalhe raro, nunca fundo dominante |
| sucesso | `#25805a` | loja aberta e confirmação |
| perigo | `#b42318` | erros e remoção |

Raios permanecem entre 8 e 12 px. Sombras aparecem apenas em camadas flutuantes (toast, barra mobile, diálogo); cards normais usam borda e superfície.

## Tipografia e densidade

- `h1`: forte, porém contido; nenhuma manchete deve ocupar quase toda a primeira dobra.
- Títulos de seção: 24–32 px conforme largura.
- Corpo: 16 px, linha 1,5–1,6.
- Metadados: mínimo visual de 13 px e contraste compatível com WCAG AA.
- Preços usam números tabulares e permanecem alinhados.

## Componentes e comportamento

### Cabeçalho

- Altura compacta e sticky.
- Marca à esquerda; Cardápio, Acompanhar e Carrinho à direita quando houver espaço.
- Carrinho mostra quantidade e subtotal reais.
- Em mobile, mantém alvos de toque de pelo menos 44 px e reduz texto secundário antes de provocar overflow.

### Cardápio

- Abertura curta com status real da loja, estimativa e endereço quando disponíveis.
- Busca com ícone, rótulo acessível e botão “Limpar” quando houver termo.
- Navegação horizontal neutra por categorias; clique atualiza URL e rola para a seção, sem transformar a página em abas isoladas.
- Seções permanecem na mesma página, com âncoras e `scroll-margin-top`.
- Cards compactos: imagem real ou placeholder honesto, nome, descrição, preço e ação textual “Personalizar”/“Adicionar”.
- Desktop a partir de 1024 px: conteúdo e resumo sticky do carrinho em duas colunas.
- Mobile/tablet: uma coluna e barra inferior “Ver carrinho”, exibida apenas com itens.

### Produto

- Link de volta usa o destino interno validado.
- Opções obrigatórias, adicionais e observações aparecem em grupos compactos com seleção inequívoca.
- Erro permanece inline e no resumo focável.
- CTA informa total estimado e bloqueia repetição durante a transição.

### Carrinho e checkout

- Itens em lista, resumo sticky no desktop e CTAs com prioridade clara.
- `Field` é o contrato único de rótulo, dica e erro.
- Campos em duas colunas apenas quando houver espaço; no mobile, uma coluna.
- Resumo nunca compete visualmente com os dados obrigatórios.

### Confirmação e acompanhamento

- Estados de sucesso/erro/vazio são informativos, sem elementos decorativos exagerados.
- Código de acompanhamento é copiável e quebra linha com segurança.
- Linha do tempo mantém texto legível em telas estreitas.

## Acessibilidade e movimento

- Foco visível em todos os controles.
- Ícones Lucide são decorativos quando o texto já nomeia a ação; botões somente com ícone têm `aria-label`.
- Estados não dependem apenas de cor.
- Alvos interativos têm ao menos 44 × 44 px.
- `prefers-reduced-motion` desativa transições e animações não essenciais.
- `scroll-padding-top` e `scroll-margin-top` evitam conteúdo sob o cabeçalho sticky.
- Safe-area é aplicada à barra inferior e aos toasts.

## Navegação e preservação de contexto

- Busca e categoria são refletidas em query string com `history.replaceState`, integrado ao App Router.
- Ao abrir um produto, o link inclui apenas um retorno interno saneado.
- A posição de rolagem é salva em `sessionStorage`, sem PII, e restaurada uma única vez quando o cardápio estiver pronto.
- Acesso direto e retornos malformados caem em `/`.
- Após adicionar, `router.replace(retornoSeguro)` remove a tela de personalização da sequência imediata e evita que “voltar” reapresente um formulário já adicionado.

