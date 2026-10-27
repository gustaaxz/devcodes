# Security & RLS - DevCodes

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

---

## Políticas Padrão por Entidade

### 1. Políticas de Isolamento por Usuário
Para tabelas privadas (`profiles`, `tasks`, `events`, `notes`, `note_versions`, `stored_files`, `categories`, `tags`, `task_reminders`, `reminder_preferences`):
```sql
CREATE POLICY "Users can manage own data"
ON public.<tabela>
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

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
