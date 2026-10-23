import { DatabaseZap } from 'lucide-react'
import EmptyState from '../ui/EmptyState.jsx'
import FullScreenMessage from './FullScreenMessage.jsx'

export default function ConfigurationNotice() {
  return (
    <FullScreenMessage>
      <EmptyState
        icon={DatabaseZap}
        title="Supabase não configurado"
        description="Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env e reinicie o servidor de desenvolvimento."
      />
    </FullScreenMessage>
  )
}
