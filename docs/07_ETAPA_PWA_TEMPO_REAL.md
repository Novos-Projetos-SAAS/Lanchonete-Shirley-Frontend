# Etapa PWA e tempo real

## PWA

`src/app/manifest.ts` declara nome, cores, modo standalone e ícones 192/512/maskable próprios, gerados por `scripts/generate-icons.mjs`. `public/sw.js` pré-cacheia somente shell/assets públicos e fornece `public/offline.html`. API, autenticação, checkout, painel e respostas privadas não entram no cache.

O service worker registra no cliente e trata `push`/`notificationclick`. A URL de clique é restringida ao mesmo origin, e a aba existente é focada quando possível. O banner de conexão não permite interpretar um pedido offline como enviado.

## Push

`src/features/pwa/push.ts` verifica suporte e `/admin/push/configuracao`. A permissão só é pedida após o botão do usuário; inscrição e remoção passam pela API. Perfil/logout oferecem limpeza do aparelho. Servidor sem VAPID produz estado explicativo, não quebra a tela.

## Socket.IO

`src/features/orders/use-admin-realtime.ts` conecta ao namespace `/admin` por cookie, ouve `novo_pedido_recebido`, `pedido_atualizado`, `loja_atualizada` e `notificacao_recebida`, deduplica `event_id` e invalida REST ao conectar/reconectar. REST continua sendo a fonte durável.

## Restrições conhecidas

Manifest, SW e ausência de Push foram validados localmente; instalação, notificação em segundo plano e reconexão real não foram testadas em Android. Som não é garantido pelo navegador. Impressão física requer agente externo e não é executada diretamente no celular.
