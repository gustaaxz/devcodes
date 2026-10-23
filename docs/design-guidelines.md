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
- **Accent (Primária):** `--color-accent: #3b82f6` (Blue 500)
- **Accent Hover:** `--color-accent-hover: #2563eb` (Blue 600)
- **Accent Soft:** `rgba(59, 130, 246, 0.14)` (fundos sutis de badges, itens ativos e foco)

### 2. Status e Semântica
- **Sucesso:** `--color-success: #22c55e` (Green 500)
- **Aviso:** `--color-warning: #f59e0b` (Amber 500)
- **Perigo / Erro:** `--color-danger: #ef4444` (Red 500)

### 3. Superfícies & Temas

| Token | Dark Mode (Padrão) | Light Mode |
| :--- | :--- | :--- |
| `--color-bg` | `#0f1115` (fundo geral ultra escuro) | `#f5f6f8` (cinza suave) |
| `--color-surface` | `#171a21` (cards, sidebar, modais) | `#ffffff` (branco puro) |
| `--color-surface-hover` | `#1f232c` (hover em listas e cards) | `#eef0f4` (cinza sutil hover) |
| `--color-border` | `#262b36` (bordas discretas) | `#e1e4ea` (borda nítida clara) |
| `--color-text` | `#e8eaf0` (texto de alto contraste) | `#151821` (texto escuro principal) |
| `--color-text-muted` | `#9aa3b2` (legendas e metadados) | `#5f6878` (cinza legível) |
| `--color-overlay` | `rgba(0, 0, 0, 0.6)` | `rgba(15, 17, 21, 0.4)` |

---

## Tipografia

- **Família Tipográfica:** `'Montserrat', system-ui, -apple-system, 'Segoe UI', sans-serif`
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
  - `--space-5: 20px` | `--space-6: 24px` | `--space-8: 32px`
- **Arredondamento de Bordas (Border Radius):**
  - `--radius-sm: 6px` (tags, badges, inputs menores)
  - `--radius-md: 10px` (botões padrão, inputs, selects, cards de tarefas)
  - `--radius-lg: 14px` (modais, painéis do dashboard, visualizador de código)
- **Transições:**
  - `--transition: 180ms ease`

---

## Diretrizes de Componentes e Layout

1. **Sidebar & Navegação:**
   - Largura fixa padrão: `260px`; versão recolhida: `72px`.
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
