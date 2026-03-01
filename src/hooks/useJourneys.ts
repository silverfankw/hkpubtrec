import { useState, useEffect } from 'react'
import type { Journey } from '../types'
import { STORAGE_KEY, loadJourneysFromStorage } from '../utils'

export function useJourneys() {
  const [journeys, setJourneys] = useState<Journey[]>(loadJourneysFromStorage)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(journeys))
    } catch (error) {
      console.error('Failed to save journeys to storage', error)
    }
  }, [journeys])

  const addJourney = (journey: Journey) => {
    setJourneys((prev) => [...prev, journey])
  }

  const removeJourney = (journeyId: string) => {
    setJourneys((prev) => prev.filter((j) => j.id !== journeyId))
  }

  const clearAll = () => {
    if (!journeys.length) return
    const confirmed = window.confirm('Clear all recorded journeys? This cannot be undone.')
    if (!confirmed) return
    setJourneys([])
  }

  const importJourneys = (newJourneys: Journey[]) => {
    setJourneys((prev) => [...prev, ...newJourneys])
  }

  return { journeys, addJourney, removeJourney, clearAll, importJourneys }
}
