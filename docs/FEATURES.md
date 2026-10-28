# Funcionalidades e arquitetura

## Módulos

### Dashboard
Saudação por horário, data atual e indicadores calculados no banco: tarefas pendentes, tarefas atrasadas, compromissos de hoje e total de anotações. Lista os próximos eventos (30 dias), os prazos em aberto, as anotações recentes e os arquivos enviados recentemente. Permite criar tarefa, evento ou anotação sem sair da página. Possui estados de carregamento, ausência de dados e erro com nova tentativa.

### Calendário
Visualização mensal com navegação e botão Hoje. Destaca o dia atual, os eventos por cor de categoria e indicadores de tarefas com prazo e de anotações vinculadas. Ao selecionar um dia, o painel lateral lista os eventos, as tarefas e as anotações e permite criar, editar e excluir eventos.

Cada evento possui título, descrição, categoria, data, horário de início e término opcionais, prioridade, status e lembrete opcional. Um evento sem horário de início é tratado como evento de dia inteiro. Os horários são exibidos no fuso do navegador e armazenados em UTC. O primeiro dia da semana é configurável.

### Tarefas
Criação, edição, conclusão, reabertura e exclusão. Filtros por status, categoria, prioridade e prazo. Tarefas atrasadas e as que vencem em até 48 horas recebem destaque. Visualização em lista e em quadro por status.

### Anotações
Duas visões sobre o mesmo registro: **Gerais** (sem data) e **Por data** (vinculadas a um dia do calendário). Recursos: busca por título e conteúdo, filtros por categoria, tag e favoritas, fixar, favoritar, duplicar e excluir. O editor oferece títulos, negrito, itálico e listas, com alternância entre edição e visualização. O salvamento é automático e mostra os estados Salvo, Salvando e Erro. Em caso de falha, o texto é preservado e há o botão "Tentar novamente".

### Biblioteca de Programação
Módulo independente das anotações, com tabelas próprias e conteúdo no Supabase Storage.

- **Categorias dinâmicas**: criar, renomear, reordenar e excluir. Excluir uma categoria com arquivos exige escolher entre mover os arquivos, excluí-los ou cancelar.
- **Upload**: por botão ou por drag and drop, com vários arquivos por vez e resultado individual. Valida extensão, tamanho (até 10 MB) e conteúdo (texto sem bytes nulos e assinatura de PDF, ZIP e DOC).
- **Gerenciamento**: visualizar, baixar por URL assinada de 60 segundos, renomear, editar descrição, mudar de categoria, favoritar, buscar, filtrar por extensão, ordenar e alternar entre lista e grade.
- **Visualizador**: realce de sintaxe com Prism, numeração de linhas, nome, linguagem, copiar e baixar o original. PDFs e demais binários mostram uma tela de metadados com o download.
- **Criação e edição**: arquivos de texto podem ser criados e editados na própria biblioteca.
- **Exclusão**: remove primeiro o objeto do Storage e depois o registro, de modo que uma falha parcial pode ser repetida.

Todos os tipos e extensões de arquivo são aceitos na Biblioteca, incluindo arquivos sem extensão, com limite de 10 MB por arquivo. Formatos reconhecidos mantêm validações e pré-visualizações específicas; os demais são armazenados como binários genéricos e podem ser baixados, mas não pré-visualizados. O conteúdo enviado nunca é executado. Arquivos de texto são gravados com tipo `text/plain`, e arquivos sem tipo conhecido usam `application/octet-stream`.

### Pesquisa global, Favoritos e Arquivos recentes
- A pesquisa localiza anotações, tarefas, eventos, arquivos (somente metadados), categorias e tags, separados por tipo, e abre o registro correspondente.
- Favoritos reúne anotações e arquivos da biblioteca em seções separadas.
- Arquivos recentes lista os 30 arquivos enviados ou modificados mais recentemente.

### Configurações
Nome de exibição, tema (escuro ou claro), primeiro dia da semana, exibição e ordenação padrão da biblioteca, gerenciamento das categorias de programação, e-mail, alteração de senha e encerramento de sessão. As preferências ficam salvas no perfil do usuário.

## Separação entre Anotações e Biblioteca

| | Anotações | Biblioteca de Programação |
|---|---|---|
| Tabelas | `notes`, `note_tags` | `programming_categories`, `stored_files`, `file_tags` |
| Conteúdo | Texto no banco | Arquivos no Storage e metadados no banco |
| Exclusão | Não afeta arquivos | Não afeta anotações |

Os módulos compartilham apenas a autenticação, o sistema visual, a pesquisa e as preferências.

## Modelo de dados

| Tabela | Finalidade |
|---|---|
| `profiles` | Nome de exibição e preferências do usuário |
| `categories` | Categorias de eventos, tarefas e anotações |
| `tags` | Tags do usuário |
| `events` | Eventos do calendário |
| `tasks` | Tarefas |
| `notes` e `note_tags` | Anotações e suas tags |
| `programming_categories` | Abas da biblioteca |
| `stored_files` e `file_tags` | Metadados dos arquivos da biblioteca |

Todas as tabelas usam UUID, chaves estrangeiras, restrições de integridade e índices para as consultas frequentes. Um gatilho no cadastro cria o perfil, as 10 categorias de programação e as 6 categorias acadêmicas padrão.

## Segurança

- **RLS** em todas as tabelas, com políticas de leitura, criação, edição e exclusão restritas ao proprietário. As políticas também validam que categorias e tags referenciadas pertencem ao mesmo usuário.
- **Storage** privado, com políticas que limitam cada usuário à própria pasta `{id-do-usuário}/`.
- **Chaves**: somente a chave pública é usada no navegador.
- **Cabeçalhos HTTP** de segurança definidos em `vercel.json`.
- **Conteúdo do usuário** é sempre renderizado como texto, sem HTML arbitrário.

## Estrutura do projeto

```text
src/
  components/    layout, ui e componentes de cada módulo
  contexts/      autenticação, perfil e versão de dados
  hooks/         hooks reutilizáveis
  pages/         uma pasta por rota
  services/      acesso ao Supabase por domínio
  styles/        estilos globais e variáveis
  utils/         funções puras e utilitários
supabase/
  migrations/    estrutura do banco versionada
  tests/         teste de isolamento entre usuários
  seed.sql       vazio: as categorias padrão são criadas por gatilho no cadastro
docs/            documentação
vercel.json      rotas SPA, cabeçalhos e cache
```

## Decisões de arquitetura

- O Supabase concentra autenticação, banco e arquivos. Não há servidor próprio nem API própria, portanto Postman, Swagger/OpenAPI e Nginx não se aplicam.
- A sessão e os tokens JWT são gerenciados pelo Supabase Auth.
