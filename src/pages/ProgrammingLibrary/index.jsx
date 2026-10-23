import Alert from '../../components/ui/Alert.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import { useLoad } from '../../hooks/useLoad.js'
import { listFiles } from '../../services/files/filesService.js'
import { listProgrammingCategories } from '../../services/programming-categories/programmingCategoriesService.js'
import LibraryWorkspace from './LibraryWorkspace.jsx'
import './ProgrammingLibrary.css'

async function loadLibrary() {
  const [categories, files] = await Promise.all([listProgrammingCategories(), listFiles()])
  return { categories, files }
}

export default function ProgrammingLibrary() {
  const { data, loading, error } = useLoad(loadLibrary)

  if (loading && !data) return <Spinner label="Carregando biblioteca" />
  if (!data) return <Alert variant="error">{error || 'Não foi possível carregar a biblioteca.'}</Alert>

  return <LibraryWorkspace initialCategories={data.categories} initialFiles={data.files} />
}
