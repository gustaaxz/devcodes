# Deploy - DevCodes

## Por que este arquivo existe

Este documento define a estratégia de build, configuração de ambiente e publicação da plataforma DevCodes em produção.

---

## Arquitetura de Deploy

- **Frontend:** Single Page Application (SPA) construída com Vite + React 18, hospedada e distribuída globalmente na **Vercel**.
- **Backend / BaaS:** **Supabase** gerenciado (PostgreSQL 15+, Auth, Storage S3-compatible, Realtime WebSocket e Edge Functions).

---

## Configuração da Vercel (`vercel.json`)

Para que o roteamento client-side com `react-router-dom` funcione sem erros 404 ao recarregar a página, todas as rotas são reescritas para `index.html`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## Variáveis de Ambiente

O frontend consome variáveis públicas através do prefixo `VITE_`:

| Variável | Descrição |
| :--- | :--- |
| `VITE_SUPABASE_URL` | URL da instância do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima pública com controle de acesso limitado por RLS |

> [!CAUTION]
> A `SUPABASE_SERVICE_ROLE_KEY` **NUNCA** deve ser inserida nas variáveis do frontend ou comitada no repositório.

---

## Checklist de Build e Deploy

- [ ] Executar checagem de tipos e lint localmente: `npm run lint` ou oxlint
- [ ] Executar testes automatizados: `npm run test`
- [ ] Validar o build de produção: `npm run build`
- [ ] Garantir que todas as migrações SQL foram aplicadas no banco de dados do Supabase
