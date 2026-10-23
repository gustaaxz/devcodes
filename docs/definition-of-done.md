# Definition of Done

Uma tarefa é considerada **pronta para merge** quando TODOS os itens abaixo estão checked:

## Código

- [ ] Implementação completa conforme requisitos
- [ ] Segue `docs/coding-standards.md`
- [ ] Sem console errors ou warnings
- [ ] Sem commented code
- [ ] RLS policies verificadas (se necessário)
- [ ] Imports organizados e sem duplicatas

## Testes

- [ ] Testes unitários escritos (`*.test.jsx`)
- [ ] Testes passando (`npm run test`)
- [ ] Cobertura mínima de 70%
- [ ] Teste manual em dark e light mode
- [ ] Teste em mobile (se aplica)

## Documentação

- [ ] `CHANGELOG.md` atualizado com versão/data
- [ ] `implementation-log.md` registrado com timestamp
- [ ] Comentários adicionados em código complexo
- [ ] `docs/architecture.md` atualizado (se mudança arquitetural)
- [ ] `docs/issues.md` marcado como resolvido

## Performance

- [ ] Sem memory leaks (verificar com DevTools)
- [ ] Build size não aumentou significativamente
- [ ] Queries otimizadas (sem N+1)
- [ ] Realtime subscriptions desinscritas corretamente

## Git

- [ ] Commits com mensagens claras
- [ ] PR/MR com descrição do que foi feito
- [ ] Branches nomeados conforme padrão
- [ ] Branch atualizado com main antes de merge

## Segurança

- [ ] Sem exposição de dados de outros usuários
- [ ] RLS policies ativas e testadas
- [ ] Sem senhas em logs ou commits
- [ ] Validação de entrada implementada

## Acessibilidade

- [ ] Buttons têm `aria-label`
- [ ] Inputs têm `label` associada
- [ ] Cores seguem contraste mínimo WCAG AA
- [ ] Tab order lógica

## Review

- [ ] Code review aprovada por outro dev/agente
- [ ] Feedback implementado
- [ ] Nenhuma blocker deixada aberta

---

## Fast-Track para Pequenas Mudanças

Para typos, small CSS tweaks, ou pequenas correções:

- [ ] Mudança é mínima e óbvia
- [ ] Testes existentes ainda passam
- [ ] Sem RLS ou dados sensíveis afetados
- [ ] `CHANGELOG.md` atualizado

**Skip:** Pode pular code review se mudança for < 5 linhas e óbvia

---

## Quem Valida

- **Implementador:** Responsável por self-check
- **Code Reviewer:** Valida implementação e DoD
- **Product Owner:** Valida se entrega resolve issue

---

**Versão:** 1.0  
**Atualizado:** 2026-10-23
