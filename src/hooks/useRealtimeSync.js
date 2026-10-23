import { useEffect, useRef } from 'react'
import { supabase } from '../services/supabase/client.js'

export function useRealtimeSync(table, filters = {}, onUpdate = () => {}, onDelete = () => {}, onInsert = () => {}) {
  const subscriptionRef = useRef(null)

  useEffect(() => {
    const channel = supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: table,
          ...filters
        },
        (payload) => onUpdate(payload.new, payload.old)
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: table,
          ...filters
        },
        (payload) => onDelete(payload.old)
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: table,
          ...filters
        },
        (payload) => onInsert(payload.new)
      )
      .subscribe()

    subscriptionRef.current = channel

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
    }
  }, [table, JSON.stringify(filters), onUpdate, onDelete, onInsert])
}
