# DevCodes

Aplicação web para organizar calendário, tarefas, anotações e arquivos de código. Usa React, Vite e Supabase.

## Requisitos

- Git
- Node.js 20.19 ou superior e npm
- Um projeto Supabase

## Baixar e executar

1. Clone o repositório e entre na pasta:

   ```bash
   git clone https://github.com/gustaaxz/devcodes.git
   cd devcodes
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Crie o arquivo de ambiente a partir do exemplo:

   ```powershell
   Copy-Item .env.example .env
   ```

   No macOS ou Linux, use `cp .env.example .env`.

4. No `.env`, preencha a URL do projeto Supabase e a chave pública (`anon` ou `publishable`):

   ```env
   VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
   ```

5. Para um projeto Supabase novo, aplique as migrations da pasta `supabase/migrations` na ordem dos nomes. Com a CLI do Supabase:

   ```bash
   npx supabase login
   npx supabase link --project-ref SEU_PROJECT_REF
   npx supabase db push
   ```

6. Inicie a aplicação:

   ```bash
   npm run dev
   ```

7. Abra <http://localhost:5173> no navegador.

Sem as variáveis do Supabase ou as migrations aplicadas, o app não consegue acessar os dados e serviços da plataforma. Nunca coloque uma chave `service_role` no `.env` do frontend.
