import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import Spinner from '../ui/Spinner.jsx'
import FullScreenMessage from './FullScreenMessage.jsx'

export default function ProtectedRoute() {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <FullScreenMessage>
        <Spinner label="Carregando sessão" />
      </FullScreenMessage>
    )
  }

  if (status !== 'authenticated') return <Navigate to="/entrar" replace />

  return <Outlet />
}
