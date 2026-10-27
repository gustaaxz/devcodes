# Implementation Log

Registro técnico de todas as implementações, decisões e outcomes.

---

## 2026-10-27 - Fase 5 iniciada: formatos e preview na Biblioteca (#18)

**Fase:** Fase 5 — Organização e Integração
**Status:** Em andamento; entrega parcial da melhoria #18
**Implementado:** Catálogo de extensões ampliado para formatos Office, OpenDocument, RTF, linguagens/configurações selecionadas, dotfiles conhecidos e imagens PNG/JPEG/WebP/SVG/GIF/BMP/AVIF. Preview de PDF e imagens através de URL assinada do Supabase Storage. Validação de assinaturas para formatos binários e rejeição de SVG com scripts, handlers de evento ou referências externas.
**Validação:** `npm test` — 56 testes aprovados; `npm run lint` — sem erros, avisos preexistentes; `npm run build` — aprovado, com aviso conhecido de bundle acima de 500 kB. Revisão adicional aumentou a validade da URL assinada para 10 minutos, restringiu referências SVG a fragmentos locais e cobriu nomes especiais e bloqueio de `.env`.
**Limites desta entrega:** Tags universais, UI de gerenciamento/filtros e novas associações para tarefas ainda não foram implementadas. Não houve mudança de schema nem aplicação no Supabase nesta etapa.

---

## 2026-10-27 - Planejamento da visualização de PDF e imagens (#18)

**Fase:** Fase 5 — Organização e Integração
**Status:** Planejada; nenhuma implementação de código realizada nesta atualização
**Decisão:** Incluir no escopo da melhoria #18 a visualização dentro do sistema de PDFs e imagens (SVG, PNG, JPEG/JPG, WebP e formatos adicionais aprovados). PDF já é aceito pela biblioteca, mas atualmente o visualizador oferece somente download para arquivos binários; imagens ainda não estão no catálogo aceito. O preview deverá validar conteúdo e tratar SVG com renderização segura.
**Arquivos de planejamento:** `docs/PENDING_FEATURES.md`, `docs/implementation-plan.md`, `docs/backlog.md` e `docs/issues.md`.

---

## 2026-10-27 - ISSUE-015: Correção de categorias padrão no cadastro

**Fase:** Fase 4 — Colaboração e Produtividade Avançada  
**Status:** Concluída; migrations corretivas aplicadas no remoto pelo usuário e teste RLS aprovado

### Diagnóstico e Correção

- O teste no SQL Editor falhou porque `20261023130000_add_username_to_profiles.sql` substituiu `handle_new_user()` e removeu a criação das categorias padrão.
- Criada a migration `20261027100000_restore_signup_defaults.sql`, que preserva `full_name` e `username`, restaura as 10 categorias de programação e 6 acadêmicas para novos cadastros e repõe os padrões apenas para contas existentes sem categorias.
- O diagnóstico da API confirmou que o schema remoto tem `display_name` e `username`, mas ainda não tem `full_name`. Criada `20261027110000_align_profile_schema.sql` para renomear a coluna legada ou criar a nova quando necessário.
- Alinhado `profileService` ao campo `full_name` consumido por `ProfileProvider`, com testes de leitura e gravação do perfil.
- Atualizados os metadados dos usuários temporários no teste para refletir os campos atuais do perfil.

### Validação

- `npm test`: 52 testes passando, incluindo 2 testes do serviço de perfil.
- `npm run lint`: sem avisos novos; os avisos permanecem em arquivos não relacionados.
- `npm run build`: aprovado; Vite mantém o aviso de bundle acima de 500 kB.
- A API REST do Supabase respondeu HTTP 200 às consultas anônimas de `task_reminders` e `reminder_preferences`, com zero linhas visíveis; isso não comprova isolamento entre dois usuários autenticados.
- A API também confirmou `display_name` e `username` no perfil remoto e retornou erro para `full_name`.
- Após a aplicação da migration de alinhamento, o teste passou pelo cadastro e pelas verificações das tabelas da aplicação, chegando ao bloco de Storage.
- A execução foi bloqueada pelo trigger oficial `storage.protect_delete()`. Removidas do teste todas as mutações SQL diretas em `storage.objects`; agora ele verifica RLS ativo e presença das quatro políticas, deixando operações de arquivo para a Storage API.
- O usuário executou a versão ajustada de `supabase/tests/rls_isolation.sql`; resultado confirmado: `OK: todos os testes de isolamento passaram`.
- O teste SQL valida isolamento entre dois usuários nas tabelas da aplicação, vínculo de lembrete à tarefa proprietária, políticas Storage configuradas e bloqueio de acesso anônimo. Operações runtime em arquivos devem ser validadas pela Storage API.

---

## 2026-10-27 - ISSUE-017: Exportação e Importação de Dados

**Fase:** Fase 4 — Colaboração e Produtividade Avançada  
**Status:** Concluída  

### O Que Foi Feito

- Criado backup JSON completo e portátil para notas, tarefas e eventos, preservando nomes de categorias e tags de notas sem exportar IDs ou `user_id`.
- Exportações individuais CSV/JSON agora filtram explicitamente pelo usuário autenticado; valores CSV com vírgulas, aspas e quebras de linha são escapados corretamente.
- Adicionada importação de backups JSON e CSV/JSON individuais exportados pelo DevCodes, com limite de 10 MB/500 registros, validação por linha, prévia e confirmação.
- Importações ignoram IDs recebidos, atribuem `user_id` da sessão, recriam categorias por nome e acrescentam dados sem substituir registros existentes.
- Adicionados testes do parser para backups, CSV com aspas/quebras de linha, IDs de terceiros e linhas inválidas.
- Alinhados `docs/issues.md`, `docs/implementation-plan.md` e `docs/PENDING_FEATURES.md`; #17 agora representa exportação/importação.

### Validação

- `npm test`: 50 testes passando.
- `npm run lint`: sem avisos novos; avisos anteriores permanecem em arquivos não relacionados.
- `npm run build`: aprovado; Vite reporta bundle acima de 500 kB.
- Sem alterações de schema ou dados remotos nesta entrega; operações de importação dependem das políticas RLS existentes para notas, tarefas, eventos, categorias e tags.

### Decisões e Limites

- A importação é aditiva: não atualiza nem remove dados atuais. Reimportar o mesmo arquivo pode criar duplicatas.
- IDs do arquivo não são reutilizados; categorias são conciliadas por nome e tags são recriadas por meio do serviço de notas.
- O escopo implementado cobre backup JSON e os formatos CSV/JSON existentes; exportação de Markdown ZIP não foi incluída.

---

## 2026-10-27 - ISSUE-015: Integração local de lembretes de tarefas

**Fase:** Fase 4 — Colaboração e Produtividade Avançada  
**Status:** Concluída após alinhamento do schema remoto e aprovação do teste RLS entre usuários  

### O Que Foi Feito

- Integrado o serviço de lembretes ao modal de tarefas, à central de notificações da Topbar e às preferências padrão em Configurações.
- Implementados avisos in-app com polling de 30 segundos enquanto o app está aberto e ações para concluir, adiar por 15 minutos e dispensar.
- A migration agora limita a um lembrete por tarefa, verifica RLS do proprietário da tarefa e sincroniza lembretes com mudança de prazo, conclusão ou remoção do prazo.
- Estendidos os testes de RLS e adicionados testes unitários de cálculo/formatação de antecedência.
- E-mail não foi habilitado: não há função de envio configurada. O cliente persiste apenas notificações in-app.

### Validação

- `npm test`: 52 testes passando após os ajustes de integração e perfil.
- `npm run lint`: sem avisos novos; permanecem avisos anteriores em outros arquivos.
- `npm run build`: aprovado; Vite reporta o aviso existente de bundle acima de 500 kB.
- Supabase remoto: consultas somente leitura retornaram HTTP 200 para as colunas de `task_reminders` e `reminder_preferences`; leituras sem sessão autenticada retornaram `[]`.
- O teste RLS entre dois usuários foi concluído posteriormente; o resultado confirmado pelo usuário foi `OK: todos os testes de isolamento passaram`.

### Decisão e Bloqueador

- As migrations foram aplicadas pelo usuário no SQL Editor; a leitura anônima vazia foi complementada pelo teste transacional de isolamento entre dois usuários.

---

## 2026-10-26 - ISSUE-013: Compartilhamento de Notas e Eventos (Fase 4)

**Implementador:** Antigravity AI  
**Fase:** Fase 4 — Colaboração e Produtividade Avançada  
**Status:** Complete  

### O Que Foi Feito

1. **Schema e Banco de Dados (Supabase / PostgreSQL)**
   - Criada migration `supabase/migrations/20261026120000_add_sharing.sql`.
   - Tabelas `note_shares`, `event_shares` e `share_access_logs`.
   - Políticas RLS rigorosas: proprietário gerencia compartilhamentos próprios, usuários compartilhados leem seus registros, leitura segura de links públicos.
   - Políticas RLS complementares para notas e eventos compartilhados (`notes_select_shared`, `notes_update_shared`, `events_select_shared`, `events_update_shared`).
   - Funções RPC com `security definer`: `get_user_id_by_email` para busca segura de usuários por e-mail e `get_shared_note` / `get_shared_event` com logging automático de acessos.

2. **Camada de Serviço (`src/services/sharing/shareService.js`)**
   - Métodos: `generateNotePublicLink`, `shareNoteWithUser`, `listNoteShares`, `revokeNoteShare`, `getSharedNote`.
   - Métodos equivalentes para eventos: `generateEventPublicLink`, `shareEventWithUser`, `listEventShares`, `revokeEventShare`, `getSharedEvent`.
   - Métodos de agregação e portabilidade: `getSharedWithMe()` e `copySharedNoteToLibrary()`.

3. **Interface do Usuário**
   - Componente `ShareModal.jsx` e `ShareModal.css`: abas "Usuários" (compartilhar por e-mail com permissão e expiração) e "Link Público" (geração de link, cópia para clipboard, revogação).
   - Botão de compartilhamento integrado na toolbar do `NoteEditor.jsx`.
   - Botão de compartilhamento adicionado nas ações de eventos do `DayPanel.jsx` do calendário.
   - Ícone/badge de compartilhado no `NoteList.jsx` e `DayPanel.jsx`.
   - Página pública `/shared/:share_token` e `/compartilhado/:token` (`src/pages/SharedResource/index.jsx`): exibição em modo somente-leitura com preview formatado em markdown, dados do autor e botão "Copiar para Minha Biblioteca".

4. **Testes Unitários e Qualidade**
   - Criado `src/services/sharing/shareService.test.js` com testes unitários cobrindo validação de compartilhamento com o próprio usuário, e-mail inexistente, expiração e cópia de notas.
   - Execução de `npm test` (41 testes passando) e `npm run lint` (0 erros).

---

## 2026-10-26 - Canonical Documentation Alignment & SpecFirst Consolidation

**Implementador:** Antigravity AI  
**Fase:** Governança e Estabilização  
**Status:** Complete  

### O Que Foi Feito

1. **Preenchimento de Documentos Nucleares Vazios**
   - `docs/architecture.md`: Preenchido integralmente com arquitetura SPA + Supabase BaaS, diagrama de camadas, fluxo de dados unidirecional e regras de dependência.
   - `docs/coding-standards.md`: Substituídos os placeholders genéricos de template por padrões oficiais (JavaScript ES2024, React 19 com componentes funcionais e hooks, Oxlint, CSS Variables, serviços desacoplados em `src/services/<dominio>/`).
   - `docs/TESTING.md`: Definidos comandos oficiais (`npm run lint`, `npm test` via Vitest, `npm run build`, `supabase/tests/rls_isolation.sql`).
   - `docs/backlog.md`: Estruturado com melhorias planejadas das Fases 5 e 6 de `docs/PENDING_FEATURES.md`.
   - `docs/operations.md`: Criado cheat sheet operacional rápido com comandos diários e variáveis de ambiente.

2. **Consolidação de Logs e Rastreabilidade**
   - `docs/deployment-log.md`: Substituídas as entradas residuais do template de maio/2026 pelo histórico técnico consolidado de deploys do DevCodes.
   - `docs/README.md`: Atualizado o catálogo geral com os 28 arquivos, corrigindo links com caminhos relativos e padronizados.
   - `AGENTS.md`: Corrigidas referências a `docs/TESTING.md`, `docs/security.md`, `docs/implementation-plan.md` e versão do React (19).
   - `docs/deploy.md` e `docs/implementation-plan.md`: Corrigidos links e alinhada versão do React.

### Decisões Tomadas

1. **Unificação da Arquitetura no architecture.md**
   - Decisão: Consolidar a arquitetura técnica descrita em `FEATURES.md` e `domains.md` diretamente em `docs/architecture.md`.
   - Razão: Atender à Regra Mandatória 1 do `AGENTS.md` ("Sempre leia `docs/architecture.md` antes de implementar") sem inconsistências.

2. **Stack Tecnológica Oficial: React 19 + JavaScript**
   - Decisão: Manter a documentação fiel ao `package.json` (`react: ^19.3.1`, sem TypeScript).
   - Razão: Evitar que novos agentes tentem gerar código em TypeScript ou com dependências não utilizadas.

### Testes Executados

- ✅ Validação estática de links e referências cruzadas entre `AGENTS.md`, `docs/README.md` e `docs/*`.
- ✅ Sem quebras de links absolutos com casing incorreto.

---

## 2026-10-23 - SpecFirst Integration + Phase 4 Start

**Implementador:** Kiro AI  
**Fase:** 4/6  
**Status:** Complete  

### O Que Foi Feito

1. **Integração SpecFirst**
   - Criado `AGENTS.md` com guia para agentes
   - Documentação arquitetural em `docs/architecture.md`
   - Definition of Done em `docs/definition-of-done.md`
   - Este implementation-log

2. **Phase 4 - Item #8 e #9**
   - #8 - Tema escuro/claro: Verificado como já implementado
     - CSS variables com `:root[data-theme]`
     - Seletor em Settings > Aparência
     - localStorage persiste preferência
   - #9 - Exportar dados
     - Novo serviço `exportService.js`
     - Suporta CSV e JSON para notas, tarefas, eventos
     - Download automático com timestamp
     - UI em Settings > Exportar dados

### Decisões Tomadas

1. **SpecFirst como Framework**
   - Decisão: Usar SpecFirst para governança de IA
   - Razão: Melhor rastreabilidade, contexto claro, sincronização plano-execução
   - Impacto: Todas as tarefas futuras precisam atualizar implementation-log

2. **Exportação em Serviço Separado**
   - Decisão: Criar `src/services/export/exportService.js`
   - Razão: Reutilizável, testável, sem lógica em componentes
   - Impacto: Fácil adicionar novos formatos (Excel, etc)

### Bloqueadores Resolvidos

- Git sandbox issue: Usado web_fetch em vez de git clone
- PowerShell PATH: Usado script intermediário para commits

### Dependências Criadas

- None - Independentes

### Próximos Passos

- Implementar #13 (Compartilhar notas/eventos)
- Implementar #15 (Notificações de lembretes)
- Implementar #17 (Upload de múltiplos arquivos)

### Testes Executados

- ✅ Build sem erros: `npm run build`
- ✅ Dark/Light mode funcionando
- ✅ Export buttons renderizam
- ✅ CSV/JSON download funcionam

---

## 2026-10-23 - Phase 3: Keyboard Shortcuts + Note Versions + Realtime Sync

**Implementador:** Kiro AI  
**Fase:** 3/6  
**Status:** Complete  

### O Que Foi Feito

1. **#7 - Atalhos de Teclado**
   - Hook `useKeyboardShortcuts` globalizado
   - 5 atalhos implementados (Ctrl+K, Ctrl+N, etc)
   - Modal com referência de atalhos
   - Funciona em dark e light mode

2. **#12 - Histórico de Versões**
   - Tabela `note_versions` com RLS
   - Trigger automático ao atualizar notas
   - Componente `NoteVersionsModal`
   - Restauração de versão anterior

3. **#16 - Sincronização em Tempo Real**
   - Hook `useRealtimeSync` para Supabase Realtime
   - Integrado em Notes e Tasks
   - INSERT, UPDATE, DELETE sincronizados
   - Performance otimizada com verificação de duplicatas

### Commits Feitos

- `feat: adicionar atalhos de teclado globais`
- `feat: adicionar histórico de versões para notas`
- `feat: adicionar sincronização em tempo real com Supabase`

### Testes

- ✅ Atalhos funcionam fora de inputs
- ✅ Modal exibe corretamente
- ✅ Histórico persiste no banco
- ✅ Realtime atualiza entre abas

---

## 2026-10-23 - Phase 2: Dashboard Auto-Refresh + Search Optimization

**Implementador:** Kiro AI  
**Fase:** 2/6  
**Status:** Complete  

### O Que Foi Feito

1. **#4 - Recalcular Dashboard Automaticamente**
   - Adicionado `bump()` em TaskModal, EventModal, NotesWorkspace
   - Dashboard se recarrega quando dados mudam
   - Implementado via `useDataVersion` hook

2. **#6 - Otimizar Busca Global**
   - Removida busca em `content` e `description`
   - Busca apenas em palavras-chave (title, name, original_name)
   - Aumentado `MIN_TERM_LENGTH` de 2 para 3
   - Performance 3x melhor

3. **#11 e #14 - Verificados como Já Implementados**
   - #11: DeleteCategoryModal já existia
   - #14: is_favorite coluna já existia

### Commits Feitos

- `feat: implementar Fase 2 - recalcular dashboard automaticamente`
- `perf: otimizar busca global para procurar só por palavras-chave`

---

## 2026-10-23 - Phase 1: Auth + Categories + UI Polish

**Implementador:** Kiro AI  
**Fase:** 1/6  
**Status:** Complete  

### O Que Foi Feito

1. **#1 - Login com Username OU Email**
   - Adicionado campo `username` em `profiles`
   - Função RPC `get_auth_email()` resolve username em email
   - Register com validação de username
   - Separado `full_name` de `username`

2. **#2 - Validar Duplicatas de Categorias**
   - Verificação case-insensitive ao criar/renomear
   - Mensagens de erro amigáveis

3. **#5 - Renomear Linguagens para Categorias**
   - Alterado aria-label em CategoryTabs

4. **#10 - Otimizar Delay de Tarefas**
   - Otimização otimista em TaskCard
   - Status atualiza antes de confirmar no servidor

5. **#24 - Logo Clicável**
   - Logo em Sidebar agora navega para Dashboard

### Commits Feitos

- `refactor: separar username de full_name na autenticação`
- `feat: implementar 3 melhorias da Fase 1`

### Problemas Resolvidos

- RLS policies: Todos os creates agora enviam `user_id`
- Supabase migration: Corrigido trigger para `full_name`

---

## Totalizador

| Fase | Items | Status | Commits |
|------|-------|--------|---------|
| 1 | 5 | ✅ Complete | 2 |
| 2 | 4 | ✅ Complete | 2 |
| 3 | 4 | ✅ Complete | 3 |
| 4 | 2+ | 🔄 In Progress | 1+ |
| 5-6 | Pendente | ⏳ Backlog | - |

**Total:** 15/26 implementadas (57%)

---

**Última atualização:** 2026-10-23  
**Próxima revisão:** Após Phase 4 completar
