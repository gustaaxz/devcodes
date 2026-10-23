import { createContext } from 'react'

export const DataVersionContext = createContext({ version: 0, bump: () => {} })
