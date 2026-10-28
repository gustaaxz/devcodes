# Backlog - DevCodes

## 1. Visão Geral

Este documento registra oportunidades futuras. O ciclo ativo está descrito em `docs/issues.md` e `docs/implementation-plan.md` e inclui as melhorias solicitadas em 2026-10-28.

Para itens em desenvolvimento imediato, consulte [docs/issues.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/issues.md) e [docs/implementation-plan.md](file:///c:/Users/gustavo_hatschbach/Desktop/devcodes/docs/implementation-plan.md).

---

## 2. Melhorias e estado em relação ao escopo atual

Os itens abaixo são referências futuras ou funcionalidades já implementadas.

| Item | Origem | Valor Esperado | Complexidade | Observações |
| :--- | :--- | :--- | :---: | :--- |
| **Tags Universais, Organização e Formatos de Arquivo** | Melhoria #18 — foco ativo | Tags cruzadas entre notas, tarefas e arquivos; formatos ampliados e preview seguro. Implementação local registrada; falta executar o teste RLS atualizado no Supabase remoto. Arquivos `.env` continuam bloqueados. | Média | Ver `docs/implementation-plan.md` para o escopo entregue e a validação pendente. |
| **Importação e exportação local de calendário** | Melhoria #19 | Intercâmbio de eventos por arquivos `.ics`, sem sincronização externa. | Média | Disponível no calendário DevCodes; `.ics` também é aceito na Biblioteca. |
| **Dashboard de Análise de Produtividade** | Melhoria #20 — foco ativo | Dashboard `/analytics` implementado localmente com métricas agregadas. Falta validação visual. | Média | Ver `docs/implementation-plan.md`. |
| **Backup Automático Diário** | Melhoria #21 | Exportação periódica compactada em ZIP com dados do usuário. | Média | Pode utilizar Supabase Edge Function ou export local em segundo plano. |

---

## 3. Ideias Livres e Hipóteses

| Ideia | Valor Esperado | Status | Observações |
| :--- | :--- | :---: | :--- |
| **Modo Pomodoro Integrado** | Auxiliar foco durante a execução de tarefas diárias com temporizador na Topbar. | Proposta | Pode emitir alerta sonoro suave ou notificação no navegador. |
| **Snippets do GitHub Gist** | Importação/exportação direta de código para Gists públicos ou privados. | Proposta | Exige integração com a API pública do GitHub via Personal Access Token. |
| **Suporte Offline (PWA)** | Leitura e cache local de notas e tarefas via Service Worker quando sem conexão. | Proposta | Necessita de fila de sincronização de escrita local (IndexedDB) para o Supabase. |
