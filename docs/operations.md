# Operations - DevCodes

## 1. Visão Geral

Este documento é o guia rápido de operação, manutenção e execução do **DevCodes**. Ele fornece os comandos e verificações essenciais para operar o sistema no dia a dia.

Para o passo a passo completo de primeiro setup e configuração do Supabase, consulte [docs/SETUP.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/SETUP.md).  
Para detalhes sobre a publicação em produção, consulte [docs/deploy.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/deploy.md).

---

## 2. Execução Local

### 2.1. Requisitos
- **Node.js:** Versão 20.19.0 ou superior (verifique com `node -v`).
- **NPM:** Gerenciador de pacotes padrão.

### 2.2. Comandos Operacionais Diários

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente (criar .env baseado no .env.example)
cp .env.example .env

# 3. Iniciar servidor de desenvolvimento local
npm run dev

# 4. Validar qualidade de código (linter rápido)
npm run lint

# 5. Executar suíte de testes unitários
npm test

# 6. Gerar build de produção para validação
npm run build
```

---

## 3. Variáveis de Ambiente Obrigatórias

Definidas no arquivo `.env` na raiz do projeto (nunca comitado no Git):

| Variável | Obrigatória | Descrição | Exemplo |
| :--- | :---: | :--- | :--- |
| `VITE_SUPABASE_URL` | Sim | URL HTTPS do projeto Supabase | `https://xyzcompany.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Sim | Chave pública anônima do Supabase | Token JWT iniciando com `eyJ...` |

---

## 4. Banco de Dados e Migrações

- **Local das Migrações:** `supabase/migrations/`
- **Ordem de Aplicação:** Ordem cronológica dos nomes dos arquivos (`YYYYMMDDHHMMSS_*.sql`).
- **Comandos via Supabase CLI:**
  ```bash
  # Vincular ao projeto remoto
  npx supabase link --project-ref <PROJECT_REF>

  # Aplicar migrações pendentes no banco
  npx supabase db push
  ```
- **Auditoria de Políticas RLS:** Execute o script `supabase/tests/rls_isolation.sql` no SQL Editor do painel do Supabase para certificar que o isolamento entre contas está íntegro.

---

## 5. Checklist de Deploy e Produção

- [ ] Variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` cadastradas no painel da Vercel.
- [ ] Configuração de URL e Redirect URLs do Supabase Auth apontando para o domínio de produção.
- [ ] Todas as migrações aplicadas no banco antes do deploy.
- [ ] Build e testes passando localmente sem erros (`npm test && npm run build`).
