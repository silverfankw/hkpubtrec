import type { Journey, JourneyFormState, RouteType, RouteStyle } from './types'
import { COMPANY_CHIP_COLORS } from './constants/companies'
import { COMPANY_ROUTE_STYLES, COMPANY_ROUTE_TYPE_RULES } from './constants/routeConfig'

export const STORAGE_KEY = 'hkpubtrec_journeys_v1'

export function sanitizeVehiclePlate(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-HJ-NPR-Z0-9]/g, '')
}

export function getLocalDateString(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

export function getCompanyChipStyle(companyCodes: string[]): React.CSSProperties | undefined {
  if (!companyCodes.length) return undefined
  if (companyCodes.length >= 2) {
    const c1 = COMPANY_CHIP_COLORS[companyCodes[0]]
    const c2 = COMPANY_CHIP_COLORS[companyCodes[1]]
    if (c1 && c2) {
      return {
        background: `linear-gradient(140deg, ${c1.backgroundColor} 50%, ${c2.backgroundColor} 50%)`,
        color: '#ffffff',
      }
    }
  }
  return COMPANY_CHIP_COLORS[companyCodes[0]]
}

export function getRouteStyle(
  companyCode: string | undefined,
  routeType: RouteType,
): RouteStyle | undefined {
  if (!companyCode) return undefined
  const companyStyles = COMPANY_ROUTE_STYLES[companyCode.toLowerCase()]
  if (!companyStyles) return undefined
  const style = companyStyles[routeType]
  return style && Object.keys(style).length > 0 ? style : undefined
}

export function getRouteType(companyCode: string | undefined, normalizedRoute: string): RouteType {
  const rules =
    COMPANY_ROUTE_TYPE_RULES[companyCode?.toLowerCase() ?? ''] ??
    COMPANY_ROUTE_TYPE_RULES.default
  for (const rule of rules) {
    if (rule.regex.test(normalizedRoute)) return rule.type
  }
  return 'regular'
}

export function createEmptyFormState(): JourneyFormState {
  return {
    date: getLocalDateString(),
    route: '',
    bound: '',
    fromStop: '',
    toStop: '',
    vehiclePlate: '',
    notes: '',
  }
}

export function loadJourneysFromStorage(): Journey[] {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
    if (!raw) return []
    const parsed = JSON.parse(raw) as Journey[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function sanitizeNonNegative(value: string): string {
  if (value.startsWith('-')) return ''
  return value.replace(/[^0-9]/g, '')
}

// ─── Export / Import ──────────────────────────────────────────────────────────

type ExportedJourney = Omit<Journey, 'id' | 'totalOnBoard' | 'boardingCount' | 'alightingCount'>

function stripJourneyForExport(journey: Journey): ExportedJourney {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, totalOnBoard: _t, boardingCount: _b, alightingCount: _a, ...rest } = journey
  return Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== undefined),
  ) as ExportedJourney
}

export function exportJourneyToJson(journey: Journey): string {
  return JSON.stringify(stripJourneyForExport(journey))
}

export function exportAllJourneysToJson(journeys: Journey[]): string {
  return JSON.stringify(journeys.map(stripJourneyForExport))
}

export function downloadJsonFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function isDuplicateJourney(existing: Journey[], incoming: Journey): boolean {
  return existing.some(
    (j) =>
      j.date === incoming.date &&
      j.route === incoming.route &&
      j.bound === incoming.bound &&
      j.fromStop === incoming.fromStop &&
      j.toStop === incoming.toStop,
  )
}

export function importJourneysFromJson(
  raw: string,
  existing: Journey[],
): { newJourneys: Journey[]; skippedCount: number } {
  const parsed: unknown = JSON.parse(raw)
  const items = Array.isArray(parsed) ? parsed : [parsed]
  const newJourneys: Journey[] = []
  let skippedCount = 0
  let pool = [...existing]

  for (const item of items) {
    if (typeof item !== 'object' || item === null) continue
    const j = item as Partial<Journey>
    if (!j.date || !j.route || !j.bound || !j.fromStop || !j.toStop) continue

    const candidate: Journey = {
      ...(j as Journey),
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    }

    if (isDuplicateJourney(pool, candidate)) {
      skippedCount++
      continue
    }

    newJourneys.push(candidate)
    pool = [...pool, candidate]
  }

  return { newJourneys, skippedCount }
}
