import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { translate } from '../../utils/i18n.js'

const STEPS = [
  { path: '/', title: 'tour.dashboard.title', description: 'tour.dashboard.description' },
  { path: '/tarefas', title: 'tour.tasks.title', description: 'tour.tasks.description' },
  { path: '/anotacoes', title: 'tour.notes.title', description: 'tour.notes.description' },
  { path: '/biblioteca', title: 'tour.library.title', description: 'tour.library.description' },
  { path: '/analytics', title: 'tour.analytics.title', description: 'tour.analytics.description' }
]

export default function OnboardingTour({ locale = 'pt-BR', onComplete }) {
  const [stepIndex, setStepIndex] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()
  const step = STEPS[stepIndex]

  useEffect(() => {
    if (location.pathname !== step.path) navigate(step.path)
  }, [location.pathname, navigate, step.path])

  function nextStep() {
    if (stepIndex === STEPS.length - 1) {
      onComplete()
      return
    }
    setStepIndex((current) => current + 1)
  }

  return (
    <div className="onboarding-tour" role="presentation">
      <section className="onboarding-tour__card" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <span className="onboarding-tour__progress">{translate(locale, 'tour.progress', { current: stepIndex + 1, total: STEPS.length })}</span>
        <h2 id="onboarding-title">{translate(locale, step.title)}</h2>
        <p>{translate(locale, step.description)}</p>
        <div className="onboarding-tour__actions">
          <button type="button" className="button button--secondary" onClick={onComplete}>{translate(locale, 'tour.skip')}</button>
          <button type="button" className="button button--primary" onClick={nextStep}>
            {translate(locale, stepIndex === STEPS.length - 1 ? 'tour.finish' : 'tour.next')}
          </button>
        </div>
      </section>
    </div>
  )
}
