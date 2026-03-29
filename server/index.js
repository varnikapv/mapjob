import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Cache reverse-geocode results (rounded to ~1km precision) to avoid repeat Nominatim calls
const geoCache = new Map();

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// ─── GET /api/jobs ──────────────────────────────────────────────────────────
app.get('/api/jobs', async (req, res) => {
  try {
    const { keyword, lat, lng, remote, experience, salaryMin, page, datePosted, employmentType } = req.query;

    if (!process.env.RAPIDAPI_KEY || process.env.RAPIDAPI_KEY === 'your_rapidapi_key_here') {
      return res.status(500).json({ error: 'RAPIDAPI_KEY not configured. Get one at https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch' });
    }

    // Reverse-geocode coords to city name — cached by rounded coords (~1km precision)
    let locationName = '';
    if (lat && lng) {
      const cacheKey = `${Number(lat).toFixed(2)},${Number(lng).toFixed(2)}`;
      if (geoCache.has(cacheKey)) {
        locationName = geoCache.get(cacheKey);
      } else {
        try {
          const geoRes = await axios.get('https://nominatim.openstreetmap.org/reverse', {
            params: { lat, lon: lng, format: 'json', zoom: 10 },
            headers: { 'User-Agent': 'JobMap/1.0' },
          });
          const addr = geoRes.data?.address;
          locationName = addr?.city || addr?.town || addr?.state || '';
          geoCache.set(cacheKey, locationName);
        } catch (_) {
          // Fall back to coordinate-based query
        }
      }
    }

    const searchTerm = keyword || 'software engineer';
    const query = locationName
      ? `${searchTerm} in ${locationName}`
      : searchTerm;

    const params = {
      query,
      num_pages: 1,
      page: page || 1,
    };

    if (remote === 'true') params.remote_jobs_only = true;
    if (experience && experience !== 'ANY') {
      params.job_requirements = experience.toLowerCase() + '_level';
    }
    if (datePosted) params.date_posted = datePosted;
    if (employmentType) params.employment_types = employmentType;

    const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
      params,
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
      },
    });

    let jobs = response.data.data || [];

    // Filter by minimum salary server-side (JSearch doesn't support salary filtering)
    if (salaryMin && Number(salaryMin) > 0) {
      const min = Number(salaryMin);
      jobs = jobs.filter((job) => {
        if (!job.job_min_salary && !job.job_max_salary) return true;
        const jobSalary = job.job_max_salary || job.job_min_salary || 0;
        return jobSalary >= min;
      });
    }

    res.json(jobs);
  } catch (err) {
    console.error('Jobs API error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.message || err.message });
  }
});

// ─── GET /api/geocode ───────────────────────────────────────────────────────
app.get('/api/geocode', async (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({ error: 'city query parameter is required' });
    }

    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: city, format: 'json', limit: 1 },
      headers: { 'User-Agent': 'JobMap/1.0' },
    });

    if (!response.data.length) {
      return res.status(404).json({ error: `City not found: "${city}"` });
    }

    const place = response.data[0];
    res.json({
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      displayName: place.display_name,
    });
  } catch (err) {
    console.error('Geocode error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`JobMap server running → http://localhost:${PORT}`);
});
