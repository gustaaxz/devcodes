const SOON_WINDOW_MS = 48 * 60 * 60 * 1000

export function getDueState(task, now = new Date()) {
  if (task.status === 'done') return 'done'
  if (!task.due_at) return 'none'
  const due = new Date(task.due_at).getTime()
  if (due < now.getTime()) return 'overdue'
  if (due - now.getTime() <= SOON_WINDOW_MS) return 'soon'
  return 'normal'
}

const STATUS_ORDER = { in_progress: 0, pending: 1, done: 2 }

export function compareTasks(a, b) {
  const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
  if (byStatus !== 0) return byStatus
  if (a.due_at && b.due_at) return new Date(a.due_at) - new Date(b.due_at)
  if (a.due_at) return -1
  if (b.due_at) return 1
  return new Date(b.created_at) - new Date(a.created_at)
}

export function moveTaskToStatus(tasks, taskId, status) {
  return (tasks || []).map((task) => task.id === taskId ? { ...task, status } : task)
}
