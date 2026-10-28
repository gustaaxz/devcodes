# Features Pendentes - DevCodes

**Última atualização:** 28 de outubro de 2026  
**Roadmap atual:** Fases 1–5, melhorias #1–#21. A antiga Fase 6 (#22–#26) foi removida do roadmap; seu histórico permanece nos registros de entrega.

**Escopo ativo atualizado em 2026-10-28:** os pedidos de UX e comportamento registrados em `docs/issues.md`; o ciclo não está limitado às issues #18 e #20.

---

## Resumo Geral

| Fase | Status | Pendentes |
|------|--------|-----------|
| Fase 1–3 | ✅ Completas | — |
| Fase 4 | ✅ 5/5 feitas | — |
| Fase 5 | 🔄 Em atualização | #18/#20 seguem com validações próprias; pedidos adicionais de UX estão sendo implementados |

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
- Tags de arquivos podem ser criadas ou selecionadas em **Editar detalhes do arquivo**; aparecem nos itens da biblioteca e podem ser filtradas. Estrelas de favoritos de notas e arquivos usam destaque amarelo, com preenchimento para os itens ativos.
- Pendência para concluir #18: executar `supabase/tests/rls_isolation.sql` atualizado. O usuário confirmou a aplicação de `20261027120000_phase5_tags.sql`; o teste remoto ainda não foi validado.
- Ampliar os tipos aceitos pela Biblioteca de Código com catálogo centralizado, validação de MIME/assinatura, testes e suporte seguro para preview ou download:
  - Documentos e apresentações: `.ppt`, `.pptx`, `.xls`, `.xlsx`, `.odt`, `.ods`, `.odp` e `.rtf`; `.doc` e `.docx` já são aceitos atualmente
  - Preview interno de PDF e imagens SVG, PNG, JPEG, WebP, GIF, BMP e AVIF já implementado com URL assinada; o SVG é exibido como imagem e validado contra scripts e referências externas
  - Formatos sem preview continuam disponíveis para download; arquivos `.env` seguem bloqueados
  - Código, configuração e dados: `.vue`, `.svelte`, `.swift`, `.dart`, `.ipynb`, `.toml`, `.ini`, `.conf`, `.tf`, `.hcl`, `.gradle`, `.properties`, `.csv`, `.log`, `.rst` e `.adoc`
  - Arquivos de projeto sem extensão convencional: `Dockerfile`, `.gitignore`, `.dockerignore`, `.editorconfig` e `.env.example`; arquivos `.env` com possíveis segredos ficam fora da lista

---

### #19: Integração Google Calendar/iCalendar — removida da aplicação
**Status:** Removida localmente em 2026-10-28

Integração OAuth, sincronização Google e feed iCalendar foram removidos da interface e do runtime da aplicação. A importação e exportação local de arquivos `.ics` continuam disponíveis no calendário, e `.ics` também é aceito como arquivo de texto na Biblioteca.

As fontes locais das Edge Functions foram removidas. A migration `20261028100000_remove_calendar_integrations.sql` remove as tabelas de integração quando aplicada no Supabase; `events.ical_uid` permanece para deduplicar importações locais. A migration remota ainda precisa ser aplicada.

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

### #21: Backup Automático e Histórico de Sincronização — fora do escopo atual
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

## Próximas ações do escopo atual

1. **#18:** executar `supabase/tests/rls_isolation.sql` atualizado no Supabase remoto.
2. **#20:** validar visualmente a página `/analytics`.

Não iniciar trabalho nas demais melhorias neste ciclo.


## Atualização da implementação local — 27/10/2026

- #20 está disponível localmente em /analytics, com métricas agregadas por período/categoria, sequência e variação semanal; testes unitários passam e a validação visual continua pendente.
- #21 inclui gerenciador, Edge Function, snapshots gzip privados, restauração aditiva, retenção, histórico de execução e log de alterações. Aplicar a migration 20261027140000_phase5_backups_audit.sql, publicar a função e executar o setup pg_cron conforme docs/BACKUP_SETUP.md.
- Snapshots preservam registros e associações; os bytes dos arquivos da Biblioteca não são copiados. A interface restaura notas, tarefas e eventos de forma aditiva, com IDs novos.
