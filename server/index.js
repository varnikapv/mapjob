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
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin }));
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

    // Append experience level to query for better results
    // JSearch job_requirements only accepts: under_3_years_experience, more_than_3_years_experience, no_experience, no_degree
    const expQueryMap = { ENTRY: 'entry level', MID: 'mid level', SENIOR: 'senior', DIRECTOR: 'director' }
    const expRequirementsMap = {
      ENTRY: null, // rely on query string only — combined values cause 400
      MID: 'under_3_years_experience',
      SENIOR: 'more_than_3_years_experience',
      DIRECTOR: 'more_than_3_years_experience',
    }
    const expSuffix = (experience && expQueryMap[experience]) ? ` ${expQueryMap[experience]}` : ''
    const query = locationName
      ? `${searchTerm}${expSuffix} in ${locationName}`
      : `${searchTerm}${expSuffix}`

    const params = {
      query,
      num_pages: 1,
      page: page || 1,
    };

    if (remote === 'true') params.remote_jobs_only = true;
    if (experience && experience !== 'ANY' && expRequirementsMap[experience]) {
      params.job_requirements = expRequirementsMap[experience];
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

    // Geocode jobs missing lat/lng using their city/country from JSearch
    const cityCache = new Map();
    async function geocodeCity(city, country) {
      const key = `${city},${country}`;
      if (cityCache.has(key)) return cityCache.get(key);
      if (geoCache.has(key)) { cityCache.set(key, geoCache.get(key)); return geoCache.get(key); }
      try {
        const q = country ? `${city}, ${country}` : city;
        const r = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: { q, format: 'json', limit: 1 },
          headers: { 'User-Agent': 'JobMap/1.0' },
        });
        const result = r.data[0] ? { lat: parseFloat(r.data[0].lat), lng: parseFloat(r.data[0].lon) } : null;
        cityCache.set(key, result);
        geoCache.set(key, result);
        return result;
      } catch {
        return null;
      }
    }

    // Collect unique cities needing geocoding
    const uniqueCities = new Set();
    for (const job of jobs) {
      if (!job.job_latitude && !job.job_longitude && job.job_city) {
        uniqueCities.add(`${job.job_city},${job.job_country || ''}`);
      }
    }

    // Geocode all unique cities in parallel (Nominatim allows ~1 req/s; batch safely)
    await Promise.all([...uniqueCities].map((key) => {
      const [city, country] = key.split(',');
      return geocodeCity(city, country);
    }));

    // Attach coordinates to jobs
    jobs = await Promise.all(jobs.map(async (job) => {
      if (job.job_latitude && job.job_longitude) return job;
      if (!job.job_city) return job;
      const coords = await geocodeCity(job.job_city, job.job_country || '');
      if (!coords) return job;
      return { ...job, job_latitude: coords.lat, job_longitude: coords.lng };
    }));

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
