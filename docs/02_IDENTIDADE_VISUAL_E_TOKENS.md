# Identidade visual e tokens

## Direção

O conceito visual é “lanchonete de bairro acolhedora, comida feita na hora”. A interface usa a linguagem de ficha de chapa: carimbos discretos, mostarda como destaque, superfícies creme e cartões brancos. Não há fotografia fictícia; quando `imagem_url` não existe, aparece um placeholder explicitamente identificado.

## Fundação

Os tokens estão centralizados em `src/app/globals.css` e são usados pelos componentes:

- Marca `#ad3226`, hover `#85271e`, destaque `#efb83f`.
- Fundo `#fffaf3`, superfície `#ffffff`, superfície secundária `#f6f0e8`.
- Texto `#27221f`, texto secundário `#6e625b`, borda `#e9dfd4`.
- Estados de sucesso, alerta, perigo, foco, status de pedido, overlay e tooltip.
- Raios de 0,5 a 1,75 rem, sombra de cartão contida e altura semântica da navegação admin.

Bricolage Grotesque identifica títulos e marca; Nunito Sans prioriza leitura no corpo. Ícones são exclusivamente Lucide. O símbolo provisório combina tipografia e `CookingPot`, sem pretender ser o logotipo comercial definitivo.

## Componentes e interação

`src/components/ui/index.tsx` reúne Button/IconButton, campos, Card, Badge/StatusBadge, Skeleton, Dialog/ConfirmDialog, estados vazio/erro/offline, PageHeader, CurrencyText, QuantityStepper, PriceBreakdown e lista responsiva. `PermissionGate` controla apenas a visibilidade; a API continua responsável pela autorização.

Há foco visível, alvos principais de aproximadamente 48 px, labels, avisos textuais, skip link, `prefers-reduced-motion` e `safe-area-inset-bottom`. O painel troca sidebar desktop por navegação inferior no celular.

## Breakpoints verificados

Playwright verificou 320, 360, 375, 390, 414, 430, 768, 1024 e 1440 px. As capturas de 360, 390 e 1024 px ficam em `docs/screenshots/`. O modo claro é o único tema entregue; não foi incluído modo escuro parcial.
