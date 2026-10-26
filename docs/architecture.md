# Architecture - DevCodes

## 1. Visão Geral e Estilo Arquitetural

O **DevCodes** é uma plataforma de organização pessoal para desenvolvedores e estudantes de tecnologia, integrando calendário, tarefas, anotações em Markdown e biblioteca de códigos em um dashboard único.

A aplicação adota a arquitetura **BaaS (Backend-as-a-Service)** com uma **Single Page Application (SPA)** no frontend:

```text
[ Navegador do Usuário (SPA) ]
  ├── React 19 + React Router 7 + Lucide Icons + Prism.js
  └── Supabase Client (@supabase/supabase-js) com Chave Pública (Anon Key)
               │ (HTTPS REST / WSS Realtime)
               ▼
[ Supabase BaaS (PostgreSQL 15+ Gerenciado) ]
  ├── GoTrue: Autenticação, gestão de sessão e tokens JWT
  ├── PostgREST: API REST gerada automaticamente com Row Level Security (RLS)
  ├── Supabase Realtime: WebSockets com canais para sincronização entre abas/dispositivos
  └── Supabase Storage: Bucket privado 'code-files' com políticas RLS por pasta do usuário
```

### Decisões Arquiteturais Fundamentais
1. **Sem servidor intermediário próprio:** Não há backend Node.js, Express ou Django. A SPA comunica-se diretamente com o Supabase.
2. **Segurança no Banco (Defesa em Profundidade):** Toda a autorização reside no PostgreSQL através de políticas de **Row Level Security (RLS)**. O frontend nunca possui privilégios de superusuário (`service_role` proibido no client).
3. **Isolamento Total por Usuário:** Toda tabela de negócio possui chave estrangeira `user_id uuid references auth.users(id)` e todas as linhas são isoladas por usuário.

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Propósito |
| :--- | :--- | :--- |
| **Linguagem** | JavaScript (ES2024 / JSX) | Lógica e componentes da SPA |
| **Framework / View** | React 19 (`^19.3.1`) | UI declarativa, components funcionais e hooks |
| **Roteamento** | React Router 7 (`^7.18.4`) | Roteamento client-side com reescrita SPA |
| **Build & Bundler** | Vite 8 (`^8.3.4`) | Build ultrarrápido e Hot Module Replacement (HMR) |
| **Linter** | Oxlint (`^1.88.0`) | Linter estático de alta performance |
| **Testes** | Vitest (`^5.0.5`) | Testes unitários para utilitários e serviços |
| **Highlighting** | Prism.js (`^1.30.0`) | Realce de sintaxe em blocos de código e biblioteca |
| **Ícones** | Lucide React (`^1.61.0`) | Iconografia consistente em toda a UI |
| **Estilização** | Vanilla CSS + CSS Variables | Design system nativo sem frameworks pesados |
| **BaaS / Banco** | Supabase (PostgreSQL 15+) | Autenticação, banco relacional, storage e realtime |
| **Deploy** | Vercel | Hospedagem estática com cache e headers de segurança |

---

## 3. Estrutura de Pastas e Responsabilidades

```text
devcodes/
├── public/                 # Assets estáticos servidos diretamente (ícones, manifest, favicon)
├── docs/                   # Documentação canônica técnica e de produto (SpecFirst)
├── supabase/               # Governança de banco de dados
│   ├── migrations/         # Migrações SQL sequenciais versionadas
│   ├── tests/              # Scripts de validação e isolamento RLS (rls_isolation.sql)
│   └── seed.sql            # Scripts de seed (opcional; categorias padrão via trigger)
├── src/
│   ├── assets/             # Imagens, ilustrações e recursos estáticos locais
│   ├── components/         # Componentes React divididos por domínio e layout
│   │   ├── auth/           # Formulários de login, registro, recuperação de senha
│   │   ├── calendar/       # Grid do mês, painel do dia, modais de eventos
│   │   ├── dashboard/      # Cards de resumo, contadores, atalhos rápidos
│   │   ├── layout/         # Topbar, Sidebar recolhível, SearchBox, Modais de atalhos
│   │   ├── notes/          # NoteEditor, MarkdownPreview, NoteVersionsModal
│   │   ├── programming-library/ # CodeViewer, UploadDropzone, FileViewerModal
│   │   ├── settings/       # Preferências de perfil, tema, exportação de dados
│   │   ├── tasks/          # TaskList, TaskCard, TaskModal, filtros de status
│   │   └── ui/             # Componentes base (Button, Modal, Input, Badge, Skeleton)
│   ├── contexts/           # Estado global compartilhado via React Context
│   │   ├── AuthContext.jsx         # Sessão ativa, login, logout, user
│   │   ├── ProfileProvider.jsx     # Perfil, preferências visuais e tema
│   │   └── DataVersionProvider.jsx # Sinalizador reativo de invalidação de dados
│   ├── hooks/              # Custom hooks reativos
│   │   ├── useTheme.js             # Gestão de dark/light mode persistido
│   │   ├── useRealtime.js          # Inscrição em canais Supabase Realtime
│   │   └── useKeyboardShortcuts.js # Atalhos globais (Ctrl+K, etc.)
│   ├── pages/              # Páginas e rotas da aplicação
│   │   ├── DashboardPage.jsx
│   │   ├── CalendarPage.jsx
│   │   ├── TasksPage.jsx
│   │   ├── NotesPage.jsx
│   │   ├── LibraryPage.jsx
│   │   ├── SettingsPage.jsx
│   │   └── AuthPage.jsx
│   ├── services/           # Camada de comunicação com o Supabase isolada por domínio
│   │   ├── auth/           # authService.js
│   │   ├── calendar/       # calendarService.js, eventsService.js
│   │   ├── categories/     # categoriesService.js, programmingCategoriesService.js
│   │   ├── dashboard/      # dashboardService.js
│   │   ├── export/         # exportService.js (JSON/CSV)
│   │   ├── files/          # filesService.js (Storage + stored_files)
│   │   ├── notes/          # notesService.js, noteVersionsService.js
│   │   ├── profile/        # profileService.js
│   │   ├── search/         # searchService.js (Busca global unificada)
│   │   ├── supabase/       # client.js (instância singleton do createClient)
│   │   └── tasks/          # tasksService.js
│   ├── styles/             # Design System (global.css, reset, variáveis de cor/tokens)
│   └── utils/              # Funções puras (datas, formatação, validação de arquivos)
├── AGENTS.md               # Contrato universal para agentes de IA
├── CHANGELOG.md            # Registro público de versões e entregas
├── implementation-log.md   # Log técnico detalhado com timestamps e decisões
├── package.json            # Metadados do projeto e scripts npm
└── vercel.json             # Rewrites SPA e cabeçalhos de segurança
```

---

## 4. Camadas e Fluxo de Dados

A comunicação no frontend segue um fluxo estrito e unidirecional:

```text
[ Página / Componente UI ]
        │  Dispara evento do usuário (ex: salvar nota, alternar status de tarefa)
        ▼
[ Custom Hook / Contexto ]
        │  Coordena estado otimista, invalidações e contexto global
        ▼
[ Service de Domínio (src/services/*) ]
        │  Executa chamada assíncrona ao supabase client com queries parametrizadas
        ▼
[ Supabase Client Singleton ]
        │  Injeta Authorization: Bearer <JWT> e apikey
        ▼
[ PostgreSQL + RLS ]
```

### Regras de Dependência entre Camadas
1. **Componentes UI não devem chamar `supabase.*` diretamente:** Toda operação de banco ou storage deve passar por um serviço em `src/services/<dominio>/`.
2. **Serviços não conhecem detalhes de UI:** Serviços são funções puras assíncronas que retornam `{ data, error }` ou lançam exceções tratáveis.
3. **Contextos apenas para estado compartilhado:** Estado local de telas ou formulários permanece em `useState` / `useReducer` dentro do próprio componente.

---

## 5. Estratégia de Estado Reativo e Realtime

- **Sessão:** Centralizada em `AuthContext.jsx` com listener `onAuthStateChange`.
- **Tema e Preferências:** Gerenciados em `ProfileProvider.jsx`, persistidos no banco (tabela `profiles`) e com fallback em `localStorage`.
- **Sincronização em Tempo Real:**
  - O hook `useRealtime` inscreve o cliente em canais do Supabase Realtime (`postgres_changes`) filtrando pelo `user_id`.
  - Mudanças remotas incrementam a versão em `DataVersionProvider.jsx`, disparando re-fetch pontual nas páginas afetadas sem recarregar toda a aplicação.

---

## 6. Referências Cruzadas Canônicas

- Modelagem do banco e RLS: [docs/data-model.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/data-model.md) e [docs/security.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/security.md).
- Fronteiras de domínio: [docs/domains.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/domains.md).
- Sistema visual e tokens: [docs/design-guidelines.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/design-guidelines.md).
- Editor Markdown e Prism: [docs/editor.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/editor.md).
- Configuração e Deploy: [docs/SETUP.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/SETUP.md) e [docs/deploy.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/deploy.md).
