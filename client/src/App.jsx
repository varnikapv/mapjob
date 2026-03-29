import { useState, useEffect, useCallback } from 'react'
import { ToastProvider, useToast } from './components/Toast'
import Header from './components/Header'
import FilterSidebar from './components/FilterSidebar'
import MapView from './components/MapView'
import JobPanel from './components/JobPanel'
import SavedDrawer from './components/SavedDrawer'
import useGeolocation from './hooks/useGeolocation'
import useJobs from './hooks/useJobs'
import useBookmarks from './hooks/useBookmarks'

function AppInner() {
  const geo = useGeolocation()
  const { jobs, isLoading, error, fetchJobs, totalCount } = useJobs()
  const { bookmarks, applied, toggleBookmark, toggleApplied } = useBookmarks()
  const { showToast } = useToast()

  const [selectedJob, setSelectedJob] = useState(null)
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false)
  const [appliedDrawerOpen, setAppliedDrawerOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [filters, setFilters] = useState({
    keyword: '',
    remote: true,
    onsite: true,
    hybrid: true,
    experience: 'ANY',
    salaryMin: 0,
    datePosted: 'Any',
    fulltime: true,
    parttime: true,
    contractor: true,
    intern: true,
  })
  const [mobileFilters, setMobileFilters] = useState(false)

  useEffect(() => {
    if (error) showToast(error)
  }, [error, showToast])

  const [firstLoad, setFirstLoad] = useState(true)
  const [cityOverride, setCityOverride] = useState(null) // { lat, lng, name }

  const effectiveLat = cityOverride?.lat ?? geo.lat
  const effectiveLng = cityOverride?.lng ?? geo.lng
  const currentCity = cityOverride?.name ?? (geo.status === 'default' ? 'Chennai (default)' : null)

  const showDefaultBanner = !cityOverride && geo.status === 'default'

  const doSearch = useCallback((overrides, lat, lng) => {
    const merged = { ...filters, ...overrides, keyword: overrides?.keyword ?? keyword ?? '' }
    setFirstLoad(false)
    fetchJobs(merged, lat ?? effectiveLat, lng ?? effectiveLng)
  }, [filters, keyword, effectiveLat, effectiveLng, fetchJobs])

  async function handleCitySearch(cityName) {
    try {
      const apiBase = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${apiBase}/api/geocode?city=${encodeURIComponent(cityName)}`)
      if (!res.ok) { showToast(`City not found: "${cityName}"`); return }
      const { lat, lng } = await res.json()
      setCityOverride({ lat, lng, name: cityName })
      setFirstLoad(false)
      fetchJobs({ ...filters, keyword: keyword || '' }, lat, lng)
    } catch {
      showToast('Could not geocode city. Try again.')
    }
  }

  function handleFilterChange(updated) {
    setFilters((prev) => ({ ...prev, ...updated }))
  }

  function handleApply(appliedFilters) {
    doSearch(appliedFilters)
  }

  function handleJobSelect(job) {
    setSelectedJob(job)
    setSavedDrawerOpen(false)
    setAppliedDrawerOpen(false)
  }

  function handleClosePanel() {
    setSelectedJob(null)
  }

  function handleOpenSaved() {
    setSavedDrawerOpen(true)
    setAppliedDrawerOpen(false)
    setSelectedJob(null)
  }

  function handleOpenApplied() {
    setAppliedDrawerOpen(true)
    setSavedDrawerOpen(false)
    setSelectedJob(null)
  }

  const savedCount = Object.keys(bookmarks).length
  const appliedCount = Object.keys(applied).length

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-paper">
      <Header
        keyword={keyword}
        onKeywordChange={setKeyword}
        onSearch={doSearch}
        jobCount={totalCount}
        onUseLocation={() => { setCityOverride(null); geo.retrigger() }}
        savedCount={savedCount}
        onOpenSaved={handleOpenSaved}
        appliedCount={appliedCount}
        onOpenApplied={handleOpenApplied}
        onCitySearch={handleCitySearch}
        currentCity={currentCity}
      />

      {/* Default location banner */}
      {showDefaultBanner && (
        <div className="bg-cream border-b border-border px-4 py-1.5 text-[10px] font-body text-muted text-center">
          Using default location: Chennai. Click
          <button onClick={geo.retrigger} className="text-accent underline mx-1">
            Use my location
          </button>
          to update.
        </div>
      )}

      {/* API key missing banner */}
      {error && error.includes('RAPIDAPI_KEY') && (
        <div className="bg-accent/10 border-b border-accent/20 px-4 py-2 text-[11px] font-body text-accent text-center">
          API key not configured. Get a free key at{' '}
          <a
            href="https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium"
          >
            RapidAPI JSearch
          </a>{' '}
          and add it to <code className="bg-cream px-1 rounded">server/.env</code>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile filter toggle */}
        <button
          onClick={() => setMobileFilters((o) => !o)}
          className="md:hidden fixed bottom-4 left-4 z-50 w-11 h-11 rounded-full bg-ink text-white flex items-center justify-center shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M3 12h12M3 20h6" />
          </svg>
        </button>

        <FilterSidebar
          filters={filters}
          onChange={handleFilterChange}
          onApply={handleApply}
          jobCount={totalCount}
          isMobileOpen={mobileFilters}
          onMobileClose={() => setMobileFilters(false)}
        />

        <MapView
          jobs={jobs}
          selectedJob={selectedJob}
          isLoading={isLoading}
          onJobSelect={handleJobSelect}
          userLat={effectiveLat}
          userLng={effectiveLng}
          applied={applied}
          firstLoad={firstLoad}
          onFirstSearch={(role) => { setKeyword(role); doSearch({ keyword: role }) }}
        />

        <JobPanel
          job={selectedJob}
          onClose={handleClosePanel}
          isBookmarked={!!bookmarks[selectedJob?.job_id]}
          isApplied={!!applied[selectedJob?.job_id]}
          onBookmark={toggleBookmark}
          onApplied={toggleApplied}
        />

        {savedDrawerOpen && (
          <SavedDrawer
            title="Saved Jobs"
            jobs={Object.values(bookmarks)}
            badgeLabel={(job) => applied[job.job_id] ? '✓ Applied' : null}
            emptyIcon="♡"
            emptyText={{ title: 'No saved jobs yet', body: 'Click the ♡ on any job to save it here.' }}
            onJobSelect={handleJobSelect}
            onRemove={toggleBookmark}
            removeLabel="Remove"
            onClose={() => setSavedDrawerOpen(false)}
          />
        )}

        {appliedDrawerOpen && (
          <SavedDrawer
            title="Applied Jobs"
            jobs={Object.values(applied)}
            badgeLabel={(job) => bookmarks[job.job_id] ? '♥ Saved' : null}
            emptyIcon="✓"
            emptyText={{ title: 'No applications yet', body: 'Click "Applied?" on any job to track it here.' }}
            onJobSelect={handleJobSelect}
            onRemove={toggleApplied}
            removeLabel="Unmark"
            onClose={() => setAppliedDrawerOpen(false)}
          />
        )}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  )
}
