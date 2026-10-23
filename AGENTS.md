# AGENTS.md - DevCodes

**DevCodes** é uma plataforma de organização pessoal que integra calendário, tarefas, anotações e biblioteca de código em um único dashboard.

## Visão Geral do Projeto

**Problema:** Usuários estudam e desenvolvem código, mas precisam dispersar conhecimento entre múltiplas aplicações (Google Calendar, Notion, GitHub, etc).

**Solução:** DevCodes unifica calendário, tarefas, anotações e código em uma plataforma web única com sincronização em tempo real via Supabase.

**Status:** 15/26 melhorias implementadas (57%)

---

## Regras Obrigatórias para Agentes de IA

1. **Sempre leia `docs/architecture.md` antes de implementar** - Garante decisões de design corretas
2. **Nunca modifique dados sem RLS policies** - Protege privacidade dos usuários
3. **Todas as features devem ter testes unitários** - Manutenibilidade e confiabilidade
4. **Commits precisam de descrição clara** - Rastreabilidade técnica
5. **Atualize `CHANGELOG.md` e `implementation-log.md` após cada entrega** - Sincroniza progresso
6. **Verificar `docs/coding-standards.md` para estilo de código** - Consistência do projeto

---

## Fluxo de Trabalho para Agentes

### 1. Recebimento de Tarefa
- Leia a issue/tarefa em `docs/issues.md` ou `docs/backlog.md`
- Consulte `docs/architecture.md` para contexto
- Verifique dependências em `implementation-plan.md`

### 2. Planejamento
- Escreva um pequeno plano de execução
- Identifique quais arquivos serão modificados
- Confirme se há bloqueadores

### 3. Implementação
- Siga `docs/coding-standards.md`
- Use RLS policies para dados sensíveis (em `docs/rls-policies.md`)
- Faça commit com mensagem descritiva

### 4. Validação
- Execute testes em `docs/testing.md`
- Verifique `docs/definition-of-done.md`
- Atualize documentação

### 5. Registro de Entrega
- Registre em `CHANGELOG.md` com versão e data
- Atualize `implementation-log.md` com timestamp e decisões
- Marque issue como resolvida

---

## Documentação Relevante

| Arquivo | Propósito |
|---------|-----------|
| `docs/architecture.md` | Decisões arquiteturais, stack, estrutura |
| `docs/coding-standards.md` | Estilo, convenções, padrões |
| `docs/definition-of-done.md` | Checklist para considerar tarefa pronta |
| `docs/rls-policies.md` | Políticas de segurança Supabase |
| `docs/issues.md` | Tarefas planejadas e status |
| `docs/backlog.md` | Ideias futuras não planejadas |
| `docs/decision-log.md` | Histórico de decisões importantes |
| `docs/testing.md` | Estratégia e tipos de testes |
| `implementation-plan.md` | Roadmap das 26 melhorias |
| `implementation-log.md` | Log técnico com timestamps e outcomes |
| `CHANGELOG.md` | Versões e mudanças públicas |

---

## Definition of Done

Uma tarefa é considerada **pronta** quando:

- [ ] Código implementado e revisado
- [ ] Testes escritos e passando
- [ ] `docs/coding-standards.md` seguido
- [ ] RLS policies verificadas (se aplica)
- [ ] CHANGELOG.md atualizado
- [ ] implementation-log.md registrado
- [ ] Commits com mensagens claras
- [ ] Sem console errors/warnings
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

- **Frontend:** React 18 + Vite + React Router
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Banco:** PostgreSQL com RLS policies
- **Estilo:** CSS Variables + Tema escuro/claro
- **Deploy:** Vercel (configurado em `vercel.json`)

Leia `docs/architecture.md` para detalhes completos.

---

## Como Começar

1. Clone este repositório
2. Leia `docs/architecture.md` para entender decisões
3. Leia `implementation-plan.md` para ver roadmap
4. Consulte `docs/issues.md` para tarefa atual
5. Siga o Fluxo de Trabalho acima

---

**Versão:** 1.0  
**Atualizado:** 2026-10-23  
**Mantido por:** Agentes de IA + Humanos
