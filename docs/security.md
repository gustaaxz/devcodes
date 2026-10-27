# Security & RLS - DevCodes

## Correcao da auditoria da Fase 6

Depois da migration inicial de auditoria, aplique `20261027170000_phase6_audit_cascade_fix.sql` antes de rodar `supabase/tests/phase6_audit_rls.sql`. A correção ignora deletes aninhados disparados pela exclusão de uma conta para respeitar a FK em `auth.users`; a cascata configurada continua removendo os registros de auditoria da conta.

## Por que este arquivo existe

Este documento define os padrões mandatórios de segurança, autenticação e proteção de dados do DevCodes.

---

## Princípio Fundamental: Defesa em Profundidade com RLS

No DevCodes, a segurança de dados **não depende da lógica do frontend**. Toda a privacidade e controle de acesso são aplicados diretamente no banco de dados através de **Row Level Security (RLS)** do PostgreSQL.

### Regra Mandatória
> Toda tabela criada no esquema `public` deve conter a instrução explícita:
> ```sql
> ALTER TABLE public.<tabela> ENABLE ROW LEVEL SECURITY;
> ```
> Nenhuma tabela deve existir sem políticas de RLS ativas.

### MFA TOTP
Supabase Auth gerencia fatores TOTP. Após login, o app exige verificação do fator quando a sessão está em AAL1 e a conta tem um fator verificado; o acesso às rotas protegidas só continua após a sessão chegar a AAL2. O cliente não armazena nem valida os segredos TOTP. Em produção, habilite TOTP e verificação de fatores nas configurações de Auth do projeto Supabase.

---

## Políticas Padrão por Entidade

### 1. Políticas de Isolamento por Usuário
Para tabelas privadas com `user_id` (`profiles`, `tasks`, `events`, `notes`, `note_versions`, `stored_files`, `categories`, `tags`, `task_reminders`, `reminder_preferences`):
```sql
CREATE POLICY "Users can manage own data"
ON public.<tabela>
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

Tabelas de associação sem `user_id` próprio (`note_tags`, `task_tags`, `file_tags`) aplicam RLS verificando a propriedade do recurso e da tag relacionada. `task_tags` também valida ambos os lados na política de inserção.

A migration `20261027120000_phase5_tags.sql` instala um trigger `SECURITY DEFINER` com `search_path` fixo para remover tags sem associações após exclusões em qualquer tabela de vínculo. A função não pode ser chamada diretamente por `anon` ou `authenticated`, remove somente tags não favoritas e verifica vínculos em todas as três tabelas.

A trilha de auditoria da Fase 6 usa `public.audit_log`, isolada por usuário com RLS. O cliente autenticado tem apenas `SELECT`; triggers `SECURITY DEFINER` registram operação e nomes dos campos alterados sem copiar conteúdo de notas, descrições ou arquivos. A migration `20261027160000_phase6_audit_log.sql` pode ser aplicada independentemente das migrations de backup. Depois de aplicá-la, rode `supabase/tests/phase6_audit_rls.sql` para verificar o isolamento e o bloqueio de escrita pelo cliente.

Na integração Google (#19), refresh tokens são criptografados com AES-GCM no Edge Function; a chave fica em Supabase Function Secrets. `google_calendar_credentials` e `google_calendar_oauth_states` têm RLS ligado, sem policies para usuários e sem grants a `anon`/`authenticated`. Os estados OAuth expiram em 10 minutos, são vinculados ao usuário autenticado e consumidos uma vez. O feed iCalendar público armazena somente o SHA-256 de um token aleatório; seu link concede leitura dos títulos, descrições e horários até revogação/rotação.

### 2. Políticas de Storage (Bucket `code-files`)
Arquivos enviados para o bucket de código são isolados em pastas prefixadas pelo `user_id`:
- Caminho: `code-files/{user_id}/{filename}`
- Regra de Leitura/Download: `bucket_id = 'code-files' AND (storage.foldername(name))[1] = auth.uid()::text`
- Regra de Upload: Usuário só pode fazer upload dentro de sua própria pasta.

---

## Sanitização de Entradas & XSS

- Entradas de texto em títulos e descrições são validadas quanto a limites de comprimento (`check (char_length(...) <= 200)`).
- Conteúdo renderizado de Markdown passa por sanitização antes de ser injetado no DOM, impedindo injeção de scripts maliciosos.

---

## Boas Práticas para Agentes e Desenvolvedores

1. **Nunca usar service_role key no client:** Utilizar exclusivamente a `anon key`.
2. **Filtragem explícita:** Mesmo com RLS, sempre passe `user_id = auth.uid()` nas queries do Supabase client para indexação e clareza de intenção.
3. **Auditoria de migrações:** Sempre validar o arquivo `supabase/tests/rls_isolation.sql` ao introduzir novas entidades.
4. **Lembretes:** `task_reminders` verifica tanto o `user_id` da linha quanto a propriedade da tarefa referenciada; os lembretes do cliente atual são somente in-app.
5. **Importação:** IDs e `user_id` fornecidos no arquivo são descartados. Todo novo registro recebe o `user_id` da sessão e continua sujeito às RLS existentes; o processo adiciona registros e não apaga/substitui dados.
