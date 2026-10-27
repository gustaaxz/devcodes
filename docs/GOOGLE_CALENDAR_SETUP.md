# Configuração do Google Calendar

A integração #19 usa três Supabase Edge Functions: `google-calendar` (ações autenticadas), `google-calendar-oauth-callback` (retorno OAuth) e `ical-feed` (feed protegido por token). O navegador nunca recebe o refresh token do Google.

## Preparar Google OAuth

1. Crie ou selecione um projeto no Google Cloud e habilite a Google Calendar API.
2. Configure a tela de consentimento OAuth e crie um cliente OAuth do tipo aplicação Web.
3. Registre como URI de redirecionamento autorizado:
   `https://<project-ref>.supabase.co/functions/v1/google-calendar-oauth-callback`
4. Para desenvolvimento local, adicione o usuário Google como test user na tela de consentimento.

A autorização pede `calendar.events` para ler e editar eventos e `calendar.calendarlist.readonly` para mostrar calendários onde o usuário pode gravar. O consentimento solicita acesso offline e usa `state` de uso único mais PKCE.

## Configurar Supabase

Depois de aplicar `supabase/migrations/20261027130000_calendar_integration.sql`, configure os secrets das Edge Functions no Supabase Dashboard ou CLI. Use `supabase/functions/.env.example` como lista de nomes; nunca coloque os valores reais no repositório.

Secrets obrigatórios:

- `APP_URL`: origem HTTPS do DevCodes em produção (por exemplo `https://app.exemplo.com`); para desenvolvimento, `http://localhost:5173`.
- `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`: credenciais do cliente Web criado no Google Cloud.
- `GOOGLE_REDIRECT_URI`: URI de callback idêntica à cadastrada no Google.
- `GOOGLE_TOKEN_ENCRYPTION_KEY`: chave aleatória de 32 bytes codificada em Base64. Guarde uma cópia segura; sem ela, os refresh tokens já gravados não poderão ser descriptografados.

As credenciais do Google são criptografadas com AES-GCM no Edge Function. `google_calendar_credentials` e `google_calendar_oauth_states` não concedem acesso a `anon`/`authenticated`; as operações privilegiadas usam a chave secreta Supabase apenas no servidor.

## Deploy e verificação

Faça deploy das três funções após configurar os secrets. O callback OAuth e `ical-feed` usam `verify_jwt = false`; o código valida o estado OAuth de uso único ou o token secreto do feed. `google-calendar` mantém verificação de sessão Supabase.

Execute `supabase/tests/google_calendar_rls.sql` no SQL Editor. Depois, em uma conta de teste, conecte o Google, selecione um calendário gravável, sincronize e confira a badge/histórico. Teste também importação/exportação `.ics`, geração e revogação do feed e a política de conflito DevCodes-primeiro.

A sincronização automática por Realtime roda enquanto o DevCodes permanece aberto e online. Não há execução agendada com o navegador fechado nesta etapa.
