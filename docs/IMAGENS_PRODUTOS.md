# Imagens demonstrativas dos produtos

Data: 29/10/2026. Escopo: catálogo demo `DEMO-SHIRLEY-V1` do frontend existente.

> **Imagem demonstrativa gerada por IA — substituir por foto real antes da divulgação comercial.**

## Referências visuais

- `Screenshot_13.png`: hambúrguer centralizado, pão brilhante, luz âmbar frontal/lateral, madeira rústica, fundo escuro desfocado e profundidade de campo curta.
- `Screenshot_12.png`: sanduíche de chapa centralizado, textura tostada, mesma atmosfera quente, madeira e fundo de lanchonete desfocado.

Os anexos foram usados somente para composição, luz, cenário e acabamento editorial. Os ingredientes mostrados neles não foram tratados como instruções. Os arquivos de referência permaneceram fora de `public/`.

Ferramenta: skill `imagegen` com o gerador de imagens integrado. Geração quadrada, inspeção visual individual e conversão local com Sharp para WebP 900 × 900, qualidade 80.

## Integração segura

- `imagem_url` cadastrado na API sempre tem prioridade.
- O fallback local só é habilitado quando a descrição normalizada contém o marcador `[DEMO-SHIRLEY-V1]` e o nome corresponde exatamente a um item conhecido.
- Produto comercial homônimo sem marcador não recebe foto demo.
- Em erro de carregamento, tenta-se a próxima fonte segura e depois “Imagem em breve”.
- WebP local usa `next/image`; URL remota arbitrária preserva o `<img>` existente para não ampliar `remotePatterns` no `next.config`.

Implementação: `src/lib/product-images.ts`, `src/components/shared/product-image.tsx`, cards e detalhe do produto. A regra possui testes unitários para precedência, marcador e isolamento comercial.

## Manifesto

| Produto | Arquivo ativo | Dimensão | Peso aprox. | Situação |
|---|---|---:|---:|---|
| Hambúrguer Clássico | `hamburguer-classico.webp` | 900 × 900 | 101 KB | aprovado |
| X-Salada | `x-salada-corrigido.webp` | 900 × 900 | 127 KB | aprovado após correção |
| X-Bacon | `x-bacon.webp` | 900 × 900 | 135 KB | aprovado |
| X-Egg | `x-egg.webp` | 900 × 900 | 114 KB | aprovado |
| X-Tudo | `x-tudo.webp` | 900 × 900 | 134 KB | aprovado |
| X-Frango | `x-frango.webp` | 900 × 900 | 124 KB | aprovado |
| X-Calabresa | `x-calabresa.webp` | 900 × 900 | 135 KB | aprovado |
| Batata Frita Pequena | `batata-frita-pequena.webp` | 900 × 900 | 90 KB | aprovado |
| Batata Frita Grande | `batata-frita-grande.webp` | 900 × 900 | 103 KB | aprovado |
| Calabresa Acebolada | `calabresa-acebolada.webp` | 900 × 900 | 127 KB | aprovado |
| Água Mineral 500 ml | `agua-mineral-500ml.webp` | 900 × 900 | 91 KB | aprovado, genérico sem rótulo |
| Refrigerante Lata 350 ml | `refrigerante-lata-350ml.webp` | 900 × 900 | 97 KB | aprovado, genérico sem rótulo |
| Suco Natural 300 ml | `suco-natural-300ml.webp` | 900 × 900 | 69 KB | aprovado, sabor ilustrativo genérico |
| Refrigerante 2 Litros | `refrigerante-2-litros.webp` | 900 × 900 | 102 KB | aprovado, genérico sem rótulo |

`x-salada.webp` (124 KB) é a primeira versão rejeitada por sugerir molho. Ela não é referenciada pelo código; foi preservada para rastreabilidade e a versão corrigida é a única ativa.

## Prompts exatos

Cada prompt final foi formado pelo bloco compartilhado indicado e pelo complemento do produto, sem texto adicional.

### Bloco A — lanches

```text
Use case: photorealistic-natural
Asset type: square ecommerce product photo for the Lanchonete Shirley digital menu.
Input images: Image 1 and Image 2 are style references only. Create a new original photograph; do not copy a specific sandwich from them.
Scene/backdrop: rustic warm wooden serving board, dark softly blurred neighborhood snack-bar background.
Style/medium: appetizing but believable Brazilian snack-bar food photography, photorealistic, natural food texture, editorial consistency with both references.
Composition/framing: square 1:1, single sandwich centered, slight front three-quarter eye-level view, entire sandwich and board visible with safe margin on all sides; no crop of the food.
Lighting/mood: warm amber side/front light, subtle rim light, inviting evening atmosphere, shallow depth of field, realistic shadows.
Constraints: exact ingredients only; realistic scale; no hands, people, utensils, fries, side dishes, packaging, text, lettering, price, logo, label, watermark, signature, or extra ingredients. One sandwich only.
```

Complementos usados com o bloco A:

```text
Primary request: Hambúrguer Clássico in a plain glossy hamburger bun, with exactly one grilled beef patty, one layer of melted yellow cheese, and a modest layer of creamy house sauce.
Exact exclusions: no lettuce, no tomato, no bacon, no egg, no onion, no sausage, no pickles.
```

```text
Primary request: X-Salada in a plain glossy hamburger bun, with exactly one grilled beef patty, melted yellow cheese, crisp green lettuce, and fresh red tomato slices.
Exact exclusions: no bacon, no egg, no onion, no sausage, no pickles, no fries.
```

```text
Primary request: X-Bacon in a plain glossy hamburger bun, with exactly one grilled beef patty, melted yellow cheese, and visibly crisp bacon strips.
Exact exclusions: no lettuce, no tomato, no egg, no onion, no sausage, no pickles, no fries.
```

```text
Primary request: X-Egg in a plain glossy hamburger bun, with exactly one grilled beef patty, melted yellow cheese, and one fried egg with set white and a softly golden yolk.
Exact exclusions: no lettuce, no tomato, no bacon, no onion, no sausage, no pickles, no fries.
```

```text
Primary request: X-Tudo in a plain glossy hamburger bun, with exactly one grilled beef patty, melted yellow cheese, one fried egg, crisp bacon strips, crisp green lettuce, and fresh red tomato slices.
Exact exclusions: no onion, no sausage, no pickles, no fries, no sauce.
```

```text
Primary request: X-Frango in a plain glossy hamburger bun, with exactly a generous layer of savory shredded chicken, melted yellow cheese, crisp green lettuce, and fresh red tomato slices.
Exact exclusions: no beef patty, no bacon, no egg, no onion, no sausage, no pickles, no fries, no sauce.
```

```text
Primary request: X-Calabresa in a plain glossy hamburger bun, with exactly sliced grilled Brazilian calabresa sausage, clearly visible sautéed onion strips, and melted yellow cheese.
Exact exclusions: no beef patty, no lettuce, no tomato, no bacon, no egg, no pickles, no fries, no sauce.
```

### Correção do X-Salada

```text
Use case: precise-object-edit
Input images: Image 1 is the X-Salada edit target. Image 2 and Image 3 are style references only.
Primary request: remove every visible trace of creamy sauce, mayonnaise, brown sauce, dressing, or spread from the X-Salada in Image 1.
Replace only those sauce areas with the natural adjacent surface of the plain bun, crisp green lettuce, or fresh red tomato as appropriate.
Constraints: preserve the exact square composition, camera angle, wooden board, dark blurred snack-bar background, warm amber lighting, shadows, realistic texture, hamburger bun, exactly one grilled beef patty, melted yellow cheese, lettuce, and tomato. Keep the whole sandwich visible. Do not add, remove, or redesign any other ingredient. No bacon, egg, onion, sausage, pickles, fries, hands, people, utensils, text, logo, label, watermark, or signature.
```

### Bloco B — porção pequena

```text
Use case: photorealistic-natural
Asset type: square ecommerce product photo for the Lanchonete Shirley digital menu.
Input images: Image 1 and Image 2 are style references for warm lighting, dark blurred background and rustic wood only. Create a new original photograph.
Scene/backdrop: small neutral dark stoneware bowl on a rustic warm wooden board, dark softly blurred neighborhood snack-bar background.
Style/medium: appetizing but believable Brazilian snack-bar food photography, photorealistic, natural texture, same editorial series as the sandwich references.
Composition/framing: square 1:1, single portion centered, front three-quarter view, entire bowl and board visible with safe margin on all sides; no crop.
Lighting/mood: warm amber side/front light, subtle rim light, inviting evening atmosphere, shallow depth of field, realistic shadows.
Constraints: exact food only; realistic serving size; no hands, people, utensils, sauces, garnish, side dishes, packaging, text, lettering, price, logo, label, watermark, or signature.
Primary request: a modest individual portion of classic thin golden French fries, crisp outside with a few natural irregularities, served only in the small bowl.
Exact exclusions: no ketchup, no mayonnaise, no cheese, no bacon, no herbs, no salt shaker.
```

### Bloco C — porções grandes

```text
Use case: photorealistic-natural
Asset type: square ecommerce product photo for the Lanchonete Shirley digital menu.
Input images: Image 1 and Image 2 are style references for warm lighting, dark blurred background and rustic wood only. Create a new original photograph.
Scene/backdrop: neutral dark stoneware serving vessel on a rustic warm wooden board, dark softly blurred neighborhood snack-bar background.
Style/medium: appetizing but believable Brazilian snack-bar food photography, photorealistic, natural texture, same editorial series as the references.
Composition/framing: square 1:1, one serving centered, front three-quarter view, entire serving vessel and board visible with safe margin; no crop.
Lighting/mood: warm amber side/front light, subtle rim light, inviting evening atmosphere, shallow depth of field, realistic shadows.
Constraints: exact food only; realistic serving size; no hands, people, utensils, sauces, garnish, side dishes, packaging, text, lettering, price, logo, label, watermark, or signature.
```

Complementos usados com o bloco C:

```text
Primary request: a generous sharing-size portion of classic thin golden French fries, crisp outside with natural irregularities, served only in a wide large bowl clearly bigger than an individual serving.
Exact exclusions: no ketchup, no mayonnaise, no cheese, no bacon, no herbs, no salt shaker.
```

```text
Primary request: a generous sharing portion of sliced grilled Brazilian calabresa sausage with clearly visible sautéed onion strips, served only in a shallow dark stoneware bowl.
Exact exclusions: no bread, no cheese, no lettuce, no tomato, no peppers, no herbs, no fries, no sauce.
```

### Bloco D — bebidas

```text
Use case: product-mockup
Asset type: square ecommerce product photo for the Lanchonete Shirley digital menu.
Input images: Image 1 and Image 2 are style references for warm amber lighting, dark blurred background and rustic wood only. Create a new original photograph.
Scene/backdrop: rustic warm wooden board, dark softly blurred neighborhood snack-bar background.
Style/medium: believable commercial beverage photography, photorealistic, natural condensation, same warm editorial series as the food references.
Composition/framing: square 1:1, one beverage centered upright, front three-quarter eye-level view, entire container visible with generous safe margin; no crop.
Lighting/mood: warm amber side/front light with a cool subtle rim highlight, inviting evening atmosphere, shallow depth of field, realistic reflection and shadow.
Constraints: generic unbranded representation only; no hands, people, utensils, food, fruit, ice outside the container, packaging props, text, lettering, price, logo, trademark, label, watermark, or signature.
```

O bloco acima foi usado para água e lata. Nos prompts de suco e garrafa de 2 litros, a restrição foi exatamente a mesma, exceto por `fruit garnish` no lugar de `fruit` e sem a frase `ice outside the container`.

Complementos:

```text
Primary request: one sealed generic 500 ml clear PET bottle filled with transparent mineral water, plain white cap, completely label-free bottle, a few realistic condensation droplets.
Exact exclusions: no glass, no lemon, no bubbles added outside the water, no second bottle.
```

```text
Primary request: one sealed generic 350 ml aluminum soda can with a completely plain brushed silver surface, no printing at all, a few realistic condensation droplets.
Exact exclusions: no glass, no straw, no fruit, no second can, no invented branding.
```

```text
Primary request: one simple clear 300 ml tumbler filled with freshly blended natural golden-orange fruit juice, subtle realistic pulp and a light condensation haze, no straw.
Exact exclusions: no bottle, no can, no second glass, no sliced fruit, no mint, no ice cubes outside the drink.
```

```text
Primary request: one sealed generic 2-liter clear PET soda bottle filled with dark amber carbonated soft drink, plain black cap, completely label-free bottle, a few realistic condensation droplets.
Exact exclusions: no glass, no straw, no fruit, no second bottle, no invented branding.
```

## Validação e pendências

- Os 14 ativos foram inspecionados e não contêm texto, marcas, pessoas ou utensílios.
- A tela pública mockada confirma o `src` local e `naturalWidth > 0` antes das capturas.
- A primeira versão do X-Salada foi rejeitada; nenhuma outra imagem precisou de nova geração.
- Fotos reais, marcas/sabores efetivamente vendidos e autorização comercial continuam pendentes antes de divulgação pública.
- Nenhum dado do catálogo, seed, banco ou variável de ambiente foi modificado.

