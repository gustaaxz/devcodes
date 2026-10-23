# Issues - DevCodes

## Por que este arquivo existe

Este documento é a fonte canônica local de tarefas e issues ativas e planejadas do DevCodes, acompanhando o ciclo de vida das 26 melhorias do projeto.

---

## Próximas Issues em Foco (Fase 4)

### ISSUE-013 - Compartilhamento de Notas e Eventos
**Tipo:** Feature  
**Status:** Planejada  
**Fase:** Fase 4  

**Objetivo:** Permitir compartilhamento de notas e eventos entre usuários cadastrados e geração de links públicos com controle de permissões.

**Critérios de aceite:**
- Criação das tabelas `note_shares` e `event_shares` com RLS ativado.
- Componente `ShareModal` com controle de permissões (Visualizar / Editar) e expiração opcional.
- Rota pública `/shared/:share_token` para leitura anônima ou cópia direta para a conta do usuário.

---

### ISSUE-015 - Notificações e Lembretes de Tarefas
**Tipo:** Feature  
**Status:** Planejada  
**Fase:** Fase 4  

**Objetivo:** Alertar o usuário sobre tarefas com vencimento próximo via central de notificações in-app e toasts interativos.

**Critérios de aceite:**
- Tabela `reminders` e `reminder_preferences`.
- Ícone de sino com contador (`NotificationCenter`) na Topbar.
- `ReminderToast` com ações rápidas de concluir ou adiar tarefa.

---

### ISSUE-017 - Exportação e Importação de Dados
**Tipo:** Feature  
**Status:** Planejada  
**Fase:** Fase 4  

**Objetivo:** Garantir a portabilidade dos dados do usuário, permitindo download em massa de notas (Markdown/ZIP) e tarefas (JSON/CSV), além de importação.

**Critérios de aceite:**
- Modal de exportação na tela de configurações (`Settings`).
- Exportação segura sem dados sensíveis de credenciais.

---

## Issues Concluídas Recentemente

- **ISSUE-016 - Sincronização em Tempo Real:** Concluída via Supabase Realtime Channels e hooks reativos.
- **ISSUE-014 - Histórico de Versões de Notas:** Concluída com tabela `note_versions` e `NoteVersionsModal`.
- **ISSUE-012 - Atalhos de Teclado Globais:** Concluída com hook `useKeyboardShortcuts` e modal de ajuda.
