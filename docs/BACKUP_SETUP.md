# Configuração de backups automáticos

O backup manual é criado pela Edge Function `create-backup`; a rotina comprime os dados em gzip e os grava no bucket privado `user-backups`. O navegador nunca recebe credenciais administrativas. Cada arquivo inclui tabelas de negócio e vínculos de tags do usuário, sem incluir os bytes dos arquivos armazenados na Biblioteca.

## Aplicar e publicar

1. Aplique `supabase/migrations/20261027140000_phase5_backups_audit.sql` no projeto Supabase.
2. Publique a função `create-backup`.
3. Gere um segredo aleatório longo e configure-o como `BACKUP_CRON_SECRET` nos secrets da função. Não salve o valor no repositório.
4. Em Configurações > Backup automático e histórico, habilite backups diários para os usuários desejados.

## Agendar a execução diária

O toggle grava a preferência do usuário. O script `schedule_backups.sql` instala `pg_cron` e `pg_net` quando ainda não estiverem ativos. Habilite Vault no painel de Extensions, se necessário, e crie estas entradas no Vault:

- `devcodes_project_url`: URL do projeto Supabase, como `https://<project-ref>.supabase.co`.
- `devcodes_publishable_key`: chave publicável/anon do projeto.
- `devcodes_backup_cron_secret`: mesmo valor configurado como `BACKUP_CRON_SECRET` nas Edge Functions.

Depois execute `supabase/setup/schedule_backups.sql` no SQL Editor. Se o projeto não permitir a instalação de `pg_cron` via SQL, habilite a extensão pelo Dashboard em Integrations > Cron e rode novamente o script. O agendamento chama `create-backup` diariamente às 03:00 UTC. A função verifica o segredo, seleciona apenas usuários com backup automático ativado, aplica retenção e registra o resultado em `sync_history`. Chamadas manuais continuam usando o JWT do usuário.

O `pg_net` pode manter temporariamente headers HTTP na fila de requisições; limite o acesso ao banco e ao Vault conforme a documentação do Supabase. O job pode ser removido com `select cron.unschedule(jobid) from cron.job where jobname = 'devcodes-daily-backups';`.

## Segurança e limites

- O bucket `user-backups` é privado e a tabela `backups` só permite leitura das linhas do próprio usuário via RLS.
- Os snapshots JSON comprimidos incluem notas e versões, tarefas e lembretes, eventos e histórico/mapeamentos de sincronização, categorias, tags, perfil, categorias da biblioteca e metadados de arquivos; os próprios arquivos continuam no bucket `programming-files`.
- Tokens OAuth, credenciais Google e tokens de feeds públicos são excluídos dos snapshots.
- A tabela `change_log` registra inserções, atualizações e exclusões em notas, tarefas, eventos e metadados de arquivos. O log é somente leitura para o usuário e mantém valores antigos/novos; retenção e exclusão de logs devem ser definidos antes de habilitar para bases grandes.
- A ação Restaurar importa de forma aditiva notas, tarefas e eventos, gera IDs novos e mantém os registros atuais. Repetir a restauração cria duplicatas. Ela não restaura metadados/binaries da Biblioteca, versões de notas, perfil, preferências ou credenciais.
