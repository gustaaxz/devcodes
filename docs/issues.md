# Issues - DevCodes

## Por que este arquivo existe

### Atualizacao remota da Fase 6
O usuario confirmou o sucesso de `supabase/tests/phase6_audit_rls.sql` apos aplicar a migration corretiva e ajustar a ordem de limpeza do fixture. A validacao de auditoria terminou; falta habilitar/verificar MFA TOTP no Supabase Auth.

Este documento é a fonte canônica local de tarefas e issues ativas e planejadas do DevCodes, acompanhando o ciclo de vida das 26 melhorias do projeto.

---

## Próximas Issues em Foco

Fase 4 concluída. A Fase 5 mantém validações/publicações remotas pendentes conforme o roadmap. A Fase 6 está implementada localmente (5/5): MFA TOTP (#22), auditoria independente (#23), i18n PT-BR/EN-US (#24), Playwright E2E (#25) e onboarding (#26). O usuário confirmou a aplicação das migrations de auditoria e a aprovação de `supabase/tests/phase6_audit_rls.sql`; falta habilitar/verificar MFA TOTP no Supabase. Roadmap canônico: `docs/implementation-plan.md`.

---

## Issues Concluídas Recentemente

- **ISSUE-015 - Notificações e Lembretes de Tarefas:** Concluída com central/toast in-app, preferências, lembretes por tarefa e teste de isolamento RLS aprovado no Supabase.
- **ISSUE-013 - Compartilhamento de Notas e Eventos:** Concluída com tabelas `note_shares`, `event_shares`, `share_access_logs`, modal `ShareModal`, rota pública `/shared/:share_token`, `shareService.js` e testes unitários.

- **ISSUE-016 - Sincronização em Tempo Real:** Concluída via Supabase Realtime Channels e hooks reativos.
- **ISSUE-014 - Histórico de Versões de Notas:** Concluída com tabela `note_versions` e `NoteVersionsModal`.
- **ISSUE-012 - Atalhos de Teclado Globais:** Concluída com hook `useKeyboardShortcuts` e modal de ajuda.
- **ISSUE-017 - Exportação e Importação de Dados:** Concluída com backup JSON portátil, exportações CSV/JSON por recurso e importação validada de backups e arquivos exportados.
