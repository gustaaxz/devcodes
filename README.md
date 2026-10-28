# DevCodes

O DevCodes reúne calendário, tarefas, anotações e arquivos de programação em um só lugar. A aplicação é uma SPA em React; autenticação, banco de dados, sincronização e armazenamento de arquivos são fornecidos pelo Supabase.

## O que você encontra

- **Painel e calendário:** visão do dia, compromissos e próximos prazos.
- **Tarefas:** listas ou quadro por status, categorias, prioridades e lembretes.
- **Anotações:** editor com formatação, salvamento automático, tags, favoritos e histórico de versões.
- **Biblioteca de programação:** arquivos e trechos de código organizados por categoria, com busca, tags e favoritos. Arquivos enviados não são executados.
- **Calendário `.ics`:** importar e exportar eventos em arquivos `.ics`.
- **Organização:** busca global, tags, arquivos recentes e página de produtividade.
- **Conta:** preferências de idioma e tema, compartilhamento e opções de segurança.

## Executar localmente

### Requisitos

- Node.js **20.19 ou superior** e npm.
- Um projeto Supabase.
- Git para clonar o repositório.

### 1. Obter o código e instalar dependências

```bash
git clone https://github.com/gustaaxz/devcodes.git
cd devcodes
npm ci
```

### 2. Configurar o Supabase

Copie o arquivo de exemplo para `.env`:

```bash
cp .env.example .env
```

No PowerShell do Windows, use `Copy-Item .env.example .env`. Depois, preencha os valores do projeto Supabase:

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
```

Use apenas a chave pública `anon` ou `publishable`. Variáveis com prefixo `VITE_` ficam visíveis no navegador; nunca coloque uma chave `service_role` ou outro segredo nelas.

As migrations em `supabase/migrations` preparam o banco, as políticas RLS e o Storage. Para aplicá-las com a CLI do Supabase:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

Configure também as URLs de autenticação no painel do Supabase: use `http://localhost:5173` como Site URL local e adicione `http://localhost:5173/**` às Redirect URLs. O guia de [configuração e publicação](docs/SETUP.md) traz as etapas completas, incluindo autenticação, Storage e Vercel.

### 3. Iniciar a aplicação

```bash
npm run dev
```

Abra <http://localhost:5173> no navegador. Sem as variáveis de ambiente e as migrations aplicadas, recursos que dependem do Supabase não estarão disponíveis.

## Comandos úteis

| Comando | Uso |
| --- | --- |
| `npm run dev` | Inicia o servidor local do Vite. |
| `npm run build` | Gera a versão de produção em `dist/`. |
| `npm run preview` | Serve localmente a última versão compilada. |
| `npm run lint` | Analisa o código com Oxlint. |
| `npm test` | Executa os testes unitários com Vitest. |
| `npm run test:e2e` | Executa os fluxos de interface com Playwright. |
| `npm run i18n:check` | Verifica a cobertura de traduções. |

Os testes E2E usam um Supabase simulado e não exigem credenciais remotas. Na primeira execução, instale o Chromium do Playwright com `npx playwright install chromium`.

## Estrutura do projeto

```text
src/
  components/   Componentes de interface e dos módulos
  contexts/     Estado compartilhado, como autenticação e perfil
  hooks/        Hooks React reutilizáveis
  pages/        Telas e rotas da aplicação
  services/     Acesso ao Supabase por domínio
  styles/       Estilos globais e variáveis do tema
  utils/        Funções auxiliares e regras reutilizáveis
supabase/
  migrations/   Alterações versionadas do banco e Storage
  tests/        Verificações SQL, incluindo isolamento por usuário
docs/           Guias, arquitetura, segurança e planejamento
```

## Segurança e dados

- O Supabase Auth gerencia cadastro, sessão e autenticação.
- As políticas **Row Level Security (RLS)** isolam os dados por usuário.
- O bucket de arquivos é privado; o conteúdo não é executado pelo aplicativo.
- O navegador usa somente credenciais públicas. O controle de acesso deve permanecer nas políticas do banco e do Storage.
- Não versione `.env`; ele já está listado no `.gitignore`.

## Documentação

- [Guia de configuração e publicação](docs/SETUP.md)
- [Visão geral das funcionalidades](docs/FEATURES.md)
- [Arquitetura](docs/architecture.md)
- [Segurança e RLS](docs/security.md)
- [Estratégia de testes](docs/TESTING.md)
- [Plano de implementação](docs/implementation-plan.md)

## Licença

Distribuído sob a licença [MIT](LICENSE).
