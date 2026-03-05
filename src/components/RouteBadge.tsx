import type { RouteListEntry, Language } from '../types'
import { getCompanyChipStyle, getRouteStyle } from '../utils'
import { COMPANY_LABELS, MTR_ROUTE_LABELS } from '../constants/companies'

type Props = {
  entry: RouteListEntry
  language: Language
  specialLabel?: string
}

export function RouteBadge({ entry, language, specialLabel }: Props) {
  const primaryCompany = entry.companyCodes[0]
  const companyStyle = getCompanyChipStyle(entry.companyCodes)
  const routeStyle = getRouteStyle(primaryCompany, entry.routeType)
  const route = entry.route
  const isZh = language === 'zh-HK'

  const companyLabel =
    entry.companyCodes.length > 0
      ? entry.companyCodes
          .map((code) =>
            isZh
              ? COMPANY_LABELS[code] ?? code.toUpperCase()
              : code.toUpperCase(),
          )
          .join(' / ')
      : '—'

  const mtrLabel =
    primaryCompany === 'mtr' && route
      ? MTR_ROUTE_LABELS[route.trim().toUpperCase()]
      : undefined

  const routeDisplayLabel = mtrLabel
    ? `${route}  ${isZh ? mtrLabel.zh : mtrLabel.en}`
    : route

  const isSpecial = entry.serviceType != '1'

  return (
    <>
      <span className="route-list-company" style={companyStyle}>
        {companyLabel}
      </span>
      <span className="route-list-number-wrap">
        <span className="route-list-number" style={routeStyle}>
          {routeDisplayLabel}
        </span>
        {isSpecial && specialLabel && (
          <span className="route-list-special-badge">
            {specialLabel}
          </span>
        )}
      </span>
    </>
  )
}
