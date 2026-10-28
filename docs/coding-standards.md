# Coding Standards - DevCodes

## 1. Visão Geral e Princípios

Este documento define os padrões obrigatórios de codificação para o projeto **DevCodes**. Ele garante consistência, manutenibilidade e confiabilidade entre todas as contribuições humanas e de agentes de IA.

---

## 2. Linguagem e Paradigma

- **Linguagem Principal:** JavaScript moderno (ES2024+) com módulos ECMAScript nativos (`import`/`export`).
- **Extensões de Arquivo:**
  - `.jsx` para componentes e contextos React.
  - `.js` para serviços, hooks, utilitários e configurações.
- **Paradigma:** Funcional e declarativo. Preferir funções puras, imutabilidade em arrays/objetos e composição de componentes.
- **Evitar Abstrações Prematuras:** Escrever código simples e direto. Não introduzir classes ou padrões complexos de injeção de dependência desnecessários.

---

## 3. Padrões do Framework (React 19)

### 3.1. Componentes
- Use **exclusivamente componentes funcionais**. Não utilize componentes baseados em classe.
- Cada componente deve residir em seu próprio arquivo nomeado em PascalCase (ex: `TaskCard.jsx`, `ShareModal.jsx`).
- Mantenha componentes pequenos e focados em uma única responsabilidade. Extraia subcomponentes quando o arquivo ultrapassar 250 linhas.
- Utilize desestruturação clara de props com valores padrão quando aplicável:
  ```jsx
  export function TaskCard({ task, onComplete, priority = 'medium' }) {
    // ...
  }
  ```

### 3.2. Hooks e Estado
- Utilize os hooks nativos: `useState`, `useEffect`, `useCallback`, `useMemo` e `useRef`.
- **Regras dos Hooks:** Nunca chame hooks dentro de loops, condições ou funções aninhadas.
- **Clean-up obrigatório:** Todo `useEffect` que registrar listeners (teclado, cliques, WebSockets, Supabase Realtime) DEVE retornar a respectiva função de cancelamento/limpeza (`unsubscribe()`, `removeEventListener`).
- **Estado Local vs. Global:**
  - Estado restrito à tela (ex: texto de input, modal aberto/fechado) fica em `useState`.
  - Estado compartilhado (ex: sessão de auth, tema da aplicação) utiliza os providers em `src/contexts/`.

---

## 4. Camada de Serviços e Comunicação com Supabase

- Todas as chamadas ao Supabase residem dentro de `src/services/<dominio>/`.
- **Proibido:** Fazer chamadas diretas com `supabase.from(...)` dentro de componentes React.
- **Padronização de Retorno:** Funções assíncronas de serviço devem retornar objetos estruturados `{ data, error }` ou lançar erros com mensagens amigáveis:
  ```javascript
  import { supabase } from '../supabase/client.js'

  export async function getTasksByUserId(userId) {
    if (!userId) throw new Error('userId é obrigatório.')
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*, categories(*)')
      .eq('user_id', userId)
      .order('due_at', { ascending: true, nullsFirst: false })

    if (error) throw error
    return data
  }
  ```
- **Filtragem Explícita:** Mesmo com o RLS ativo no banco, passe sempre `.eq('user_id', userId)` nas queries para clareza e indexação eficiente.

---

## 5. Estilização e Design System

- **Vanilla CSS com Custom Properties (Variáveis CSS):**
  - O projeto utiliza CSS Variables centralizadas em `src/styles/global.css`.
  - Utilize os tokens semânticos: `--color-bg`, `--color-surface`, `--color-accent`, `--color-text`, `--color-border`.
  - Suporte obrigatório a temas escuro e claro via seletor `:root[data-theme="light"]` e `:root[data-theme="dark"]`.
- **Frameworks CSS:** Não utilize TailwindCSS, Bootstrap ou Styled Components a menos que expressamente solicitado pelo usuário.
- **Interações e Feedback:**
  - Adicione estados de hover, active e focus visíveis em elementos interativos.
  - Modais devem fechar ao clicar no backdrop e pressionar `Escape`.
  - Ao carregar dados assíncronos, utilize esqueletos (`Skeleton`) ou spinners de carregamento.

---

## 6. Qualidade de Código e Linter

- **Linter Oficial:** Oxlint.
  - Execução: `npm run lint`
- **Regras:**
  - Sem variáveis não utilizadas (`no-unused-vars`).
  - Sem consoles desnecessários em produção (`console.log`). Permitido apenas `console.error` em capturas de erro de serviços.
  - Sem código comentado ou blocos `TODO` abandonados.
  - Manter imports ordenados: 1º bibliotecas externas, 2º contextos/hooks, 3º componentes/serviços, 4º estilos.

---

## 7. Segurança e Proteção de Dados

1. **Nunca exponha credenciais:** Utilize exclusivamente `import.meta.env.VITE_SUPABASE_ANON_KEY`. A `service_role` jamais deve ser mencionada no frontend.
2. **Sanitização de Markdown:** Qualquer texto renderizado como HTML deve passar por sanitização para evitar ataques de Cross-Site Scripting (XSS).
3. **Validação de Entrada:** Valide campos obrigatórios e comprimentos máximos. A Biblioteca aceita qualquer extensão e tipo de arquivo até 10 MB; formatos reconhecidos podem aplicar verificações de conteúdo para proteger suas pré-visualizações.

---

## 8. Checklist de Qualidade para Modificações

Antes de concluir qualquer tarefa:
- [ ] Código escrito em JavaScript moderno seguindo os padrões deste documento.
- [ ] Nenhum erro reportado pelo linter (`npm run lint`).
- [ ] Tratamento de loading, erro e estado vazio em componentes visuais.
- [ ] Testes manuais realizados em **Dark Mode** e **Light Mode**.
- [ ] Layout validado em telas desktop e mobile (responsividade).
- [ ] RLS policies respeitadas nas operações de banco de dados.
- [ ] Documentação atualizada caso haja alteração de contrato ou novo serviço.
