import { useMemo, useState } from 'react'
import Alert from '../../components/ui/Alert.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import { useLocale } from '../../hooks/useLocale.js'
import { useLoad } from '../../hooks/useLoad.js'
import { loadAnalytics } from '../../services/analytics/analyticsService.js'
import './Analytics.css'

const RANGE_OPTIONS = [30, 90]

function Metric({ label, value, hint }) {
  return <article className="analytics__metric card"><span>{label}</span><strong>{value}</strong><small>{hint}</small></article>
}

function ActivityChart({ points }) {
  const max = Math.max(1, ...points.map((point) => point.tasks + point.notes + point.files))
  const step = Math.max(1, Math.ceil(points.length / 15))
  return (
    <div className="analytics__chart" role="img" aria-label="Atividade diária de tarefas concluídas, anotações e arquivos">
      {points.map((point, index) => {
        const total = point.tasks + point.notes + point.files
        const height = total ? Math.max(4, Math.round((total / max) * 100)) : 0
        return <div className="analytics__bar-column" key={point.date} title={`${point.label}: ${point.tasks} tarefas, ${point.notes} anotações, ${point.files} arquivos`}>
          <div className="analytics__bar" style={{ height: `${height}%` }}><span style={{ height: `${(point.tasks / Math.max(1, total)) * 100}%` }} /><span style={{ height: `${(point.notes / Math.max(1, total)) * 100}%` }} /><span style={{ height: `${(point.files / Math.max(1, total)) * 100}%` }} /></div>
          {index % step === 0 || index === points.length - 1 ? <small>{point.label}</small> : <small aria-hidden="true">&nbsp;</small>}
        </div>
      })}
    </div>
  )
}

export default function Analytics() {
  const [days, setDays] = useState(30)
  const locale = useLocale()
  const loader = useMemo(() => () => loadAnalytics(days, locale), [days, locale])
  const { data, loading, error } = useLoad(loader, `${days}-${locale}`)

  return <main className="analytics">
    <header className="analytics__header">
      <div><h2>Análise de produtividade</h2><p>Acompanhe sua atividade e o andamento das tarefas.</p></div>
      <label className="analytics__range">Período <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
        {RANGE_OPTIONS.map((option) => <option key={option} value={option}>{option} dias</option>)}
      </select></label>
    </header>
    {loading && !data && <Spinner label="Carregando métricas" />}
    {error && <Alert variant="error">{error}</Alert>}
    {data && <>
      <div className="analytics__metrics">
        <Metric label="Tarefas concluídas" value={data.completedTasks} hint={`Taxa de conclusão: ${data.completionRate}%`} />
        <Metric label="Tarefas em aberto" value={data.pendingTasks} hint="No momento" />
        <Metric label="Anotações criadas" value={data.notesCreated} hint={`Nos últimos ${days} dias`} />
        <Metric label="Dias ativos" value={`${data.activeDays}/${days}`} hint="Com alguma atividade registrada" />
        <Metric label="Sequência ativa" value={`${data.currentStreak} dias`} hint={`Recorde no período: ${data.bestStreak} dias`} />
        <Metric label="Variação semanal" value={`${data.weeklyChangePercent > 0 ? '+' : ''}${data.weeklyChangePercent}%`} hint="Atividade vs. 7 dias anteriores" />
        <Metric label="Dia mais produtivo" value={data.mostActiveWeekday || '—'} hint="Pelo total de atividades registradas" />
      </div>
      <section className="analytics__section card">
        <header><div><h3>Atividade diária</h3><p>Tarefas concluídas, anotações e arquivos adicionados.</p></div>
          <div className="analytics__legend"><span><i className="analytics__legend-task" />Tarefas</span><span><i className="analytics__legend-note" />Anotações</span><span><i className="analytics__legend-file" />Arquivos</span></div>
        </header>
        <ActivityChart points={data.points} />
      </section>
      <div className="analytics__lower">
        <section className="analytics__section card"><h3>Conclusões por categoria</h3>
          {data.categories.length ? <ul className="analytics__categories">{data.categories.map((category) => <li key={category.name}><span><i style={{ background: category.color }} />{category.name}</span><strong>{category.value}</strong></li>)}</ul> : <p className="analytics__empty">Ainda não há tarefas concluídas por categoria neste período.</p>}
        </section>
        <section className="analytics__section card"><h3>Seu ritmo</h3>
          {data.bestDay ? <p>Seu dia mais ativo foi <strong>{data.bestDay.label}</strong>, com {data.bestDay.tasks + data.bestDay.notes + data.bestDay.files} atividade(s).</p> : <p className="analytics__empty">Registre uma atividade para começar a ver seus destaques.</p>}
          <p className="analytics__files-added">Arquivos adicionados: <strong>{data.filesAdded}</strong></p>
        </section>
      </div>
    </>}
  </main>
}
