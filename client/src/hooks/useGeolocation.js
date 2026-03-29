import { useState, useCallback, useEffect, useRef } from 'react'

const DEFAULT = { lat: 13.0827, lng: 80.2707 } // Chennai

export default function useGeolocation() {
  const [position, setPosition] = useState({ ...DEFAULT, status: 'pending' })
  const attempted = useRef(false)

  const detect = useCallback(() => {
    if (!navigator.geolocation) {
      setPosition({ ...DEFAULT, status: 'default' })
      return
    }

    setPosition((prev) => ({ ...prev, status: 'pending' }))

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          status: 'detected',
        })
      },
      () => {
        setPosition({ ...DEFAULT, status: 'default' })
      },
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }, [])

  useEffect(() => {
    if (!attempted.current) {
      attempted.current = true
      detect()
    }
  }, [detect])

  return { ...position, retrigger: detect }
}
