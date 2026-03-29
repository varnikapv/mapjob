import { useState, useRef, useEffect } from 'react'

export default function Header({ keyword, onKeywordChange, onSearch, jobCount, onUseLocation, savedCount, onOpenSaved, appliedCount, onOpenApplied, onCitySearch, currentCity }) {
  const [cityOpen, setCityOpen] = useState(false)
  const [cityInput, setCityInput] = useState('')
  const cityRef = useRef(null)

  useEffect(() => {
    if (!cityOpen) return
    function handleClick(e) {
      if (cityRef.current && !cityRef.current.contains(e.target)) setCityOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [cityOpen])

  function submitCity() {
    if (!cityInput.trim()) return
    onCitySearch(cityInput.trim())
    setCityInput('')
    setCityOpen(false)
  }

  return (
    <header className="h-14 shrink-0 bg-ink flex items-center px-4 gap-4 z-30 border-b-2 border-accent">
      {/* Logo */}
      <div className="shrink-0 font-display font-black text-xl tracking-tight select-none">
        <span className="text-white">Job</span>
        <span className="text-accent">Map</span>
      </div>

      {/* Search bar */}
      <div className="flex-1 max-w-xl flex gap-2">
        <input
          type="text"
          placeholder="e.g. React developer, Data Analyst..."
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          className="flex-1 rounded-md bg-white/10 border border-white/10 px-3 py-1.5 text-sm font-body text-white placeholder-white/40 outline-none focus:border-accent transition-colors"
        />
        <button
          onClick={onSearch}
          className="px-4 py-1.5 rounded-md bg-accent text-white text-sm font-body font-medium hover:brightness-110 active:scale-[0.97] transition-all"
        >
          Search
        </button>
      </div>

      {/* Job count badge */}
      <div className="shrink-0 bg-accent2 text-white text-xs font-body font-medium px-3 py-1 rounded-full hidden sm:block">
        {jobCount} job{jobCount !== 1 ? 's' : ''} found
      </div>

      {/* Saved jobs button */}
      <button
        onClick={onOpenSaved}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 text-white text-xs font-body hover:bg-white/15 transition-colors"
      >
        <span>♥</span>
        <span className="hidden sm:inline">Saved</span>
        {savedCount > 0 && (
          <span className="min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[9px] flex items-center justify-center font-medium">
            {savedCount}
          </span>
        )}
      </button>

      {/* Applied jobs button */}
      <button
        onClick={onOpenApplied}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 text-white text-xs font-body hover:bg-white/15 transition-colors"
      >
        <span>✓</span>
        <span className="hidden sm:inline">Applied</span>
        {appliedCount > 0 && (
          <span className="min-w-[16px] h-4 px-1 rounded-full bg-accent2 text-white text-[9px] flex items-center justify-center font-medium">
            {appliedCount}
          </span>
        )}
      </button>

      {/* City picker */}
      <div className="relative shrink-0" ref={cityRef}>
        <button
          onClick={() => setCityOpen((o) => !o)}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-accent hover:bg-white/15 transition-colors"
          title="Search by city"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
        </button>

        {cityOpen && (
          <div className="absolute right-0 top-10 w-60 bg-white rounded-xl shadow-xl border border-border p-3 flex flex-col gap-2 z-50">
            {currentCity && (
              <p className="text-[10px] font-body text-muted px-1">
                Currently: <span className="text-ink font-medium">{currentCity}</span>
              </p>
            )}
            <input
              autoFocus
              type="text"
              placeholder="e.g. Bangalore, Mumbai..."
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitCity()}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-body text-ink outline-none focus:border-accent transition-colors"
            />
            <button
              onClick={submitCity}
              className="rounded-lg bg-accent text-white text-xs font-body py-1.5 hover:brightness-110 transition-all"
            >
              Search this city
            </button>
            <button
              onClick={() => { onUseLocation(); setCityOpen(false) }}
              className="rounded-lg bg-cream text-ink text-xs font-body py-1.5 hover:bg-border transition-all"
            >
              Use my location
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
