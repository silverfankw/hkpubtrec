import type { Journey, RouteListEntry, Language } from '../types'
import type { TranslationKeys } from '../constants/translations'
import { RouteBadge } from './RouteBadge'
import './JourneyTable.css'

type Props = {
  journeys: Journey[]
  routeEntries: RouteListEntry[]
  selectedJourneyId: string | null
  dateSortDir: 'asc' | 'desc'
  onToggleSort: () => void
  onSelectJourney: (id: string | null) => void
  onRemoveJourney: (id: string, e: React.MouseEvent) => void
  language: Language
  t: TranslationKeys
}

export function JourneyTable({
  journeys,
  routeEntries,
  selectedJourneyId,
  dateSortDir,
  onToggleSort,
  onSelectJourney,
  onRemoveJourney,
  language,
  t,
}: Props) {
  return (
    <div className="journey-table-wrapper">
      <table className="journey-table">
        <thead>
          <tr>
            <th
              className="journey-table-date-header sortable"
              onClick={onToggleSort}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onToggleSort()
                }
              }}
              title={dateSortDir === 'desc' ? t.sortDateClickAsc : t.sortDateClickDesc}
            >
              {t.dateLabel}
              <span className="journey-table-sort-indicator" aria-hidden>
                {dateSortDir === 'desc' ? ' ↓' : ' ↑'}
              </span>
            </th>
            <th>{t.periodLabel}</th>
            <th>{t.routeLabel}</th>
            <th>{t.boundLabel}</th>
            <th>{t.fromStopLabel}</th>
            <th>{t.toStopLabel}</th>
            <th>{t.vehiclePlateLabel}</th>
            <th className="journey-table-actions-header" aria-label={t.removeJourney} />
          </tr>
        </thead>
        <tbody>
          {journeys.map((journey) => {
            const entry = journey.routeId
              ? routeEntries.find((e) => e.routeId === journey.routeId)
              : null

            return (
              <tr
                key={journey.id}
                className={`journey-table-row ${selectedJourneyId === journey.id ? 'journey-table-row--selected' : ''}`}
                onClick={() =>
                  onSelectJourney(selectedJourneyId === journey.id ? null : journey.id)
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectJourney(selectedJourneyId === journey.id ? null : journey.id)
                  }
                }}
              >
                <td>{journey.date}</td>
                <td>
                  {journey.stops?.length
                    ? `${journey.stops[0]?.arrivalTime || '—'} - ${journey.stops[journey.stops.length - 1]?.arrivalTime || '—'}`
                    : '—'}
                </td>
                <td>
                  {entry ? (
                    <span className="journey-table-company-route">
                      <RouteBadge entry={entry} language={language} specialLabel={t.specialDepartureLabel} />
                    </span>
                  ) : (
                    journey.route
                  )}
                </td>
                <td>
                  {journey.bound.includes(' → ')
                    ? t.boundToPrefix + journey.bound.split(' → ').pop()
                    : journey.bound}
                </td>
                <td>{journey.fromStop ?? '—'}</td>
                <td>{journey.toStop ?? '—'}</td>
                <td>{journey.vehiclePlate ?? '-'}</td>
                <td className="journey-table-actions-cell">
                  <button
                    type="button"
                    className="journey-table-remove-btn"
                    onClick={(e) => onRemoveJourney(journey.id, e)}
                    title={t.removeJourney}
                    aria-label={t.removeJourney}
                  >
                    ×
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
