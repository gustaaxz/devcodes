import { describe, expect, it } from 'vitest'
import { compareTasks, getDueState, moveTaskToStatus } from './tasks.js'

const now = new Date(2026, 9, 22, 12, 0)
const hours = (value) => new Date(now.getTime() + value * 3600000).toISOString()
const task = (status, due) => ({ status, due_at: due === null ? null : hours(due), created_at: now.toISOString() })

describe('prazos de tarefas', () => {
  it('classifica atrasada, proxima do vencimento, normal, sem prazo e concluida', () => {
    expect(getDueState(task('pending', -2), now)).toBe('overdue')
    expect(getDueState(task('in_progress', 24), now)).toBe('soon')
    expect(getDueState(task('pending', 200), now)).toBe('normal')
    expect(getDueState(task('pending', null), now)).toBe('none')
    expect(getDueState(task('done', -50), now)).toBe('done')
  })

  it('ordena por status, depois por prazo, deixando concluidas e sem prazo no fim', () => {
    const list = [task('done', 1), task('pending', null), task('pending', 50), task('pending', 5), task('in_progress', 100)]
    const sorted = [...list].sort(compareTasks)
    expect(sorted.map((item) => item.status)).toEqual(['in_progress', 'pending', 'pending', 'pending', 'done'])
    expect(sorted[1].due_at).toBe(hours(5))
    expect(sorted[3].due_at).toBeNull()
  })
})

describe('movimentação no quadro', () => {
  it('move somente a tarefa solta para a coluna de destino sem mutar a lista original', () => {
    const tasks = [{ id: 'a', status: 'pending' }, { id: 'b', status: 'done' }]
    const moved = moveTaskToStatus(tasks, 'a', 'in_progress')
    expect(moved).toEqual([{ id: 'a', status: 'in_progress' }, { id: 'b', status: 'done' }])
    expect(tasks[0].status).toBe('pending')
  })
})
