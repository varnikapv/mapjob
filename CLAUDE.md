# JobMap — Project Context

## What it does
Location-based job discovery app. Users see an interactive map with job listing pins near their location, filter by keyword/type/salary/radius, click a pin for details, and apply directly.

## How to run
```bash
npm run dev        # starts both client (:5173) and server (:3001) via concurrently
```

## Environment variables
`server/.env` requires:
- `RAPIDAPI_KEY` — get a free key at https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
- `PORT` — defaults to 3001

## Tech stack
- Frontend: React 18 + Vite + Tailwind CSS
- Map: Leaflet.js + react-leaflet (CartoDB Light tiles)
- Backend: Express (proxies JSearch API, Nominatim geocoding)
- Fonts: Fraunces (display), DM Mono (body)

## Component tree
```
App (ToastProvider)
├── Header          — logo, search input, job count, location button
├── FilterSidebar   — work type, experience, salary, radius, date, employment type
├── MapView         — Leaflet map, job pins, user dot, loading/empty states
├── JobPanel        — slide-in detail panel with apply button and bookmark
└── Toast           — global toast system via useToast()
```

## Custom hooks
- `useGeolocation` — browser geolocation with Chennai fallback + retrigger()
- `useJobs` — fetches from /api/jobs, exposes jobs[], isLoading, error

## Design tokens
Colors: ink (#0f0e0c), paper (#f5f0e8), cream (#ede8dc), accent (#c8441a), accent2 (#2a5f4f), gold (#d4a843), muted (#7a7268)

## API routes
- `GET /api/jobs?keyword&lat&lng&radius&remote&experience&salaryMin` — proxies JSearch
- `GET /api/geocode?city` — Nominatim city→lat/lng

## Notes
- Vite proxies /api to localhost:3001 in dev mode
- Jobs without lat/lng are scattered randomly near user location
- Map tiles have CSS sepia(15%) filter for editorial aesthetic
- Mobile: sidebar becomes bottom drawer, filter toggle button bottom-left
