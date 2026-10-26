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
| **Execução Local** | `npm run dev` | Vite Dev Server | Inspeção visual e testes de usabilidade em tempo real |
| **Isolamento de Banco (RLS)** | `supabase/tests/rls_isolation.sql` | Supabase SQL Editor | Cria 2 usuários temporários e valida que nenhum acessa dados do outro |

---

## 3. Pirâmide e Tipos de Teste

### 3.1. Testes Unitários (`*.test.jsx` / `*.test.js`)
- **Onde vivem:** Junto ao módulo que testam ou em `src/**/__tests__/`.
- **Escopo:**
  - Utilitários em `src/utils/` (datas, formatação de bytes, validação de arquivos).
  - Regras puras de ordenação e filtros em `src/services/`.
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
- Garante que usuário A não consiga ler, atualizar ou deletar dados de usuário B nas tabelas `profiles`, `categories`, `tasks`, `events`, `notes`, `stored_files` e `note_versions`.
- **Critério de Aceite:** O script deve retornar `OK: todos os testes de isolamento passaram`.

### 3.3. Testes Manuais e de Interface (UI/UX)
Para qualquer tela ou componente modificado:
1. **Alternância de Tema:** Testar obrigatoriamente tanto no tema Dark (`:root[data-theme="dark"]`) quanto no tema Light (`:root[data-theme="light"]`) para garantir contraste visual adequado (WCAG AA).
2. **Responsividade Mobile:** Redimensionar o viewport para mobile (375px a 768px) para verificar recolhimento da sidebar, modais fullscreen/drawer e quebra de textos.
3. **Estados de Carregamento e Vazio:** Verificar skeleton loader durante fetch e exibição amigável de lista vazia.
4. **Fechamento de Modais:** Pressionar `Escape` e clicar no backdrop do modal.

---

## 4. Regras Obrigatórias

- **Sem testes quebrados:** Nenhuma alteração pode ser mesclada com falhas no `npm test` ou no `npm run lint`.
- **Cobertura de novos comportamentos:** Toda nova feature deve adicionar os testes unitários correspondentes.
- **Testes de Regressão:** Ao corrigir um bug, escreva um teste que reproduza a falha e passe após a correção.
- **Impossibilidade Justificada:** Caso algum teste automatizado não possa ser executado no ambiente local (ex: dependência de hardware ou rede), registre explicitamente o motivo no `implementation-log.md`.
