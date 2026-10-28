# Configuração e publicação

Este guia leva o projeto do código-fonte até a aplicação publicada. Siga as etapas na ordem.

## 1. Requisitos

- Node.js 20.19 ou superior e NPM.
- Git.
- Conta no [Supabase](https://supabase.com), no [GitHub](https://github.com) e na [Vercel](https://vercel.com).

## 2. Executar localmente

```bash
npm install
cp .env.example .env
```

Preencha o `.env` com os valores obtidos na etapa 3.2 e execute:

```bash
npm run dev
```

A aplicação abre em `http://localhost:5173`.

## 3. Configurar o Supabase

### 3.1 Criar o projeto

No painel do Supabase, crie um novo projeto e guarde a senha do banco em local seguro. A senha do banco nunca é usada pela aplicação.

### 3.2 Obter as credenciais

Em **Project Settings**, **API Keys** (ou **API**), copie:

| Valor | Variável |
|---|---|
| URL do projeto | `VITE_SUPABASE_URL` |
| Chave pública (`anon` ou `publishable`, conforme exibido no painel) | `VITE_SUPABASE_ANON_KEY` |

Nunca utilize a chave `service_role` ou qualquer chave secreta no front-end. As variáveis com prefixo `VITE_` ficam visíveis no navegador.

### 3.3 Aplicar as migrations

As migrations em `supabase/migrations` criam e atualizam tabelas, políticas RLS, Storage e funções. O Supabase CLI acompanha quais já foram aplicadas e envia as pendentes em ordem. Para um projeto existente, prefira a CLI para não executar migrations antigas novamente.

**Opção A: Supabase CLI**

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

O CLI solicita a senha do banco no `supabase link` ou no `db push`. O arquivo `supabase/config.toml` já está versionado no repositório. O `SEU_PROJECT_REF` aparece na URL do projeto.

**Opção B: SQL Editor**

No painel, abra **SQL Editor** e, em um projeto novo, execute todos os arquivos `.sql` de `supabase/migrations` em ordem lexicográfica pelo nome. Em um projeto existente, confira o histórico de migrations e execute somente as pendentes; não reaplique arquivos já executados.

### 3.4 Configurar a autenticação

Em **Authentication**:

1. **URL Configuration**: defina o **Site URL** como `http://localhost:5173` durante o desenvolvimento e adicione em **Redirect URLs** o endereço `http://localhost:5173/**`. Após publicar, inclua o domínio da Vercel (etapa 6).
2. Nas configurações do provedor **Email** (**Sign In / Providers**): mantenha a confirmação de e-mail ativada e defina o comprimento mínimo de senha como **8**, valor também exigido pela interface. A opção de comprimento mínimo fica nas configurações de e-mail e senha de Authentication.
3. Para produção, configure um servidor SMTP próprio em **Authentication**, **SMTP Settings**. O servidor padrão do Supabase limita o envio de e-mails e serve apenas para testes.

### 3.5 Conferir o Storage

Em **Storage**, confirme que o bucket `programming-files` existe e está marcado como **privado**. O limite por arquivo definido na migration é de 10 MB. Se o plano ou o limite global do projeto for menor, o limite menor prevalece.

### 3.6 Verificar o isolamento entre usuários

Execute o arquivo `supabase/tests/rls_isolation.sql` no **SQL Editor**, de preferência em um projeto de desenvolvimento. O script cria dois usuários de teste dentro de uma transação, verifica as políticas das tabelas da aplicação e desfaz tudo ao final. Para Storage, ele verifica RLS e a presença das políticas; operações em arquivos devem ser testadas pela Storage API. Se a última consulta retornar `OK: todos os testes de isolamento passaram`, as verificações SQL foram aprovadas. Qualquer falha interrompe o script com uma mensagem iniciada por `FALHA`.

## 4. Publicar no GitHub

No diretório do projeto:

```bash
git init
git add .
git status
```

Confirme na saída do `git status` que o arquivo `.env` **não** aparece. Em seguida:

```bash
git commit -m "Versão inicial do DevCodes"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/devcodes.git
git push -u origin main
```

Crie antes um repositório vazio no GitHub, sem README nem `.gitignore`. Prefira um repositório privado.

## 5. Publicar na Vercel

1. Na Vercel, selecione **Add New**, **Project** e importe o repositório do GitHub.
2. Confirme as configurações detectadas:

| Campo | Valor |
|---|---|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

3. Em **Environment Variables**, cadastre para **Production**, **Preview** e **Development**:

| Nome | Valor |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave pública do projeto |

4. Execute o deploy.

O arquivo `vercel.json` já redireciona todas as rotas para `index.html`, o que permite abrir qualquer endereço da aplicação diretamente e atualizar a página sem erro 404. Ele também define cabeçalhos de segurança e cache dos arquivos estáticos.

## 6. Ajustar o Supabase após a publicação

Depois do primeiro deploy, volte em **Authentication**, **URL Configuration** do Supabase:

1. Defina o **Site URL** como o endereço de produção, por exemplo `https://seu-projeto.vercel.app`.
2. Adicione em **Redirect URLs**:
   - `https://seu-projeto.vercel.app/**`
   - Para os deploys de preview, o padrão do seu time, por exemplo `https://*-seu-time.vercel.app/**`.
3. Mantenha `http://localhost:5173/**` para o desenvolvimento.

Sem esse ajuste, os links de confirmação de e-mail e de recuperação de senha não funcionam em produção.

## 7. Verificar a publicação

Execute o checklist de [TESTING.md](TESTING.md), principalmente os itens de cadastro, login, recuperação de senha, upload e isolamento entre dois usuários.

## 8. Atualizar a aplicação

| Situação | Procedimento |
|---|---|
| Alteração no código | `git push` na branch `main`. A Vercel publica automaticamente. |
| Nova migration | Aplique-a no Supabase (`npx supabase db push`) antes do deploy que depende dela. |
| Alteração de variável de ambiente | Atualize na Vercel e execute um novo deploy. |

Nunca edite as migrations já aplicadas em produção. Crie uma nova migration com a alteração.

## 9. Solução de problemas

| Sintoma | Causa provável e solução |
|---|---|
| Tela "Supabase não configurado" | Variáveis `VITE_` ausentes. Preencha o `.env` e reinicie o `npm run dev`, ou cadastre-as na Vercel e refaça o deploy. |
| Erro 404 ao atualizar uma página na Vercel | Confirme que o `vercel.json` está na raiz do repositório. |
| E-mail de confirmação ou de recuperação não chega | Verifique a pasta de spam, o limite do SMTP padrão e as URLs de redirecionamento. |
| "Link inválido ou expirado" ao redefinir a senha | A URL de redirecionamento do domínio atual não está cadastrada, ou o link expirou. Solicite um novo. |
| "Você não tem permissão" ao salvar | As migrations não foram aplicadas por completo, ou a sessão pertence a outro usuário. |
| Upload falha com arquivo grande | O arquivo excede o limite do bucket ou do projeto. Veja a etapa 3.5. |
| Novo usuário sem categorias de programação | A migration 1 ou a migration 4 não foi aplicada. O gatilho de cadastro cria as categorias padrão. |
