import { useState, useCallback } from 'react'
import axios from 'axios'

export default function useJobs() {
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchJobs = useCallback(async (filters = {}, lat, lng) => {
    if (lat == null || lng == null) return

    setIsLoading(true)
    setError(null)
    setJobs([])

    try {
      const params = {
        keyword: filters.keyword || 'software engineer',
        lat,
        lng,
      }

      if (filters.remote) params.remote = 'true'
      if (filters.experience && filters.experience !== 'ANY') {
        params.experience = filters.experience
      }
      if (filters.salaryMin) params.salaryMin = filters.salaryMin

      // Map date posted UI values to JSearch API values
      const dateMap = { 'Past 24h': 'today', 'Past Week': 'week', 'Past Month': 'month' }
      if (filters.datePosted && dateMap[filters.datePosted]) {
        params.datePosted = dateMap[filters.datePosted]
      }

      // Map employment type booleans to JSearch comma-separated format
      const empTypes = []
      if (filters.fulltime) empTypes.push('FULLTIME')
      if (filters.parttime) empTypes.push('PARTTIME')
      if (filters.contractor) empTypes.push('CONTRACTOR')
      if (filters.intern) empTypes.push('INTERN')
      if (empTypes.length && empTypes.length < 4) {
        params.employmentType = empTypes.join(',')
      }

      const { data } = await axios.get('/api/jobs', { params })
      setJobs(Array.isArray(data) ? data : [])
    } catch (err) {
      const msg =
        err.response?.data?.error || err.message || 'Failed to fetch jobs'
      setError(msg)
      setJobs([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { jobs, isLoading, error, fetchJobs, totalCount: jobs.length }
}
