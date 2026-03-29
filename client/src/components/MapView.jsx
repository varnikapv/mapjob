import { useEffect, useRef, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMap, ZoomControl } from 'react-leaflet'
import L from 'leaflet'

const DEFAULT_CENTER = [13.0827, 80.2707]
const DEFAULT_ZOOM = 12

// ── User location: pulsing red dot ──────────────────────────────────────────
const userIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:14px;height:14px">
      <div style="
        position:absolute;inset:-4px;border-radius:50%;
        background:rgba(200,68,26,.3);
        animation:pulse-ring 1.5s ease-out infinite;
      "></div>
      <div style="
        position:absolute;inset:0;border-radius:50%;
        background:#c8441a;border:2px solid #fff;
        box-shadow:0 0 6px rgba(0,0,0,.25);
      "></div>
    </div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

// ── Job marker: dark pill with employer name ────────────────────────────────
function makeJobIcon(name, isSelected) {
  const truncated = name.length > 18 ? name.slice(0, 18) + '...' : name
  const bg = isSelected ? 'var(--accent)' : 'var(--ink)'
  return L.divIcon({
    className: '',
    html: `
      <div class="jm-pin" style="--pin-bg:${bg}">
        <div class="jm-pin-label">${truncated}</div>
        <div class="jm-pin-arrow"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 38],
  })
}

// ── Fly-to sub-component ────────────────────────────────────────────────────
function FlyTo({ position, zoom }) {
  const map = useMap()
  const prev = useRef(null)
  useEffect(() => {
    if (!position) return
    const key = position.join(',')
    if (key === prev.current) return
    prev.current = key
    map.flyTo(position, zoom ?? 14, { duration: 1 })
  }, [position, zoom, map])
  return null
}

// ── Set initial view from user location ─────────────────────────────────────
function SetView({ center }) {
  const map = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (center && !done.current) {
      done.current = true
      map.flyTo(center, DEFAULT_ZOOM, { duration: 1.2 })
    }
  }, [center, map])
  return null
}

// ── Scatter jobs without coords AND spread overlapping coords ────────────────
function scatterJobs(jobs, userLat, userLng) {
  // First pass: assign coords (scatter missing ones near user)
  const withCoords = jobs.map((job) => {
    if (job.job_latitude && job.job_longitude) return job
    if (!userLat || !userLng) return null
    const angle = Math.random() * 2 * Math.PI
    const dist = Math.random() * 0.08 // ~9km spread
    return {
      ...job,
      job_latitude: userLat + dist * Math.cos(angle),
      job_longitude: userLng + dist * Math.sin(angle),
      _scattered: true,
    }
  }).filter(Boolean)

  // Second pass: spread out jobs sharing the same coordinates
  const coordCount = {}
  for (const job of withCoords) {
    const key = `${job.job_latitude.toFixed(3)},${job.job_longitude.toFixed(3)}`
    coordCount[key] = (coordCount[key] || 0) + 1
  }

  const coordIndex = {}
  return withCoords.map((job) => {
    const key = `${job.job_latitude.toFixed(3)},${job.job_longitude.toFixed(3)}`
    if (coordCount[key] <= 1) return job

    const idx = coordIndex[key] = (coordIndex[key] || 0) + 1
    const total = coordCount[key]
    const angle = (2 * Math.PI * idx) / total
    const radius = 0.005 + 0.003 * Math.floor(idx / 12) // spiral outward
    return {
      ...job,
      job_latitude: job.job_latitude + radius * Math.cos(angle),
      job_longitude: job.job_longitude + radius * Math.sin(angle),
      _scattered: true,
    }
  })
}

// ── Auto-fit map to show all job pins ─────────────────────────────────────────
function FitBounds({ plotted, userCenter }) {
  const map = useMap()
  const prevCount = useRef(0)
  useEffect(() => {
    if (plotted.length === 0 || plotted.length === prevCount.current) return
    prevCount.current = plotted.length
    const points = plotted.map((j) => [j.job_latitude, j.job_longitude])
    if (userCenter) points.push(userCenter)
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 13 })
    }
  }, [plotted, userCenter, map])
  return null
}

// ── Main component ──────────────────────────────────────────────────────────
export default function MapView({ jobs = [], selectedJob, isLoading, onJobSelect, userLat, userLng }) {
  const plotted = useMemo(() => scatterJobs(jobs, userLat, userLng), [jobs, userLat, userLng])

  const flyTarget = useMemo(() => {
    if (!selectedJob) return null
    const j = plotted.find((p) => p.job_id === selectedJob.job_id)
    return j ? [j.job_latitude, j.job_longitude] : null
  }, [selectedJob, plotted])

  const userCenter = useMemo(
    () => (userLat && userLng ? [userLat, userLng] : null),
    [userLat, userLng]
  )

  return (
    <div className="relative h-full w-full">
      {/* Job pin styles */}
      <style>{`
        .jm-pin {
          display:flex;flex-direction:column;align-items:center;
          transform:translateX(-50%);pointer-events:auto;cursor:pointer;
        }
        .jm-pin-label {
          white-space:nowrap;background:var(--pin-bg);color:#fff;
          font-family:'DM Mono',monospace;font-size:10px;font-weight:500;
          padding:3px 8px;border-radius:4px;
          box-shadow:0 2px 8px rgba(0,0,0,.18);
          transition:background .15s;
        }
        .jm-pin:hover .jm-pin-label { background:var(--accent); }
        .jm-pin-arrow {
          width:0;height:0;
          border-left:5px solid transparent;border-right:5px solid transparent;
          border-top:5px solid var(--pin-bg);transition:border-top-color .15s;
        }
        .jm-pin:hover .jm-pin-arrow { border-top-color:var(--accent); }
      `}</style>

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <ZoomControl position="bottomright" />
        <SetView center={userCenter} />
        <FlyTo position={flyTarget} />
        <FitBounds plotted={plotted} userCenter={userCenter} />

        {/* User dot */}
        {userCenter && (
          <Marker position={userCenter} icon={userIcon}>
            <Tooltip direction="top" offset={[0, -12]} className="!font-body !text-[10px]">
              You are here
            </Tooltip>
          </Marker>
        )}

        {/* Job markers */}
        {plotted.map((job) => (
          <Marker
            key={job.job_id}
            position={[job.job_latitude, job.job_longitude]}
            icon={makeJobIcon(
              job.employer_name || 'Unknown',
              selectedJob?.job_id === job.job_id
            )}
            eventHandlers={{ click: () => onJobSelect(job) }}
          />
        ))}
      </MapContainer>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-paper/60 backdrop-blur-[2px] flex items-center justify-center z-[1000]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-9 h-9 border-[3px] border-border rounded-full animate-spin" style={{ borderTopColor: 'var(--accent)' }} />
            <span className="text-xs font-body text-muted">Searching nearby jobs...</span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && jobs.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-[999] pointer-events-none">
          <div className="bg-card/95 backdrop-blur-sm rounded-xl px-8 py-6 text-center shadow-lg border border-border max-w-xs">
            <p className="font-display text-lg font-semibold text-ink">No jobs found</p>
            <p className="text-xs font-body text-muted mt-1.5 leading-relaxed">
              Try different keywords or expand your search radius.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
