import type { Journey, RouteListEntry, Language } from '../types'
import type { TranslationKeys } from '../constants/translations'
import { RouteBadge } from './RouteBadge'
import './JourneyDetail.css'

type Props = {
  journey: Journey
  routeEntries: RouteListEntry[]
  language: Language
  t: TranslationKeys
}

export function JourneyDetail({ journey, routeEntries, language, t }: Props) {
  const entry = journey.routeId
    ? routeEntries.find((e) => e.routeId === journey.routeId)
    : null

  const periodStr = journey.stops?.length
    ? `${journey.stops[0]?.arrivalTime || '—'} - ${journey.stops[journey.stops.length - 1]?.arrivalTime || '—'}`
    : '—'

  const fromStopOrder = journey.stops?.[0]?.order
  const toStopOrder = journey.stops?.length ? journey.stops[journey.stops.length - 1]?.order : undefined

  const formatStopOrder = (order: number) => {
    if (language === 'zh-HK') return `第${order}個站  `
    const suffix = order === 1 ? 'st' : order === 2 ? 'nd' : order === 3 ? 'rd' : 'th'
    return `${order}${suffix} stop  `
  }

  return (
    <div className="saved-journey-detail-panel">
      <div className="saved-journey-summary">
        <dl className="saved-journey-summary-grid">
          <dt>{t.dateLabel}</dt>
          <dd>{journey.date}</dd>
          <dt>{t.periodLabel}</dt>
          <dd>{periodStr}</dd>
          <dt>{t.routeLabel}</dt>
          <dd>
            {entry ? (
              <span className="journey-table-company-route">
                <RouteBadge entry={entry} language={language} specialLabel={t.specialDepartureLabel} />
              </span>
            ) : (
              journey.route
            )}
          </dd>
          <dt>{t.boundLabel}</dt>
          <dd>{journey.bound}</dd>
          <dt>{t.fromStopLabel}</dt>
          <dd>{fromStopOrder != null ? <span className="stop-order-prefix">{formatStopOrder(fromStopOrder)}</span> : ''}{journey.fromStop ?? '—'}</dd>
          <dt>{t.toStopLabel}</dt>
          <dd>{toStopOrder != null ? <span className="stop-order-prefix">{formatStopOrder(toStopOrder)}</span> : ''}{journey.toStop ?? '—'}</dd>
          <dt>{t.vehiclePlateLabel}</dt>
          <dd>{journey.vehiclePlate ?? '—'}</dd>
          <dt>{t.notesLabel}</dt>
          <dd className="saved-journey-notes-cell">{journey.notes ?? '—'}</dd>
        </dl>
        <h4 className="saved-journey-station-title">
          {t.savedJourneyStopDetails}
        </h4>
        {!journey.stops?.length ? (
          <p className="empty-state">{t.noStopDataSaved}</p>
        ) : (
          <ul className="saved-station-list">
            <li className="saved-station-list-header">
              <span className="station-order">#</span>
              <span className="station-name">{t.stationNameLabel}</span>
              <span>{t.arrivalTimeLabel}</span>
              <span>{t.aboardingLabel}</span>
              <span>{t.alightingLabel}</span>
              <span>{t.onBoardLabel}</span>
              <span>{t.totalPassengersLabel}</span>
              <span>{t.remarkLabel}</span>
            </li>
            {(() => {
              const initial = journey.initialOnBoard ?? 0
              let cumulative = initial
              let cumulativeAboard = 0
              const hasInitialRow = initial > 0
              const rows: React.ReactNode[] = []
              if (hasInitialRow) {
                rows.push(
                  <li key="initial-onboard" className="saved-station-list-item saved-station-list-item--initial">
                    <span className="station-order">—</span>
                    <span className="station-name">—</span>
                    <span>—</span>
                    <span>—</span>
                    <span>—</span>
                    <span className="saved-station-onboard-cell">{initial}</span>
                    <span>—</span>
                    <span>{t.initialOnBoardLabel}</span>
                  </li>,
                )
              }
              journey.stops!.forEach((stop) => {
                const aboard = parseInt(stop.aboard ?? '0', 10) || 0
                const alighting = parseInt(stop.alighting ?? '0', 10) || 0
                cumulative += aboard - alighting
                cumulativeAboard += aboard
                const totalPassengers = initial + cumulativeAboard
                rows.push(
                  <li key={`${stop.stopId}-${stop.order}`} className="saved-station-list-item">
                    <span className="station-order">{stop.order}</span>
                    <span className="station-name">{stop.name}</span>
                    <span>{stop.arrivalTime || '—'}</span>
                    <span>{stop.aboard || '—'}</span>
                    <span>{stop.alighting || '—'}</span>
                    <span className="saved-station-onboard-cell">{cumulative}</span>
                    <span className="saved-station-onboard-cell">{totalPassengers > 0 ? totalPassengers : '—'}</span>
                    <span>{stop.remark || '—'}</span>
                  </li>,
                )
              })
              return rows
            })()}
          </ul>
        )}
      </div>
    </div>
  )
}
