import { useState, useCallback } from 'react'

const BM_KEY = 'jobmap-bookmarks'
const AP_KEY = 'jobmap-applied'

function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {} } catch { return {} }
}
function persist(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

export default function useBookmarks() {
  // both store full job objects keyed by job_id
  const [bookmarks, setBookmarks] = useState(() => load(BM_KEY))
  const [applied, setApplied] = useState(() => load(AP_KEY))

  const toggleBookmark = useCallback((job) => {
    setBookmarks(prev => {
      const next = { ...prev }
      if (next[job.job_id]) delete next[job.job_id]
      else next[job.job_id] = job
      persist(BM_KEY, next)
      return next
    })
  }, [])

  const toggleApplied = useCallback((job) => {
    setApplied(prev => {
      const next = { ...prev }
      if (next[job.job_id]) delete next[job.job_id]
      else next[job.job_id] = job
      persist(AP_KEY, next)
      return next
    })
  }, [])

  return { bookmarks, applied, toggleBookmark, toggleApplied }
}
