import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout.jsx'
import ProtectedRoute from './components/layout/ProtectedRoute.jsx'
import PublicRoute from './components/layout/PublicRoute.jsx'
import ConfigurationNotice from './components/layout/ConfigurationNotice.jsx'
import { useAuth } from './hooks/useAuth.js'
import Login from './pages/Auth/Login.jsx'
import Register from './pages/Auth/Register.jsx'
import ForgotPassword from './pages/Auth/ForgotPassword.jsx'
import ResetPassword from './pages/Auth/ResetPassword.jsx'
import Dashboard from './pages/Dashboard/index.jsx'
import Calendar from './pages/Calendar/index.jsx'
import Tasks from './pages/Tasks/index.jsx'
import Notes from './pages/Notes/index.jsx'
import ProgrammingLibrary from './pages/ProgrammingLibrary/index.jsx'
import RecentFiles from './pages/RecentFiles/index.jsx'
import Favorites from './pages/Favorites/index.jsx'
import Settings from './pages/Settings/index.jsx'
import SharedResource from './pages/SharedResource/index.jsx'
import Tags from './pages/Tags/index.jsx'
import Analytics from './pages/Analytics/index.jsx'

export default function App() {
  const { status } = useAuth()
  if (status === 'unconfigured') return <ConfigurationNotice />

  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="entrar" element={<Login />} />
        <Route path="cadastro" element={<Register />} />
        <Route path="recuperar-senha" element={<ForgotPassword />} />
      </Route>
      <Route path="redefinir-senha" element={<ResetPassword />} />
      <Route path="shared/:share_token" element={<SharedResource />} />
      <Route path="compartilhado/:token" element={<SharedResource />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="calendario" element={<Calendar />} />
          <Route path="tarefas" element={<Tasks />} />
          <Route path="anotacoes" element={<Notes />} />
          <Route path="biblioteca" element={<ProgrammingLibrary />} />
          <Route path="arquivos-recentes" element={<RecentFiles />} />
          <Route path="favoritos" element={<Favorites />} />
          <Route path="tags" element={<Tags />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="configuracoes" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
