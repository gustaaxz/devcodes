# Design Guidelines - DevCodes

## Por que este arquivo existe

Este documento define a identidade visual, sistema de cores, tipografia, espaçamento e diretrizes de componentes do DevCodes para garantir coerência estética de nível premium entre todas as telas.

---

## Identidade & Direção Visual

O **DevCodes** adota uma estética limpa, moderna e técnica, pensada para desenvolvedores. O design prioriza:
- Alta densidade de informação sem poluição visual.
- Foco em legibilidade de código e leitura confortável de notas longas.
- Suporte nativo a **Dark Mode** (padrão) e **Light Mode** consistentes via CSS Custom Properties.

---

## Sistema de Cores (Tokens CSS)

Definido centralizadamente em `src/styles/global.css`:

### 1. Cores de Destaque e Ação
- **Accent (Primária):** `--color-accent` usa `#9aa4ff` no tema escuro e `#4f46e5` no claro, com cor de texto contrastante por tema
- **Accent Hover:** `--color-accent-hover` aumenta o contraste no hover em cada tema
- **Accent Soft:** `color-mix()` baseado no accent (fundos sutis de badges, itens ativos e foco)

- **Accent Contrast:** `--color-accent-contrast` mantém texto legível sobre botões primários nos temas claro e escuro.

### 2. Status e Semântica
- **Sucesso:** `--color-success` usa `#43d9a0` no tema escuro e `#118357` no claro
- **Aviso:** `--color-warning` usa `#ffd166` no tema escuro e `#a86300` no claro
- **Perigo / Erro:** `--color-danger` usa `#ff8391` no tema escuro e `#c43d4e` no claro

### 3. Superfícies & Temas

| Token | Dark Mode (Padrão) | Light Mode |
| :--- | :--- | :--- |
| `--color-bg` | `#0b1020` (fundo geral ultra escuro) | `#f4f6fb` (cinza suave) |
| `--color-surface` | `#11192b` (cards, sidebar, modais) | `#ffffff` (branco puro) |
| `--color-surface-raised` | `#151f34` (menus e camadas elevadas) | `#ffffff` (menus e camadas elevadas) |
| `--color-surface-hover` | `#1a2740` (hover em listas e cards) | `#eef1fb` (cinza sutil hover) |
| `--color-border` | `rgba(160, 176, 204, 0.16)` (bordas discretas) | `#e0e6f0` (borda nítida clara) |
| `--color-text` | `#edf1fa` (texto de alto contraste) | `#1a2437` (texto escuro principal) |
| `--color-text-muted` | `#a5b0c5` (legendas e metadados) | `#5c687d` (cinza legível) |
| `--color-overlay` | `rgba(3, 7, 18, 0.72)` | `rgba(17, 25, 43, 0.42)` |

---

## Tipografia

- **Família Tipográfica:** `'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif`
- **Código / Snippets:** `'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace`
- **Pesos:**
  - 400 (Regular): Corpo de texto e descrições
  - 500 (Medium): Rótulos de campos, itens de menu e botões secundários
  - 600 (Semi-bold): Títulos de seções, cabeçalhos de modais e badges
  - 700 (Bold): Títulos principais (H1, métricas do dashboard)

---

## Espaçamento e Bordas

- **Escala de Espaçamento:**
  - `--space-1: 4px` | `--space-2: 8px` | `--space-3: 12px` | `--space-4: 16px`
  - `--space-5: 20px` | `--space-6: 24px` | `--space-8: 32px` | `--space-10: 40px` | `--space-12: 48px`
- **Arredondamento de Bordas (Border Radius):**
  - `--radius-sm: 8px` (tags, badges, inputs menores)
  - `--radius-md: 12px` (botões padrão, inputs, selects, cards de tarefas)
  - `--radius-lg: 18px` (modais, painéis do dashboard, visualizador de código)
- **Transições:**
  - `--transition: 220ms cubic-bezier(0.2, 0.8, 0.2, 1)`

---

## Diretrizes de Componentes e Layout

1. **Sidebar & Navegação:**
   - Largura fixa padrão: `264px`; versão recolhida: `76px`.
   - Itens ativos recebem `--color-accent-soft` com texto e ícone em `--color-accent`.
2. **Cards e Modais:**
   - Fundo em `--color-surface` com borda fina de `1px solid var(--color-border)`.
   - Modais possuem overlay com `backdrop-filter: blur(4px)`.
3. **Editor e Visualizadores de Código:**
   - Numeração de linhas explícita.
   - Prism / Monaco configurados com tema dark harmônico com o fundo da aplicação.
4. **Estados Interativos:**
   - Todo elemento clicável deve possuir micro-feedback visual no `:hover`, `:focus-visible` e `:active`.
   - Inputs em foco recebem `outline: 2px solid var(--color-accent)` ou borda destacada com sombra suave.
