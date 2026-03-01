import { useState, useEffect, useMemo } from 'react'
import type { EtaDb } from 'hk-bus-eta'
import type {
  Journey,
  JourneyFormState,
  RouteBoundMap,
  RouteListEntry,
  SavedStop,
  StopInputData,
  Language,
} from '../types'
import type { TranslationKeys } from '../constants/translations'
import {
  sanitizeVehiclePlate,
  getLocalDateString,
  createEmptyFormState,
} from '../utils'
import { useStationDrag } from '../hooks/useStationDrag'
import { RouteBadge } from './RouteBadge'
import { RouteSearch } from './RouteSearch'
import { StationList } from './StationList'
import { ConfirmDialog } from './ConfirmDialog'
import './RecordTab.css'

type Props = {
  etaDb: EtaDb | null
  routeMap: RouteBoundMap
  routeEntries: RouteListEntry[]
  isRouteDbLoading: boolean
  routeDbError: string | null
  language: Language
  t: TranslationKeys
  onSaveJourney: (journey: Journey) => void
  onShowNotification: () => void
  onSwitchToSaved: () => void
}

export function RecordTab({
  etaDb,
  routeMap,
  routeEntries,
  isRouteDbLoading,
  routeDbError,
  language,
  t,
  onSaveJourney,
  onShowNotification,
  onSwitchToSaved,
}: Props) {
  const [form, setForm] = useState<JourneyFormState>(() => createEmptyFormState())
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [routeBoundSectionExpanded, setRouteBoundSectionExpanded] = useState(true)
  const [stationStopData, setStationStopData] = useState<Record<string, StopInputData>>({})
  const [initialPassengersOnBoard, setInitialPassengersOnBoard] = useState('')
  const [pendingJourney, setPendingJourney] = useState<Journey | null>(null)
  const [crossMidnight, setCrossMidnight] = useState(false)
  const [mobileStage, setMobileStage] = useState<'search' | 'record'>('search')

  const {
    journeySelection,
    setJourneySelection,
    dragSelectionLocked,
    setDragSelectionLocked,
    selectionPhase,
    setSelectionPhase,
    handleStationMouseDown,
  } = useStationDrag()

  const resetRecordTabState = () => {
    setForm(createEmptyFormState())
    setSelectedRouteId(null)
    setJourneySelection(null)
    setStationStopData({})
    setDragSelectionLocked(false)
    setSelectionPhase('idle')
    setRouteBoundSectionExpanded(true)
    setInitialPassengersOnBoard('')
    setCrossMidnight(false)
    setMobileStage('search')
  }

  const updateForm = <K extends keyof JourneyFormState>(key: K, value: JourneyFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const updateStationStop = (
    routeId: string,
    stopOrder: number,
    field: 'arrivalTime' | 'aboard' | 'alighting' | 'remark',
    value: string,
  ) => {
    const key = `${routeId}|${stopOrder}`
    setStationStopData((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
  }

  const handleSelectRoute = (routeId: string) => {
    setSelectedRouteId(routeId)
    setMobileStage('record')
  }

  useEffect(() => {
    if (!selectedRouteId) {
      setJourneySelection(null)
      setSelectionPhase('idle')
    }
  }, [selectedRouteId, setJourneySelection, setSelectionPhase])

  const selectedEntry = useMemo(() => {
    if (!selectedRouteId) return null
    return routeEntries.find((e) => e.routeId === selectedRouteId) ?? null
  }, [selectedRouteId, routeEntries])

  const selectedRouteLabel = selectedEntry?.route ?? ''

  const selectedBoundLabel = useMemo(() => {
    if (!selectedEntry) return ''
    return language === 'zh-HK'
      ? `${selectedEntry.origZh} → ${selectedEntry.destZh}`
      : `${selectedEntry.origEn} → ${selectedEntry.destEn}`
  }, [selectedEntry, language])

  const availableBounds = useMemo(() => {
    if (!selectedEntry) return []
    const companyKey = [...selectedEntry.companyCodes].sort().join(',')
    return routeEntries.filter(
      (e) =>
        e.route === selectedEntry.route &&
        [...e.companyCodes].sort().join(',') === companyKey &&
        e.serviceType === '1',
    )
  }, [selectedEntry, routeEntries])

  const handleChangeBound = () => {
    if (availableBounds.length <= 1) return
    const currentIndex = availableBounds.findIndex((b) => b.routeId === selectedRouteId)
    const nextIndex = (currentIndex + 1) % availableBounds.length
    setSelectedRouteId(availableBounds[nextIndex].routeId)
    setJourneySelection(null)
    setSelectionPhase('idle')
    setDragSelectionLocked(false)
  }

  const selectedRouteMeta = useMemo(() => {
    if (!etaDb || !selectedRouteId) return null
    return etaDb.routeList[selectedRouteId] ?? null
  }, [etaDb, selectedRouteId])

  const selectedRouteStops = useMemo(() => {
    if (!etaDb || !selectedRouteId || !selectedRouteMeta) return []
    const companyKeys = Object.keys(selectedRouteMeta.stops as Record<string, string[]>)
    if (!companyKeys.length) return []
    const primaryCompany = companyKeys[0]
    const stopIds = (selectedRouteMeta.stops as Record<string, string[]>)[primaryCompany] ?? []
    return stopIds.map((stopId: string, index: number) => {
      const stopMeta = etaDb.stopList[stopId]
      const name =
        language === 'zh-HK'
          ? stopMeta?.name.zh ?? stopMeta?.name.en ?? stopId
          : stopMeta?.name.en ?? stopMeta?.name.zh ?? stopId
      return { id: stopId, order: index + 1, name }
    })
  }, [etaDb, selectedRouteId, selectedRouteMeta, language])

  const selectedStopRange = useMemo(() => {
    if (
      !selectedRouteId ||
      !selectedRouteStops.length ||
      !journeySelection ||
      journeySelection.routeId !== selectedRouteId
    ) {
      return { fromStop: '', toStop: '' }
    }

    const start = Math.min(journeySelection.startOrder, journeySelection.endOrder)
    const end = Math.max(journeySelection.startOrder, journeySelection.endOrder)
    const fromStop = selectedRouteStops.find((s) => s.order === start)
    const toStop = selectedRouteStops.find((s) => s.order === end)

    return {
      fromStop: fromStop?.name ?? '',
      toStop: toStop?.name ?? '',
    }
  }, [journeySelection, selectedRouteId, selectedRouteStops])

  const journeyDuration = useMemo(() => {
    const sel = journeySelection?.routeId === selectedRouteId ? journeySelection : null
    if (!sel || !selectedRouteStops.length) return null
    const start = Math.min(sel.startOrder, sel.endOrder)
    const end = Math.max(sel.startOrder, sel.endOrder)
    const firstStop = selectedRouteStops.find((s) => s.order === start)
    const lastStop = selectedRouteStops.find((s) => s.order === end)
    if (!firstStop || !lastStop) return null
    const firstKey = `${selectedRouteId}|${firstStop.order}`
    const lastKey = `${selectedRouteId}|${lastStop.order}`
    const firstTime = stationStopData[firstKey]?.arrivalTime?.trim()
    const lastTime = stationStopData[lastKey]?.arrivalTime?.trim()
    if (!firstTime || !lastTime) return null
    const [fh, fm] = firstTime.split(':').map(Number)
    const [lh, lm] = lastTime.split(':').map(Number)
    const firstMins = fh * 60 + fm
    const lastMins = lh * 60 + lm
    let diffMins = lastMins - firstMins
    if (diffMins < 0) diffMins += 24 * 60
    const hours = Math.floor(diffMins / 60)
    const minutes = diffMins % 60
    if (language === 'zh-HK') {
      if (hours > 0 && minutes > 0) return `${hours} 小時 ${minutes} 分鐘`
      if (hours > 0) return `${hours} 小時`
      return `${minutes} 分鐘`
    }
    if (hours > 0 && minutes > 0) return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  }, [journeySelection, selectedRouteId, selectedRouteStops, stationStopData, language])

  const stationOnBoardMap = useMemo(() => {
    const map: Record<number, number> = {}
    const sel = journeySelection?.routeId === selectedRouteId ? journeySelection : null
    if (!sel || !selectedRouteId) return map
    const start = Math.min(sel.startOrder, sel.endOrder)
    const end = Math.max(sel.startOrder, sel.endOrder)
    const initial = Math.max(0, parseInt(initialPassengersOnBoard, 10) || 0)
    let cumulative = initial
    for (const stop of selectedRouteStops) {
      if (stop.order < start || stop.order > end) continue
      const key = `${selectedRouteId}|${stop.order}`
      const data = stationStopData[key]
      const aboard = parseInt(data?.aboard ?? '0', 10) || 0
      const alighting = parseInt(data?.alighting ?? '0', 10) || 0
      cumulative += aboard - alighting
      map[stop.order] = cumulative
    }
    return map
  }, [journeySelection, selectedRouteId, selectedRouteStops, stationStopData, initialPassengersOnBoard])

  const timeWarnings = useMemo(() => {
    const warnings = new Set<number>()
    const sel = journeySelection?.routeId === selectedRouteId ? journeySelection : null
    if (!sel || !selectedRouteId || !selectedRouteStops.length) return warnings
    const start = Math.min(sel.startOrder, sel.endOrder)
    const end = Math.max(sel.startOrder, sel.endOrder)

    let prevMins: number | null = null
    for (const stop of selectedRouteStops) {
      if (stop.order < start || stop.order > end) continue
      const key = `${selectedRouteId}|${stop.order}`
      const time = stationStopData[key]?.arrivalTime?.trim()
      if (!time) {
        prevMins = null
        continue
      }
      const [h, m] = time.split(':').map(Number)
      const mins = h * 60 + m
      if (prevMins !== null && mins < prevMins) {
        warnings.add(stop.order)
      }
      prevMins = mins
    }
    return warnings
  }, [journeySelection, selectedRouteId, selectedRouteStops, stationStopData])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedRoute = selectedRouteLabel.trim()
    const trimmedBound = selectedBoundLabel.trim()
    const trimmedFromStop = selectedStopRange.fromStop.trim()
    const trimmedToStop = selectedStopRange.toStop.trim()

    if (!trimmedRoute || !trimmedBound) {
      window.alert(t.validationMissingFields)
      return
    }

    const hasValidStopSelection =
      selectedRouteId &&
      journeySelection?.routeId === selectedRouteId &&
      trimmedFromStop &&
      trimmedToStop

    if (!hasValidStopSelection) {
      window.alert(t.validationSelectStopRange)
      return
    }

    if (timeWarnings.size > 0 && !crossMidnight) {
      window.alert(t.validationEndTimeBeforeStart)
      return
    }

    const date = form.date || getLocalDateString()

    let matchedRouteId: string | undefined
    const candidates = routeMap[trimmedRoute]
    if (candidates && candidates.length > 0) {
      const matchingCandidates = candidates.filter(
        (c) => c.labelZh === trimmedBound || c.labelEn === trimmedBound,
      )
      const preferred =
        selectedRouteId && matchingCandidates.some((c) => c.routeId === selectedRouteId)
          ? selectedRouteId
          : matchingCandidates[0]?.routeId
      matchedRouteId = preferred
    }

    const routeIdToStore = selectedRouteId ?? matchedRouteId

    const entryBySelection = selectedRouteId
      ? routeEntries.find((e) => e.routeId === selectedRouteId && e.route === trimmedRoute)
      : undefined
    const entryByMatch = routeIdToStore
      ? routeEntries.find((e) => e.routeId === routeIdToStore)
      : null
    const selectedEntry = entryBySelection ?? entryByMatch
    const isSpecialDeparture = selectedEntry?.serviceType && selectedEntry.serviceType != '1'
    const routeToStore = isSpecialDeparture
      ? `${trimmedRoute} (${t.specialDepartureLabel})`
      : trimmedRoute

    const stops: SavedStop[] = []
    const sel = journeySelection?.routeId === selectedRouteId ? journeySelection : null
    let totalOnBoard: number | undefined
    let initialOnBoard: number | undefined
    if (sel && selectedRouteStops.length && routeIdToStore) {
      const start = Math.min(sel.startOrder, sel.endOrder)
      const end = Math.max(sel.startOrder, sel.endOrder)
      if (start > 1) {
        initialOnBoard = Math.max(0, parseInt(initialPassengersOnBoard, 10) || 0)
      }
      for (const stop of selectedRouteStops) {
        if (stop.order >= start && stop.order <= end) {
          const key = `${selectedRouteId}|${stop.order}`
          const data = stationStopData[key] ?? {
            arrivalTime: '',
            aboard: '',
            alighting: '',
            remark: '',
          }
          stops.push({
            stopId: stop.id,
            order: stop.order,
            name: stop.name,
            arrivalTime: data.arrivalTime,
            aboard: data.aboard,
            alighting: data.alighting,
            remark: data.remark,
          })
          totalOnBoard = stationOnBoardMap[stop.order]
        }
      }
    }

    const newJourney: Journey = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date,
      route: routeToStore,
      routeId: routeIdToStore,
      bound: trimmedBound,
      fromStop: trimmedFromStop,
      toStop: trimmedToStop,
      time: journeyDuration || undefined,
      vehiclePlate: form.vehiclePlate.trim() || undefined,
      notes: form.notes.trim() || undefined,
      stops: stops.length > 0 ? stops : undefined,
      initialOnBoard,
      totalOnBoard,
    }

    setPendingJourney(newJourney)
  }

  const handleConfirmSave = () => {
    if (!pendingJourney) return
    onSaveJourney(pendingJourney)
    setPendingJourney(null)
    resetRecordTabState()
    onSwitchToSaved()
    onShowNotification()
  }

  return (
    <>
      {pendingJourney && (
        <ConfirmDialog
          journey={pendingJourney}
          t={t}
          onConfirm={handleConfirmSave}
          onCancel={() => setPendingJourney(null)}
        />
      )}
      <section className="panel">
        <form className="journey-form" onSubmit={handleSubmit} data-mobile-stage={mobileStage}>
          {selectedEntry && (
            <div className="record-route-strip">
              <RouteBadge entry={selectedEntry} language={language} specialLabel={t.specialDepartureLabel} />
              <span className="record-route-strip-bound">{selectedBoundLabel}</span>
              <button
                type="button"
                className="record-route-strip-edit-btn"
                onClick={() => setMobileStage('search')}
                aria-label={t.changeRouteBtn}
              >
                ✎
              </button>
            </div>
          )}
          <div className="form-grid form-grid--journey">
            <div className="record-meta-fields">
            <div className="form-field">
              <label htmlFor="date">{t.dateLabel}</label>
              <input
                id="date"
                type="date"
                value={form.date}
                max={getLocalDateString()}
                onChange={(event) => updateForm('date', event.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="vehiclePlate">{t.vehiclePlateLabel}</label>
              <input
                id="vehiclePlate"
                type="text"
                placeholder={t.vehiclePlatePlaceholder}
                value={form.vehiclePlate}
                onChange={(e) => updateForm('vehiclePlate', sanitizeVehiclePlate(e.target.value))}
                autoComplete="off"
                maxLength={8}
              />
            </div>
            </div>

            <div className="form-field form-field--full-width">
              <label id="route-bound">{t.routeAndBoundLabel}</label>
              <div className="route-form-company-route route-form-route-bound">
                <span className="route-form-route-content">
                  <button
                    type="button"
                    className="route-bound-toggle-btn"
                    onClick={() => setRouteBoundSectionExpanded((prev) => !prev)}
                    aria-expanded={routeBoundSectionExpanded}
                    aria-controls="route-bound-section"
                    title={routeBoundSectionExpanded ? t.routeBoundToggleCollapse : t.routeBoundToggleExpand}
                  >
                    <span className="route-bound-toggle-icon" aria-hidden />
                  </button>
                  {selectedEntry ? (
                    <>
                      <RouteBadge entry={selectedEntry} language={language} specialLabel={t.specialDepartureLabel} />
                      <span className="route-form-bound-text">{selectedBoundLabel || '—'}</span>
                      {availableBounds.length > 1 && !selectedEntry.companyCodes.includes('gmb') && selectedEntry.serviceType === '1' && (
                        <button
                          type="button"
                          className="route-bound-switch-btn"
                          onClick={handleChangeBound}
                          title={t.switchBoundLabel}
                          aria-label={t.switchBoundLabel}
                        >
                          ⇄ {t.switchBoundLabel}
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="route-form-placeholder">{t.routeFormPlaceholder}</span>
                  )}
                </span>
              </div>

              {(routeBoundSectionExpanded || mobileStage === 'search') && (
                <RouteSearch
                  routeEntries={routeEntries}
                  selectedRouteId={selectedRouteId}
                  onSelectRoute={handleSelectRoute}
                  language={language}
                  t={t}
                  isLoading={isRouteDbLoading}
                  error={routeDbError}
                />
              )}

              {selectedRouteId && (
              <div className="station-section" aria-labelledby="route-bound">
                {selectedRouteStops.length === 0 ? (
                  <p className="empty-state">{t.noStationsForRoute}</p>
                ) : (
                  <StationList
                    selectedRouteId={selectedRouteId}
                    stops={selectedRouteStops}
                    journeySelection={journeySelection}
                    dragSelectionLocked={dragSelectionLocked}
                    selectionPhase={selectionPhase}
                    stationStopData={stationStopData}
                    stationOnBoardMap={stationOnBoardMap}
                    initialPassengersOnBoard={initialPassengersOnBoard}
                    timeWarnings={timeWarnings}
                    crossMidnight={crossMidnight}
                    onMouseDown={handleStationMouseDown}
                    onSelectAll={() => {
                      if (!selectedRouteId) return
                      setJourneySelection({
                        routeId: selectedRouteId,
                        startOrder: 1,
                        endOrder: selectedRouteStops.length,
                      })
                      setSelectionPhase('idle')
                    }}
                    onSelectNone={() => {
                      setJourneySelection(null)
                      setSelectionPhase('idle')
                      setDragSelectionLocked(false)
                    }}
                    onToggleLock={() => setDragSelectionLocked((prev) => !prev)}
                    onUpdateStop={updateStationStop}
                    onInitialPassengersChange={setInitialPassengersOnBoard}
                    t={t}
                  />
                )}
                <div className="station-stop-range">
                  <div className="form-field">
                    <label htmlFor="fromStop">{t.fromStopLabel}</label>
                    <div id="fromStop" className="form-field-text">
                      {selectedStopRange.fromStop || '—'}
                    </div>
                  </div>
                  <div className="form-field">
                    <label htmlFor="toStop">{t.toStopLabel}</label>
                    <div id="toStop" className="form-field-text">
                      {selectedStopRange.toStop || '—'}
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>

            {timeWarnings.size > 0 && (
              <div className="form-field form-field--full-width record-cross-midnight">
                <label className="cross-midnight-label">
                  <input
                    type="checkbox"
                    checked={crossMidnight}
                    onChange={(e) => setCrossMidnight(e.target.checked)}
                  />
                  <span>{t.crossMidnightLabel}</span>
                </label>
                <p className="helper-text">{t.crossMidnightHint}</p>
              </div>
            )}

            <div className="form-field form-field--full-width record-notes-field">
              <label htmlFor="notes">{t.notesLabel}</label>
              <textarea
                id="notes"
                rows={2}
                placeholder={t.notesPlaceholderLabel}
                value={form.notes}
                onChange={(event) => updateForm('notes', event.target.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-button">{t.saveJourney}</button>
          </div>
        </form>
      </section>
    </>
  )
}
