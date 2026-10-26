# Backlog - DevCodes

## 1. Visão Geral

Este documento registra oportunidades, melhorias e hipóteses em incubação que estão fora do ciclo ativo de sprints (Fases 1 a 4). 

Para itens em desenvolvimento imediato, consulte [docs/issues.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/issues.md) e [docs/implementation-plan.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/implementation-plan.md).

---

## 2. Itens Priorizados para Futuras Fases (Fases 5 e 6)

| Item | Origem | Valor Esperado | Complexidade | Observações |
| :--- | :--- | :--- | :---: | :--- |
| **Tags Universais e Organização Avançada** | Melhoria #18 | Cruzar tags coloridas entre notas, tarefas e códigos na biblioteca. | Média | Tabela `tags` e `note_tags` já existem; falta interface unificada. |
| **Integração com Google Calendar & iCal** | Melhoria #19 | Sincronização bidirecional de eventos e exportação em formato `.ics`. | Alta | Exige OAuth Google e gestão de conflitos de horário. |
| **Dashboard de Análise de Produtividade** | Melhoria #20 | Métricas de entrega, streaks de estudo diário e gráficos por categoria. | Média | Biblioteca de gráficos (`recharts` ou similar). |
| **Backup Automático Diário** | Melhoria #21 | Exportação periódica compactada em ZIP com dados do usuário. | Média | Pode utilizar Supabase Edge Function ou export local em segundo plano. |
| **Autenticação em Dois Fatores (2FA/MFA)** | Melhoria #22 | Camada adicional de proteção via TOTP (Google Authenticator). | Média | Suportado nativamente pelo Supabase Auth. |
| **Auditoria e Logs de Atividades** | Melhoria #23 | Histórico detalhado de logins, alterações e exclusões com rollback. | Média | Tabela `audit_logs` com trigger dedicado. |
| **Internacionalização (i18n)** | Melhoria #24 | Suporte completo a Português (PT-BR) e Inglês (EN-US). | Média | Centralização de strings em dicionários JSON. |
| **Testes End-to-End (E2E)** | Melhoria #25 | Bateria automatizada de testes de regressão de ponta a ponta com Playwright. | Alta | Rodar em pipeline CI/CD na Vercel/GitHub Actions. |
| **Tour Interativo de Onboarding** | Melhoria #26 | Guia passo a passo para novos usuários após primeiro login. | Baixa | Componente de tour com tooltips explicativos. |

---

## 3. Ideias Livres e Hipóteses

| Ideia | Valor Esperado | Status | Observações |
| :--- | :--- | :---: | :--- |
| **Modo Pomodoro Integrado** | Auxiliar foco durante a execução de tarefas diárias com temporizador na Topbar. | Proposta | Pode emitir alerta sonoro suave ou notificação no navegador. |
| **Snippets do GitHub Gist** | Importação/exportação direta de código para Gists públicos ou privados. | Proposta | Exige integração com a API pública do GitHub via Personal Access Token. |
| **Suporte Offline (PWA)** | Leitura e cache local de notas e tarefas via Service Worker quando sem conexão. | Proposta | Necessita de fila de sincronização de escrita local (IndexedDB) para o Supabase. |
