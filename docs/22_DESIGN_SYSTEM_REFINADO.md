# Etapa 7 — design system refinado

Data: 2026-10-28.

## Direção

“Balcão operacional sóbrio”: o administrativo funciona como uma ficha comercial legível; a expressão artesanal fica concentrada no cardápio público. A interface é clara, direta e robusta em celulares usados durante o atendimento.

## Tokens-alvo

| Papel | Valor | Uso |
| --- | --- | --- |
| Fundo admin | `#F7F7F8` | Plano de fundo neutro |
| Superfície | `#FFFFFF` | Cartões, tabelas, diálogos |
| Texto | `#25272B` | Texto principal |
| Texto secundário | `#667085` | Metadados e ajuda |
| Borda | `#E4E7EC` | Separação sem sombra forte |
| Marca | `#A9342B` | CTA primário, seleção, foco de marca |
| Marca hover | `#8D2E28` | Estado de interação |
| Dourado | `#D6A34B` | Detalhe raro no público |
| Sucesso | `#25805A` | Confirmação com texto/ícone |
| Perigo | `#B42318` | Erro e ação destrutiva |

Raio: 4 px em controles pequenos, 8 px em controles/cartões e 12 px somente em diálogos/áreas públicas relevantes. Sombras: nenhuma em superfícies normais; uma sombra curta apenas em elevação real. Espaçamento: escala de 4, 8, 12, 16, 24, 32 e 48 px.

## Tipografia

- Bricolage Grotesque: marca, títulos curtos e números de destaque.
- Nunito Sans: corpo, rótulos, navegação e dados.
- Valores, preços e horários usam algarismos tabulares.
- Títulos curtos podem usar balanceamento natural; corpo mantém medida de leitura de 60–75 caracteres em telas grandes.

## Componentes

- `Field` mantém rótulo, ajuda e erro no mesmo bloco, com espaço estável no grid.
- `ResponsiveDataList`/tabela exibe cabeçalhos semânticos no desktop e cartões equivalentes no mobile.
- `RowActions` concentra editar, configurar, revogar e desativar sem repetir botões largos.
- Estados de acesso negado usam mensagem 403 clara, sem iniciar requisição protegida.
- Senhas aceitam colar/autofill, têm botão mostrar/ocultar e nunca são registradas.

## Responsividade

- 320–575 px: uma coluna, navegação inferior, cartões compactos.
- 576–767 px: duas colunas apenas quando o conteúdo comportar alvos de toque.
- 768–1023 px: tabelas essenciais e formulários de duas colunas alinhadas.
- 1024–1439 px: sidebar e largura de conteúdo controlada.
- 1440 px ou mais: conteúdo centralizado, sem esticar campos ou linhas de leitura.

## Autocrítica

A proposta poderia ficar impessoal se todos os detalhes artesanais fossem removidos. Por isso, a assinatura é mantida no cardápio, na marca e em um detalhe dourado pontual; o painel não recebe ilustrações ou textura. O outro risco é densidade excessiva no celular: por isso a tabela não encolhe nem cria rolagem na página; cada linha vira um cartão com ordem de leitura e ações equivalentes.
