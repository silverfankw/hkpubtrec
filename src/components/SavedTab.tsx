import { useState, useMemo } from 'react'
import type { Journey, RouteListEntry, Language } from '../types'
import type { TranslationKeys } from '../constants/translations'
import { JourneyTable } from './JourneyTable'
import { JourneyDetail } from './JourneyDetail'

type Props = {
  journeys: Journey[]
  routeEntries: RouteListEntry[]
  language: Language
  t: TranslationKeys
  onRemoveJourney: (journeyId: string) => void
}

export function SavedTab({ journeys, routeEntries, language, t, onRemoveJourney }: Props) {
  const [filterRoute, setFilterRoute] = useState('')
  const [filterBound, setFilterBound] = useState('')
  const [dateSortDir, setDateSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null)

  const visibleJourneys = useMemo(() => {
    const routeFilter = filterRoute.trim().toLowerCase()
    const boundFilter = filterBound.trim().toLowerCase()

    const filtered = journeys.filter((journey) => {
      const matchesRoute = routeFilter
        ? journey.route.toLowerCase().includes(routeFilter)
        : true
      const matchesBound = boundFilter
        ? journey.bound.toLowerCase().includes(boundFilter)
        : true
      return matchesRoute && matchesBound
    })

    return [...filtered].sort((a, b) => {
      const dateCmp =
        dateSortDir === 'desc'
          ? b.date.localeCompare(a.date)
          : a.date.localeCompare(b.date)
      if (dateCmp !== 0) return dateCmp
      return b.id.localeCompare(a.id)
    })
  }, [journeys, filterRoute, filterBound, dateSortDir])

  const handleRemoveJourney = (journeyId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const confirmed = window.confirm(t.removeJourneyConfirm)
    if (!confirmed) return
    onRemoveJourney(journeyId)
    setSelectedJourneyId((prev) => (prev === journeyId ? null : prev))
  }

  const selectedJourney = selectedJourneyId
    ? visibleJourneys.find((j) => j.id === selectedJourneyId)
    : null

  return (
    <section className="panel">
      <div className="filters">
        <div className="form-field">
          <label htmlFor="filterRoute">{t.filterByRoute}</label>
          <input
            id="filterRoute"
            type="text"
            placeholder={t.filterRoutePlaceholder}
            value={filterRoute}
            onChange={(event) => setFilterRoute(event.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="filterBound">{t.filterByBound}</label>
          <input
            id="filterBound"
            type="text"
            placeholder={t.filterBoundPlaceholder}
            value={filterBound}
            onChange={(event) => setFilterBound(event.target.value)}
          />
        </div>
      </div>

      {visibleJourneys.length === 0 ? (
        <p className="empty-state">{t.noJourneys}</p>
      ) : (
        <>
          <JourneyTable
            journeys={visibleJourneys}
            routeEntries={routeEntries}
            selectedJourneyId={selectedJourneyId}
            dateSortDir={dateSortDir}
            onToggleSort={() => setDateSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
            onSelectJourney={setSelectedJourneyId}
            onRemoveJourney={handleRemoveJourney}
            language={language}
            t={t}
          />

          {selectedJourney && (
            <JourneyDetail
              journey={selectedJourney}
              routeEntries={routeEntries}
              language={language}
              t={t}
            />
          )}
        </>
      )}
    </section>
  )
}
