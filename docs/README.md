# Documentação - DevCodes (SpecFirst)

## 1. Visão Geral

Este índice organiza a documentação canônica do projeto **DevCodes**, estruturada sob a metodologia **SpecFirst**. Os documentos abaixo servem como contrato de alinhamento entre humanos (navegadores) e agentes de IA (pilotos) para guiar todas as decisões de produto, arquitetura e implementação.

---

## 2. Rotas Principais

- [README.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/README.md) -> Apresentação geral e guia rápido do DevCodes.
- [AGENTS.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/AGENTS.md) -> Contrato universal mandatório para agentes de IA.
- [CHANGELOG.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/CHANGELOG.md) -> Versões públicas e notas de lançamento.
- [implementation-log.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/implementation-log.md) -> Log técnico detalhado com decisões e outcomes.

---

## 3. Documentos Nucleares

| Documento | Descrição / Propósito |
| :--- | :--- |
| [project-overview.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/project-overview.md) | Problema, público-alvo, objetivo e escopo funcional do DevCodes. |
| [architecture.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/architecture.md) | Arquitetura técnica completa (React 19, Vite, Supabase BaaS, RLS, fluxo de dados). |
| [domains.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/domains.md) | Fronteiras de domínio (`auth`, `tasks/calendar`, `notes`, `library`, `search`). |
| [data-model.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/data-model.md) | Modelagem relacional PostgreSQL, tabelas, campos, chaves e triggers. |
| [design-guidelines.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/design-guidelines.md) | Tokens CSS, temas dark/light, tipografia Montserrat e componentes visuais. |
| [coding-standards.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/coding-standards.md) | Convenções oficiais de código JavaScript/React 19, Oxlint e boas práticas. |
| [TESTING.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/TESTING.md) | Estratégia de testes unitários (Vitest), testes de isolamento RLS e checks de qualidade. |
| [definition-of-done.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/definition-of-done.md) | Checklist mandatório para entrega de tarefas e aprovação de merges. |
| [security.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/security.md) | Políticas de Row Level Security (RLS), isolamento por usuário e sanitização de dados. |
| [editor.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/editor.md) | Estratégia do editor Markdown GFM, realce de sintaxe Prism e debounce de auto-save. |
| [SETUP.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/SETUP.md) | Passo a passo completo de configuração de ambiente, Supabase CLI e SMTP. |
| [deploy.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/deploy.md) | Configurações de deploy na Vercel (`vercel.json`), SPA rewrites e variáveis de ambiente. |
| [operations.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/operations.md) | Guia rápido de comandos operacionais do dia a dia e manutenção. |

---

## 4. Planejamento, Roadmap e Rastreabilidade

| Documento | Descrição / Propósito |
| :--- | :--- |
| [PENDING_FEATURES.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/PENDING_FEATURES.md) | Especificação detalhada das 26 melhorias do sistema e status de entrega. |
| [FEATURES.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/FEATURES.md) | Especificação aprofundada dos módulos e regras de negócio originais. |
| [LIMITATIONS.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/LIMITATIONS.md) | Limitações conhecidas, premissas e itens não verificados em produção. |
| [implementation-plan.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/implementation-plan.md) | Sequência de fases (1 a 6) e marcos de desenvolvimento. |
| [issues.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/issues.md) | Lista de tarefas ativas e critérios de aceite imediatos (Fase 4). |
| [backlog.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/backlog.md) | Ideias futuras e oportunidades em incubação (Fases 5 e 6). |
| [decision-log.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/decision-log.md) | Histórico de decisões arquiteturais duradouras (ADRs). |
| [deployment-log.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/deployment-log.md) | Registro técnico de deploys e entregas realizadas. |

---

## 5. Governança e Processo com IA

| Documento | Descrição / Propósito |
| :--- | :--- |
| [ai-workflow.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/ai-workflow.md) | Regras operacionais do modelo Humano Navegador / IA Piloto. |
| [implementation-governance.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/implementation-governance.md) | Regras para evitar expansão indevida de escopo e travar fases. |
| [tooling-adapters.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/tooling-adapters.md) | Diretrizes para adaptadores de ferramentas (Claude Code, Cursor, Windsurf). |
| [context-strategy.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/context-strategy.md) | Organização de contexto em camadas para não sobrecarregar conversas de IA. |
| [templates.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/templates.md) | Padrões e recipes reutilizáveis de componentes e serviços. |
| [workflows.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/workflows.md) | Mapeamento de jornadas de usuário e sequências operacionais. |
