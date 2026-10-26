# Deployment Log - DevCodes

## 1. Visão Geral

Este documento registra o histórico técnico das entregas e deploys efetuados no **DevCodes**, mapeando cada entrega à sua respectiva fase, arquivos alterados e validações executadas.

Para o registro detalhado de implementação com timestamps e decisões técnicas em nível de código, consulte também [implementation-log.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/implementation-log.md) e [CHANGELOG.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/CHANGELOG.md).

---

## 2. Entradas de Deploys e Entregas

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
- **Riscos/Débito técnico:** A tabela `note_versions` (migração `20261023150000_add_note_versions.sql`) necessita ser executada no Supabase remoto via `npx supabase db push`.

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
