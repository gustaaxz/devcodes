# Data Model - DevCodes

## Por que este arquivo existe

Este documento descreve os modelos de dados, tabelas, campos, relações e regras de validação persistidos no PostgreSQL gerenciado via Supabase no projeto DevCodes.

## Princípios de Dados

- **Isolamento por RLS:** Toda tabela de negócio possui coluna `user_id uuid references auth.users(id)` e RLS habilitado, garantindo privacidade estrita.
- **Auditoria de tempo:** Tabelas contêm `created_at` e `updated_at` (atualizado automaticamente via trigger `set_updated_at()`).
- **Integridade referencial:** Remoções de categorias ou tags usam `on delete set null` ou tabelas de relacionamento com `cascade`.

---

## Entidades Principais

### 1. `profiles`
Informações complementares ao cadastro de `auth.users`.
- `id` (uuid, PK, ref `auth.users` on delete cascade)
- `display_name` (text, opcional)
- `username` (text, unique, 3 a 30 caracteres)
- `avatar_url` (text, opcional)
- `theme` (text, 'dark' | 'light', default 'dark')
- `default_calendar_view` (text, 'month' | 'week' | 'day')
- `created_at`, `updated_at` (timestamptz)

### 2. `categories`
Categorias organizacionais compartilhadas entre tarefas e eventos.
- `id` (uuid, PK)
- `user_id` (uuid, ref `auth.users`)
- `name` (text, not null, 1 a 60 chars)
- `color` (text, hex color code)
- Unique: `(user_id, name)`

### 3. `tasks`
Tarefas e pendências com prazos e status.
- `id` (uuid, PK)
- `user_id` (uuid, ref `auth.users`)
- `title` (text, not null, 1 a 200 chars)
- `description` (text, opcional)
- `category_id` (uuid, ref `categories`, on delete set null)
- `due_at` (timestamptz, opcional)
- `priority` (text, 'low' | 'medium' | 'high', default 'medium')
- `status` (text, 'pending' | 'in_progress' | 'done', default 'pending')
- `completed_at` (timestamptz)

### 4. `events`
Eventos de calendário e reuniões agendadas.
- `id` (uuid, PK)
- `user_id` (uuid, ref `auth.users`)
- `title` (text, not null, 1 a 200 chars)
- `description` (text, opcional)
- `category_id` (uuid, ref `categories`, on delete set null)
- `start_at` (timestamptz, not null)
- `end_at` (timestamptz, check `end_at >= start_at`)
- `priority` (text, 'low' | 'medium' | 'high')
- `status` (text, 'scheduled' | 'completed' | 'cancelled')
- `reminder_at` (timestamptz)

### 5. `notes` & `note_versions`
Notas técnicas em Markdown e histórico de versões.
- **`notes`:**
  - `id` (uuid, PK)
  - `user_id` (uuid, ref `auth.users`)
  - `title` (text, max 200 chars)
  - `content` (text, conteúdo Markdown)
  - `category_id` (uuid, ref `categories`)
  - `is_pinned` (boolean, default false)
- **`note_versions`:**
  - `id` (uuid, PK)
  - `note_id` (uuid, ref `notes` on delete cascade)
  - `user_id` (uuid, ref `auth.users`)
  - `title` (text)
  - `content` (text)
  - `version_number` (int)
  - `created_at` (timestamptz)

### 6. `stored_files` & `programming_categories`
Arquivos da biblioteca de códigos e categorização por linguagem/disciplina.
- **`programming_categories`:**
  - `id` (uuid, PK)
  - `user_id` (uuid, ref `auth.users`)
  - `name` (text, unique por usuário)
  - `icon` (text), `color` (text)
- **`stored_files`:**
  - `id` (uuid, PK)
  - `user_id` (uuid, ref `auth.users`)
  - `programming_category_id` (uuid, ref `programming_categories`)
  - `file_name` (text), `file_path` (text caminho no storage)
  - `file_size` (bigint), `mime_type` (text), `language` (text)

### 7. `tags` & `note_tags`
Sistema flexível de marcação de notas.
- `tags`: `(id, user_id, name)` com unique `(user_id, name)`.
- `note_tags`: tabela de junção `(note_id, tag_id)`.

---

## Migrações e Evolução de Schemas

- Novas tabelas e alterações de colunas devem ser criadas via scripts SQL em `supabase/migrations/` numerados sequencialmente com timestamp (ex: `YYYYMMDDHHMMSS_nome_da_migracao.sql`).
- Toda migração que criar tabela deve obrigatoriamente incluir `ALTER TABLE <nome> ENABLE ROW LEVEL SECURITY;` e suas políticas `FOR ALL USING (auth.uid() = user_id)`.
