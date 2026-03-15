import type { RouteListEntry, Language } from '../types'
import { getCompanyChipStyle, getRouteStyle } from '../utils'
import { COMPANY_LABELS, COMPANY_CHIP_COLORS, MTR_ROUTE_LABELS } from '../constants/companies'

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
    ? `${isZh ? mtrLabel.zh : mtrLabel.en}`
    : route

  const isSpecial = entry.serviceType != '1'
  const isMultiCompany = entry.companyCodes.length >= 2

  // CJK characters count as 2 units, others as 1
  const effectiveLen = [...(routeDisplayLabel ?? '')].reduce(
    (sum, ch) => sum + (/\p{Script=Han}/u.test(ch) ? 2 : 1),
    0,
  )

  return (
    <>
      <span className={`route-list-company${isMultiCompany ? ' route-list-company--multi' : ''}`} style={isMultiCompany ? undefined : companyStyle}>
        {isMultiCompany
          ? entry.companyCodes.map((code) => {
              const chipColor = COMPANY_CHIP_COLORS[code]
              const label = isZh ? (COMPANY_LABELS[code] ?? code.toUpperCase()) : code.toUpperCase()
              return (
                <span
                  key={code}
                  className="route-list-company-slice"
                  style={chipColor ? { backgroundColor: chipColor.backgroundColor, color: chipColor.color } : undefined}
                >
                  {label}
                </span>
              )
            })
          : companyLabel}
      </span>
      <span className="route-list-number-wrap">
        <span className={`route-list-number${isSpecial && specialLabel ? ' route-list-number--special' : ''}`} style={routeStyle} data-len={effectiveLen}>
          <span className="route-list-number-text">{routeDisplayLabel}</span>
          {isSpecial && specialLabel && (
            <span className="route-list-special-badge">
              {specialLabel}
            </span>
          )}
        </span>
      </span>
    </>
  )
}
