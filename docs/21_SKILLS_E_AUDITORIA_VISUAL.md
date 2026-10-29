# Etapa 7 — skills e auditoria visual

Data da auditoria: 2026-10-28.

## Escopo e privacidade

As onze referências visuais recebidas foram abertas somente fora do repositório, uma por vez. Nenhum arquivo foi copiado para o projeto e nenhum nome, e-mail, telefone, endereço ou outro dado pessoal observado foi transcrito. A pasta local `/referencias_visuais/` também foi adicionada ao `.gitignore` como barreira preventiva.

O trabalho usa as orientações locais `frontend-design` e `ui-ux-pro-max`. Não há uma skill separada instalada para React, formulários, acessibilidade, design system ou teste visual; esses pontos foram cobertos pelas regras de UI/UX, pela documentação local do Next.js 16 e pelos testes do próprio projeto.

## Leitura das referências

| Referência | Padrão útil | Risco ou conteúdo descartado | Aplicação no projeto |
| --- | --- | --- | --- |
| 1 | Tabela comercial densa, busca, filtros e hierarquia de colunas | Estoque, promoção, PDV e importação não suportados | Tabela real em desktop e cartões compactos em telas pequenas |
| 2 | Relação clara entre rótulo e controle | Dados pessoais reais e campos largos demais | Formulários alinhados, largura legível e nenhuma reprodução de dados |
| 3 | Cabeçalho, busca, contêiner tabular e paginação | Estado vazio exibido ao mesmo tempo que carregamento | Estados de carregamento, erro e vazio mutuamente exclusivos |
| 4 | Navegação neutra, título e filtros discretos | Módulos e promessas comerciais ausentes no produto | Painel sóbrio e apenas recursos realmente suportados |
| 5 | Evidencia o campo de impressora no fluxo de configuração | Campo em largura excessiva e ajuda solta | Campo limitado, ajuda persistente dentro do `Field` |
| 6 | Evidencia WhatsApp e taxa de entrega como um grupo | Desalinhamento vertical causado por ajuda em só um campo | Grid que alinha rótulos e reserva a área de ajuda |
| 7 | Perfil e segurança no mesmo contexto | Texto técnico sobre cookie/JWT exposto ao usuário | Perfil com “Alterar senha” e “Sair”, sem explicação de implementação |
| 8 | Ação de ativar/desativar reconhecível | Botões em formato de pílula e excesso de destaque | Raio contido e ação destrutiva subordinada/contextual |
| 9 | Lista operacional como foco da tela | Faixas soltas, ações gigantes repetidas e aviso amarelo dominante | Tabela, menu de linha e orientação discreta |
| 10 | Agrupamento de dados do cliente e recebimento | Espaçamento insuficiente entre títulos, rótulos, campos e escolhas | Seções e ritmo vertical de 8/16/24 px no checkout |
| 11 | Cardápio por categoria, cartões compactos e resumo próximo | Marca, fotografias, banners e recursos proprietários da referência | Agrupamento por categoria com dados e imagens já existentes somente |

## Síntese crítica

O melhor traço comum das referências é a clareza comercial: informação escaneável, filtros próximos da lista e ações subordinadas ao conteúdo. O pior traço é a mistura de recursos não existentes com excesso de decoração, pílulas e blocos largos. A implementação adota a densidade e a hierarquia, mas não imita marcas, imagens, textos, módulos ou dados das referências.

Uma recomendação automática sugeriu uma interface suíça em azul/laranja com Playfair Display e Karla. Ela foi rejeitada por ser genérica e conflitante com a identidade Shirley. Foram preservadas Bricolage Grotesque para marca/títulos e Nunito Sans para leitura e operação. Da recomendação, aproveitam-se apenas a grade neutra, o contraste, a redução de sombras e a disciplina de densidade.

## Matriz de páginas e decisões

| Área | Desktop/tablet | Mobile | Permissão/segurança |
| --- | --- | --- | --- |
| Recursos do cardápio | Tabela com nome, estado, ordem/preço quando disponível e menu de ações | Cartões compactos com os mesmos dados essenciais | Consulta e botões condicionados à permissão específica |
| Equipe e convites | Tabelas separadas para colaboradores e convites | Cartões com estado e ações contextuais | Convites exigem permissões próprias; token nunca aparece em listagem |
| Pedidos, logs, notificações e impressões | Tabela ou lista tabular conforme a informação | Cartões empilhados | Nenhuma consulta é iniciada sem a permissão da rota |
| Loja | Formulários em colunas alinhadas | Uma coluna, alvos de 48 px | Cada painel só consulta/salva se a permissão correspondente existir |
| Perfil | Dados essenciais e ações de conta | Mesma ordem, sem conteúdo técnico | Alteração de senha autenticada e saída explícita |
| Cardápio público | Seções por categoria e cartões compactos | Uma coluna/telas estreitas, duas quando houver espaço | Apenas catálogo público e dados existentes |
| Convite público | Formulário focado com nome e senha | Uma coluna e teclado/autofill adequados | Token lido do fragmento, removido do histórico e enviado somente no corpo |

## Plano visual antes da implementação

- Assunto: balcão digital de uma lanchonete de bairro, não um painel SaaS genérico.
- Público: equipe operando sobretudo em Android e clientes montando pedidos no cardápio público.
- Tarefa central: encontrar, decidir e agir rapidamente, com poucos elementos competindo por atenção.
- Composição: painel em grade neutra, navegação com trilho vermelho fino, tabela como superfície principal e cartões móveis equivalentes.
- Assinatura visual: “ficha de balcão” contida — cabeçalhos, estados e números tabulares lembram uma ordem de serviço sem texturas decorativas repetidas.
- Restrição: vermelho é marca/ação/ativo; dourado é detalhe raro; sucesso e perigo permanecem semânticos e sempre acompanhados de texto.

## Critérios de aceite visual

- Uma ação primária por contexto e demais ações em menu de linha.
- Controles com 44–48 px, foco visível e rótulo acessível.
- Sem pílulas indiscriminadas, sombras pesadas, emojis, gradientes decorativos ou “dark mode” parcial.
- Sem rolagem horizontal na página em 320 px; tabelas viram cartões compactos abaixo do breakpoint.
- Texto normal com contraste mínimo de 4,5:1 e informação não dependente apenas de cor.
- Movimentos discretos e removidos com `prefers-reduced-motion`.
