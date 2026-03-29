# JobMap

A location-based job discovery app. Open the map, see job pins near you, filter by keyword, salary, experience level, and radius, then click to apply.

## Setup

### 1. Install dependencies
```bash
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

### 2. Add your API key
Get a free JSearch API key from [RapidAPI](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch).

Edit `server/.env`:
```
RAPIDAPI_KEY=your_actual_key_here
PORT=3001
```

### 3. Run
```bash
npm run dev
```

Opens:
- Frontend → http://localhost:5173
- Backend → http://localhost:3001

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Tailwind CSS |
| Map | Leaflet.js + react-leaflet (CartoDB tiles) |
| Jobs API | JSearch via RapidAPI |
| Backend | Node.js + Express |
| Geocoding | OpenStreetMap Nominatim (free) |
| Fonts | Fraunces (serif), DM Mono (mono) |

## Features

- Browser geolocation with fallback to Chennai
- Real-time job pins on interactive map
- Filters: keyword, work type, experience, salary, radius, date, employment type
- Slide-in job detail panel with Apply Now
- Bookmark jobs
- Toast notifications
- Mobile responsive (sidebar as bottom drawer)
- Editorial design with sepia map tiles

## Project Structure

```
jobmap/
├── client/src/
│   ├── components/   MapView, FilterSidebar, JobPanel, Header, Toast
│   ├── hooks/        useGeolocation, useJobs
│   ├── App.jsx       Main layout and state
│   └── index.css     Design tokens and global styles
├── server/
│   └── index.js      Express API proxy
└── CLAUDE.md         AI development context
```
