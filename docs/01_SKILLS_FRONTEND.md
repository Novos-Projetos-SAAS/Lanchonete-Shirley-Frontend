# Skills consultadas no frontend

Atualizado em 28/10/2026.

## Etapa 7B — redesign público

| Skill | Aplicação comprovável |
|---|---|
| `frontend-design` | Definição da direção “balcão digital limpo”, preservação das fontes existentes, remoção do hero temático dominante e criação de uma assinatura funcional pelo resumo do pedido. |
| `ui-ux-pro-max` | Consulta integral das regras profissionais e do guia rápido; pesquisas internas sobre design system de food delivery, preservação de estado, formulários e imagens Next.js. Influenciou alvos de toque, foco, contraste, estado na URL, safe-area, `FieldGroup`, breakpoints e inspeção visual. |

A sugestão automática “vibrante e blocada” da busca de design system foi rejeitada por conflitar com o briefing neutro e com o painel existente. Foram mantidos Bricolage Grotesque, Nunito Sans, terracota restrito e superfícies cinza/branco. Também foram lidas as guias locais do Next.js 16 sobre navegação, componentes server/client, CSS e imagens, conforme `AGENTS.md`.

Não foram usadas skills de Figma, geração de imagem, SEO ou Sites: não havia arquivo Figma, a referência raster estava ausente e o trabalho era uma implementação local em código existente.

Evidência detalhada: `27_REDESIGN_PUBLICO_DIAGNOSTICO.md` a `31_PENDENCIAS_PUBLICO.md`.

## Skills encontradas e aplicadas

| Skill | Fonte | Aplicação comprovável |
|---|---|---|
| `frontend-design` | catálogo local do Codex | Preservação da identidade “ficha da chapa”, dos tokens, hierarquia, tipografia e layout existente. A homologação corrigiu integração sem redesenhar a interface. |
| `ui-ux-pro-max` | catálogo local do Codex | Revisão de responsividade, acessibilidade, foco não encoberto, navegação móvel, mensagens de estado e áreas de toque. Foram consultadas as regras profissionais e feitas buscas internas sobre foco com navegação inferior e formulários responsivos. |

As duas skills foram lidas antes das alterações de interface. Não foi usada skill de Figma, geração de imagem, SEO ou Sites porque a tarefa era homologar e corrigir um frontend local existente, sem criar um novo design nem publicar um site.

## Decisões influenciadas pelas skills

- Manter cores, fontes, componentes e composição existentes; nenhuma troca de stack ou redesign.
- Associar dica/erro/obrigatoriedade ao controle correto via ARIA, inclusive em campo composto de senha.
- Preservar `scroll-padding`, safe-area e a navegação inferior já existentes.
- Validar ausência de overflow em 320, 360, 375, 390, 414, 430, 768, 1024 e 1440 px.
- Inspecionar visualmente a captura real em 390 × 844; isso revelou e permitiu corrigir o falso alerta inicial de offline.

## Limite da evidência

Axe automatizado e inspeção visual não substituem leitor de tela, teclado Android, zoom do sistema ou aparelho físico. Esses itens continuam na lista de homologação de produção.
