# Correções de integração — Etapa 6

## 1. URL local divergente

- Reprodução: fallback e `.env.example` apontavam para 3001; o backend informado opera em 3333.
- Correção: fallback e exemplo agora usam `http://localhost:3333/api/v1`; `.env.local` não foi tocado.
- Arquivos: `.env.example`, `src/lib/api-client.ts`.

## 2. `/auth/me` não renovava sessão

- Causa: todo path `/auth/*` era excluído do refresh.
- Correção: somente login/refresh/logout/CSRF são excluídos; `/auth/me` e alteração de senha podem renovar uma vez. Falha de refresh emite evento de sessão expirada, limpa cache/CSRF e retorna ao login.
- Regressão: testes cobrem sucesso, refresh de `/auth/me`, falha e limite de tentativas.

## 3. Alteração de senha deixava sessão local obsoleta

- Correção: após sucesso, o frontend limpa Query Cache e CSRF antes do redirecionamento.
- Risco residual: fluxo browser real contra TEST ainda não executado.

## 4. Troco podia ser enviado para pagamento não monetário

- Correção: a opção aparece somente quando o método selecionado tem código `DINHEIRO`; ao trocar o método, o estado é limpo; o payload força `false/null` fora de dinheiro.

## 5. Edição de permissões podia substituir por lista vazia

- Causa: a listagem de usuários não carrega necessariamente permissões completas.
- Correção: `GET /admin/usuarios/:id` é buscado antes de abrir o diálogo. Reset/desativação da própria conta também foram ocultados, alinhando a UX ao bloqueio do backend.

## 6. Controle da loja confundia permissão manual e abertura efetiva

- Causa: o botão usava `status.aberta`, que inclui horário/configuração, para decidir o próximo valor de `aceitar_pedidos`.
- Correção: o botão usa a configuração manual; o cartão continua mostrando o status efetivo. O rótulo “Permitir no horário” deixa claro que o horário ainda governa a abertura.

## 7. ARIA de campos não alcançava o input

- Causa: dica/erro eram registrados no wrapper; a primeira correção atingiu o `div` de campos compostos.
- Correção final: busca recursiva pelo descendente cujo `id` corresponde ao `htmlFor`, aplicando `aria-describedby`, `aria-invalid` e `aria-required` apenas ao controle.
- Evidência: unitário e Axe A/AA no cardápio/login.

## 8. Falso alerta de offline

- Reprodução: Chromium local reportou `navigator.onLine=false` embora status e cardápio reais tivessem carregado.
- Correção: estado inicial neutro/online; banner reage a eventos explícitos `offline`/`online`. Erros reais da API continuam aparecendo nos componentes de erro.
- Evidência: captura real antes/depois e teste unitário de eventos.

## 9. Navegação externa por notificação Push

- Causa: URL absoluta do payload podia apontar para outra origem.
- Correção: clique aceita somente a origem do PWA; demais destinos caem em `/admin/notificacoes`.

## 10. Tipos públicos mais estritos que a serialização

- Correção: `ativo` e `disponivel_hoje` passaram a opcionais nas opções públicas em que o backend não os serializa sempre.

## 11. Separação dos runners

- O Vitest tentou importar a nova spec Playwright. As pastas `tests/e2e`, `tests/e2e-readonly` e `tests/e2e-test-api` foram excluídas explicitamente do runner unitário.

## 12. Editor de vínculos podia substituir o conjunto sem conhecer o estado atual

- Correção backend: `GET /admin/produtos/:id/vinculos`, protegido por `produtos.listar`, retorna pães/adicionais atuais e seus estados/limites.
- Correção frontend: o diálogo carrega vínculos e catálogos em paralelo, bloqueia salvar durante carga/erro e inicializa o rascunho no callback assíncrono de abertura, sem `setState` em efeito.
- Regressão: E2E mockado confirma pão francês/Bacon marcados, pão de hambúrguer desmarcado, limite `2` e botão habilitado somente após carga.

## Limitação operacional remanescente

- Não foi criado um servidor 3334 improvisado. O runner de integração existente é seguro, mas não exporta fixture/credencial para o Playwright do frontend.
- Após o restart informado pelo usuário, a instância 3333 passou a documentar o novo GET com `server_base=/api/v1` e autenticação por cookie.
