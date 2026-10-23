# Project Overview - DevCodes

## Por que este arquivo existe

Este documento explica o projeto DevCodes para qualquer pessoa ou agente de IA que chegue ao repositório. Ele define o problema, o público-alvo, a solução, o escopo e os diferenciais da aplicação.

## Problema

Desenvolvedores e estudantes de tecnologia precisam constantemente registrar anotações técnicas, organizar tarefas acadêmicas ou profissionais, agendar prazos/eventos e armazenar snippets ou arquivos de código de referência.

Atualmente, isso gera uma fragmentação de contexto em múltiplas ferramentas separadas (Google Calendar, Notion/Obsidian, GitHub Gists, Todoist, etc.), aumentando a sobrecarga mental e diminuindo a produtividade.

## Público-alvo

- Desenvolvedores de software (júnior a sênior)
- Estudantes de ciência da computação, engenharia de software e cursos técnicos
- Autodidatas e pesquisadores que buscam uma central de comando pessoal unificada para código e estudos

## Objetivo

- O DevCodes deve centralizar em uma interface moderna e rápida: **Calendário**, **Tarefas**, **Anotações técnicas** e **Biblioteca de Código**.
- O usuário deve conseguir sincronização em tempo real entre abas e dispositivos sem atrito, com suporte completo a tema escuro e claro.
- A aplicação deve garantir isolamento rigoroso de dados através de políticas RLS (*Row Level Security*) no banco de dados.

## Escopo do Sistema

- **Autenticação & Perfis:** Cadastro, login, redefinição de senha, preferências visuais (tema escuro/claro, visualização padrão, atalhos de teclado).
- **Dashboard:** Visão consolidada com métricas do dia, tarefas prioritárias, próximos eventos e anotações recentes.
- **Calendário:** Agendamento e visualização de eventos em modos Mês, Semana e Dia, filtragem por categorias e prioridades.
- **Tarefas:** Gestão ágil de tarefas com prioridades, datas de entrega, categorização e filtros.
- **Anotações:** Editor rico em Markdown com realce de sintaxe de código (Prism/Monaco), visualização em tempo real e versionamento de histórico.
- **Biblioteca de Código:** Upload e armazenamento seguro de arquivos de código (JS, TS, Python, SQL, CSS, JSON, etc.), visualizador de código com numeração de linha e download.
- **Busca Global:** Modal de busca rápida por teclado para pesquisar notas, tarefas, eventos e arquivos instantaneamente.

## Fora do Escopo

- Plataforma social aberta ou feed público de postagens (o foco primário é organização pessoal e produtividade do dev).
- IDE completa de compilação ou execução em nuvem (o foco é biblioteca de referência, consulta e documentação).
- Gestão corporativa complexa de times empresariais (o foco inicial é pessoal e colaboração pontual entre usuários).

## Diferenciais

- **Feito para quem coda:** Suporte de primeira classe para Markdown, blocos de código com destaque de sintaxe e gestão de snippets.
- **Sincronização em tempo real:** Atualização instantânea de estado entre sessões via Supabase Realtime.
- **Privacidade nativa:** Segurança reforçada a nível de banco de dados (PostgreSQL RLS), impedindo qualquer vazamento entre contas.
