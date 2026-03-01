import { useState, useMemo, useRef } from 'react'
import type { Journey, RouteListEntry, Language } from '../types'
import type { TranslationKeys } from '../constants/translations'
import { exportJourneyToJson, exportAllJourneysToJson, downloadJsonFile, importJourneysFromJson } from '../utils'
import { JourneyTable } from './JourneyTable'
import { JourneyDetail } from './JourneyDetail'
import './SavedTab.css'


type Props = {
  journeys: Journey[]
  routeEntries: RouteListEntry[]
  language: Language
  t: TranslationKeys
  onRemoveJourney: (journeyId: string) => void
  onClearAll: () => void
  onImportJourneys: (newJourneys: Journey[]) => void
}

export function SavedTab({ journeys, routeEntries, language, t, onRemoveJourney, onClearAll, onImportJourneys }: Props) {
  const [filterRoute, setFilterRoute] = useState('')
  const [dateSortDir, setDateSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const visibleJourneys = useMemo(() => {
    const routeFilter = filterRoute.trim().toLowerCase()

    const filtered = journeys.filter((journey) => {
      const matchesRoute = routeFilter
        ? journey.route.toLowerCase().includes(routeFilter)
        : true
      return matchesRoute
    })

    return [...filtered].sort((a, b) => {
      const dateCmp =
        dateSortDir === 'desc'
          ? b.date.localeCompare(a.date)
          : a.date.localeCompare(b.date)
      if (dateCmp !== 0) return dateCmp
      return b.id.localeCompare(a.id)
    })
  }, [journeys, filterRoute, dateSortDir])

  const handleRemoveJourney = (journeyId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const confirmed = window.confirm(t.removeJourneyConfirm)
    if (!confirmed) return
    onRemoveJourney(journeyId)
    setSelectedJourneyId((prev) => (prev === journeyId ? null : prev))
  }

  const handleExportAll = () => {
    downloadJsonFile(exportAllJourneysToJson(visibleJourneys), `journeys-${new Date().toISOString().slice(0, 10)}.json`)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string
        const { newJourneys, skippedCount } = importJourneysFromJson(raw, journeys)
        onImportJourneys(newJourneys)
        const msg = t.importSuccess
          .replace('{count}', String(newJourneys.length))
          .replace('{skipped}', String(skippedCount))
        window.alert(msg)
      } catch {
        window.alert(t.importError)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const selectedJourney = selectedJourneyId
    ? visibleJourneys.find((j) => j.id === selectedJourneyId)
    : null

  return (
    <section className="panel">
      <div className="filters">
        <div className="form-field">
          <input
            id="filterRoute"
            type="text"
            placeholder={t.filterRoutePlaceholder}
            value={filterRoute}
            onChange={(event) => setFilterRoute(event.target.value)}
          />
        </div>
        <div className="saved-tab-actions">
          <button type="button" className="clear-button" onClick={handleImportClick}>
            {t.importJourneys}
          </button>
          <button type="button" className="clear-button" onClick={handleExportAll} disabled={visibleJourneys.length === 0}>
            {t.exportAllJourneys}
          </button>
          <button type="button" className="clear-button" onClick={onClearAll}>
            {t.clearAll}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
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
              onExport={() =>
                downloadJsonFile(
                  exportJourneyToJson(selectedJourney),
                  `journey-${selectedJourney.date}-${selectedJourney.route}.json`,
                )
              }
            />
          )}
        </>
      )}
    </section>
  )
}
