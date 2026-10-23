# Changelog

Todas as mudanças notáveis do DevCodes são documentadas aqui.

## [Unreleased] - Phase 4 em Progresso

### Added
- Suporte a exportação de dados (CSV, JSON) para notas, tarefas e eventos
- Integração SpecFirst para governança de IA
- Documentação técnica completa em `docs/`

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
