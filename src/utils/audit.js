import { translateText } from './i18n.js'

const ENTITY_LABELS = {
  tasks: 'Tarefas', notes: 'Anotações', events: 'Eventos', stored_files: 'Arquivos', profiles: 'Perfil',
  categories: 'Categorias', programming_categories: 'Categorias de programação', tags: 'Tags',
  note_shares: 'Compartilhamento de anotações', event_shares: 'Compartilhamento de eventos'
}

const FIELD_LABELS = {
  title: 'Título', description: 'Descrição', content: 'Conteúdo', status: 'Status', priority: 'Prioridade',
  due_at: 'Prazo', start_at: 'Início', end_at: 'Término', category_id: 'Categoria', is_favorite: 'Favorito',
  is_pinned: 'Fixado', full_name: 'Nome completo', preferences: 'Preferências', original_name: 'Nome do arquivo',
  permission: 'Permissão', expires_at: 'Expiração', shared_with_user_id: 'Usuário compartilhado'
}

export function getAuditLabels(entry, locale = 'pt-BR') {
  const operation = { INSERT: 'Criado', UPDATE: 'Atualizado', DELETE: 'Excluído' }[entry.operation] ?? entry.operation
  const entity = ENTITY_LABELS[entry.entity_type] ?? entry.entity_type
  return {
    operation: translateText(locale, operation),
    entity: translateText(locale, entity),
    fields: (entry.changed_fields ?? []).map((field) => translateText(locale, FIELD_LABELS[field] ?? field.replaceAll('_', ' ')))
  }
}
