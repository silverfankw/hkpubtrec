import { useState, useRef, useEffect } from 'react'
import type { JourneySelection, StopInputData } from '../types'
import type { TranslationKeys } from '../constants/translations'
import type { SelectionPhase } from '../hooks/useStationDrag'
import { sanitizeNonNegative } from '../utils'
import './StationList.css'

function serializeData(data: StopInputData): string {
  let result = ''
  if (data.arrivalTime) {
    result += data.arrivalTime.replace(':', '')
  }
  if (data.aboard) {
    result += `+${data.aboard}`
  }
  if (data.alighting) {
    result += `-${data.alighting}`
  }
  if (data.remark) {
    result += `/${data.remark}`
  }
  return result
}

function parseInput(raw: string): StopInputData {
  let remaining = raw.trim()
  let arrivalTime = ''
  let aboard = ''
  let alighting = ''
  let remark = ''

  const slashIdx = remaining.indexOf('/')
  if (slashIdx !== -1) {
    remark = remaining.slice(slashIdx + 1)
    remaining = remaining.slice(0, slashIdx)
  }

  const timeMatch = remaining.match(/^(\d{1,4})/)
  if (timeMatch) {
    const digits = timeMatch[1]
    if (digits.length === 4) {
      const hh = String(Math.min(parseInt(digits.slice(0, 2), 10), 23)).padStart(2, '0')
      const mm = String(Math.min(parseInt(digits.slice(2), 10), 59)).padStart(2, '0')
      arrivalTime = `${hh}:${mm}`
    } else if (digits.length === 3) {
      const hh = String(Math.min(parseInt(digits.slice(0, 2), 10), 23)).padStart(2, '0')
      arrivalTime = `${hh}:${digits[2]}`
    } else {
      arrivalTime = String(Math.min(parseInt(digits, 10), 23)).padStart(digits.length, '0')
    }
    remaining = remaining.slice(digits.length)
  }

  const aboardMatch = remaining.match(/\+(\d+)/)
  if (aboardMatch) {
    aboard = String(Math.min(parseInt(aboardMatch[1], 10), 151))
    remaining = remaining.replace(aboardMatch[0], '')
  }

  const alightingMatch = remaining.match(/-(\d+)/)
  if (alightingMatch) {
    alighting = String(Math.min(parseInt(alightingMatch[1], 10), 151))
  }

  return { arrivalTime, aboard, alighting, remark }
}

type StopInfo = { id: string; order: number; name: string }

const EMPTY_STOP_DATA: StopInputData = {
  arrivalTime: '',
  aboard: '',
  alighting: '',
  remark: '',
}

type Props = {
  selectedRouteId: string
  stops: StopInfo[]
  journeySelection: JourneySelection | null
  dragSelectionLocked: boolean
  selectionPhase: SelectionPhase
  stationStopData: Record<string, StopInputData>
  initialPassengersOnBoard: string
  timeWarnings: Set<number>
  crossMidnight: boolean
  onMouseDown: (routeId: string, order: number) => void
  onSelectAll: () => void
  onSelectNone: () => void
  onToggleLock: () => void
  onUpdateStop: (
    routeId: string,
    stopOrder: number,
    field: 'arrivalTime' | 'aboard' | 'alighting' | 'remark',
    value: string,
  ) => void
  onInitialPassengersChange: (value: string) => void
  t: TranslationKeys
}

export function StationList({
  selectedRouteId,
  stops,
  journeySelection,
  dragSelectionLocked,
  selectionPhase,
  stationStopData,
  initialPassengersOnBoard,
  timeWarnings,
  crossMidnight,
  onMouseDown,
  onSelectAll,
  onSelectNone,
  onToggleLock,
  onUpdateStop,
  onInitialPassengersChange,
  t,
}: Props) {
  const [editingStopKey, setEditingStopKey] = useState<string | null>(null)
  const [rawInput, setRawInput] = useState('')
  const skipBlurRef = useRef(false)
  const hintRef = useRef<HTMLParagraphElement | null>(null)
  const prevSelectionPhaseRef = useRef<SelectionPhase>(selectionPhase)

  const sel = journeySelection?.routeId === selectedRouteId ? journeySelection : null
  const start = sel ? Math.min(sel.startOrder, sel.endOrder) : 0
  const end = sel ? Math.max(sel.startOrder, sel.endOrder) : 0

  const isAwaitingEnd = selectionPhase === 'awaiting-end'
  const hintText = isAwaitingEnd
    ? t.tapEndHint
    : sel && dragSelectionLocked
      ? t.enterDataHint
      : sel
        ? t.lockSelectionHint
        : t.journeyDragHint
  const showHighlight = !sel || isAwaitingEnd || (!!sel && !dragSelectionLocked)

  useEffect(() => {
    const wasAwaitingEnd = prevSelectionPhaseRef.current === 'awaiting-end'
    prevSelectionPhaseRef.current = selectionPhase

    if (!wasAwaitingEnd || selectionPhase !== 'idle' || !sel) return
    if (typeof window === 'undefined' || !window.matchMedia('(max-width: 640px)').matches) return

    hintRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    })
  }, [selectionPhase, sel])

  return (
    <>
      <div className="station-list-actions">
        <p
          ref={hintRef}
          className={`helper-text station-select-range-hint ${
            showHighlight ? 'station-select-range-hint--highlight' : ''
          }`}
        >
          {hintText}
        </p>
        <div className="station-select-buttons">
          <button type="button" className="station-select-btn" onClick={onSelectAll}>
            {t.selectAllStations}
          </button>
          <button type="button" className="station-select-btn" onClick={onSelectNone}>
            {t.selectNoneStations}
          </button>
          <button
            type="button"
            className={`station-select-btn ${dragSelectionLocked ? 'station-select-btn--locked' : ''}`}
            onClick={onToggleLock}
            disabled={!sel}
            title={dragSelectionLocked ? t.unlockStationRangeSelection : t.lockStationRangeSelection}
          >
            {dragSelectionLocked ? t.unlockStationRangeSelection : t.lockStationRangeSelection}
          </button>
        </div>
      </div>
      <ul key={selectedRouteId} className={`station-list station-list--selectable${stops.length === 0 ? ' station-list--empty' : ''}${dragSelectionLocked ? ' station-list--locked' : ''}`}>
        <li className="station-list-header">
          <div className="station-row-main">
            <span className="station-order">#</span>
            <span className="station-name">{t.stationNameLabel}</span>
            {dragSelectionLocked && (
              <span
                className="station-input-col station-format-hint-col"
                style={{ gridColumn: '3 / -1' }}
                title={t.stationInputFormatExample}
              >
                {t.stationInputFormatLabel}
              </span>
            )}
          </div>
          <div className="station-row-data" />
        </li>
        {stops.flatMap((stop) => {
          const isInRange = sel ? stop.order >= start && stop.order <= end : false
          const isTapStart = isAwaitingEnd && sel && stop.order === sel.startOrder
          const isFirstSelected = isInRange && stop.order === start && dragSelectionLocked
          const canEditInputs = isInRange && dragSelectionLocked

          const dataKey = `${selectedRouteId}|${stop.order}`
          const data = stationStopData[dataKey] ?? EMPTY_STOP_DATA

          const hasTimeWarning = !crossMidnight && timeWarnings.has(stop.order)

          const rows = []

          if (start > 1 && isInRange && stop.order === start && dragSelectionLocked) {
            rows.push(
              <li
                key={`${selectedRouteId}|initial-onboard`}
                className="station-list-item station-list-item--initial-onboard"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <span className="station-initial-onboard-label">{t.initialOnBoardLabel}</span>
                <input
                  id="initialPassengersOnBoard"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className="station-input station-initial-onboard-input"
                  placeholder="0"
                  title={t.initialOnBoardPlaceholder}
                  value={initialPassengersOnBoard}
                  onChange={(e) => onInitialPassengersChange(sanitizeNonNegative(e.target.value))}
                  onMouseDown={(e) => e.stopPropagation()}
                />
              </li>
            )
          }

          const isEditing = editingStopKey === dataKey

          rows.push(
            <li
              key={`${selectedRouteId}|${stop.order}`}
              className={`station-list-item ${isTapStart ? 'station-list-item--tap-start' : isInRange ? 'station-list-item--selected' : sel ? 'station-list-item--disabled' : ''}${isEditing ? ' station-list-item--editing' : ''}`}
              data-order={stop.order}
              data-route-id={selectedRouteId}
              onMouseDown={(e) => {
                e.preventDefault()
                onMouseDown(selectedRouteId, stop.order)
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onMouseDown(selectedRouteId, stop.order)
                }
              }}
            >
              {isFirstSelected && (
                <span className="station-lock-icon" aria-hidden>
                  <svg width="12" height="12" viewBox="0 0 14 16" fill="currentColor">
                    <rect x="2" y="7" width="10" height="8" rx="1.5" />
                    <path d="M4.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                  </svg>
                </span>
              )}
              <div className="station-row-main">
                <span className="station-order">{stop.order}</span>
                <span className="station-name">{stop.name}</span>
                {canEditInputs ? (
                  isEditing ? (
                    <input
                      type="text"
                      className="station-combined-input"
                      style={{ gridColumn: '3 / -1' }}
                      value={rawInput}
                      placeholder="HHMM+aboard-alighting/remark"
                      enterKeyHint="next"
                      autoFocus
                      onChange={(e) => setRawInput(e.target.value)}
                      onBlur={() => {
                        if (skipBlurRef.current) {
                          skipBlurRef.current = false
                          return
                        }
                        const parsed = parseInput(rawInput)
                        onUpdateStop(selectedRouteId, stop.order, 'arrivalTime', parsed.arrivalTime)
                        onUpdateStop(selectedRouteId, stop.order, 'aboard', parsed.aboard)
                        onUpdateStop(selectedRouteId, stop.order, 'alighting', parsed.alighting)
                        onUpdateStop(selectedRouteId, stop.order, 'remark', parsed.remark)
                        setEditingStopKey(null)
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setEditingStopKey(null)
                        }
                        if (e.key === 'Tab' || e.key === 'Enter') {
                          e.preventDefault()
                          const parsed = parseInput(rawInput)
                          onUpdateStop(selectedRouteId, stop.order, 'arrivalTime', parsed.arrivalTime)
                          onUpdateStop(selectedRouteId, stop.order, 'aboard', parsed.aboard)
                          onUpdateStop(selectedRouteId, stop.order, 'alighting', parsed.alighting)
                          onUpdateStop(selectedRouteId, stop.order, 'remark', parsed.remark)
                          const inRangeOrders = stops
                            .filter((s) => s.order >= start && s.order <= end)
                            .map((s) => s.order)
                          const currentIdx = inRangeOrders.indexOf(stop.order)
                          const step = e.key === 'Tab' && e.shiftKey ? -1 : 1
                          const nextOrder = inRangeOrders[currentIdx + step]
                          if (nextOrder !== undefined) {
                            const nextKey = `${selectedRouteId}|${nextOrder}`
                            const nextData = stationStopData[nextKey] ?? EMPTY_STOP_DATA
                            skipBlurRef.current = true
                            setRawInput(serializeData(nextData))
                            setEditingStopKey(nextKey)
                          } else {
                            setEditingStopKey(null)
                          }
                        }
                        e.stopPropagation()
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      className={`station-combined-display${hasTimeWarning ? ' station-combined-display--warning' : ''}`}
                      style={{ gridColumn: '3 / -1' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingStopKey(dataKey)
                        setRawInput(serializeData(data))
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      title={t.combinedInputHint}
                    >
                      {data.arrivalTime || data.aboard || data.alighting || data.remark ? (
                        <>
                          {data.arrivalTime && (
                            <span className={`combined-time${hasTimeWarning ? ' combined-time--warning' : ''}`}>
                              {data.arrivalTime}
                            </span>
                          )}
                          {data.aboard && <span className="combined-aboard">+{data.aboard}</span>}
                          {data.alighting && <span className="combined-alighting">-{data.alighting}</span>}
                          {data.remark && <span className="combined-remark">{data.remark}</span>}
                          {hasTimeWarning && (
                            <span className="combined-warning-msg">{t.timeOrderWarning}</span>
                          )}
                        </>
                      ) : (
                        <span className="combined-placeholder">HHMM+上車人數-落車人數/備註</span>
                      )}
                    </button>
                  )
                ) : (
                  <span />
                )}
              </div>
              {!canEditInputs && (
                <div className="station-row-data station-row-data--inactive">
                  <span />
                  <span />
                  <span />
                </div>
              )}
            </li>
          )
          return rows
        })}
      </ul>
    </>
  )
}
