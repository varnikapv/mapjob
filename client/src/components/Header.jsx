export default function Header({ keyword, onKeywordChange, onSearch, jobCount, onUseLocation }) {
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

      {/* Use my location */}
      <button
        onClick={onUseLocation}
        className="shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-accent hover:bg-white/15 transition-colors"
        title="Use my location"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      </button>
    </header>
  )
}
