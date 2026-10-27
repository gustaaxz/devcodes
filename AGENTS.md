# AGENTS.md - DevCodes

**DevCodes** é uma plataforma de organização pessoal que integra calendário, tarefas, anotações e biblioteca de código em um único dashboard.

## Visão Geral do Projeto

**Problema:** Usuários estudam e desenvolvem código, mas precisam dispersar conhecimento entre múltiplas aplicações (Google Calendar, Notion, GitHub, etc).

**Solução:** DevCodes unifica calendário, tarefas, anotações e código em uma plataforma web única com sincronização em tempo real via Supabase.

**Status:** 18/26 melhorias implementadas (69%). Fase 4 concluída; teste de isolamento RLS da #15 aprovado no Supabase.

---

## Regras Obrigatórias para Agentes de IA

1. **Sempre leia `docs/architecture.md` antes de implementar** - Garante decisões de design corretas
2. **Nunca modifique dados sem RLS policies** - Protege privacidade dos usuários (consulte `docs/security.md`)
3. **Todas as features devem ter testes unitários** - Manutenibilidade e confiabilidade (consulte `docs/TESTING.md`)
4. **Commits precisam de descrição clara** - Rastreabilidade técnica
5. **Atualize `CHANGELOG.md` e `implementation-log.md` após cada entrega** - Sincroniza progresso
6. **Verificar `docs/coding-standards.md` para estilo de código** - Consistência do projeto

---

## Fluxo de Trabalho para Agentes

### 1. Recebimento de Tarefa
- Leia a issue/tarefa em `docs/issues.md` ou `docs/backlog.md`
- Consulte `docs/architecture.md` para contexto
- Verifique dependências em `docs/implementation-plan.md`

### 2. Planejamento
- Escreva um pequeno plano de execução
- Identifique quais arquivos serão modificados
- Confirme se há bloqueadores

### 3. Implementação
- Siga `docs/coding-standards.md`
- Use RLS policies para dados sensíveis (em `docs/security.md`)
- Faça commit com mensagem descritiva

### 4. Validação
- Execute testes em `docs/TESTING.md` (`npm test`, `npm run lint`)
- Verifique `docs/definition-of-done.md`
- Atualize documentação

### 5. Registro de Entrega
- Registre em `CHANGELOG.md` com versão e data
- Atualize `implementation-log.md` e `docs/deployment-log.md` com timestamp e decisões
- Marque issue como resolvida

---

## Documentação Relevante

| Arquivo | Propósito |
|---------|-----------|
| `docs/architecture.md` | Decisões arquiteturais, stack, estrutura e fluxo |
| `docs/coding-standards.md` | Estilo, convenções, padrões React 19 / JavaScript |
| `docs/definition-of-done.md` | Checklist para considerar tarefa pronta |
| `docs/security.md` | Políticas de segurança Supabase e RLS |
| `docs/issues.md` | Tarefas planejadas e status imediato |
| `docs/backlog.md` | Ideias futuras e melhorias planejadas |
| `docs/decision-log.md` | Histórico de decisões importantes (ADRs) |
| `docs/TESTING.md` | Estratégia e tipos de testes |
| `docs/implementation-plan.md` | Roadmap das 26 melhorias (Fases 1 a 6) |
| `implementation-log.md` | Log técnico com timestamps e outcomes |
| `docs/deployment-log.md` | Registro de deploys e histórico de entregas |
| `CHANGELOG.md` | Versões e mudanças públicas |

---

## Definition of Done

Uma tarefa é considerada **pronta** quando:

- [ ] Código implementado e revisado
- [ ] Testes escritos e passando (`npm test`)
- [ ] `docs/coding-standards.md` seguido
- [ ] RLS policies verificadas (se aplica)
- [ ] CHANGELOG.md atualizado
- [ ] implementation-log.md registrado
- [ ] Commits com mensagens claras
- [ ] Sem console errors/warnings (`npm run lint`)
- [ ] Funciona em dark e light mode

---

## Responsabilidades do Agente

Quando uma tarefa termina, o agente DEVE:

1. **Documentar decisões** - Por que fez daquele jeito?
2. **Registrar bloqueadores** - Algo que impediu a implementação?
3. **Manter o contexto sincronizado** - Outros agentes precisam entender o que mudou
4. **Avisar sobre dependências** - Essa mudança afeta outras áreas?
5. **Atualizar plano se necessário** - A realidade diferiu do planejado?

---

## Stack Técnico (Referência Rápida)

- **Frontend:** React 19 + Vite + React Router
- **Backend:** Supabase (PostgreSQL 15+ + Auth + Realtime + Storage)
- **Banco:** PostgreSQL com RLS policies
- **Estilo:** CSS Variables + Tema escuro/claro
- **Deploy:** Vercel (configurado em `vercel.json`)

Leia `docs/architecture.md` para detalhes completos.

---

## Como Começar

1. Clone este repositório
2. Leia `docs/architecture.md` para entender decisões
3. Leia `docs/implementation-plan.md` para ver roadmap
4. Consulte `docs/issues.md` para tarefa atual
5. Siga o Fluxo de Trabalho acima

---

**Versão:** 1.1  
**Atualizado:** 2026-10-27  
**Mantido por:** Agentes de IA + Humanos
