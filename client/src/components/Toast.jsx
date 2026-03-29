import { useState, useCallback, useRef, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'

const ToastCtx = createContext(null)

export function useToast() {
  return useContext(ToastCtx)
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  const showToast = useCallback((message) => {
    clearTimeout(timer.current)
    setToast({ message, leaving: false })
    timer.current = setTimeout(() => {
      setToast((t) => (t ? { ...t, leaving: true } : null))
      setTimeout(() => setToast(null), 250)
    }, 3000)
  }, [])

  return (
    <ToastCtx.Provider value={{ showToast }}>
      {children}
      {toast &&
        createPortal(
          <div
            className="fixed bottom-6 left-1/2 z-[9999] px-5 py-2.5 rounded-lg shadow-xl font-body text-xs"
            style={{
              background: 'var(--ink)',
              color: '#fff',
              animation: toast.leaving ? 'toast-out 0.25s ease forwards' : 'toast-in 0.25s ease forwards',
            }}
          >
            {toast.message}
          </div>,
          document.body
        )}
    </ToastCtx.Provider>
  )
}
