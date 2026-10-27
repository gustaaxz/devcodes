# Implementation Plan - DevCodes

## Por que este arquivo existe

Este documento organiza as fases de desenvolvimento do DevCodes, conectando o roadmap de funcionalidades ao estado real de entrega.

**Status Geral:** 19/26 melhorias validadas no ambiente remoto. A Fase 5 mantém validações/publicações externas pendentes; a implementação local da Fase 6 está concluída (5/5), com #23 validada remotamente.
**ReferÃªncia Detalhada:** [PENDING_FEATURES.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/PENDING_FEATURES.md)

---

## SequÃªncia de ImplementaÃ§Ã£o

### Atualizacao remota da Fase 6
O usuario aplicou as migrations inicial e corretiva e confirmou que `supabase/tests/phase6_audit_rls.sql` retornou sucesso. A validacao remota de #23 esta concluida; falta configurar/verificar MFA TOTP.

### Fases 1 a 3 â€” FundaÃ§Ã£o, UX & Recursos Essenciais (ConcluÃ­das)
**Status:** âœ… ConcluÃ­da (13 melhorias entregues)
- [x] #1: Modal de confirmaÃ§Ã£o ao deletar tarefa/evento/nota/arquivo
- [x] #2: Limpeza automÃ¡tica de campos ao fechar modais
- [x] #3: Fechar modais ao clicar no backdrop (overlay)
- [x] #4: Feedback visual de carregamento (Skeleton loaders / Spinners)
- [x] #5: Responsividade mobile completa (Sidebar recolhÃ­vel, layouts adaptados)
- [x] #6: Tema claro/escuro persistido no banco e localStorage
- [x] #7: Busca global rÃ¡pida por atalho de teclado (`Cmd/Ctrl + K`)
- [x] #8: Filtros avanÃ§ados por categoria e prioridade em tarefas e calendÃ¡rio
- [x] #9: OrdenaÃ§Ã£o de tarefas por data, prioridade e ordem alfabÃ©tica
- [x] #10: Upload de mÃºltiplos arquivos com drag-and-drop na biblioteca
- [x] #11: PrÃ©-visualizaÃ§Ã£o de cÃ³digo com realce de sintaxe na biblioteca
- [x] #12: Atalhos de teclado globais documentados em modal
- [x] #14: HistÃ³rico de versÃµes de notas com restauraÃ§Ã£o

---

### Fase 4 â€” ColaboraÃ§Ã£o e Produtividade AvanÃ§ada
**Status:** âœ… ConcluÃ­da (5/5 entregues)
- [x] #16: SincronizaÃ§Ã£o em tempo real entre abas e dispositivos (Supabase Realtime)
- [x] #14: HistÃ³rico de versÃµes de notas (entregue)
- [x] #13: Compartilhamento de notas e eventos (links pÃºblicos e permissÃµes)
- [x] **#15:** NotificaÃ§Ãµes e lembretes de tarefas in-app (RLS entre usuÃ¡rios validado no SQL Editor)
- [x] **#17:** ExportaÃ§Ã£o e importaÃ§Ã£o de dados (backup JSON, CSV/JSON por recurso)

---

### Fase 5 â€” OrganizaÃ§Ã£o e IntegraÃ§Ã£o
**Status:** Implementada localmente (4/4); validação e publicação remota pendentes
- [ ] **#18 (em andamento):** Tags e organizaÃ§Ã£o avanÃ§ada, incluindo ampliaÃ§Ã£o segura dos tipos de arquivo aceitos pela Biblioteca de CÃ³digo. ImplementaÃ§Ã£o local: associaÃ§Ãµes de tags em notas/tarefas/arquivos, gerenciamento central, sugestÃµes por conteÃºdo e limpeza automÃ¡tica; catÃ¡lago/preview da biblioteca ampliados. Migration de tags aplicada pelo usuário; falta executar o teste RLS atualizado no Supabase remoto.
  - Documentos: `.ppt`, `.pptx`, `.xls`, `.xlsx`, `.odt`, `.ods`, `.odp` e `.rtf` (`.doc`/`.docx` jÃ¡ sÃ£o aceitos)
  - Preview interno de PDF e imagens (SVG, PNG, JPEG, WebP, GIF, BMP e AVIF) implementado com URL assinada; os SVGs são exibidos como imagem e submetidos a validação contra scripts e referências externas.
  - Formatos sem preview continuam disponíveis para download; arquivos `.env` seguem bloqueados.
  - CÃ³digo, configuraÃ§Ã£o e dados: `.vue`, `.svelte`, `.swift`, `.dart`, `.ipynb`, `.toml`, `.ini`, `.conf`, `.tf`, `.hcl`, `.gradle`, `.properties`, `.csv`, `.log`, `.rst` e `.adoc`
  - Dotfiles de projeto selecionados (`Dockerfile`, `.gitignore`, `.dockerignore`, `.editorconfig`, `.env.example`), com validaÃ§Ã£o de MIME/conteÃºdo e testes; `.env` permanece bloqueado
- [ ] **#19 (em andamento):** Sincronização com Google Calendar e iCalendar. Import/export `.ics`, feed protegido por token, OAuth/PKCE server-side, sync bidirecional manual/Realtime e logs estão no código; migration aplicada pelo usuário; teste RLS confirmado como aprovado pelo usuário; faltam configurar/deployar Edge Functions e secrets e validar OAuth com conta Google. Auto sync com browser fechado segue pendente.
- [x] **#20:** Análise de produtividade com métricas e gráficos em `/analytics` (código local; validação visual pendente)
- [x] **#21:** Backup manual/automático, histórico e auditoria (código local; job pg_cron ID 1 criado; migration/função/secrets e execução ainda precisam de validação)

---

### Fase 6 â€” SeguranÃ§a, Qualidade e Polimento
**Status:** Implementação local concluída (5/5); migration e teste RLS da auditoria aprovados pelo usuário. Falta habilitar/verificar MFA no projeto Supabase.
- [x] **#22:** MFA TOTP via Supabase Auth, com cadastro/remoção em Configurações e desafio ao entrar em sessões que exigem AAL2. Habilitar MFA e verificação TOTP nas configurações de Auth antes de publicar.
- [x] **#23:** Trilha de auditoria para perfis, tarefas, notas, eventos, arquivos, categorias, tags e compartilhamentos. Migration independente aplicada e teste `supabase/tests/phase6_audit_rls.sql` aprovado pelo usuário no Supabase remoto.
- [x] **#24:** Internacionalização PT-BR/EN-US para texto JSX, atributos acessíveis, mensagens e datas; idioma persistido nas preferências do perfil. `npm run i18n:check` valida a cobertura de textos JSX.
- [x] **#25:** Testes E2E Playwright cobrindo login, navegação autenticada, troca de idioma, desafio e cadastro TOTP, validação de tarefa, cadastro/recuperação de conta e rotas públicas, com Supabase mockado.
- [x] **#26:** Tour de boas-vindas pelo painel, tarefas, anotações, biblioteca e analytics; conclusão salva nas preferências do perfil.

---

## Regras de AtualizaÃ§Ã£o

- Ao concluir uma melhoria, marque o item como `[x]` aqui, atualize [issues.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/issues.md), registre a entrega em `CHANGELOG.md` e em `implementation-log.md`.
