# DevCodes

Plataforma web pessoal para organização acadêmica e biblioteca de programação. Reúne calendário, tarefas, anotações e arquivos de código em um único ambiente, com autenticação, persistência real e isolamento de dados por usuário.

## Funcionalidades

- **Dashboard** com indicadores reais, compromissos do dia, prazos, anotações e arquivos recentes, e criação rápida.
- **Calendário** mensal com eventos, tarefas com prazo e anotações vinculadas a datas.
- **Tarefas** com filtros, destaque de atrasos e visualização em lista e em quadro.
- **Anotações** gerais e por data, com busca, categorias, tags, favoritos, fixação, duplicação e salvamento automático.
- **Biblioteca de Programação**, módulo independente das anotações: categorias dinâmicas, upload por botão e drag and drop, armazenamento privado, visualizador de código com realce de sintaxe e criação e edição de arquivos de texto.
- **Pesquisa global**, **Favoritos**, **Arquivos recentes** e **Configurações** persistidas.

A descrição completa está em [docs/FEATURES.md](docs/FEATURES.md).

## Tecnologias

React, Vite, JavaScript, React Router, CSS, Lucide React, Prism, Supabase (Auth, PostgreSQL, Storage e RLS) e Vercel.

## Início rápido

Requisitos: Node.js 20.19 ou superior, NPM e um projeto Supabase.

```bash
npm install
cp .env.example .env
npm run dev
```

Preencha o `.env` com a URL e a chave pública do seu projeto Supabase. Sem essas variáveis, a aplicação exibe o aviso "Supabase não configurado".

## Scripts

| Comando | Finalidade |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Servidor local do build de produção |
| `npm run lint` | Análise estática do código |
| `npm test` | Testes automatizados |

## Documentação

| Documento | Conteúdo |
|---|---|
| [docs/SETUP.md](docs/SETUP.md) | Configuração do Supabase, publicação no GitHub e na Vercel, atualização e solução de problemas |
| [docs/FEATURES.md](docs/FEATURES.md) | Funcionalidades, modelo de dados, segurança e estrutura do projeto |
| [docs/TESTING.md](docs/TESTING.md) | Testes automatizados, teste de RLS e checklist de aceitação |
| [docs/LIMITATIONS.md](docs/LIMITATIONS.md) | Limitações conhecidas e itens não verificados |

## Segurança

- Nenhuma chave administrativa é usada no navegador. Somente a chave pública do Supabase é exposta.
- O arquivo `.env` está no `.gitignore`.
- Todas as tabelas usam Row Level Security e o bucket de arquivos é privado.
- O conteúdo dos arquivos enviados nunca é executado.
