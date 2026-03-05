import { useState, useMemo, useEffect } from 'react'
import type { RouteListEntry, Language } from '../types'
import type { TranslationKeys } from '../constants/translations'
import { RouteBadge } from './RouteBadge'
import { RouteKeypad } from './RouteKeypad'
import './RouteSearch.css'

type Props = {
  routeEntries: RouteListEntry[]
  selectedRouteId: string | null
  onSelectRoute: (routeId: string) => void
  language: Language
  t: TranslationKeys
  isLoading: boolean
  error: string | null
}

export function RouteSearch({
  routeEntries,
  selectedRouteId,
  onSelectRoute,
  language,
  t,
  isLoading,
  error,
}: Props) {
  const [routeSearch, setRouteSearch] = useState('')
  const [keypadVisible, setKeypadVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const filteredRouteEntries = useMemo(() => {
    const COMPANY_ORDER: Record<string, number> = { kmb: 0, ctb: 1, nlb: 2, gmb: 3 }
    if (!routeEntries.length) return []
    const companyRank = (codes: string[]) => {
      const primary = (codes[0] ?? '').toLowerCase()
      return primary in COMPANY_ORDER ? COMPANY_ORDER[primary] : 99
    }
    const sortByCompany = (a: RouteListEntry, b: RouteListEntry) => {
      const rankA = companyRank(a.companyCodes)
      const rankB = companyRank(b.companyCodes)
      if (rankA !== rankB) return rankA - rankB
      return (a.route ?? '').localeCompare(b.route ?? '', undefined, { numeric: true })
    }

    const rawTerm = routeSearch.trim()
    if (!rawTerm) {
      return [...routeEntries].sort(sortByCompany).slice(0, 30)
    }

    const termForRoute = rawTerm.normalize('NFKC')
    const termLower = termForRoute.toLowerCase()

    const isFullRouteMatch = (entry: RouteListEntry) => {
      const routeNorm = (entry.route ?? '').trim().normalize('NFKC')
      return routeNorm.toLowerCase() === termLower
    }

    const isRoutePrefixMatch = (entry: RouteListEntry) => {
      const routeNorm = (entry.route ?? '').trim().normalize('NFKC')
      return routeNorm.toLowerCase().startsWith(termLower)
    }

    return routeEntries
      .filter((entry) => {
        const routeNorm = (entry.route ?? '').trim().normalize('NFKC')
        return routeNorm.toLowerCase().startsWith(termLower)
      })
      .sort((a, b) => {
        const fullA = isFullRouteMatch(a)
        const fullB = isFullRouteMatch(b)
        if (fullA !== fullB) return fullA ? -1 : 1
        const prefixA = isRoutePrefixMatch(a)
        const prefixB = isRoutePrefixMatch(b)
        if (prefixA !== prefixB) return prefixA ? -1 : 1
        return sortByCompany(a, b)
      })
      .slice(0, 80)
  }, [routeEntries, routeSearch])

  return (
    <div id="route-bound-section" className="route-bound-section" aria-labelledby="route-bound">
      {isLoading && <p className="helper-text">{t.routesLoading}</p>}
      {error && <p className="helper-text helper-text-error">{t.routesError}</p>}

      <div className="route-search-details">
        <div className={`route-search${isMobile && keypadVisible ? ' route-search--keypad-open' : ''}`}>
          <div className="form-field">
            <div className="route-search-input-wrap">
              <input
                id="routeSearch"
                type="text"
                placeholder={t.routeSearchPlaceholder}
                value={routeSearch}
                readOnly={isMobile}
                onChange={(event) => !isMobile && setRouteSearch(event.target.value)}
                onClick={() => isMobile && setKeypadVisible((v) => !v)}
                className={isMobile ? 'route-search-input--mobile' : ''}
              />
              {routeSearch && (
                <button
                  type="button"
                  className="route-search-clear-btn"
                  onClick={() => {
                    setRouteSearch('')
                    setKeypadVisible(false)
                  }}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {isMobile && keypadVisible && (
            <RouteKeypad
              value={routeSearch}
              routeEntries={routeEntries}
              onChar={(char) => setRouteSearch((prev) => prev + char)}
              onBackspace={() => setRouteSearch((prev) => prev.slice(0, -1))}
              onClear={() => setRouteSearch('')}
            />
          )}

          <div className="route-list">
            {filteredRouteEntries.length === 0 ? (
              <p className="empty-state">{t.noRoutesFound}</p>
            ) : (
              <ul className="route-list-items">
                {filteredRouteEntries.map((entry) => {
                  const originLabel = language === 'zh-HK' ? entry.origZh : entry.origEn
                  const destLabel = language === 'zh-HK' ? entry.destZh : entry.destEn

                  return (
                    <li key={entry.routeId}>
                      <button
                        type="button"
                        className={
                          selectedRouteId === entry.routeId
                            ? 'route-list-item route-list-item--active'
                            : 'route-list-item'
                        }
                        onClick={() => {
                          onSelectRoute(entry.routeId)
                          setKeypadVisible(false)
                        }}
                      >
                        <RouteBadge entry={entry} language={language} specialLabel={isMobile ? t.specialDepartureLabelShort : t.specialDepartureLabel} />
                        <span className="route-list-od-group">
                          <span className="route-list-origin">{originLabel}</span>
                          <span className="route-list-arrow">→</span>
                          <span className="route-list-dest">{destLabel}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
