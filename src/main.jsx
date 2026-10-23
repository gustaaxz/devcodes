import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ErrorBoundary from './components/layout/ErrorBoundary.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { applyTheme, readCachedTheme } from './utils/preferences.js'
import './styles/global.css'

applyTheme(readCachedTheme())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
)
