# Homologação de fluxos reais

Data: 27/10/2026. Os níveis de prova abaixo são deliberadamente separados.

| Cenário | Ambiente/dado | Esperado | Observado | Status | Limpeza |
|---|---|---|---|---|---|
| Saúde, status, cardápio, pagamentos e OpenAPI | A/3333, somente leitura | HTTP 200, CORS e shape válidos | Duas rodadas aprovadas | PASS real A | não aplicável |
| Página pública Next → API | Next 3000 + A/3333, viewport 390 × 844 | carregar status/cardápio sem escrita | 1 Playwright real aprovado, Axe sem impacto sério/crítico | PASS real A | não aplicável |
| Estado development vazio/loja fechada | dados já existentes | UI honesta sem inventar produtos | “Fechada agora” e “A chapa ainda está vazia” | PASS real A | não aplicável |
| API/auth/CSRF/RBAC/catálogo/pedidos/relatórios | runner backend + PostgreSQL TEST | regras reais, dados efêmeros | 9 arquivos/43 testes, duas vezes | PASS real TEST | cleanup seletivo; zero resíduos |
| Socket.IO e isolamento de salas | runner backend + TEST | eventos e autorização reais | incluído nas 43 integrações, duas vezes | PASS real TEST | zero resíduos |
| Login do Next contra API TEST persistente | futuro 3000 → 3334 | cookie HttpOnly, me, logout | não havia orquestrador seguro de fixture/cleanup | BLOCKED | nenhuma escrita realizada pelo browser |
| CRUD/pedido do Next contra TEST | futuro 3000 → 3334 | fluxo ponta a ponta sem mocks | API persistente segura indisponível | BLOCKED | nenhuma escrita realizada pelo browser |
| Frontend com API simulada | Playwright local, dados fictícios | regressão de UI/estados | 15/15 aprovados | PASS mock | interceptação, sem banco |
| Unitários frontend | Vitest/jsdom | regras/cliente/componentes | 20/20 aprovados | PASS unitário | sem banco |
| Push Android, R2, QZ/impressora física | serviços/aparelho externo | entrega/arquivo/impressão reais | não executado | BLOCKED externo | não aplicável |

## Comandos executados

```powershell
# Backend, com opt-in explícito no processo
npm run test:unit
npm run test:integration
npm run test:integration  # segunda rodada
npm run db:test:verify
node scripts/snapshotDevelopmentReadOnly.js

# Frontend
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run test:smoke:dev     # duas rodadas
npm run test:e2e:readonly
```

O build é registrado no fechamento após a última alteração. Nenhum comando de seed, migration, rollback ou limpeza ampla foi executado.

## Suíte opt-in futura

`npm run test:e2e:test-api` testa login/sessão/logout no browser e recusa iniciar sem URL exata 3334, opt-in, confirmação explícita de isolamento e credencial efêmera `example.invalid`. Ela deve ser executada somente por um orquestrador que:

1. rode o guard de identidade real;
2. crie fixture rastreável no TEST;
3. inicie a API com segredos efêmeros, Push/R2/QZ desligados e CORS `localhost:3000`;
4. forneça credenciais ao processo sem logá-las;
5. faça cleanup seletivo mesmo em falha;
6. rode `db:test:verify` e a checagem de resíduos ao final.

## Estado final dos bancos

- TEST: guard aprovado, 25 migrations, 8 seeds, loja fechada e `fixtures_remaining=0`.
- Development: snapshot read-only após as integrações manteve o estado agregado esperado (27 tabelas, 25 migrations, 8 seeds, 1 usuário, 0 produtos, 0 pedidos, loja fechada).
- Nenhuma credencial ou identidade privada do destino foi registrada.
