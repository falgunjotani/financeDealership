/**
 * DealContext.jsx
 *
 * Lightweight global state using React Context + useReducer.
 * Stores the active deal ID so it survives page navigation within the SPA
 * without needing to pass it through URL params on every transition.
 *
 * Note: For a production app you would also persist the dealId to
 * sessionStorage so a page refresh doesn't lose context.
 */

import { createContext, useContext, useReducer, useEffect } from 'react'

// ─── State shape ─────────────────────────────────────────────────────────────
const initialState = {
  activeDealId: sessionStorage.getItem('activeDealId') || null,
}

// ─── Reducer ─────────────────────────────────────────────────────────────────
function dealReducer(state, action) {
  switch (action.type) {
    case 'SET_DEAL_ID':
      return { ...state, activeDealId: action.payload }
    case 'CLEAR_DEAL':
      return { ...state, activeDealId: null }
    default:
      return state
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────
const DealContext = createContext(null)

export function DealProvider({ children }) {
  const [state, dispatch] = useReducer(dealReducer, initialState)

  // Persist dealId to sessionStorage so a hard refresh on /offers or /summary
  // doesn't silently lose the active deal.
  useEffect(() => {
    if (state.activeDealId) {
      sessionStorage.setItem('activeDealId', state.activeDealId)
    } else {
      sessionStorage.removeItem('activeDealId')
    }
  }, [state.activeDealId])

  const setActiveDealId = (id) => dispatch({ type: 'SET_DEAL_ID', payload: id })
  const clearDeal = () => dispatch({ type: 'CLEAR_DEAL' })

  return (
    <DealContext.Provider value={{ activeDealId: state.activeDealId, setActiveDealId, clearDeal }}>
      {children}
    </DealContext.Provider>
  )
}

// Custom hook – components call useDeal() instead of importing context directly
export function useDeal() {
  const ctx = useContext(DealContext)
  if (!ctx) throw new Error('useDeal must be used inside <DealProvider>')
  return ctx
}
