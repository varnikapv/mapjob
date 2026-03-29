import { useState, useEffect } from 'react'

const WORK_TYPES = ['Remote', 'On-site', 'Hybrid']
const EXP_LEVELS = ['Any', 'Entry', 'Mid', 'Senior', 'Director']
const DATE_OPTIONS = ['Any', 'Past 24h', 'Past Week', 'Past Month']
const EMP_TYPES = ['Full-time', 'Part-time', 'Contractor', 'Intern']

function Checkbox({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group" onClick={onChange}>
      <span
        className="w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors"
        style={{
          borderColor: checked ? 'var(--ink)' : 'var(--border)',
          background: checked ? 'var(--ink)' : 'transparent',
        }}
      >
        {checked && (
          <svg className="w-2 h-2 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <span className="text-xs font-body text-muted group-hover:text-ink transition-colors">{label}</span>
    </label>
  )
}

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-body font-medium uppercase tracking-widest text-muted mb-2">
      {children}
    </p>
  )
}

export default function FilterSidebar({ filters, onChange, onApply, jobCount, isMobileOpen, onMobileClose }) {
  const [local, setLocal] = useState({
    workTypes: ['Remote', 'On-site', 'Hybrid'],
    experience: 'Any',
    salaryMin: 0,
    datePosted: 'Any',
    empTypes: ['Full-time', 'Part-time', 'Contractor', 'Intern'],
  })

  // Sync from parent filters on mount
  useEffect(() => {
    if (filters) {
      setLocal((prev) => ({
        ...prev,
        workTypes: [
          ...(filters.remote !== false ? ['Remote'] : []),
          ...(filters.onsite !== false ? ['On-site'] : []),
          ...(filters.hybrid !== false ? ['Hybrid'] : []),
        ],
        experience: filters.experience || 'Any',
        salaryMin: filters.salaryMin || 0,
        datePosted: filters.datePosted || 'Any',
        empTypes: [
          ...(filters.fulltime !== false ? ['Full-time'] : []),
          ...(filters.parttime !== false ? ['Part-time'] : []),
          ...(filters.contractor !== false ? ['Contractor'] : []),
          ...(filters.intern !== false ? ['Intern'] : []),
        ],
      }))
    }
  }, [])

  function update(patch) {
    setLocal((prev) => ({ ...prev, ...patch }))
  }

  function toggleInList(key, value) {
    setLocal((prev) => {
      const list = prev[key]
      const next = list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value]
      return { ...prev, [key]: next }
    })
  }

  function handleApply() {
    const out = {
      remote: local.workTypes.includes('Remote'),
      onsite: local.workTypes.includes('On-site'),
      hybrid: local.workTypes.includes('Hybrid'),
      experience: local.experience === 'Any' ? 'ANY' : local.experience.toUpperCase(),
      salaryMin: local.salaryMin,
      datePosted: local.datePosted,
      fulltime: local.empTypes.includes('Full-time'),
      parttime: local.empTypes.includes('Part-time'),
      contractor: local.empTypes.includes('Contractor'),
      intern: local.empTypes.includes('Intern'),
    }
    onChange(out)
    onApply(out)
    onMobileClose?.()
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`
          w-[260px] shrink-0 bg-cream border-r border-border flex flex-col h-full
          custom-scroll overflow-y-auto
          fixed md:relative z-50 md:z-auto
          transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isMobileOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
          bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-auto
          md:translate-x-0 md:w-[260px]
          max-h-[70vh] md:max-h-none
          rounded-t-xl md:rounded-none
        `}
      >
        {/* Mobile handle */}
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="p-4 flex flex-col gap-4 flex-1">
          {/* Work Type */}
          <div className="pb-4 border-b border-border">
            <SectionLabel>Work Type</SectionLabel>
            <div className="flex flex-col gap-2">
              {WORK_TYPES.map((t) => (
                <Checkbox
                  key={t}
                  checked={local.workTypes.includes(t)}
                  onChange={() => toggleInList('workTypes', t)}
                  label={t}
                />
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div className="pb-4 border-b border-border">
            <SectionLabel>Experience Level</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {EXP_LEVELS.map((level) => {
                const active = local.experience === level
                return (
                  <button
                    key={level}
                    onClick={() => update({ experience: level })}
                    className="px-2.5 py-1 rounded-md text-[11px] font-body font-medium transition-colors"
                    style={{
                      background: active ? 'var(--ink)' : 'transparent',
                      color: active ? '#fff' : 'var(--muted)',
                      border: active ? 'none' : '1px solid var(--border)',
                    }}
                  >
                    {level}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Salary */}
          <div className="pb-4 border-b border-border">
            <div className="flex justify-between items-baseline mb-2">
              <SectionLabel>Min. Salary (Annual)</SectionLabel>
              <span className="text-xs font-body font-medium text-ink">
                {local.salaryMin === 0
                  ? 'Any'
                  : `₹${(local.salaryMin / 100000).toFixed(0)} LPA`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={5000000}
              step={100000}
              value={local.salaryMin}
              onChange={(e) => update({ salaryMin: Number(e.target.value) })}
              className="w-full range-slider"
            />
            <div className="flex justify-between text-[9px] font-body text-muted mt-1">
              <span>Any</span>
              <span>₹50 LPA</span>
            </div>
          </div>

          {/* Date Posted */}
          <div className="pb-4 border-b border-border">
            <SectionLabel>Date Posted</SectionLabel>
            <div className="flex flex-col gap-1.5">
              {DATE_OPTIONS.map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer group" onClick={() => update({ datePosted: opt })}>
                  <span
                    className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors"
                    style={{
                      borderColor: local.datePosted === opt ? 'var(--ink)' : 'var(--border)',
                    }}
                  >
                    {local.datePosted === opt && (
                      <span className="w-1.5 h-1.5 rounded-full bg-ink" />
                    )}
                  </span>
                  <span className="text-xs font-body text-muted group-hover:text-ink transition-colors">
                    {opt}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Employment Type */}
          <div className="pb-4">
            <SectionLabel>Employment Type</SectionLabel>
            <div className="flex flex-col gap-2">
              {EMP_TYPES.map((t) => (
                <Checkbox
                  key={t}
                  checked={local.empTypes.includes(t)}
                  onChange={() => toggleInList('empTypes', t)}
                  label={t}
                />
              ))}
            </div>
          </div>

          {/* Apply button */}
          <button
            onClick={handleApply}
            className="w-full py-2 rounded-md bg-ink text-white text-xs font-body font-medium hover:bg-accent transition-colors active:scale-[0.98]"
          >
            Apply Filters
          </button>

          {/* Result count */}
          <p className="text-center text-[10px] font-body text-muted -mt-1">
            Showing {jobCount} job{jobCount !== 1 ? 's' : ''}
          </p>
        </div>
      </aside>
    </>
  )
}
