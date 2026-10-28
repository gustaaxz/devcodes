import { useCallback, useEffect, useRef, useState } from 'react'
import { friendlyError } from '../utils/errors.js'

export function useLoad(loader, key = '') {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  const [version, setVersion] = useState(0)
  const loaderRef = useRef(loader)

  useEffect(() => {
    loaderRef.current = loader
  })

  useEffect(() => {
    let active = true
    loaderRef
      .current()
      .then((data) => {
        if (active) setState({ data, loading: false, error: '' })
      })
      .catch((error) => {
        if (active) {
          setState((current) => ({
            data: current.data,
            loading: false,
            error: friendlyError(error, 'Não foi possível carregar os dados.')
          }))
        }
      })
    return () => {
      active = false
    }
  }, [key, version])

  const reload = useCallback(() => setVersion((value) => value + 1), [])
  const setData = useCallback((nextData) => {
    setState((current) => ({
      ...current,
      data: typeof nextData === 'function' ? nextData(current.data) : nextData
    }))
  }, [])

  return { ...state, reload, setData }
}
