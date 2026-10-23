import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'
import EmptyState from '../ui/EmptyState.jsx'
import FullScreenMessage from './FullScreenMessage.jsx'

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error(error)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <FullScreenMessage>
        <EmptyState
          icon={AlertTriangle}
          title="Algo deu errado"
          description="Ocorreu um erro inesperado. Recarregue a página para continuar."
        />
        <button type="button" className="button button--primary" onClick={() => window.location.reload()}>
          Recarregar página
        </button>
      </FullScreenMessage>
    )
  }
}
