# Issues - DevCodes

## Por que este arquivo existe

Este documento é a fonte canônica local de tarefas e issues ativas e planejadas do DevCodes, acompanhando o ciclo de vida das 26 melhorias do projeto.

---

## Próximas Issues em Foco

Fase 4 concluída e Fase 5 iniciada pela **#18 — Tags, organização e formatos de arquivo**. A primeira entrega parcial ampliou o catálogo da Biblioteca e adicionou preview interno de PDF e imagens (SVG, PNG, JPEG e formatos adicionais), com validação de conteúdo e renderização segura. Tags universais e gerenciamento ainda fazem parte do escopo pendente da #18. O roadmap detalhado está em `docs/PENDING_FEATURES.md`.

---

## Issues Concluídas Recentemente

- **ISSUE-015 - Notificações e Lembretes de Tarefas:** Concluída com central/toast in-app, preferências, lembretes por tarefa e teste de isolamento RLS aprovado no Supabase.
- **ISSUE-013 - Compartilhamento de Notas e Eventos:** Concluída com tabelas `note_shares`, `event_shares`, `share_access_logs`, modal `ShareModal`, rota pública `/shared/:share_token`, `shareService.js` e testes unitários.

- **ISSUE-016 - Sincronização em Tempo Real:** Concluída via Supabase Realtime Channels e hooks reativos.
- **ISSUE-014 - Histórico de Versões de Notas:** Concluída com tabela `note_versions` e `NoteVersionsModal`.
- **ISSUE-012 - Atalhos de Teclado Globais:** Concluída com hook `useKeyboardShortcuts` e modal de ajuda.
- **ISSUE-017 - Exportação e Importação de Dados:** Concluída com backup JSON portátil, exportações CSV/JSON por recurso e importação validada de backups e arquivos exportados.
