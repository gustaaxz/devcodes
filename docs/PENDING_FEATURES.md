# Features Pendentes - DevCodes

**Última atualização:** 27 de outubro de 2026  
**Progresso:** 19/26 validadas remotamente (73%); a implementação local da Fase 6 está completa (5/5), aguardando configuração de MFA TOTP no Supabase.

---

## Resumo Geral

| Fase | Status | Pendentes |
|------|--------|-----------|
| Fase 1–3 | ✅ Completas | — |
| Fase 4 | ✅ 5/5 feitas | — |
| Fase 5 | 🔄 Implementada localmente (4/4); validação/publicação pendentes | #18 RLS, #19 OAuth/deploy, #20/#21 validação |
| Fase 6 | ✅ Implementada localmente (5/5); auditoria validada remotamente | Habilitar/verificar MFA TOTP |

**Pendências de validação/publicação remota:** consulte os itens marcados em cada fase abaixo.

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
  - Preview interno de PDF e imagens SVG, PNG, JPEG, WebP, GIF, BMP e AVIF já implementado com URL assinada; o SVG é exibido como imagem e validado contra scripts e referências externas
  - Formatos sem preview continuam disponíveis para download; arquivos `.env` seguem bloqueados
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

## Fase 6 — Segurança, qualidade e polimento (5 melhorias)

### #22: MFA TOTP via Supabase Auth — implementada localmente
- Cadastro e remoção de autenticador TOTP nas Configurações.
- Desafio de segundo fator para sessões AAL1 quando a conta tem um fator verificado.
- Pendência remota: habilitar MFA TOTP e verificação de fatores nas configurações de Auth do Supabase.

### #23: Auditoria — implementada localmente
- Migration corretiva aplicada pelo usuario; `supabase/tests/phase6_audit_rls.sql` retornou sucesso apos ajustar a limpeza do fixture para evitar a trigger legada `change_log`.
- Migration independente `20261027160000_phase6_audit_log.sql`, com RLS, escrita por triggers e leitura somente dos próprios registros.
- Registra operação e nomes dos campos alterados sem duplicar texto ou conteúdo dos registros.
- Aplicação remota e teste RLS confirmados pelo usuário; validação #23 concluída.

### #24: Internacionalização PT-BR/EN-US — implementada localmente
- Idioma persistido nas preferências do perfil; textos JSX, atributos acessíveis, navegação, controles e datas seguem o idioma selecionado.
- `npm run i18n:check` verifica se textos JSX têm tradução EN-US.

### #25: Testes E2E com Playwright — implementados localmente
- 10 testes cobrem navegação autenticada, idioma, MFA, formulário de tarefa, login, cadastro, recuperação e rotas públicas.
- Supabase é mockado; os testes não precisam de credenciais nem alteram um projeto remoto.

### #26: Tour de onboarding — implementado localmente
- Tour de cinco etapas pelo painel, tarefas, anotações, biblioteca e analytics; conclusão persistida nas preferências do perfil.

## Ordem Sugerida de Implementação

1. **Fase 4**: #13 Compartilhamento → #15 Lembretes → #17 Exportação e Importação de Dados
2. **Fase 5**: #18 Tags → #20 Analytics → #21 Backup → #19 Google Calendar
3. **Fase 6**: #22 MFA → #23 Auditoria → #24 i18n → #25 Playwright → #26 Onboarding

**Validação externa restante da Fase 6:** habilitar/verificar MFA TOTP nas configurações de Auth do Supabase.


## Atualização da implementação local — 27/10/2026

- #20 está disponível localmente em /analytics, com métricas agregadas por período/categoria, sequência e variação semanal; testes unitários passam e a validação visual continua pendente.
- #21 inclui gerenciador, Edge Function, snapshots gzip privados, restauração aditiva, retenção, histórico de execução e log de alterações. Aplicar a migration 20261027140000_phase5_backups_audit.sql, publicar a função e executar o setup pg_cron conforme docs/BACKUP_SETUP.md.
- Snapshots preservam registros e associações; os bytes dos arquivos da Biblioteca não são copiados. A interface restaura notas, tarefas e eventos de forma aditiva, com IDs novos.
