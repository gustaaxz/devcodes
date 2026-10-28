# Issues - DevCodes

## Por que este arquivo existe

Este documento é a fonte canônica local de tarefas e issues ativas e planejadas do DevCodes. O roadmap atual cobre as Fases 1–5 (#1–#21); a antiga Fase 6 foi removida do roadmap.

---

## Próximas Issues em Foco

**Escopo desta entrega:** favoritos amarelos, tags em arquivos, suporte a `.ics` sem sincronização Google, anotações com prévia e expansão, hover de estados ativos, correção das ações de lembrete, drag-and-drop no quadro, navegação mobile e footer. Roadmap canônico: `docs/implementation-plan.md`.

---

## Issues Concluídas Recentemente

- **ISSUE-015 - Notificações e Lembretes de Tarefas:** Concluída com central/toast in-app, preferências, lembretes por tarefa e teste de isolamento RLS aprovado no Supabase.
- **ISSUE-013 - Compartilhamento de Notas e Eventos:** Concluída com tabelas `note_shares`, `event_shares`, `share_access_logs`, modal `ShareModal`, rota pública `/shared/:share_token`, `shareService.js` e testes unitários.

- **ISSUE-016 - Sincronização em Tempo Real:** Concluída via Supabase Realtime Channels e hooks reativos.
- **ISSUE-014 - Histórico de Versões de Notas:** Concluída com tabela `note_versions` e `NoteVersionsModal`.
- **ISSUE-012 - Atalhos de Teclado Globais:** Concluída com hook `useKeyboardShortcuts` e modal de ajuda.
- **ISSUE-017 - Exportação e Importação de Dados:** Concluída com backup JSON portátil, exportações CSV/JSON por recurso e importação validada de backups e arquivos exportados.
