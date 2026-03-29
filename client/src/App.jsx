import { useState, useEffect, useRef, useCallback } from 'react'
import { ToastProvider, useToast } from './components/Toast'
import Header from './components/Header'
import FilterSidebar from './components/FilterSidebar'
import MapView from './components/MapView'
import JobPanel from './components/JobPanel'
import useGeolocation from './hooks/useGeolocation'
import useJobs from './hooks/useJobs'

function AppInner() {
  const geo = useGeolocation()
  const { jobs, isLoading, error, fetchJobs, totalCount } = useJobs()
  const { showToast } = useToast()

  const [selectedJob, setSelectedJob] = useState(null)
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

  // Show errors as toasts
  useEffect(() => {
    if (error) showToast(error)
  }, [error, showToast])

  // Auto-fetch when location first resolves
  const hasFetched = useRef(false)
  useEffect(() => {
    if (geo.status !== 'pending' && !hasFetched.current) {
      hasFetched.current = true
      fetchJobs({ ...filters, keyword: 'software engineer' }, geo.lat, geo.lng)
    }
  }, [geo.status])

  // Geolocation status banner
  const showDefaultBanner = geo.status === 'default'

  const doSearch = useCallback((overrides) => {
    const merged = { ...filters, ...overrides, keyword: keyword || 'software engineer' }
    fetchJobs(merged, geo.lat, geo.lng)
  }, [filters, keyword, geo.lat, geo.lng, fetchJobs])

  function handleFilterChange(updated) {
    setFilters((prev) => ({ ...prev, ...updated }))
  }

  function handleApply(appliedFilters) {
    doSearch(appliedFilters)
  }

  function handleJobSelect(job) {
    setSelectedJob(job)
  }

  function handleClosePanel() {
    setSelectedJob(null)
  }

  // Count jobs with coordinates (+ scattered ones)
  const jobCount = totalCount

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-paper">
      <Header
        keyword={keyword}
        onKeywordChange={setKeyword}
        onSearch={doSearch}
        jobCount={jobCount}
        onUseLocation={geo.retrigger}
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
          jobCount={jobCount}
          isMobileOpen={mobileFilters}
          onMobileClose={() => setMobileFilters(false)}
        />

        <MapView
          jobs={jobs}
          selectedJob={selectedJob}
          isLoading={isLoading}
          onJobSelect={handleJobSelect}
          userLat={geo.lat}
          userLng={geo.lng}
        />

        {/* JobPanel floats absolutely over the map */}
        <JobPanel job={selectedJob} onClose={handleClosePanel} />
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
