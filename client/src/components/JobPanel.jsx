import { useState, useEffect, useRef, useCallback } from 'react'
import { useToast } from './Toast'

const LS_KEY = 'jobpanel-size'
const BOOKMARKS_KEY = 'jobmap-bookmarks'

function getBookmarks() {
  try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY)) || {} } catch { return {} }
}
function setBookmarks(bm) {
  try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bm)) } catch {}
}
const DEFAULT_SIZE = { width: 400, height: null, top: 0 } // height null = full container height
const MIN_W = 280
const MAX_W = 860
const MIN_H = 240

function clamp(val, min, max) { return Math.min(max, Math.max(min, val)) }

function Tag({ children, borderColor }) {
  return (
    <span
      className="text-[10px] font-body font-medium px-2 py-0.5 rounded-full border"
      style={{ borderColor, color: borderColor }}
    >
      {children}
    </span>
  )
}

// Cursor style per resize direction
const CURSORS = {
  n: 'ns-resize', s: 'ns-resize',
  e: 'ew-resize', w: 'ew-resize',
  ne: 'nesw-resize', sw: 'nesw-resize',
  nw: 'nwse-resize', se: 'nwse-resize',
}

function ResizeHandle({ dir, onMouseDown }) {
  const isCorner = dir.length === 2
  const style = {
    position: 'absolute',
    cursor: CURSORS[dir],
    zIndex: 10,
  }

  if (isCorner) {
    const size = 14
    if (dir === 'nw') { style.top = 0; style.left = 0; style.width = size; style.height = size }
    if (dir === 'ne') { style.top = 0; style.right = 0; style.width = size; style.height = size }
    if (dir === 'sw') { style.bottom = 0; style.left = 0; style.width = size; style.height = size }
    if (dir === 'se') { style.bottom = 0; style.right = 0; style.width = size; style.height = size }
  } else {
    const thickness = 6
    if (dir === 'n') { style.top = 0; style.left = 0; style.right = 0; style.height = thickness }
    if (dir === 's') { style.bottom = 0; style.left = 0; style.right = 0; style.height = thickness }
    if (dir === 'w') { style.top = 0; style.left = 0; style.bottom = 0; style.width = thickness }
    if (dir === 'e') { style.top = 0; style.right = 0; style.bottom = 0; style.width = thickness }
  }

  return (
    <div
      style={style}
      onMouseDown={(e) => onMouseDown(e, dir)}
    />
  )
}

export default function JobPanel({ job, onClose }) {
  const [bookmarked, setBookmarked] = useState(() => !!getBookmarks()[job?.job_id])
  const { showToast } = useToast()
  const panelRef = useRef(null)

  // Persisted size
  const [size, setSize] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY))
      return saved || DEFAULT_SIZE
    } catch { return DEFAULT_SIZE }
  })

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(size)) } catch {}
  }, [size])

  // Sync bookmark state when job changes
  useEffect(() => { setBookmarked(!!getBookmarks()[job?.job_id]) }, [job?.job_id])

  // Escape key closes panel
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    if (job) {
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
  }, [job, onClose])

  function handleBookmark() {
    const next = !bookmarked
    setBookmarked(next)
    const bm = getBookmarks()
    if (next) bm[job.job_id] = true
    else delete bm[job.job_id]
    setBookmarks(bm)
    showToast(next ? 'Saved ♥' : 'Removed from saved')
  }

  // Resize drag logic
  const startResize = useCallback((e, dir) => {
    e.preventDefault()
    const el = panelRef.current
    if (!el) return

    const startX = e.clientX
    const startY = e.clientY
    const startW = el.offsetWidth
    const startH = el.offsetHeight
    const container = el.parentElement
    const containerH = container ? container.offsetHeight : window.innerHeight
    const startTop = el.offsetTop

    document.body.style.cursor = CURSORS[dir]
    document.body.style.userSelect = 'none'

    function onMove(e) {
      const dx = e.clientX - startX
      const dy = e.clientY - startY

      setSize(prev => {
        let { width, height, top } = prev
        const currentH = height ?? containerH

        if (dir.includes('w')) width = clamp(startW - dx, MIN_W, MAX_W)
        if (dir.includes('e')) width = clamp(startW + dx, MIN_W, MAX_W)

        if (dir.includes('n')) {
          const newTop = clamp(startTop + dy, 0, startTop + currentH - MIN_H)
          const newH = clamp(currentH - dy + (startTop - newTop), MIN_H, containerH)
          top = newTop
          height = newH
        }

        if (dir.includes('s')) {
          height = clamp(startH + dy, MIN_H, containerH - startTop)
        }

        return { width, height, top }
      })
    }

    function onUp() {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  // Description
  const desc = job?.job_description || ''
  const isTruncated = desc.length > 600
  const [expanded, setExpanded] = useState(false)
  useEffect(() => setExpanded(false), [job?.job_id])
  const displayDesc = expanded ? desc : desc.slice(0, 600)

  // Metadata
  const expMonths = job?.job_required_experience?.required_experience_in_months
  const expLabel = expMonths ? `${Math.round(expMonths / 12)}+ yrs` : null
  const hasSalary = job?.job_min_salary || job?.job_max_salary
  const salaryLabel = hasSalary
    ? [
        job.job_min_salary && `₹${Number(job.job_min_salary).toLocaleString('en-IN')}`,
        job.job_max_salary && `₹${Number(job.job_max_salary).toLocaleString('en-IN')}`,
      ].filter(Boolean).join(' – ')
    : null
  const posted = job?.job_posted_at_datetime_utc
    ? new Date(job.job_posted_at_datetime_utc).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : null

  if (!job) return null

  const panelStyle = {
    position: 'absolute',
    right: 0,
    top: size.top ?? 0,
    width: size.width,
    height: size.height ?? undefined,
    bottom: size.height ? undefined : 0,
    zIndex: 20,
    display: 'flex',
    flexDirection: 'column',
  }

  return (
    // Slide-in wrapper
    <div
      ref={panelRef}
      style={panelStyle}
      className="bg-card border-l border-border shadow-xl overflow-hidden"
    >
      {/* Resize handles — all 4 edges + 4 corners */}
      {['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'].map(dir => (
        <ResizeHandle key={dir} dir={dir} onMouseDown={startResize} />
      ))}

      {/* Panel header */}
      <div className="p-5 pb-4 bg-cream border-b border-border relative shrink-0">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-paper flex items-center justify-center text-muted hover:text-ink transition-colors text-sm"
        >
          &times;
        </button>

        <div className="flex items-center gap-3 mb-3">
          {job.employer_logo ? (
            <img
              src={job.employer_logo}
              alt=""
              className="w-10 h-10 rounded-lg object-contain bg-white border border-border"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-paper border border-border flex items-center justify-center text-muted font-body text-xs">
              {(job.employer_name || '?')[0]}
            </div>
          )}
          <p className="text-[10px] font-body font-medium uppercase tracking-widest text-accent">
            {job.employer_name || 'Unknown'}
          </p>
        </div>

        <h2 className="font-display text-xl font-semibold text-ink leading-snug pr-8">
          {job.job_title || 'Untitled Position'}
        </h2>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {job.job_is_remote && <Tag borderColor="var(--accent2)">Remote</Tag>}
          {job.job_employment_type && (
            <Tag borderColor="var(--border)">
              {job.job_employment_type.replace(/_/g, ' ')}
            </Tag>
          )}
          {salaryLabel && <Tag borderColor="var(--gold)">{salaryLabel}</Tag>}
          {expLabel && <Tag borderColor="var(--border)">{expLabel}</Tag>}
        </div>
      </div>

      {/* Panel body */}
      <div className="flex-1 overflow-y-auto custom-scroll p-5">
        <p className="text-[10px] font-body font-medium uppercase tracking-widest text-muted mb-2">
          Overview
        </p>
        <div className="bg-cream rounded-lg p-3 text-xs font-body text-ink space-y-1.5 mb-5">
          {(job.job_city || job.job_country) && (
            <div className="flex justify-between">
              <span className="text-muted">Location</span>
              <span>{[job.job_city, job.job_state, job.job_country].filter(Boolean).join(', ')}</span>
            </div>
          )}
          {posted && (
            <div className="flex justify-between">
              <span className="text-muted">Posted</span>
              <span>{posted}</span>
            </div>
          )}
          {job.job_publisher && (
            <div className="flex justify-between">
              <span className="text-muted">Source</span>
              <span>{job.job_publisher}</span>
            </div>
          )}
          {job.job_benefits?.length > 0 && (
            <div className="flex justify-between">
              <span className="text-muted">Benefits</span>
              <span className="text-right max-w-[180px]">{job.job_benefits.slice(0, 2).join(', ')}</span>
            </div>
          )}
        </div>

        {desc && (
          <>
            <p className="text-[10px] font-body font-medium uppercase tracking-widest text-muted mb-2">
              Description
            </p>
            <p className="text-[11px] font-body text-muted leading-[1.7] whitespace-pre-line">
              {displayDesc}
              {isTruncated && !expanded && '...'}
            </p>
            {isTruncated && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="text-[10px] font-body text-accent hover:underline mt-1"
              >
                {expanded ? 'Show less' : 'Read full description'}
              </button>
            )}
          </>
        )}

        {!desc && (
          <p className="text-xs font-body text-muted italic">No description available.</p>
        )}
      </div>

      {/* Panel footer */}
      <div className="p-4 border-t border-border flex gap-2 shrink-0">
        <a
          href={job.job_apply_link || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 text-center py-2.5 rounded-md text-xs font-body font-medium text-white transition-all hover:brightness-110 active:scale-[0.98] ${
            job.job_apply_link ? 'bg-accent' : 'bg-muted pointer-events-none'
          }`}
        >
          {job.job_apply_link ? 'Apply Now →' : 'Apply on company site'}
        </a>
        <button
          onClick={handleBookmark}
          className="w-10 h-10 rounded-md border border-border flex items-center justify-center text-lg hover:border-accent transition-colors"
        >
          {bookmarked ? '♥' : '♡'}
        </button>
      </div>
    </div>
  )
}
