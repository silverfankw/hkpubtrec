import type { JourneySelection, StopInputData } from '../types'
import type { TranslationKeys } from '../constants/translations'
import type { SelectionPhase } from '../hooks/useStationDrag'
import { sanitizeNonNegative } from '../utils'
import './StationList.css'

type StopInfo = { id: string; order: number; name: string }

type Props = {
  selectedRouteId: string
  stops: StopInfo[]
  journeySelection: JourneySelection | null
  dragSelectionLocked: boolean
  selectionPhase: SelectionPhase
  stationStopData: Record<string, StopInputData>
  stationOnBoardMap: Record<number, number>
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
  stationOnBoardMap,
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

  return (
    <>
      <div className="station-list-actions">
        <p
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
      <ul key={selectedRouteId} className={`station-list station-list--selectable${stops.length === 0 ? ' station-list--empty' : ''}`}>
        <li className="station-list-header">
          <div className="station-row-main">
            <span className="station-order">#</span>
            <span className="station-name">{t.stationNameLabel}</span>
            <span className="station-input-col">{t.arrivalTimeLabel}</span>
          </div>
          <div className="station-row-data">
            <span className="station-input-col">{t.aboardingLabel}</span>
            <span className="station-input-col">{t.alightingLabel}</span>
            <span className="station-input-col station-onboard-col">{t.onBoardLabel}</span>
            <span className="station-input-col station-remark-col">{t.remarkLabel}</span>
          </div>
        </li>
        {stops.flatMap((stop) => {
          const isInRange = sel ? stop.order >= start && stop.order <= end : false
          const isTapStart = isAwaitingEnd && sel && stop.order === sel.startOrder
          const isFirstSelected = isInRange && stop.order === start && dragSelectionLocked
          const canEditInputs = isInRange && dragSelectionLocked
          const onBoardValue =
            isInRange && stop.order in stationOnBoardMap
              ? stationOnBoardMap[stop.order]
              : null

          const dataKey = `${selectedRouteId}|${stop.order}`
          const data = stationStopData[dataKey] ?? {
            arrivalTime: '',
            aboard: '',
            alighting: '',
            remark: '',
          }

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

          rows.push(
            <li
              key={`${selectedRouteId}|${stop.order}`}
              className={`station-list-item ${isTapStart ? 'station-list-item--tap-start' : isInRange ? 'station-list-item--selected' : sel ? 'station-list-item--disabled' : ''}`}
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
                <span className="station-input-col station-time-col">
                  {isInRange && (
                    <>
                      <span className="station-field-label">{t.arrivalTimeLabel}</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="HH:MM"
                        maxLength={5}
                        className={`station-input ${hasTimeWarning ? 'station-input--warning' : ''}`}
                        value={data.arrivalTime}
                        disabled={!canEditInputs}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
                          if (digits.length === 0) {
                            onUpdateStop(selectedRouteId, stop.order, 'arrivalTime', '')
                            return
                          }
                          if (digits.length <= 2) {
                            const h = Math.min(parseInt(digits, 10), 23)
                            onUpdateStop(selectedRouteId, stop.order, 'arrivalTime', String(h).padStart(digits.length, '0'))
                            return
                          }
                          const hh = String(Math.min(parseInt(digits.slice(0, 2), 10), 23)).padStart(2, '0')
                          if (digits.length === 3) {
                            onUpdateStop(selectedRouteId, stop.order, 'arrivalTime', `${hh}:${digits[2]}`)
                            return
                          }
                          const mm = String(Math.min(parseInt(digits.slice(2), 10), 59)).padStart(2, '0')
                          onUpdateStop(selectedRouteId, stop.order, 'arrivalTime', `${hh}:${mm}`)
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                      {canEditInputs && data.arrivalTime && (
                        <button
                          type="button"
                          className="station-time-clear-btn"
                          onMouseDown={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            onUpdateStop(selectedRouteId, stop.order, 'arrivalTime', '')
                          }}
                          aria-label="Clear time"
                        >
                          ×
                        </button>
                      )}
                      {hasTimeWarning && (
                        <span className="station-time-warning" title={t.timeOrderWarning}>
                          !
                        </span>
                      )}
                    </>
                  )}
                </span>
              </div>
              <div className={`station-row-data${canEditInputs ? '' : ' station-row-data--inactive'}`}>
                <div className="station-pax-row">
                  <div className="station-field-row">
                    <span className="station-field-label">{t.aboardingLabel}</span>
                    <input
                      type="number"
                      className="station-input"
                      min={0}
                      inputMode="numeric"
                      placeholder=""
                      value={data.aboard}
                      disabled={!canEditInputs}
                      onChange={(e) =>
                        onUpdateStop(selectedRouteId, stop.order, 'aboard', sanitizeNonNegative(e.target.value))
                      }
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="station-field-row">
                    <span className="station-field-label">{t.alightingLabel}</span>
                    <input
                      type="number"
                      className="station-input"
                      min={0}
                      inputMode="numeric"
                      placeholder=""
                      value={data.alighting}
                      disabled={!canEditInputs}
                      onChange={(e) =>
                        onUpdateStop(selectedRouteId, stop.order, 'alighting', sanitizeNonNegative(e.target.value))
                      }
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <span className="station-onboard-value" aria-label={t.onBoardLabel}>
                  {onBoardValue != null ? String(onBoardValue) : '—'}
                </span>
                <div className="station-field-row">
                  <span className="station-field-label">{t.remarkLabel}</span>
                  <input
                    type="text"
                    className="station-input station-remark-input"
                    placeholder=""
                    value={data.remark}
                    disabled={!canEditInputs}
                    onChange={(e) =>
                      onUpdateStop(selectedRouteId, stop.order, 'remark', e.target.value)
                    }
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            </li>
          )
          return rows
        })}
      </ul>
    </>
  )
}
