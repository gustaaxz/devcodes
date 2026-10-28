# Changelog

## [Unreleased] - 2026-10-28

### Melhorias
- Biblioteca aceita arquivos de qualquer extensão e tipo até 10 MB, com armazenamento genérico seguro para formatos sem pré-visualização.
- Auditoria da conta inicia recolhida e só carrega os registros após clicar em “Visualizar auditoria da conta”.
- Estrelas dos favoritos de notas e arquivos ficam amarelas e preenchidas quando ativadas.
- Documentado o fluxo existente de criação/atribuição, exibição e filtro de tags em arquivos da Biblioteca.
- Anotações mostram prévias maiores e abrem o editor ao serem selecionadas; `.ics` é aceito na Biblioteca.
- Removida a integração Google e o feed iCalendar, mantendo importação/exportação local `.ics`.
- Corrigidas interações hover de opções ativas, ações de lembrete e acesso ao menu mobile.
- Adicionado drag-and-drop entre colunas de tarefas e footer com guia rápido e link de sugestões.

### Roadmap atualizado
- Removida a antiga Fase 6 (#22–#26) do roadmap atual; os registros históricos de implementação foram preservados.
- O roadmap ativo termina na Fase 5 (#1–#21); o ciclo atual também inclui a lista de ajustes de UX solicitada em 2026-10-28.

### Escopo atual do projeto
- O ciclo atual cobre todos os pedidos de favoritos, tags, `.ics`, anotações, lembretes, quadro de tarefas, menu mobile, estados hover e footer.
- Próximas validações: teste RLS remoto atualizado para #18 e revisão visual de `/analytics` para #20.

### Documentação
- README reorganizado como guia de entrada, com funcionalidades, instalação, configuração Supabase, comandos, segurança e links para os guias detalhados.
- README reescrito com requisitos e passos mínimos para clonar, configurar Supabase, aplicar migrations e iniciar o app localmente.

### Correcao de auditoria da Fase 6
- Corrigida a trigger para ignorar deletes disparados por cascata durante a exclusao de uma conta, evitando inserir logs que referenciem um usuario removido.
- O usuario confirmou a aplicacao da migration corretiva e aprovou `supabase/tests/phase6_audit_rls.sql`; o fixture remove a tarefa B antes da conta para nao acionar a trigger legada `change_log` durante a cascata.

### Ajuste de validacao da Fase 6
- O teste RLS de auditoria conta apenas os registros temporarios criados pelo proprio script, evitando interferencia de dados preexistentes.

Todas as mudanças notáveis do DevCodes são documentadas aqui.

### Fase 6 — segurança, qualidade e polimento (implementação local)
- Adicionado gerenciamento TOTP pelo Supabase Auth, com desafio de AAL2 quando a conta tem um fator verificado.
- Adicionada trilha `audit_log` independente, com RLS e registro de operação/campos alterados sem cópia dos conteúdos.
- Traduzida a interface estática PT-BR/EN-US, incluindo atributos acessíveis e formatação de datas; a preferência de idioma fica no perfil.
- Adicionada checagem automatizada de cobertura i18n e suíte Playwright com 10 fluxos autenticados/públicos usando Supabase mockado.
- Adicionado tour inicial pelo painel, tarefas, anotações, biblioteca e analytics; conclusão salva nas preferências do perfil.
- O usuário confirmou a aplicação das migrations de auditoria e a aprovação de `supabase/tests/phase6_audit_rls.sql`. MFA TOTP ainda precisa estar habilitado nas configurações de Auth do Supabase.

## [Unreleased] - Fase 5 em andamento

### Fase 5 (#20 e #21) — implementação local
- Adicionada página de produtividade com métricas de tarefas, anotações e arquivos por período, atividade por categoria, sequência atual/recorde e variação semanal.
- Adicionado gerenciador de backups com execução manual, retenção configurável, histórico e download de snapshots gzip no Storage privado.
- Histórico reúne execuções de backup e sincronizações Google Calendar; trilha de alterações recentes tem filtro por tipo de recurso.
- Restauração aditiva de notas, tarefas e eventos a partir de snapshots gzip, com confirmação e criação de IDs novos.
- Adicionada migration com RLS para backups, preferências, histórico de sincronização e log de alterações; triggers registram mudanças em notas, tarefas, eventos e metadados de arquivos.
- Criada Edge Function para snapshots e limpeza por retenção. A migration/função ainda precisam ser publicadas; o job pg_cron diário foi criado no Supabase com ID 1.
- Adicionado SQL de configuração que instala/verifica pg_cron e pg_net e agenda backups diários via Vault no Supabase.

### Sistema visual
- Unificados os temas claro/escuro, tipografia Inter, escala de espaçamento, superfícies, sombras e estados de foco/hover.
- Navegação agrupada com estado ativo destacado, recolhimento persistido, fechamento por Escape no mobile e áreas de toque mais confortáveis.
- Corrigidos tokens de cor ausentes e ajustadas legibilidade e responsividade do dashboard, tarefas, calendário, notas, arquivos e configurações.
- Reorganizada a página `/tags` com resumo visual, criação guiada, busca e filtros mais claros, cartões de uso e menu acessível para favoritar, editar, mesclar e excluir.

### Fase 5 (#18) — entrega local em andamento
- Conectadas tags coloridas a notas, tarefas e arquivos, com gerenciamento, favoritos, filtros por recurso, busca e mesclagem em `/tags`.
- Adicionadas sugestões de tags existentes com base no título e conteúdo dos recursos e limpeza automática de tags órfãs, preservando tags favoritas.
- Migration adiciona `task_tags`, cor/favorito, políticas RLS e triggers de limpeza; o usuário confirmou a aplicação remota, com teste RLS atualizado pendente.
- Exportações e importações de notas/tarefas preservam tags.
- Catálogo da Biblioteca ampliado e preview privado de PDF/imagens implementado com validação de conteúdo e tratamento seguro de SVG.

### Fase 5 (#19) — implementação local em andamento
- Importação de `.ics` com prévia, fuso `TZID`, duração, deduplicação por UID e exportação do calendário.
- Feed iCalendar protegido por token aleatório com hash persistido, confirmação de compartilhamento, cópia do link e revogação/rotação.
- Integração Google via Edge Functions com OAuth state/PKCE, refresh token criptografado no servidor, escolha de calendário, sync manual bidirecional, conflito DevCodes-primeiro, histórico e badge.
- Sync automático via Realtime enquanto o app estiver aberto e online. Migration e teste RLS confirmados pelo usuário; secrets, deploy das funções e OAuth Google ainda dependem da configuração externa.

- **Fase 5 iniciada — Biblioteca de Código (#18, entrega parcial):** ampliado o catálogo para documentos Office/OpenDocument/RTF, formatos de código e configuração, dotfiles de projeto selecionados e imagens PNG, JPEG, WebP, SVG, GIF, BMP e AVIF.
  - Adicionada validação de assinatura/conteúdo para imagens, PDFs, arquivos Office e notebooks Jupyter; SVGs com scripts, eventos e referências externas são rejeitados.
  - Adicionado preview interno de PDFs e imagens usando URL assinada do Storage; imagens SVG são exibidas como imagem, sem inserção de marcação SVG no DOM.

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
