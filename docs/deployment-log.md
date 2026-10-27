# Deployment Log - DevCodes

## 1. Visão Geral

Este documento registra o histórico técnico das entregas e deploys efetuados no **DevCodes**, mapeando cada entrega à sua respectiva fase, arquivos alterados e validações executadas.

Para o registro detalhado de implementação com timestamps e decisões técnicas em nível de código, consulte também [implementation-log.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/implementation-log.md) e [CHANGELOG.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/CHANGELOG.md).

---

## 2. Entradas de Deploys e Entregas

### [2026-10-27] - Polimento visual do sistema (implementação local)
- **O que foi feito:** Identidade visual harmonizada entre temas, tipografia, espaçamento, superfícies, contraste e microinterações; navegação organizada e mais acessível; correções para tokens de estilo ausentes.
- **Áreas:** Shell e menus, dashboard, tarefas, calendário, notas, biblioteca, configurações e autenticação.
- **Estado:** Alterações locais; não houve deploy nesta etapa.

### [2026-10-27] - Fase 5 #19: Google Calendar e iCalendar (código local)
- **O que foi feito:** Import/export `.ics`, feed iCalendar público revogável e integração Google por Edge Functions com OAuth PKCE, sync bidirecional e histórico.
- **Segurança:** Refresh token criptografado no servidor; estados OAuth e metadados de feed isolados; URL de feed usa token aleatório e hash persistido.
- **Validação local:** 68 testes passando; lint sem erros (11 avisos preexistentes); Edge Functions sem erros de parsing Oxlint; build aprovado com aviso de bundle acima de 500 kB.
- **Estado remoto:** O usuário confirmou a aplicação de `20261027130000_calendar_integration.sql`. O usuário confirmou que o teste `google_calendar_rls.sql` passou. Configuração de secrets, deploy das funções e OAuth real seguem pendentes.

### [2026-10-27] - Fase 5 #18: confirmação da migration
- **Estado remoto:** Usuário confirmou a aplicação de `20261027120000_phase5_tags.sql`. O teste RLS atualizado, incluindo vínculo de tags de tarefas e limpeza de órfãs, aguarda execução.

### [2026-10-27] - Fase 5 #18: tags universais (implementação local)
- **O que foi feito:** Tags coloridas associadas a notas, tarefas e arquivos; página `/tags` para busca, filtros, favoritos, renomeação, exclusão e mesclagem; sugestões baseadas no título/conteúdo; exportação/importação de tags em notas e tarefas.
- **Integridade:** Migration com tabela `task_tags`, RLS e triggers que limpam tags órfãs inclusive quando associações são removidas por cascata, mantendo tags favoritas.
- **Validação local:** 60 testes aprovados, lint sem erros (11 avisos preexistentes) e build aprovado com aviso do bundle acima de 500 kB.
- **Estado remoto na época do registro:** Migration e teste SQL ainda pendentes de aplicação/execução pelo SQL Editor.

### [2026-10-27] - Fase 5 iniciada: Biblioteca de Código (#18, parcial)
- **O que foi feito:** Expansão do catálogo de arquivos e preview interno de PDF e imagens com validação de conteúdo.
- **Segurança:** SVGs são exibidos em contexto de imagem; uploads validam assinaturas e rejeitam SVG com scripts, atributos de evento e referências externas. Arquivos continuam no bucket privado acessados por URL assinada.
- **Validação local:** 56 testes unitários passaram; lint concluiu sem erros e build aprovado com aviso de bundle existente acima de 500 kB.
- **Estado:** Entrega parcial local; sem alteração de schema ou deploy remoto. Tags universais seguem pendentes para concluir #18.

### [2026-10-27] - Planejamento: preview de PDF e imagens na melhoria #18
- **Fase:** Fase 5 - Organização e Integração
- **Registro:** Escopo planejado para preview interno de PDF e imagens (SVG, PNG, JPEG/JPG, WebP e formatos adicionais aprovados), com validação de conteúdo e renderização segura.
- **Estado da implementação:** Somente documentação/roadmap atualizados; nenhum código ou deploy realizado. PDF já é aceito atualmente sem preview e imagens ainda não são aceitas.

### [2026-10-27] - ISSUE-017: Backup e importação de dados
- **Fase:** Fase 4 - Colaboração e Produtividade Avançada
- **O que foi feito:** Backup JSON completo, importação de backups JSON e arquivos CSV/JSON por recurso, pré-validação e interface em Configurações.
- **Segurança:** Exportações filtradas pelo usuário autenticado; a importação ignora IDs recebidos e define `user_id` pela sessão; usa RLS das tabelas existentes.
- **Validação local:** 50 testes passando; lint sem avisos novos; build aprovado com aviso de bundle acima de 500 kB.
- **Deploy:** Nenhuma migração necessária; código local validado, aguardando o processo normal de publicação do app.

### [2026-10-27] - ISSUE-015: Integração e verificação do schema remoto
- **Fase:** Fase 4 - Colaboração e Produtividade Avançada
- **O que foi feito:** Interface de configuração, central de notificações e ações in-app integradas ao serviço de lembretes; RLS, gatilho de sincronização e teste de isolamento adicionados à migration local.
- **Estado do Supabase remoto:** Após a aplicação pelo usuário, as colunas de `task_reminders` e `reminder_preferences` retornaram HTTP 200 via API; leituras anônimas retornaram listas vazias.
- **Correções aplicadas:** migrations de restauração das categorias e alinhamento do perfil executadas pelo usuário no Supabase.
- **Validação remota:** `supabase/tests/rls_isolation.sql` retornou `OK: todos os testes de isolamento passaram` no SQL Editor.
- **Validação local:** 52 testes passando; lint sem avisos novos; build aprovado com aviso de bundle acima de 500 kB.
- **Storage:** o SQL confirma RLS ativo e quatro políticas configuradas; operações em arquivos usam a Storage API para respeitar a proteção contra mutações SQL diretas.

### [2026-10-26] - Entrega: Fase 4 - Compartilhamento de Notas e Eventos (#13)
- **Fase:** Fase 4 - Colaboração e Produtividade Avançada
- **O que foi feito:**
  - Migração de banco de dados [20261026120000_add_sharing.sql](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/supabase/migrations/20261026120000_add_sharing.sql) aplicada e validada com sucesso no Supabase remoto.
  - Criação das tabelas `note_shares`, `event_shares` e `share_access_logs` com Row Level Security (RLS).
  - Funções RPC com `security definer`: `get_user_id_by_email`, `get_shared_note` e `get_shared_event`.
  - Serviço `shareService.js` com geração de link público, compartilhamento direto por e-mail e clonagem de anotações compartilhadas.
  - Componente `ShareModal.jsx` integrado nas interfaces de anotações (`NoteEditor.jsx`) e eventos (`DayPanel.jsx` / `Calendar/index.jsx`).
  - Rota pública `/shared/:share_token` (`SharedResource/index.jsx`) com visualização somente-leitura e botão "Copiar para Minha Biblioteca".
- **Arquivos modificados:** `supabase/migrations/20261026120000_add_sharing.sql`, `src/services/sharing/*`, `src/components/sharing/*`, `src/pages/SharedResource/*`, `src/components/notes/*`, `src/components/calendar/*`, `src/pages/Calendar/*`, `src/App.jsx`.
- **Resultados dos testes:** 41 testes unitários passando (`npm test`), 0 erros de linting (`npm run lint`), build de produção aprovado (`npm run build`), verificação de conectividade com as 3 novas tabelas e 2 RPCs com status 200 OK.
- **Riscos/Débito técnico:** Nenhum. Tabelas, RLS e RPCs ativas no Supabase.

---

### [2026-10-26] - Alinhamento e Governança Canônica da Pasta docs
- **Fase:** Fase 4 - Governança e Estabilização
- **O que foi feito:**
  - Preenchimento e consolidação de [docs/architecture.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/architecture.md) com a arquitetura real do DevCodes (React 19, Supabase BaaS, camadas e fluxo unidirecional).
  - Preenchimento de [docs/coding-standards.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/coding-standards.md) eliminando placeholders genéricos e formalizando JavaScript (ES2024), React 19, Oxlint e isolamento de serviços.
  - Atualização de [docs/TESTING.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/TESTING.md) com os comandos oficiais (`npm run lint`, `npm test` via Vitest, `npm run build`, testes de isolamento RLS).
  - Estruturação de [docs/backlog.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/backlog.md) com as melhorias das Fases 5 e 6 de [docs/PENDING_FEATURES.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/PENDING_FEATURES.md).
  - Atualização de [docs/operations.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/operations.md) com comandos operacionais rápidos e referências cruzadas para [docs/SETUP.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/SETUP.md) e [docs/deploy.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/deploy.md).
  - Atualização do catálogo e links em [docs/README.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/README.md) e alinhamento com [AGENTS.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/AGENTS.md).
- **Arquivos modificados:** `docs/architecture.md`, `docs/coding-standards.md`, `docs/TESTING.md`, `docs/backlog.md`, `docs/operations.md`, `docs/deployment-log.md`, `docs/README.md`, `AGENTS.md`.
- **Resultados dos testes:** Revisão e validação estática de todos os arquivos de documentação.
- **Riscos/Débito técnico:** Nenhum conhecido. Todas as migrações até `20261023150000_add_note_versions.sql` estão aplicadas e ativas no Supabase remoto.

---

### [2026-10-23] - Entrega: Fase 4 - Exportação de Dados e Governança SpecFirst
- **Fase:** Fase 4 - Colaboração e Produtividade Avançada
- **O que foi feito:**
  - Implementação de `exportService.js` com exportação de dados em formatos CSV e JSON para notas, tarefas e eventos com timestamp automático.
  - UI de exportação integrada em Settings > Exportar Dados.
  - Adoção da governança documental SpecFirst com `AGENTS.md` e sincronização de rastreabilidade.
- **Arquivos modificados:** `src/services/export/exportService.js`, `src/components/settings/`, `AGENTS.md`, `implementation-log.md`, `CHANGELOG.md`.
- **Resultados dos testes:** Build sem erros (`npm run build`), exportação e downloads validados.

---

### [2026-10-23] - Entrega: Fase 3 - Sincronização Realtime, Versões e Atalhos Globais
- **Fase:** Fase 3 - Recursos Essenciais
- **O que foi feito:**
  - Hook `useKeyboardShortcuts` globalizado com atalhos de navegação e modal de ajuda.
  - Histórico de versões de notas com tabela `note_versions`, trigger no PostgreSQL e modal `NoteVersionsModal`.
  - Sincronização em tempo real via canais do Supabase Realtime integrados a Notes e Tasks.
- **Arquivos modificados:** `src/hooks/useKeyboardShortcuts.js`, `src/hooks/useRealtime.js`, `src/components/notes/NoteVersionsModal.jsx`, `supabase/migrations/20261023150000_add_note_versions.sql`.
- **Resultados dos testes:** Testes manuais entre abas com propagação instantânea de eventos.

---

### [2026-10-23] - Entrega: Fases 1 e 2 - Fundação, Auth e Otimização
- **Fase:** Fases 1 e 2 - Fundação & UX
- **O que foi feito:**
  - Autenticação com suporte a `username` ou e-mail com função RPC e validação de duplicatas.
  - Recálculo automático de contadores do dashboard via hook `useDataVersion`.
  - Otimização da busca global (indexação por palavras-chave com limite mínimo de caracteres).
  - Tema escuro e claro persistido no banco e localStorage.
- **Arquivos modificados:** `src/services/auth/authService.js`, `src/contexts/ProfileProvider.jsx`, `src/components/layout/SearchBox.jsx`, `supabase/migrations/20261023130000_add_username_to_profiles.sql`.
- **Resultados dos testes:** Validação de login, alternância visual de temas e tempos de resposta na busca.
