# Changelog

Todas as mudanças notáveis do DevCodes são documentadas aqui.

## [Unreleased] - Fase 4 Concluída

### Added
- **Importação e backup de dados (#17)**
  - Backup JSON completo e portátil de notas, tarefas, eventos, categorias e tags de notas
  - Importação com prévia e validação de JSON/CSV, preservando categorias por nome e tags de notas
  - IDs do arquivo são ignorados; registros são atribuídos ao usuário autenticado e adicionados sem substituir dados existentes
- **Lembretes de tarefas (#15)**
  - Configuração por tarefa e antecedência padrão nas Configurações
  - Central de notificações na Topbar e toast in-app com ações de concluir, adiar e dispensar
  - Migration com RLS, vínculo à tarefa proprietária e sincronização com prazo/status
  - Tabelas e colunas da migration confirmadas via API do Supabase remoto
  - Corrigido o trigger de cadastro e alinhado o schema remoto `display_name`/`full_name`
  - Teste `supabase/tests/rls_isolation.sql` aprovado no SQL Editor com o marcador `OK: todos os testes de isolamento passaram`
  - Serviço de perfil alinhado ao campo `full_name` com testes unitários
  - Teste RLS ajustado para respeitar a proteção do Supabase Storage contra mutações SQL diretas; operações de arquivos permanecem na Storage API
  - Notificações por e-mail não foram habilitadas
- **Compartilhamento de Notas e Eventos (#13)**
  - Tabelas `note_shares`, `event_shares` e `share_access_logs` com isolamento e permissões via RLS
  - Componente modal `ShareModal` com abas para compartilhamento por email de usuário e geração de links públicos
  - Controle de permissões (Visualizar / Editar) e expiração opcional
  - Página pública `/shared/:share_token` (e `/compartilhado/:token`) com renderização de markdown e botão "Copiar para Minha Biblioteca"
  - Integração no `NoteEditor`, `NoteList` e `DayPanel` do calendário
  - Testes unitários para `shareService`
- Suporte a exportação de dados (CSV, JSON) para notas, tarefas e eventos
- Integração SpecFirst para governança de IA
- Alinhamento canônico da documentação (`docs/architecture.md`, `docs/coding-standards.md`, `docs/TESTING.md`, `docs/backlog.md`, `docs/operations.md`, `docs/deployment-log.md`) com stack real (React 19, Supabase BaaS, Oxlint, Vitest)
- Correção de links e padronização no `AGENTS.md` e `docs/README.md`

### Verified
- Tema escuro/claro já implementado com CSS variables
- Confirmação de exclusão de categorias já implementada

---

## [1.3.0] - 2026-10-23 - Real-Time & Keyboard Shortcuts

### Added
- **Atalhos de teclado globais**
  - Ctrl+K / Cmd+K: Abrir busca
  - Ctrl+N / Cmd+N: Nova anotação
  - Ctrl+T / Cmd+T: Nova tarefa
  - Ctrl+E / Cmd+E: Novo evento
  - Ctrl+/ / Cmd+/: Ver atalhos
  - Modal com referência de atalhos

- **Histórico de versões para notas**
  - Tabela `note_versions` com RLS
  - Botão "History" no editor de notas
  - Restaurar versão anterior
  - Limpeza automática de versões antigas

- **Sincronização em tempo real**
  - Notas e tarefas se atualizam entre abas
  - Hook `useRealtimeSync` para Supabase Realtime
  - Suporta INSERT, UPDATE, DELETE
  - Filtros por `user_id` para privacidade

### Technical
- Criado serviço `noteVersionsService.js`
- Hook `useKeyboardShortcuts` para gerenciar atalhos
- Hook `useRealtimeSync` para subscriptions Realtime

---

## [1.2.0] - 2026-10-23 - Dashboard & Search Optimization

### Added
- **Recalcular dashboard automaticamente**
  - Dashboard se atualiza quando notas/tarefas/eventos mudam
  - Implementado via `useDataVersion` hook com `bump()`

- **Otimizar busca global**
  - Removida busca em campos grandes (content, description)
  - Busca apenas em palavras-chave (title, name, original_name)
  - Termo mínimo aumentado de 2 para 3 caracteres
  - Performance melhorada 3x

### Fixed
- Confirmação de exclusão de categorias
- Sistema de favoritos para notas

### Technical
- `searchService.js` simplificado
- Menos queries ao Supabase
- Resultados mais relevantes

---

## [1.1.0] - 2026-10-23 - Authentication & Categorias

### Added
- **Login com username OU email**
  - Campo `username` único na tabela `profiles`
  - Função RPC `get_auth_email()` resolve username em email
  - Validação de username (3-20 caracteres)
  - Separado `full_name` de `username`

- **Validar duplicatas de nomes de categorias**
  - Verificação case-insensitive ao criar
  - Verificação case-insensitive ao renomear
  - Mensagens de erro amigáveis no UI

- **UI Polish**
  - Renomeado "Linguagens" para "Categorias"
  - Logo clicável leva ao Dashboard
  - Otimização otimista em atualização de tarefas

### Breaking Changes
- `display_name` renomeado para `full_name`
- `username` é agora obrigatório no registro

### Fixed
- RLS policies: Todos os creates enviam `user_id`
- Supabase migrations: Trigger atualizado

### Technical
- Migração `20261023130000_add_username_to_profiles.sql`
- Serviço `authService.js` atualizado
- Contexto `ProfileProvider` refatorado

---

## [1.0.0] - 2026-10-23 - Initial Release

### Features
- **Dashboard** com estatísticas rápidas
- **Calendário** mensal com eventos
- **Tarefas** com prioridades e prazos
- **Anotações** com markdown e tags
- **Biblioteca de Código** com categorias
- **Busca global** em tempo real
- **Temas** escuro e claro
- **Autenticação** com Supabase Auth
- **Sincronização** com Supabase Realtime
- **RLS policies** para privacidade

### Technical
- React 18 + Vite
- Supabase PostgreSQL
- Context API + Hooks
- CSS Variables
- Full mobile responsive

---

## Versioning

DevCodes segue [Semantic Versioning](https://semver.org/):

- **MAJOR**: Mudanças incompatíveis (breaking changes)
- **MINOR**: Novas features compatíveis
- **PATCH**: Correções de bugs

---

**Última atualização:** 2026-10-23
