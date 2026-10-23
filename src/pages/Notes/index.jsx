import Alert from '../../components/ui/Alert.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import { useLoad } from '../../hooks/useLoad.js'
import { listCategories } from '../../services/categories/categoriesService.js'
import { listNotes } from '../../services/notes/notesService.js'
import NotesWorkspace from './NotesWorkspace.jsx'
import './Notes.css'

async function loadNotesPage() {
  const [notes, categories] = await Promise.all([listNotes(), listCategories()])
  return { notes, categories }
}

export default function Notes() {
  const { data, loading, error } = useLoad(loadNotesPage)

  if (loading && !data) return <Spinner label="Carregando anotações" />
  if (!data) return <Alert variant="error">{error || 'Não foi possível carregar as anotações.'}</Alert>

  return <NotesWorkspace initialNotes={data.notes} categories={data.categories} />
}
