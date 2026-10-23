# Limitações e itens não verificados

## Não verificado no desenvolvimento

Estes pontos dependem do seu ambiente e precisam ser confirmados após a configuração.

- **Supabase real**: o banco foi testado em um PostgreSQL local que emula `auth` e `storage`. O envio real de arquivos pela API do Storage, as URLs assinadas e o fluxo de e-mails do Supabase Auth ainda não foram executados.
- **Navegadores e dispositivos**: a interface foi construída com layout responsivo, mas não foi inspecionada visualmente em navegadores reais ou em celulares. Use a checklist de [TESTING.md](TESTING.md).
- **Vercel**: o deploy não foi realizado. O `vercel.json` foi validado apenas quanto à sintaxe.
- **Política de segurança de conteúdo (CSP)**: não está configurada, pois não pôde ser validada em um navegador real. Os demais cabeçalhos de segurança estão ativos.

## Funcionalidades não implementadas

- **Notificações e lembretes**: o lembrete de eventos é gravado, mas não há aviso dentro do aplicativo, e-mail ou notificação push.
- **Categorias de tarefas, eventos e anotações**: existem 6 categorias padrão e não há tela para criar, renomear ou excluir outras.
- **Tags de arquivos**: a tabela existe no banco, mas não há interface na biblioteca.
- **Associação entre anotação e arquivo**: item opcional do projeto, não implementado.
- **Calendário**: apenas a visualização mensal. As visões semanal e diária não foram implementadas.
- **Quadro de tarefas**: a mudança de status é feita por seletor. Não há arrastar e soltar.
- **Reordenação de categorias da biblioteca**: feita por setas, sem arrastar.
- **Eventos de vários dias**: um evento tem data única, com horários de início e término no mesmo dia.
- **Busca em conteúdo de arquivos**: a pesquisa considera apenas nome e descrição dos arquivos.

## Limites técnicos

- Tamanho máximo de 10 MB por arquivo. O limite do bucket pode ser alterado em uma nova migration, juntamente com a constante `MAX_FILE_SIZE` em `src/utils/files.js`.
- O visualizador abre arquivos de texto de até 512 KB e aplica o realce de sintaxe até 200 KB.
- O progresso do upload é informado por arquivo. O cliente do Supabase não informa a porcentagem.
- A pesquisa global usa `ilike`, com até 5 resultados por tipo. Para volumes muito grandes de dados, considere índices de busca textual.
- O servidor de e-mail padrão do Supabase tem limite de envios. Configure SMTP próprio em produção.
