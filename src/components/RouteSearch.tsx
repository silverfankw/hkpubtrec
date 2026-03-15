import { useState, useMemo, useEffect } from 'react'
import type { RouteListEntry, Language } from '../types'
import type { TranslationKeys } from '../constants/translations'
import { RouteBadge } from './RouteBadge'
import { RouteKeypad } from './RouteKeypad'
import { COMPANY_LABELS, COMPANY_CHIP_COLORS } from '../constants/companies'
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
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set())
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

  useEffect(() => {
    // Mobile keypad: each tap is deliberate — apply immediately, no debounce needed
    if (isMobile) {
      setDebouncedSearch(routeSearch)
      return
    }
    const timer = setTimeout(() => setDebouncedSearch(routeSearch), 150)
    return () => clearTimeout(timer)
  }, [routeSearch, isMobile])

  // Reset company filter when search term changes
  useEffect(() => {
    setSelectedCompanies(new Set())
  }, [debouncedSearch])

  // Pre-normalize once per routeEntries load — avoids repeated normalize+toLowerCase in every filter
  const normalizedEntries = useMemo(() =>
    routeEntries.map((entry) => ({
      entry,
      routeNorm: (entry.route ?? '').trim().normalize('NFKC').toLowerCase(),
    })),
  [routeEntries])

  const filteredRouteEntries = useMemo(() => {
    const COMPANY_ORDER: Record<string, number> = { kmb: 0, ctb: 1, nlb: 2, gmb: 3 }
    if (!normalizedEntries.length) return []
    const companyRank = (codes: string[]) => {
      const primary = (codes[0] ?? '').toLowerCase()
      return primary in COMPANY_ORDER ? COMPANY_ORDER[primary] : 99
    }
    const sortByCompanyNumberAndService = (a: RouteListEntry, b: RouteListEntry) => {
      const rankA = companyRank(a.companyCodes)
      const rankB = companyRank(b.companyCodes)
      if (rankA !== rankB) return rankA - rankB
      const routeCompare = (a.route ?? '').localeCompare(b.route ?? '', undefined, { numeric: true })
      if (routeCompare !== 0) return routeCompare
      const isSpecialA = a.serviceType !== '1'
      const isSpecialB = b.serviceType !== '1'
      if (isSpecialA !== isSpecialB) return isSpecialA ? 1 : -1
      return a.routeId.localeCompare(b.routeId)
    }

    const rawTerm = debouncedSearch.trim()
    if (!rawTerm) {
      return normalizedEntries.map(n => n.entry).sort(sortByCompanyNumberAndService).slice(0, 30)
    }

    const termLower = rawTerm.normalize('NFKC').toLowerCase()

    // Score each entry once: 0 = full match, 1 = prefix match (already filtered to prefix-only)
    type Scored = { entry: RouteListEntry; score: number }
    const scored: Scored[] = []
    for (const { entry, routeNorm } of normalizedEntries) {
      if (!routeNorm.startsWith(termLower)) continue
      scored.push({ entry, score: routeNorm === termLower ? 0 : 1 })
    }

    return scored
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score
        return sortByCompanyNumberAndService(a.entry, b.entry)
      })
      .slice(0, 80)
      .map(s => s.entry)
  }, [normalizedEntries, debouncedSearch])

  const availableCompanies = useMemo(() => {
    if (!debouncedSearch.trim()) return []
    const seen = new Set<string>()
    const result: string[] = []
    for (const entry of filteredRouteEntries) {
      const primary = (entry.companyCodes[0] ?? '').toLowerCase()
      if (primary && !seen.has(primary)) {
        seen.add(primary)
        result.push(primary)
      }
    }
    return result.length > 1 ? result : []
  }, [filteredRouteEntries, debouncedSearch])

  const displayedEntries = useMemo(() => {
    if (selectedCompanies.size === 0) return filteredRouteEntries
    return filteredRouteEntries.filter((entry) =>
      entry.companyCodes.some((code) => selectedCompanies.has(code.toLowerCase())),
    )
  }, [filteredRouteEntries, selectedCompanies])

  return (
    <div id="route-bound-section" className="route-bound-section" aria-labelledby="route-bound">
      {isLoading && <p className="helper-text">{t.routesLoading}</p>}
      {error && <p className="helper-text helper-text-error">{t.routesError}</p>}

      <div className="route-search-details">
        <div className={`route-search${isMobile && keypadVisible ? ' route-search--keypad-open' : ''}`}>
          <div className="form-field">
            <div className="route-search-input-wrap">
              <span className="route-search-icon" aria-hidden="true">🔍</span>
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

          {availableCompanies.length > 0 && (
            <div className="route-company-filters">
              {availableCompanies.map((code) => {
                const isActive = selectedCompanies.has(code)
                const label = language === 'zh-HK' ? (COMPANY_LABELS[code] ?? code.toUpperCase()) : code.toUpperCase()
                const chipColor = COMPANY_CHIP_COLORS[code]
                return (
                  <button
                    key={code}
                    type="button"
                    className={`route-company-filter-chip${isActive ? ' route-company-filter-chip--active' : ''}`}
                    style={isActive && chipColor ? { backgroundColor: chipColor.backgroundColor, color: chipColor.color } : undefined}
                    onClick={() =>
                      setSelectedCompanies((prev) => {
                        const next = new Set(prev)
                        if (next.has(code)) next.delete(code)
                        else next.add(code)
                        return next
                      })
                    }
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          )}

          <div className="route-list">
            {displayedEntries.length === 0 ? (
              <p className="empty-state">{t.noRoutesFound}</p>
            ) : (
              <ul className="route-list-items">
                {displayedEntries.map((entry) => {
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
                        <RouteBadge entry={entry} language={language} specialLabel={t.specialDepartureLabel} />
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
