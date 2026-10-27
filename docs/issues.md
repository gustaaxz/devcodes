# Issues - DevCodes

## Por que este arquivo existe

Este documento é a fonte canônica local de tarefas e issues ativas e planejadas do DevCodes, acompanhando o ciclo de vida das 26 melhorias do projeto.

---

## Próximas Issues em Foco

Fase 4 concluída; Fase 5 em andamento na **#18 e #19**. A #18 tem catálogo/preview de arquivos e tags universais no código; a migration foi aplicada pelo usuário e falta executar o teste RLS atualizado. A #19 tem import/export iCalendar, feed público revogável e integração Google via Edge Functions no código; migration aplicada pelo usuário; o teste RLS passou; faltam secrets/deploy das funções e validação OAuth com conta Google. Roadmap: `docs/PENDING_FEATURES.md`.

---

## Issues Concluídas Recentemente

- **ISSUE-015 - Notificações e Lembretes de Tarefas:** Concluída com central/toast in-app, preferências, lembretes por tarefa e teste de isolamento RLS aprovado no Supabase.
- **ISSUE-013 - Compartilhamento de Notas e Eventos:** Concluída com tabelas `note_shares`, `event_shares`, `share_access_logs`, modal `ShareModal`, rota pública `/shared/:share_token`, `shareService.js` e testes unitários.

- **ISSUE-016 - Sincronização em Tempo Real:** Concluída via Supabase Realtime Channels e hooks reativos.
- **ISSUE-014 - Histórico de Versões de Notas:** Concluída com tabela `note_versions` e `NoteVersionsModal`.
- **ISSUE-012 - Atalhos de Teclado Globais:** Concluída com hook `useKeyboardShortcuts` e modal de ajuda.
- **ISSUE-017 - Exportação e Importação de Dados:** Concluída com backup JSON portátil, exportações CSV/JSON por recurso e importação validada de backups e arquivos exportados.
