# Testing Strategy - DevCodes

## 1. Visão Geral

Este documento define como a qualidade e o funcionamento contínuo do **DevCodes** são comprovados. Toda funcionalidade, refatoração ou correção de bug deve ser acompanhada das devidas validações antes de ser considerada concluída.

---

## 2. Comandos Oficiais de Verificação

| Finalidade | Comando | Ferramenta | O que valida |
| :--- | :--- | :--- | :--- |
| **Linting & Análise Estática** | `npm run lint` | Oxlint | Regras de sintaxe, imports não utilizados e anti-padrões |
| **Testes Unitários** | `npm test` | Vitest | Funções puras, validadores, formatadores e serviços |
| **Build de Produção** | `npm run build` | Vite | Validação de compilação, resolução de imports e minificação |
| **Testes E2E** | `npm run test:e2e` | Playwright | Login, áreas protegidas, idioma, MFA, validação de tarefa, cadastro, recuperação e rotas públicas com Supabase mockado |
| **Cobertura i18n** | `npm run i18n:check` | Babel parser + catálogo i18n | Textos JSX e atributos acessíveis sem tradução EN-US |
| **Execução Local** | `npm run dev` | Vite Dev Server | Inspeção visual e testes de usabilidade em tempo real |
| **Isolamento de Banco (RLS)** | `supabase/tests/rls_isolation.sql` | Supabase SQL Editor | Cria 2 usuários temporários e valida que nenhum acessa dados do outro |

---

## 3. Pirâmide e Tipos de Teste

### 3.1. Testes Unitários (`*.test.jsx` / `*.test.js`)
- **Onde vivem:** Junto ao módulo que testam ou em `src/**/__tests__/`.
- **Escopo:**
  - Utilitários em `src/utils/` (datas, formatação de bytes, validação de arquivos).
  - Regras puras de ordenação e filtros em `src/services/`.
  - Parser de importação: validação de backup, CSV com aspas/quebras de linha e rejeição de linhas inválidas.
  - Serviço de perfil: consulta e gravação do campo `full_name` consumido pelo contexto de perfil.
  - Tratamento de exceções e mapeamento de dados.
- **Exemplo com Vitest:**
  ```javascript
  import { describe, it, expect } from 'vitest'
  import { formatFileSize, isValidExtension } from './files.js'

  describe('files utils', () => {
    it('deve formatar bytes corretamente', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB')
    })

    it('deve rejeitar extensões não permitidas', () => {
      expect(isValidExtension('teste.exe')).toBe(false)
    })
  })
  ```

### 3.2. Testes de Isolamento e Segurança (RLS)
- Localizado em `supabase/tests/rls_isolation.sql`.
- Executado dentro de uma transação SQL com rollback automático.
- Garante que usuário A não consiga ler, atualizar ou deletar dados de usuário B nas tabelas privadas e associações, incluindo `task_tags`.
- Confirma que uma tag órfã é removida após a exclusão de sua última associação e que tags favoritas permanecem disponíveis sem associações.
- Verifica que um usuário não pode associar um lembrete à tarefa de outra pessoa.
- Confirma que RLS está habilitado em `storage.objects` e que as quatro políticas de pasta existem. O teste não grava nem apaga linhas de Storage: esses objetos devem ser manipulados pela Storage API, e a validação runtime de arquivos deve usar essa API.
- Para a integração Google/feed, execute `supabase/tests/google_calendar_rls.sql` depois da migration `20261027130000_calendar_integration.sql`; ele valida isolamento de configuração/logs/mapeamentos e bloqueio de acesso do cliente a credenciais, estados OAuth e metadados do feed.
- Para backups e histórico, execute `supabase/tests/backups_rls.sql` depois da migration `20261027140000_phase5_backups_audit.sql`; ele verifica RLS nas tabelas de backup, isolamento entre duas contas, escrita somente pelo servidor e a policy do bucket privado.
- Para a trilha de auditoria da Fase 6, execute `supabase/tests/phase6_audit_rls.sql` depois de `20261027160000_phase6_audit_log.sql`; valida registro de operações sem snapshots, isolamento por usuário e bloqueio de escrita pelo cliente.
- Para MFA, habilite TOTP e verificação de fatores nas configurações de Auth do Supabase; a suíte E2E cobre o fluxo com respostas mockadas, não substitui a validação em uma conta Supabase real.
- **Critério de Aceite:** O script deve retornar `OK: todos os testes de isolamento passaram`.

### 3.3. Testes Manuais e de Interface (UI/UX)
Para qualquer tela ou componente modificado:
1. **Alternância de Tema:** Testar obrigatoriamente tanto no tema Dark (`:root[data-theme="dark"]`) quanto no tema Light (`:root[data-theme="light"]`) para garantir contraste visual adequado (WCAG AA).
2. **Responsividade Mobile:** Redimensionar o viewport para mobile (375px a 768px) para verificar recolhimento da sidebar, modais fullscreen/drawer e quebra de textos.
3. **Estados de Carregamento e Vazio:** Verificar skeleton loader durante fetch e exibição amigável de lista vazia.
4. **Fechamento de Modais:** Pressionar `Escape` e clicar no backdrop do modal.

---

## 4. Regras Obrigatórias

### Execução E2E
- Instale o navegador com `npx playwright install chromium` após instalar dependências.
- O servidor Vite sobe automaticamente em `127.0.0.1:4173` durante a suíte.
- Os testes E2E usam um Supabase mockado localmente e não precisam de credenciais ou conexão com um projeto remoto.

- **Sem testes quebrados:** Nenhuma alteração pode ser mesclada com falhas no `npm test` ou no `npm run lint`.
- **Cobertura de novos comportamentos:** Toda nova feature deve adicionar os testes unitários correspondentes.
- **Testes de Regressão:** Ao corrigir um bug, escreva um teste que reproduza a falha e passe após a correção.
- **Impossibilidade Justificada:** Caso algum teste automatizado não possa ser executado no ambiente local (ex: dependência de hardware ou rede), registre explicitamente o motivo no `implementation-log.md`.
