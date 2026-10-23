# Editor - DevCodes

## Por que este arquivo existe

Este documento define a estratégia do editor de anotações técnicas e código do DevCodes, orientando regras de renderização Markdown, realce de sintaxe e sanitização de conteúdo.

---

## Decisão de Arquitetura do Editor

- **Abordagem:** Editor de Markdown split-view / dual-mode com suporte a edição de texto puro estruturado e pré-visualização instantânea lado a lado.
- **Sintaxe Suportada:** GitHub Flavored Markdown (GFM) — tabelas, task lists (`- [x]`), citações, títulos e blocos de código com linguagem especificada.
- **Realce de Código (Syntax Highlighting):** Prism.js / Monaco com suporte para JavaScript, TypeScript, Python, SQL, CSS, JSON, HTML, Bash, Go e Rust.

---

## Componentes Relacionados

- `src/components/notes/NoteEditor.jsx`: Campo de edição principal, atalhos rápidos e barra de ferramentas Markdown.
- `src/components/notes/MarkdownPreview.jsx`: Renderizador reativo do Markdown compilado para HTML seguro.
- `src/components/notes/NoteVersionsModal.jsx`: Modal para inspeção de versões passadas e restauração de snapshots anteriores da nota.
- `src/components/programming-library/CodeViewer.jsx`: Visualizador read-only dedicado a snippets e arquivos de código com numeração de linha e botão de cópia.

---

## Regras de Conteúdo e Segurança

1. **Sanitização de HTML:** Todo Markdown renderizado via `MarkdownPreview` deve escapar tags HTML perigosas (`<script>`, `<iframe>`, `javascript:`) para prevenir ataques de Cross-Site Scripting (XSS).
2. **Auto-save & Debounce:** Alterações de digitação devem ser salvas com estratégia debounce (ex: 800ms) para evitar excesso de requisições ao Supabase.
3. **Versionamento:** Criação automática ou explícita de snapshot em `note_versions` ao registrar modificações relevantes no texto.
