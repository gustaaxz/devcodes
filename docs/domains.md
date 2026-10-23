# Domains - DevCodes

## Por que este arquivo existe

Este documento define as fronteiras de responsabilidade técnica e conceitual dos módulos do DevCodes, orientando humanos e agentes sobre onde cada funcionalidade deve residir.

## Regras Globais

- Cada domínio gerencia seus próprios serviços e componentes em pastas dedicadas dentro de `src/services/` e `src/components/`.
- Todos os domínios persistem dados em tabelas do Supabase isoladas por `user_id` através de Row Level Security (RLS).
- O estado reativo global ou compartilhado entre domínios é mediado pelos Context Providers (`AuthContext`, `ProfileProvider`, `DataVersionProvider`).

---

## 1. Domínio: Autenticação & Usuários (`auth` & `profile`)

**Responsável por:**
- Registro de novos usuários, login, logout e fluxo de recuperação/redefinição de senha.
- Gestão de perfil (`profiles`), incluindo `display_name`, `username`, `avatar_url` e preferências de UI (`theme`, visualizações padrão).

**Inclui:**
- `src/services/auth/authService.js`
- `src/services/profile/profileService.js`
- `src/contexts/AuthContext.jsx`, `src/contexts/ProfileProvider.jsx`
- Tabelas: `auth.users`, `public.profiles`

**Não inclui:**
- Lógica de tarefas, notas ou arquivos vinculados.

---

## 2. Domínio: Produtividade & Tempo (`tasks` & `calendar`)

**Responsável por:**
- Gestão de tarefas diárias e pendências com prazos (`due_at`), status (`pending`, `in_progress`, `done`) e prioridades.
- Gestão de eventos e compromissos com horários marcados (`start_at`, `end_at`), status (`scheduled`, `completed`, `cancelled`) e lembretes.
- Categorias compartilhadas para organização temática (`categories`).

**Inclui:**
- `src/services/tasks/tasksService.js`
- `src/services/events/eventsService.js`
- `src/services/calendar/calendarService.js`
- `src/services/categories/categoriesService.js`
- Tabelas: `public.tasks`, `public.events`, `public.categories`

---

## 3. Domínio: Conhecimento & Anotações (`notes`)

**Responsável por:**
- Criação, edição e exclusão de notas técnicas com suporte a Markdown.
- Sistema de versionamento e histórico de alterações de notas (`note_versions`).
- Associação de tags livres (`tags`, `note_tags`).
- Favoritos e fixação de notas prioritárias.

**Inclui:**
- `src/services/notes/notesService.js`
- `src/services/notes/noteVersionsService.js`
- `src/components/notes/NoteEditor.jsx`, `MarkdownPreview.jsx`, `NoteVersionsModal.jsx`
- Tabelas: `public.notes`, `public.note_versions`, `public.tags`, `public.note_tags`

---

## 4. Domínio: Biblioteca de Código & Arquivos (`programming-library`)

**Responsável por:**
- Upload, listagem, visualização com realce de sintaxe e download de arquivos de código (JS, Python, SQL, etc.).
- Armazenamento físico de arquivos no Supabase Storage (bucket privado com RLS).
- Categorização de arquivos de código por linguagens ou disciplinas acadêmicas.

**Inclui:**
- `src/services/files/filesService.js`
- `src/services/categories/programmingCategoriesService.js`
- `src/components/programming-library/CodeViewer.jsx`, `UploadDropzone.jsx`, `FileViewerModal.jsx`
- Tabelas & Storage: `public.stored_files`, `public.programming_categories`, Bucket `code-files`

---

## 5. Domínio: Dashboard & Busca Global (`dashboard` & `search`)

**Responsável por:**
- Agregação de estatísticas do usuário (total de tarefas pendentes, eventos de hoje, notas recentes).
- Busca rápida unificada (SearchBox e atalho `Cmd/Ctrl + K`) consultando notas, tarefas, eventos e arquivos de código simultaneamente.

**Inclui:**
- `src/services/dashboard/dashboardService.js`
- `src/services/search/searchService.js`
- `src/components/layout/SearchBox.jsx`

---

## Matriz de Dependência entre Domínios

- Todos os domínios dependem do domínio **Autenticação & Usuários** para obter o `user_id` da sessão ativa.
- **Tarefas e Calendário** compartilham o catálogo de `categories`.
- **Anotações** e **Biblioteca de Código** operam de forma desacoplada em armazenamento, mas podem ser indexados em conjunto pelo domínio de **Busca Global**.
- Nenhum serviço de banco de dados deve realizar chamadas diretas a componentes de UI.
