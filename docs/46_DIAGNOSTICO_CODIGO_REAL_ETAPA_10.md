# Diagnóstico do código real — Etapa 10

Data: 31/10/2026. Escopo: frontend, backend e aplicativo Android locais. Nenhuma migration, seed, credencial, banco, deploy ou push foi executado.

## Matriz de achados

| Problema | Estado | Evidência / causa | Estratégia |
| --- | --- | --- | --- |
| Equipe não lista inativos | Causa confirmada por código | O frontend envia `busca`, `ativo`, `page` e `limit=10`, mas a consulta anterior do backend descartava usuários com `deletado_em`; a desativação preenche esse campo. | Listar registros ativos e inativos no endpoint administrativo, mantendo detalhes/mutações protegidos e testar a composição de filtros. |
| Busca da Equipe | Contrato confirmado; integração real não executada | Frontend usa busca diferida e backend usa `ILIKE` em nome/e-mail. | Cobrir URL, combinação busca+estado, reset de página e estados de carregamento/vazio. Acentos dependem da collation PostgreSQL; não será criada extensão/migration nesta etapa. |
| Menu vazio em Convites | Causa confirmada por código anterior | Um `RowActions` podia ser renderizado sem botão aplicável. Convite aceito não possui ação; revogação só se aplica ao pendente. | Não renderizar o menu sem ação, mostrar `Sem ações` e melhorar fechamento por clique externo/Escape. |
| Navegação móvel `Mais` | Causa estrutural confirmada | O Drawer existe, porém os atalhos fixos dependem de índices (`nav[12]` é Auditoria), tornando a composição frágil. | Definir atalhos operacionais por `href`, manter `Mais` como botão e listar todos os módulos restantes permitidos por RBAC. |
| Paginação de listagens | Divergência confirmada | O frontend solicita 10, mas schemas/controllers/repositories do backend ainda possuem defaults de 20. | Uniformizar default de listagens em 10, preservar consultas de referência em 100 e testar totais/páginas/reset de filtros. |
| Falha final ao confirmar impressão | Causa confirmada | `reportSafely()` tenta três vezes e abandona o ACK sem estado persistente. | Persistir confirmação pendente, reconciliar estado com o backend e bloquear nova reserva enquanto houver ambiguidade. |
| Alerta indeterminado sobrescrito | Causa confirmada | `printJob()` grava `ATENCAO`, mas `runShift()` grava `PRONTO` no ciclo seguinte. | Separar alerta crítico durável do status transitório e exigir reconhecimento manual após resultado indeterminado. |
| Turno salvo versus serviço vivo | Causa confirmada | Preferência `shift_active` é marcada antes de o foreground service estar comprovadamente ativo; `onDestroy()` não reconcilia o estado. | Usar estado real do processo/serviço, heartbeat local e marcar interrupção, mantendo `START_NOT_STICKY` e reinício manual. |
| Desvincular/reparear | Lacuna confirmada | Há `clearPairing()`, mas nenhuma ação completa na UI e nenhum endpoint de auto-revogação. | Criar desvinculação autenticada, limpar o token somente após sucesso ou 401 e permitir novo pareamento. |
| Atualizar dispositivos Bluetooth | Lacuna confirmada | A lista depende apenas da permissão e não é relida de forma explícita ao retornar das Configurações. | Atualizar no `onResume` e oferecer botão manual de atualização/configurações. |
| Compilação Android | Bloqueio de ambiente confirmado | JDK existe, mas Gradle/wrapper, Android SDK e ADB não foram encontrados. | Implementar/testar o que for estático e registrar build/APK/hardware como pendentes, sem alegar aprovação. |

## Contratos já coerentes

- Base Android `/api/v1/agente-impressao/android`, bearer por dispositivo, `parear`, `heartbeat`, SSE, reserva, início de envio, resultado e rotação coincidem entre Kotlin e Express.
- `ENVIADO` representa bytes aceitos pelo stream, não confirmação física.
- O backend converte falhas reportadas depois de `envio_iniciado_em` em `RESULTADO_INDETERMINADO` e impede retry automático.
- A migration `040_impressao_android_bluetooth.js` permanece apenas versionada e não será aplicada nesta etapa.

## Limitações da reprodução

- O Git reconhece os diretórios frontend/backend, mas `git status` e `git diff` foram bloqueados pelo acesso ao worktree nesta sessão; nenhum reset/clean foi tentado.
- A integração PostgreSQL e a migration 040 não serão executadas sem autorização futura específica.
- Navegador autenticado real, aparelho Android e impressora Bluetooth não estão disponíveis neste pré-flight. Testes locais usarão unidades e mocks, identificados como tais.
