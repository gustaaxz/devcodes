# Features Pendentes - DevCodes

**Última atualização:** 27 de outubro de 2026  
**Progresso:** 18/26 features implementadas (69%)

---

## Resumo Geral

| Fase | Status | Pendentes |
|------|--------|-----------|
| Fase 1–3 | ✅ Completas | — |
| Fase 4 | ✅ 5/5 feitas | — |
| Fase 5 | ⏳ 0/4 feitas | #18, #19, #20, #21 |
| Fase 6 | ⏳ 0/5 feitas | #22, #23, #24, #25, #26 |

**Total pendente: 9 itens conforme as fases abaixo**

---

## Fase 4 — Concluída (5 features)

### #15: Notificações e Lembretes de Tarefas — Concluída
**Prioridade:** 🔴 Alta

Sistema de lembretes in-app para tarefas próximas do vencimento. O fluxo atual é verificado enquanto o app está aberto; envio por e-mail depende de uma futura integração de servidor.

**Escopo:**
- Tabelas `task_reminders` e `reminder_preferences` confirmadas na API remota; teste `supabase/tests/rls_isolation.sql` aprovado no SQL Editor com o resultado final `OK: todos os testes de isolamento passaram`
- Offsets configuráveis: 5 min, 15 min, 1h, 1 dia antes (ou custom)
- Canal in-app implementado; email reservado para futura integração de servidor
- **NotificationCenter** no topbar: ícone de sino com contador, histórico de notificações
- **ReminderToast**: toast no canto superior direito com ações (Descartar, Adiar, Marcar como Concluído)
- **ReminderModal** no TaskModal para configurar lembretes por tarefa
- Preferências em Settings: habilitar/desabilitar in-app e email, offset padrão
- Envio por e-mail via Edge Function permanece planejado para uma integração futura; a entrega atual cobre notificações in-app
- Hook `useReminders` para verificar lembretes periodicamente via realtime subscriptions
- Badge nas tarefas indicando lembrete ativo (ex: "🔔 1h antes")

---

## Fase 5 — Organização e Integração (4 features)

### #18: Tags e Organização Avançada — em andamento
**Prioridade:** 🔴 Alta

Sistema de tags com cores customizadas para organizar notas, tarefas e código, com filtros avançados e gerenciamento centralizado.

**Escopo:**
- Tabelas: `tags` (cor e favorito), `note_tags`, `task_tags`, `file_tags`; contadores de uso calculados a partir das associações
- **TagInput** com autocomplete nas tags existentes, criação inline, chips coloridos removíveis
- **TagColorPicker**: palette de 12 cores pré-definidas + picker customizado
- **TagManager** em Settings: listar, renomear, trocar cor, deletar, mergir duplicadas, favoritar
- **Página `/tags`**: sidebar com lista ordenada por uso, filtro por tipo de recurso (notas/tarefas/código), estatísticas por tag
- Integração nos editores existentes: NoteEditor, TaskModal, FileItem, SearchBox
- Smart Tags: sugestão automática ao criar recurso, limpeza de tags órfãs
- Serviço `tagService.js`: CRUD de tags, associação a recursos, `searchTags()`, `getTopTags()`, `mergeTags()`
- Implementados localmente: associações de tags às notas, tarefas e arquivos; página `/tags` com busca, filtros por recurso, contadores de uso, renomear, cores, favoritos, exclusão e mesclagem; autocomplete de tags existentes; sugestões de tags existentes encontradas no título/conteúdo; remoção automática de tags sem vínculos após desassociação ou exclusão de recurso, preservando favoritas.
- Pendência para concluir #18: executar `supabase/tests/rls_isolation.sql` atualizado. O usuário confirmou a aplicação de `20261027120000_phase5_tags.sql`; o teste remoto ainda não foi validado.
- Ampliar os tipos aceitos pela Biblioteca de Código com catálogo centralizado, validação de MIME/assinatura, testes e suporte seguro para preview ou download:
  - Documentos e apresentações: `.ppt`, `.pptx`, `.xls`, `.xlsx`, `.odt`, `.ods`, `.odp` e `.rtf`; `.doc` e `.docx` já são aceitos atualmente
  - Visualização dentro do sistema para PDFs (`.pdf`, já aceitos, mas hoje sem preview) e imagens `.svg`, `.png`, `.jpg`, `.jpeg`, `.webp` e outros formatos de imagem adicionados ao catálogo
  - Renderização segura de SVG e demais arquivos visuais, com validação de conteúdo e opção de baixar o original; formatos sem preview continuam disponíveis para download
  - Código, configuração e dados: `.vue`, `.svelte`, `.swift`, `.dart`, `.ipynb`, `.toml`, `.ini`, `.conf`, `.tf`, `.hcl`, `.gradle`, `.properties`, `.csv`, `.log`, `.rst` e `.adoc`
  - Arquivos de projeto sem extensão convencional: `Dockerfile`, `.gitignore`, `.dockerignore`, `.editorconfig` e `.env.example`; arquivos `.env` com possíveis segredos ficam fora da lista

---

### #19: Integração com Calendário (iCal/Google Calendar)
**Prioridade:** 🟡 Média — em andamento

Sincronização bidirecional com Google Calendar e suporte a import/export iCalendar.

**Escopo:**
- Tabelas: `google_calendar_integration`, `calendar_sync_logs`, `event_google_mapping`
- **Google OAuth** com scope `calendar.events`, refresh automático de tokens
- **Serviço Google Calendar**: `syncToGoogle()`, `syncFromGoogle()`, `deleteFromGoogle()`, seleção de calendário destino
- **Serviço iCal**: export como `.ics`, import de `.ics`, feed público iCal
- **GoogleCalendarIntegration** em Settings: conectar/desconectar, escolher calendário, toggle de sync automático, log de sincronizações
- Badge "Sincronizado com Google" nos eventos
- **Tratamento de conflitos**: notificar usuário se modificado em ambos os lados, DevCodes prevalece por padrão
- Edge Function para sincronização automática via webhook/realtime
- Implementado localmente: importação com prévia e exportação `.ics`; feed iCalendar público com token aleatório armazenado como hash, botão para copiar e revogação; OAuth Google com state/PKCE; refresh token criptografado com AES-GCM; seleção de calendário gravável; sync bidirecional manual, deduplicação e política DevCodes-primeiro; histórico, badge e sync automático enquanto a SPA está aberta via Supabase Realtime.
- Pendências para concluir #19: configurar e fazer deploy das Edge Functions/secrets conforme `docs/GOOGLE_CALENDAR_SETUP.md` e validar OAuth com uma conta Google de teste. O usuário confirmou a aplicação da migration e a aprovação de `supabase/tests/google_calendar_rls.sql`. A sincronização automática não roda com o navegador fechado; usar webhook/cron do servidor segue como melhoria.

---

### #20: Análise de Produtividade
**Prioridade:** 🟢 Baixa

Dashboard de analytics com gráficos interativos, KPIs, streaks e insights personalizados.

**Escopo:**
- Serviço `analyticsService.js`: tarefas concluídas por período, tempo médio, distribuição por categoria, notas criadas, arquivos por linguagem, streak de dias, tendência, dia mais produtivo, taxa de conclusão
- **AnalyticsDashboard** em `/dashboard/analytics` com filtros por período (semana/mês/ano/custom)
- **Componentes de gráficos** (usando `recharts` ou `chart.js`):
  - Gráfico de linha: produtividade ao longo do tempo
  - Gráfico de barra/pizza: distribuição por categoria
  - Gráfico de área: tendência de atividade
- **StreakCard**: streak atual, calendário visual estilo GitHub, recordes pessoais
- **ProductivityMetrics**: cards com KPIs principais (tarefas/mês, notas criadas, dia mais produtivo, taxa de conclusão)
- Insights automáticos: "Você foi mais produtivo na terça", "Aumentou 15% vs semana anterior", etc.
- Export como PDF via `jsPDF` + `html2canvas`

---

### #21: Backup Automático e Histórico de Sincronização
**Prioridade:** 🟡 Média

Backup automático diário com restauração, auditoria de mudanças e histórico de sincronizações.

**Escopo:**
- Tabelas: `backups`, `sync_history`, `change_log`
- **Backup Service**: criar backup manual, listar histórico, restaurar, validar integridade, download
- **Cron Job** (Edge Function): backup diário, exportar todas as tabelas, compactar em ZIP, salvar no Supabase Storage, limpar backups > 30 dias
- **Change Tracking**: trigger PostgreSQL para registrar todas as mudanças, com valores antigo/novo em JSONB
- **BackupManager** em Settings: toggle de backup automático, último backup, criar manual, lista de backups com download/restore/delete
- **SyncHistory**: timeline de sincronizações por tipo (Google Calendar, Slack, etc.) com status e detalhes
- **AuditLog**: timeline de mudanças com filtro por tipo/data, visualização old vs new, botão "Desfazer"
- Modal de restauração com confirmação por senha e backup automático dos dados atuais antes de restaurar
- Criptografia em repouso via Supabase Storage

---

## Fase 6 — Funcionalidades Avançadas (5 features)

### #22: Atalhos de Teclado Customizáveis
**Prioridade:** 🟢 Baixa

Sistema para reatribuir atalhos de teclado com profiles (VS Code, Vim, etc.) e import/export.

**Escopo:**
- Tabelas: `user_shortcuts` e `shortcut_profiles`
- Atalhos suportados: `Ctrl+K` (busca), `Ctrl+N` (nota), `Ctrl+T` (tarefa), `Ctrl+E` (evento), `Ctrl+/` (atalhos) + 10-15 opcionais
- **KeyboardShortcutsPage** em Settings: tabela ação/atalho com edição inline, detecção de conflitos, reset to defaults
- **ShortcutInput**: captura pressionamento de teclas em tempo real, bloqueia se conflitar
- **ShortcutProfiles**: profiles pré-definidos (VS Code, Vim, Emacs, Default) + customizados; ativar/deletar/exportar/importar
- Hook `useKeyboardShortcuts` refatorado para carregar atalhos do banco em vez de hardcoded
- Serviço `shortcutService.js`: CRUD, validação de combinações, detecção de conflitos, import/export JSON

---

### #23: Modo Offline com Sincronização
**Prioridade:** 🟡 Média

Trabalho offline com sincronização automática ao reconectar, usando Service Workers e IndexedDB.

**Escopo:**
- **Service Worker** (`public/sw.js`): cache-first para assets, network-first para APIs, background sync
- **IndexedDB** para persistência local: salvar, recuperar, listar e deletar recursos offline
- **Sync Queue**: fila de operações pendentes persistida em localStorage, processamento automático ao reconectar
- **Conflict Resolution**: detecção de mudanças em ambos os lados, estratégia last-write-wins ou notificação ao usuário, merge quando possível
- **OfflineIndicator** no topbar: "🔴 Offline" / "⚙️ Sincronizando..." / "✓ Tudo sincronizado"
- Operações suportadas offline: criar/editar/deletar notas, tarefas e eventos; marcar tarefa como concluída; adicionar tags
- Não suportado offline: upload de arquivos
- Hook `useOfflineSync`: detectar online/offline, disparar sync, mostrar status

---

### #24: Integração com Slack
**Prioridade:** 🟢 Baixa

Enviar notas/tarefas/eventos para canais do Slack, receber eventos via webhook e criar recursos a partir de reações.

**Escopo:**
- Tabelas: `slack_connections`, `slack_channels`, `slack_messages_log`
- **Slack OAuth** com scopes: `chat:write`, `reactions:read`, `commands`
- **Serviço Slack**: autenticação, envio para canais, formatação de mensagens, webhook para receber eventos
- **SlackIntegration** em Settings: conectar/desconectar, exibir workspace + canais
- **SlackShareModal**: seletor de canal, preview da mensagem, campo customizado, enviar
- Menu "Enviar para Slack" em notas, tarefas e eventos
- **Webhook** (Edge Function): reações criam recursos (📝 → nota, 🎯 → tarefa)
- **Resumo diário** opcional: Edge Function envia resumo de tarefas concluídas para Slack
- Formatação: nota (título + snippet + link), tarefa (título + status + due date + link), evento (título + data/hora + link)

---

### #25: API Pública e Webhooks
**Prioridade:** 🟢 Baixa

API REST pública com autenticação por API key, webhooks customizáveis e documentação OpenAPI/Swagger.

**Escopo:**
- **Endpoints REST** (`/api/v1/`): CRUD completo para notes, tasks, events, tags; gestão de webhooks e API keys; perfil do usuário
- Tabelas: `api_keys`, `webhooks`, `webhook_deliveries`
- **Autenticação**: API key via header `Authorization: Bearer <key>`, rate limiting (1000 req/h por key)
- **Webhooks**: eventos disparados em create/update/delete de recursos; payload assinado com HMAC-SHA256; retry com exponential backoff
- **ApiKeysManager** em Settings: gerar/copiar/revogar chaves
- **WebhooksManager** em Settings: criar/editar/deletar webhooks, enviar payload de teste, ver logs de delivery com retry
- **Documentação**: OpenAPI/Swagger com exemplos em cURL, JavaScript e Python; hosted em `/docs/api`
- Rate limiting via PostgreSQL + Redis

---

### #26: Multi-Tenancy e Workspaces
**Prioridade:** 🟢 Baixa

Múltiplos workspaces isolados por usuário com roles de permissão e colaboração.

**Escopo:**
- Tabelas: `workspaces`, `workspace_members`, `workspace_roles`
- **Refactor de tabelas existentes**: adicionar `workspace_id` em notes, tasks, events, programming_files, tags
- **RLS refatorado**: policies consideram workspace_id; Owner (acesso total), Editor (create/edit), Viewer (read-only)
- **WorkspaceProvider** (contexto global): gerenciar workspace ativo, listar acessíveis
- **WorkspaceSwitcher** no topbar: dropdown com workspace ativo, criar novo, sair
- **WorkspaceManager** (`/workspaces`): grid de workspaces com nome, owner, nº membros; entrar/editar/sair/deletar
- **WorkspaceSettings**: editar nome/descrição/avatar, gerenciar membros com roles, convidar via link ou email
- **Fluxo de convite**: link único, email, busca por email, notificação, accept/reject
- **Migração**: criar workspace padrão para cada usuário existente, migrar dados automaticamente
- Todos os recursos filtrados pelo workspace ativo

---

## Ordem Sugerida de Implementação

1. **Fase 4**: #13 Compartilhamento → #15 Lembretes → #17 Exportação e Importação de Dados
2. **Fase 5**: #18 Tags → #20 Analytics → #21 Backup → #19 Google Calendar
3. **Fase 6**: #23 Offline → #22 Atalhos → #24 Slack → #25 API → #26 Workspaces

**Paralelizáveis:** #13 + #15 | #18 + #20 | #22 + #23 | #24 + #25
