# Implementation Plan - DevCodes

## Por que este arquivo existe

Este documento organiza as fases de desenvolvimento do DevCodes, conectando o roadmap de funcionalidades ao estado real de entrega.

**Roadmap atual:** Fases 1–5, melhorias #1–#21. A antiga Fase 6 (#22–#26) foi removida do roadmap; seu histórico de implementação permanece nos registros de entrega.
**Escopo ativo atualizado em 2026-10-28:** implementar toda a lista de melhorias de interface e comportamento solicitada pelo usuário, sem limitar o trabalho às issues #18 e #20.
**ReferÃªncia Detalhada:** [PENDING_FEATURES.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/PENDING_FEATURES.md)

---

## SequÃªncia de ImplementaÃ§Ã£o

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
**Status:** ciclo ativo contempla os pedidos de organização, calendário local e ajustes gerais de UX descritos na issue atual.
- [ ] **#18 (em andamento):** Tags e organizaÃ§Ã£o avanÃ§ada, incluindo ampliaÃ§Ã£o segura dos tipos de arquivo aceitos pela Biblioteca de CÃ³digo. ImplementaÃ§Ã£o local: associaÃ§Ãµes de tags em notas/tarefas/arquivos, gerenciamento central, sugestÃµes por conteÃºdo e limpeza automÃ¡tica; catÃ¡lago/preview da biblioteca ampliados. Migration de tags aplicada pelo usuário; falta executar o teste RLS atualizado no Supabase remoto.
  - Documentos: `.ppt`, `.pptx`, `.xls`, `.xlsx`, `.odt`, `.ods`, `.odp` e `.rtf` (`.doc`/`.docx` jÃ¡ sÃ£o aceitos)
  - Preview interno de PDF e imagens (SVG, PNG, JPEG, WebP, GIF, BMP e AVIF) implementado com URL assinada; os SVGs são exibidos como imagem e submetidos a validação contra scripts e referências externas.
  - Formatos sem preview continuam disponíveis para download; arquivos `.env` seguem bloqueados.
  - CÃ³digo, configuraÃ§Ã£o e dados: `.vue`, `.svelte`, `.swift`, `.dart`, `.ipynb`, `.toml`, `.ini`, `.conf`, `.tf`, `.hcl`, `.gradle`, `.properties`, `.csv`, `.log`, `.rst` e `.adoc`
  - Dotfiles de projeto selecionados (`Dockerfile`, `.gitignore`, `.dockerignore`, `.editorconfig`, `.env.example`), com validaÃ§Ã£o de MIME/conteÃºdo e testes; `.env` permanece bloqueado
- [x] **#19:** Removidos do app sincronização Google Calendar e feed iCalendar; importação/exportação local `.ics` permanecem. Migration de remoção do schema remoto criada; aguarda aplicação no Supabase.
- [x] **#20:** Análise de produtividade com métricas e gráficos em `/analytics` (código local; validação visual pendente)
- [x] **#21 (fora do escopo atual):** Backup manual/automático, histórico e auditoria implementados localmente; o job pg_cron foi criado. Validações operacionais pendentes não fazem parte do foco atual.
- [x] **Solicitações de UX (2026-10-28):** estrela amarela; tags em arquivos e `.ics` na Biblioteca; prévias de anotações; hover dos estados selecionados; ações de lembrete; drag-and-drop entre colunas; overlay do menu mobile; footer com links úteis.

---

## Regras de AtualizaÃ§Ã£o

- Ao concluir uma melhoria, marque o item como `[x]` aqui, atualize [issues.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/issues.md), registre a entrega em `CHANGELOG.md` e em `implementation-log.md`.
