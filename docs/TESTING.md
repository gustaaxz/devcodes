# Testes e aceitação

## Testes automatizados

```bash
npm run lint
npm test
npm run build
```

| Verificação | Cobertura |
|---|---|
| `npm test` | 36 testes: datas e fusos, grade do calendário, prazos de tarefas, validação de arquivos e uploads, nomes seguros, preferências, mensagens de erro, saneamento da pesquisa, visualização de anotações e visualizador de código, incluindo o escape de HTML |
| `npm run lint` | Análise estática, sem avisos |
| `npm run build` | Build de produção sem erros |

## Teste de isolamento no banco

O arquivo `supabase/tests/rls_isolation.sql` verifica as políticas RLS e as restrições de integridade. Para executá-lo, siga a etapa 3.6 de [SETUP.md](SETUP.md).

Ele confirma que:

- o cadastro cria o perfil e as categorias padrão;
- cada usuário lê apenas os próprios registros, em todas as tabelas e no Storage;
- um usuário não altera, não exclui nem cria registros em nome de outro;
- categorias e tags de outro usuário não podem ser referenciadas;
- um usuário não grava na pasta de outro usuário no Storage;
- o acesso anônimo não lê nem grava nada;
- uma categoria com arquivos não pode ser excluída pelo banco;
- as restrições de datas, prioridades, slugs e tamanhos são respeitadas.

## O que foi verificado no desenvolvimento

| Item | Resultado |
|---|---|
| Migrations aplicadas do zero em um PostgreSQL local que emula `auth` e `storage` | Aprovado |
| `rls_isolation.sql` nesse ambiente | Aprovado |
| Teste de mutação: 6 políticas enfraquecidas de propósito | As 6 falhas foram detectadas pelo script |
| Consultas equivalentes às do aplicativo (tags, perfil, junções) como usuário autenticado | Aprovado |
| Testes automatizados em 5 fusos horários | Aprovado |
| `npm audit` | Sem vulnerabilidades |
| Rotas da aplicação servidas pelo build de produção | Aprovado |

## O que ainda precisa ser verificado por você

Estes itens dependem do seu projeto Supabase, do GitHub e da Vercel e não puderam ser verificados no desenvolvimento. Veja também [LIMITATIONS.md](LIMITATIONS.md).

## Checklist de aceitação

Use dois usuários diferentes para os itens de isolamento.

| # | Critério | Como verificar |
|---|---|---|
| 1 | Cadastro, login, logout e recuperação de senha | Cadastre-se, confirme o e-mail, entre, saia, solicite a redefinição e defina nova senha |
| 2 | Rotas privadas protegidas | Sem sessão, abra `/tarefas` e confirme o redirecionamento para `/entrar` |
| 3 | Dados isolados entre usuários | Crie registros com o usuário A e confirme que o usuário B não os vê |
| 4 | Calendário com eventos reais | Crie, edite e exclua um evento e confirme o resultado após atualizar a página |
| 5 | Anotações vinculadas a datas | Crie uma anotação com data e confirme o indicador e o painel do dia |
| 6 | Tarefas criadas, editadas e concluídas | Crie uma tarefa, edite, conclua e reabra |
| 7 | Persistência após atualizar | Atualize a página em cada módulo e confirme que os dados permanecem |
| 8 | Abas da biblioteca dinâmicas | Confirme as 10 abas iniciais e os contadores |
| 9 | Nova categoria de programação | Crie, renomeie e reordene uma categoria |
| 10 | Upload por botão e por drag and drop | Envie vários arquivos pelos dois métodos |
| 11 | Arquivos no Storage | No painel do Supabase, confirme o objeto em `programming-files/{id-do-usuário}/...` |
| 12 | Metadados no PostgreSQL | Confirme a linha correspondente em `stored_files` |
| 13 | Download, renomeação e exclusão | Execute as três ações e confirme que o objeto e o registro são removidos |
| 14 | Biblioteca independente das anotações | Confirme que arquivos não aparecem como anotações e vice-versa |
| 15 | Excluir uma nota não exclui arquivos | Exclua uma anotação e confirme que a biblioteca permanece igual |
| 16 | Pesquisa identifica cada tipo | Pesquise um termo presente em uma nota, uma tarefa, um evento e um arquivo |
| 17 | Erros compreensíveis | Veja os cenários de falha abaixo |
| 18 | Funciona em dispositivos móveis | Veja a checklist de responsividade abaixo |
| 19 | Build de produção sem erros | `npm run build` |
| 20 | Instruções reproduzem o projeto | Siga [SETUP.md](SETUP.md) em um projeto Supabase novo |

## Cenários de falha

| Cenário | Como provocar | Resultado esperado |
|---|---|---|
| Upload interrompido | Desconecte a rede durante o envio | O arquivo aparece como "Falhou" com mensagem de conexão e nenhum registro órfão |
| Arquivo inválido | Envie um `.exe`, um arquivo vazio, um PDF falso e um arquivo acima de 10 MB | Cada um é recusado com a mensagem correspondente |
| Sessão expirada | Exclua o usuário de teste no painel do Supabase (Authentication, Users) e aguarde a renovação do token, que ocorre em até 1 hora na configuração padrão | A aplicação volta ao login exibindo "Sua sessão expirou" |
| Dados inválidos | Salve evento com término anterior ao início, tarefa sem título e senha curta | Mensagens de validação nos campos |
| Acesso não autorizado | Com o usuário B, abra o endereço `/biblioteca?arquivo=` de um arquivo do usuário A | O arquivo não é aberto |
| Falha ao salvar anotação | Desconecte a rede durante a digitação | Estado "Erro ao salvar", texto preservado e botão "Tentar novamente" |
| Erro inesperado de interface | Qualquer exceção de renderização | Tela "Algo deu errado" com o botão de recarregar |

## Checklist de responsividade

Teste nas larguras de 375 px, 768 px e 1280 px.

- A sidebar vira uma gaveta abaixo de 768 px e a pesquisa aparece pelo ícone da barra superior.
- O calendário e o painel do dia se empilham em telas estreitas.
- A lista e o editor de anotações alternam entre si no celular.
- As abas da biblioteca rolam horizontalmente.
- Os modais cabem na tela e rolam internamente.
- Não há rolagem horizontal na página, exceto no visualizador de código.
