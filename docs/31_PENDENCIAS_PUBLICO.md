# Pendências do site público — Etapa 7B

Data: 2026-10-28.

## Pendências externas

1. A referência `referencias_visuais/site_publico_referencia.png` citada no prompt não estava disponível no projeto nem em Downloads. O redesign foi validado contra o briefing textual; uma futura comparação pixel a pixel depende do envio do arquivo.
2. Leitor de tela real, zoom do sistema, teclado Android, instalação PWA e dispositivos físicos continuam sendo homologações externas; Axe não os substitui.
3. Imagens de produto permanecem dinâmicas e controladas pela API. A migração completa para `next/image` depende de conhecer e autorizar os hosts remotos reais em `remotePatterns`, sem abrir padrões inseguros.
4. Homologação contra API real pode usar somente ambiente e dados explicitamente autorizados. Esta etapa deliberadamente usou mocks para qualquer escrita.

## Sem pendência local conhecida

Não há falha local aberta no fluxo público coberto. Lint, TypeScript, unitários, build, 26 cenários Playwright, Axe e as dez larguras estão aprovados.

## Limites mantidos

- Nenhum `.env` foi alterado ou exibido.
- Nenhum backend, migration, seed ou banco foi tocado.
- Nenhum pedido real foi criado.
- Nenhum deploy, commit ou push foi realizado.

