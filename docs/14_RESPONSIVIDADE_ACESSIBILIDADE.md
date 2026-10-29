# Responsividade e acessibilidade

## Evidências executadas

- Playwright simulou 320, 360, 375, 390, 414, 430, 768, 1024 e 1440 px; nenhum cenário detectou overflow horizontal.
- Fluxo público completo foi exercitado em 390 × 844; painel/pedido em 360 × 800; catálogo admin em 1024 × 768.
- Axe WCAG A/AA passou em cardápio e login mockados (15/15 E2E). A página pública contra API real passou sem violações sérias/críticas.
- Captura real: `docs/screenshots/homologacao-readonly-390.png`. Ela usa apenas o estado vazio do development, sem PII.
- Teste unitário confirma associação de label, dica, erro e obrigatoriedade; outro confirma eventos online/offline.

## Comportamentos preservados

- Tokens, tipografia, cores terracota/mostarda/creme e identidade “ficha da chapa”.
- Layout mobile-first, safe-area Android, barra inferior fixa e `scroll-padding` para evitar foco encoberto.
- Alvos de toque e botões com rótulos acessíveis; ícones Lucide decorativos usam `aria-hidden`.
- Estados loading, vazio, erro, fechado, conflito e offline têm texto, não dependem apenas de cor.
- Dialogs Radix mantêm foco, título/descrição e fechamento acessível.

## Achado visual corrigido

A primeira captura real mostrava “Sem conexão” ao mesmo tempo que dados reais da API estavam visíveis. O sinal inicial de `navigator.onLine` era falso no ambiente local. O banner passou a responder a eventos explícitos e a captura final ficou coerente.

## Limitações

- Não houve leitor de tela TalkBack/VoiceOver, teclado Android, zoom/fonte ampliada do sistema ou teste de orientação em aparelho físico.
- Não foi validado CTA acima de teclado virtual real; a estrutura usa fluxo responsivo e safe-area, mas precisa de inspeção Android.
- Instalação PWA, notificação Push e clique vindo da bandeja do Android não foram executados.
- A captura real contém cardápio vazio porque inserir produto no development seria proibido.

## Checklist Android recomendado

1. Testar 320–430 px em retrato e paisagem com fonte do sistema em 200%.
2. Navegar somente por teclado/controle e TalkBack; confirmar ordem, foco visível e anúncios de erro/toast.
3. Abrir checkout com teclado virtual e verificar resumo/CTA, rolagem e safe-area.
4. Instalar PWA sob HTTPS, alternar rede durante pedido e confirmar mensagem de estado indeterminado.
5. Validar Push opt-in, recebimento e clique apenas depois de VAPID/HTTPS reais.
