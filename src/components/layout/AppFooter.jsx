import { Link } from 'react-router-dom'
import { BookOpen, Lightbulb } from 'lucide-react'
import './AppFooter.css'

const COPYRIGHT_YEAR = new Date().getFullYear()

export default function AppFooter({ onOpenGuide }) {
  return (
    <footer className="app-footer">
      <div className="app-footer__brand">
        <strong>DevCodes</strong>
        <span>Organize seus estudos, tarefas e projetos em um só lugar.</span>
      </div>
      <nav className="app-footer__links" aria-label="Links úteis">
        <button type="button" onClick={onOpenGuide}>
          <BookOpen size={15} /> Guia rápido
        </button>
        <a href="https://github.com/gustaaxz/devcodes/issues/new" target="_blank" rel="noreferrer">
          <Lightbulb size={15} /> Enviar sugestões
        </a>
        <Link to="/configuracoes">Configurações</Link>
      </nav>
      <small className="app-footer__copyright">© {COPYRIGHT_YEAR} DevCodes</small>
    </footer>
  )
}
