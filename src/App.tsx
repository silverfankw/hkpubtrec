import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchEtaDb } from 'hk-bus-eta'
import type { EtaDb } from 'hk-bus-eta'
import './App.css'

type Journey = {
  id: string
  date: string
  route: string
  routeId?: string
  bound: string
  fromStop: string
  toStop: string
  time?: string
  vehiclePlate?: string
  boardingCount?: number
  alightingCount?: number
  notes?: string
}

type JourneyFormState = {
  date: string
  route: string
  bound: string
  fromStop: string
  toStop: string
  vehiclePlate: string
  notes: string
}

type BoundOption = {
  routeId: string
  labelZh: string
  labelEn: string
}

type RouteBoundMap = Record<string, BoundOption[]>

type RouteListEntry = {
  routeId: string
  route: string
  serviceType: string
  companyCodes: string[]
  routeType: RouteType
  origZh: string
  destZh: string
  origEn: string
  destEn: string
}

const STORAGE_KEY = 'hkpubtrec_journeys_v1'

/** Sanitize vehicle plate: capital A-Z (excl. I,O,Q) + 0-9 only */
function sanitizeVehiclePlate(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-HJ-NPR-Z0-9]/g, '')
}

function getLocalDateString(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const COMPANY_LABELS: Record<string, string> = {
  kmb: '九巴',
  ctb: '城巴',
  gmb: '綠色小巴',
  nlb: '嶼巴',
  lrtfeeder: '港鐵接駁巴士',
  lightrail: '輕鐵',
  sunferry: '新渡輪',
  fortuneferry: '富裕小輪',
  hkkf: '港九小輪',
  mtr: '港鐵',
}

const COMPANY_CHIP_COLORS: Record<string, { backgroundColor: string; color: string }> = {
  gmb: { backgroundColor: '#009E60', color: '#ffffff' },
  kmb: { backgroundColor: '#CF0001', color: '#ffffff' },
  ctb: { backgroundColor: '#FFD700', color: '#ffffff'},
  nlb: { backgroundColor: '#027233', color: '#ffffff' },
  lrtfeeder: { backgroundColor: '#0E2A51', color: '#ffffff' },
  lightrail: { backgroundColor: '#D3A809', color: '#ffffff' },
}

const MTR_ROUTE_LABELS: Record<string, { zh: string; en: string }> = {
  TKL: { zh: '將軍澳線', en: 'Tseung Kwan O Line' },
  TWL: { zh: '荃灣線', en: 'Tsuen Wan Line' },
  KTL: { zh: '觀塘線', en: 'Kwun Tong Line' },
  SIL: { zh: '南港島線', en: 'South Island Line' },
  TML: { zh: '屯馬線', en: 'Tuen Ma Line' },
  AEL: { zh: '機場快線', en: 'Airport Express Line' },
  ISL: { zh: '港島線', en: 'Island Line' },
  EAL: { zh: '東鐵線', en: 'East Rail Line' },
  DRL: { zh: '迪士尼線', en: 'Disneyland Resort Line' },
  TCL: { zh: '東涌線', en: 'Tung Chung Line' },
}

type Language = 'zh-HK' | 'en'

const translations: Record<
  Language,
  {
    appTitle: string
    appSubtitle: string
    clearAll: string
    searchBusRouteTitle: string
    routeSearchLabel: string
    routeSearchPlaceholder: string
    noRoutesFound: string
    stationsForSelectedRoute: string
    selectRouteHint: string
    noStationsForRoute: string
    newJourneyTitle: string
    newJourneyHelper: string
    dateLabel: string
    routeLabel: string
    boundLabel: string
    fromStopLabel: string
    toStopLabel: string
    timeLabel: string
    boardingLabel: string
    alightingLabel: string
    notesLabel: string
    saveJourney: string
    journeysTitle: string
    filterByRoute: string
    filterByBound: string
    filterRoutePlaceholder: string
    filterBoundPlaceholder: string
    noJourneys: string
    routesLoading: string
    routesError: string
    validationMissingFields: string
    validationCountsMustBeNumber: string
    stationNameLabel: string
    arrivalTimeLabel: string
    aboardLabel: string
    alightingStationLabel: string
    remarkLabel: string
    journeyDragHint: string
    durationLabel: string
    durationPlaceholder: string
    selectAllStations: string
    selectNoneStations: string
    lockDragSelection: string
    unlockDragSelection: string
    specialDepartureLabel: string
    tabRecord: string
    tabSavedJourneys: string
    vehiclePlateLabel: string
    vehiclePlatePlaceholder: string
  }
> = {
  'zh-HK': {
    appTitle: '公共交通行程紀錄',
    appSubtitle: '搜尋巴士路線及方向，然後記錄由起點至終點的行程，包括可選時間及上落客人數。',
    clearAll: '清除全部',
    searchBusRouteTitle: '搜尋巴士路線',
    routeSearchLabel: '以巴士路線編號／起點站／終點站搜尋',
    routeSearchPlaceholder: '例如：1A、中環、旺角',
    noRoutesFound: '找不到相關路線，請嘗試其他關鍵字。',
    stationsForSelectedRoute: '所選路線之車站',
    selectRouteHint: '請先在上方列表選擇一條路線以顯示車站。',
    noStationsForRoute: '此路線未有可用的車站資料。',
    newJourneyTitle: '新增行程',
    newJourneyHelper: '先在上方列表查詢官方路線，再在此紀錄你的搭乘行程。',
    dateLabel: '日期',
    routeLabel: '路線',
    boundLabel: '方向',
    fromStopLabel: '上車站',
    toStopLabel: '落車站',
    timeLabel: '時間（選填）',
    boardingLabel: '上車人數（選填）',
    alightingLabel: '落車人數（選填）',
    notesLabel: '備註（選填）',
    saveJourney: '儲存行程',
    journeysTitle: '已紀錄行程',
    filterByRoute: '以路線篩選',
    filterByBound: '以方向篩選',
    filterRoutePlaceholder: '搜尋路線',
    filterBoundPlaceholder: '搜尋方向',
    noJourneys: '暫未有行程紀錄，可在右方新增第一個紀錄。',
    routesLoading: '正在載入香港官方巴士路線資料…',
    routesError: '未能載入官方路線列表，你仍然可以手動輸入路線及方向。',
    validationMissingFields: '請填寫路線、方向、上車站及落車站。',
    validationCountsMustBeNumber: '上車及落車人數必須為數字。',
    stationNameLabel: '車站',
    arrivalTimeLabel: '到站時間',
    aboardLabel: '上車',
    alightingStationLabel: '落車',
    remarkLabel: '備註 (選填)',
    journeyDragHint: '在下方以滑鼠拖曳選取範圍以標示你的行程，然後按鎖定拖曳以防止誤選。',
    durationLabel: '行程時間',
    durationPlaceholder: '請輸入首尾站到站時間以計算',
    selectAllStations: '全選',
    selectNoneStations: '取消選取',
    lockDragSelection: '鎖定拖曳',
    unlockDragSelection: '解鎖拖曳',
    specialDepartureLabel: '特別班次',
    tabRecord: '新增行程',
    tabSavedJourneys: '已紀錄行程',
    vehiclePlateLabel: '車牌',
    vehiclePlatePlaceholder: '大寫英文字母及數字（不含 I、O、Q）',
  },
  en: {
    appTitle: 'Public Transport Journey Record',
    appSubtitle:
      'Search your bus route and bound, then record journeys from starting stop to destination with optional time and passenger counts.',
    clearAll: 'Clear all',
    searchBusRouteTitle: 'Search bus route',
    routeSearchLabel: 'Search by Route No. / origin stop / destination stop',
    routeSearchPlaceholder: 'e.g. 1A, Central, Mong Kok',
    noRoutesFound: 'No routes found. Try another keyword.',
    stationsForSelectedRoute: 'Stations for selected route',
    selectRouteHint: 'Select a route from the list above to see its station list.',
    noStationsForRoute: 'No station data available for this route.',
    newJourneyTitle: 'New journey',
    newJourneyHelper:
      'Use the route search on the upper panel to look up official routes while recording your journeys here.',
    dateLabel: 'Date',
    routeLabel: 'Route',
    boundLabel: 'Bound / direction',
    fromStopLabel: 'Starting stop',
    toStopLabel: 'Destination',
    timeLabel: 'Time (optional)',
    boardingLabel: 'Boarding people (optional)',
    alightingLabel: 'Alighting people (optional)',
    notesLabel: 'Notes (optional)',
    saveJourney: 'Save journey',
    journeysTitle: 'Recorded journeys',
    filterByRoute: 'Filter by route',
    filterByBound: 'Filter by bound',
    filterRoutePlaceholder: 'Search route',
    filterBoundPlaceholder: 'Search bound / direction',
    noJourneys: 'No journeys recorded yet. Add your first journey on the right.',
    routesLoading: 'Loading official Hong Kong bus routes…',
    routesError: 'Unable to load official route list. You can still type route and bound manually.',
    validationMissingFields: 'Please fill in route, bound, starting stop and destination.',
    validationCountsMustBeNumber: 'Boarding and alighting counts must be numbers.',
    stationNameLabel: 'Station',
    arrivalTimeLabel: 'Arrival',
    aboardLabel: 'Aboard',
    alightingStationLabel: 'Alight',
    remarkLabel: 'Remark (optional)',
    journeyDragHint: 'Drag to highlight your journey (from → to), then lock drag to prevent accidental selection.',
    durationLabel: 'Duration',
    durationPlaceholder: 'Enter first & last stop arrival times to calculate',
    selectAllStations: 'Select all',
    selectNoneStations: 'Select none',
    lockDragSelection: 'Lock drag',
    unlockDragSelection: 'Unlock drag',
    specialDepartureLabel: 'Special',
    tabRecord: 'Add journey',
    tabSavedJourneys: 'Saved journeys',
    vehiclePlateLabel: 'Vehicle plate',
    vehiclePlatePlaceholder: 'Capital letters & numbers (excl. I, O, Q)',
  },
}

type RouteType =
  | 'regular'
  | 'xhtEhc'
  | 'marathon'
  | 'whc'
  | 'airport'
  | 'external'
  | 'overnight'
  | 'airportOvernight'
  | 'premier'
  | 'shuttle'
  | 'disneyRecreational'
  | 'r8'
  | 'awe' // KMB AWE type route
  | 'peak'  // CTB Peak type route
  | 'hkSightseeing' // CTB H-type route
  | 'nlbSpecial' // NLB Special / N-type route
  | 'nlbExpress' // NLB Express route
  | 'mtrTkl'  // MTR Tseung Kwan O Line
  | 'mtrTwl'  // MTR Tsuen Wan Line
  | 'mtrKtl'  // MTR Kwun Tong Line
  | 'mtrSil'  // MTR South Island Line
  | 'mtrTml'  // MTR Tuen Ma Line
  | 'mtrAel'  // MTR Airport Express Line
  | 'mtrIsl'  // MTR Island Line
  | 'mtrEal'  // MTR East Rail Line
  | 'mtrDrl'  // MTR Disneyland Resort Line
  | 'mtrTcl'  // MTR Tung Chung Line


type RouteStyle = { backgroundColor?: string; color?: string }

/** Route number styles per company. Add entries for kmb, ctb, nlb, etc. */
const COMPANY_ROUTE_STYLES: Record<
  string,
  Partial<Record<RouteType, RouteStyle>>
> = {
  kmb: {
    regular: {},
    xhtEhc: { backgroundColor: '#CF0001', color: '#ffffff' },
    marathon: { backgroundColor: '#CF0001', color: '#ffffff' },
    whc: { backgroundColor: '#027233', color: '#ffffff' },
    airport: { backgroundColor: '#0A2163', color: '#E3D026' },
    external: { backgroundColor: '#ff5000', color: '#ffffff' },
    overnight: { backgroundColor: '#000000', color: '#ffffff' },
    airportOvernight: { backgroundColor: '#000000', color: '#DED702' },
    premier: { backgroundColor: '#E5B034' },
    shuttle: { backgroundColor: '#EB5136', color: '#0E2775' },
    disneyRecreational: { backgroundColor: '#146FD1' },
    r8: { backgroundColor: '#72C8E5', color: '#1C2EB5' },
    awe: { backgroundColor: '#6F2F9F', color: '#ffffff' },
  },
  ctb: {
    regular: { backgroundColor: '#0059BD', color: '#ffffff' },
    xhtEhc: { backgroundColor: '#CF0001', color: '#ffffff' },
    whc: { backgroundColor: '#027233', color: '#ffffff' },
    airport: { backgroundColor: '#BB2B44', color: '#ffffff' },
    external: { backgroundColor: '#DB3831', color: '#FFFFFF' },
    overnight: { backgroundColor: '#000000', color: '#DED702' },
    airportOvernight: { backgroundColor: '#CF314B', color: '#ffffff' },
    disneyRecreational: { backgroundColor: '#72C8E5', color: '#1C2EB5' },
    r8: { backgroundColor: '#72C8E5', color: '#1C2EB5' },
    shuttle: { backgroundColor: '#0E2775', color: '#ffffff' },
    peak: { backgroundColor: '#3CC3D9', color: '#ffffff' },
    hkSightseeing: {backgroundColor: '#679AD1', color: '#ffffff' },
  },
  nlb: {
    regular: { backgroundColor: '#000080', color: '#ffffff' },
    airport: { backgroundColor: '#DB3831', color: '#FFFF00' },
    overnight: { backgroundColor: '#000000', color: '#FFFF00' },
    nlbSpecial: { backgroundColor: '#027233', color: '#ffffff' },
    nlbExpress: { backgroundColor: '#000080', color: '#FFFF00' },
  },
  mtr: {
    mtrTkl: { backgroundColor: '#7F3D91', color: '#ffffff' },
    mtrTwl: { backgroundColor: '#FF0000', color: '#ffffff' },
    mtrKtl: { backgroundColor: '#007500', color: '#ffffff' },
    mtrSil: { backgroundColor: '#CFCF0A', color: '#ffffff' },
    mtrTml: { backgroundColor: '#992E05', color: '#ffffff' },
    mtrAel: { backgroundColor: '#087D86', color: '#ffffff' },
    mtrIsl: { backgroundColor: '#0175BB', color: '#ffffff' },
    mtrEal: { backgroundColor: '#5BB7E9', color: '#ffffff' },
    mtrDrl: { backgroundColor: '#E86CA4', color: '#ffffff' },
    mtrTcl: { backgroundColor: '#E3A147', color: '#ffffff' },
  }
}

function getRouteStyle(
  companyCode: string | undefined,
  routeType: RouteType,
): RouteStyle | undefined {
  if (!companyCode) return undefined
  const companyStyles = COMPANY_ROUTE_STYLES[companyCode.toLowerCase()]
  if (!companyStyles) return undefined
  const style = companyStyles[routeType]
  return style && Object.keys(style).length > 0 ? style : undefined
}

type RouteTypeRule = { type: RouteType; regex: RegExp }

/** Route type rules per company. Order matters: first match wins. */
const COMPANY_ROUTE_TYPE_RULES: Record<string, RouteTypeRule[]> = {
  kmb: [
    { type: 'regular', regex: /^(331)[S]?/ },
    { type: 'xhtEhc', regex: /^[136]\d{2}[A-Z]?$/ },
    { type: 'whc', regex: /^9(?!17|18|45$)\d{2}[A-Z]?$/ },
    { type: 'overnight', regex: /^(N(?!A)[A-Z0-9]+|270S|271S|293S)$/i },
    { type: 'airport', regex: /^A/ },
    { type: 'airportOvernight', regex: /^NA/ },
    { type: 'external', regex: /^E/ },
    { type: 'shuttle', regex: /^S(?!P)/ },
    { type: 'premier', regex: /^P96[08]$/ },
    { type: 'disneyRecreational', regex: /^R(33|42)$/i },
    { type: 'r8', regex: /^R8$/i },
    { type: 'marathon', regex: /^R(108|307|603|673|678|680|934|936|948|960|961|968)$/i },
    { type: 'awe', regex: /^X(33|36|40|43|47)$/i },
  ],
  ctb: [
    { type: 'airportOvernight', regex: /^NA/ },
    { type: 'airport', regex: /^A/ },
    { type: 'xhtEhc', regex: /^[136]\d{2}[A-Z]?$/ },
    { type: 'whc', regex: /^X?9\d{2}[A-Za-z]?$/ },
    { type: 'external', regex: /^[BE]/ },
    { type: 'overnight', regex: /^N/i },
    { type: 'disneyRecreational', regex: /^R(11|22)$/i },
    { type: 'r8', regex: /^R8$/i },
    { type: 'peak', regex: /^X?15[B]?$/i },
    { type: 'shuttle', regex: /^S(?!P)/i },
    { type: 'hkSightseeing', regex: /^H/i },
  ],
  nlb: [
    { type: 'airport', regex: /^A/ },
    { type: 'overnight', regex: /^N/i },
    { type: 'nlbSpecial', regex: /^(7|34)S$/i },
    { type: 'nlbExpress', regex: /^(X11R|XB2|NB2)$/i },
  ],
  mtr: [
    { type: 'mtrTkl', regex: /^TKL$/i },
    { type: 'mtrTwl', regex: /^TWL$/i },
    { type: 'mtrKtl', regex: /^KTL$/i },
    { type: 'mtrSil', regex: /^SIL$/i },
    { type: 'mtrTml', regex: /^TML$/i },
    { type: 'mtrAel', regex: /^AEL$/i },
    { type: 'mtrIsl', regex: /^ISL$/i },
    { type: 'mtrEal', regex: /^EAL$/i },
    { type: 'mtrDrl', regex: /^DRL$/i },
    { type: 'mtrTcl', regex: /^TCL$/i },
  ],
  default: [],
}

function getRouteType(companyCode: string | undefined, normalizedRoute: string): RouteType {
  const rules =
    COMPANY_ROUTE_TYPE_RULES[companyCode?.toLowerCase() ?? ''] ??
    COMPANY_ROUTE_TYPE_RULES.default
  for (const rule of rules) {
    if (rule.regex.test(normalizedRoute)) return rule.type
  }
  return 'regular'
}

function createEmptyFormState(): JourneyFormState {
  const today = getLocalDateString()

  return {
    date: today,
    route: '',
    bound: '',
    fromStop: '',
    toStop: '',
    vehiclePlate: '',
    notes: '',
  }
}

function App() {
  const [journeys, setJourneys] = useState<Journey[]>([])
  const [form, setForm] = useState<JourneyFormState>(() => createEmptyFormState())
  const [filterRoute, setFilterRoute] = useState('')
  const [filterBound, setFilterBound] = useState('')
  const [language, setLanguage] = useState<Language>('zh-HK')
  const [etaDb, setEtaDb] = useState<EtaDb | null>(null)
  const [routeMap, setRouteMap] = useState<RouteBoundMap>({})
  const [routeEntries, setRouteEntries] = useState<RouteListEntry[]>([])
  const [routeSearch, setRouteSearch] = useState('')
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [isRouteDbLoading, setIsRouteDbLoading] = useState(true)
  const [routeDbError, setRouteDbError] = useState<string | null>(null)
  const [journeySelection, setJourneySelection] = useState<{
    routeId: string
    startOrder: number
    endOrder: number
  } | null>(null)
  const [stationStopData, setStationStopData] = useState<
    Record<
      string,
      { arrivalTime: string; aboard: string; alighting: string; remark: string }
    >
  >({})
  const isDraggingRef = useRef(false)
  const [dragSelectionLocked, setDragSelectionLocked] = useState(false)
  const [activeTab, setActiveTab] = useState<'record' | 'saved'>('record')

  const t = translations[language]

  const updateStationStop = (
    routeId: string,
    stopId: string,
    field: 'arrivalTime' | 'aboard' | 'alighting' | 'remark',
    value: string,
  ) => {
    const key = `${routeId}|${stopId}`
    setStationStopData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }))
  }

  useEffect(() => {
    if (!selectedRouteId) setJourneySelection(null)
  }, [selectedRouteId])

  useEffect(() => {
    if (!selectedRouteId || !routeEntries.length) return
    const entry = routeEntries.find((e) => e.routeId === selectedRouteId)
    if (!entry) return
    const boundLabel =
      language === 'zh-HK'
        ? `${entry.origZh} → ${entry.destZh}`
        : `${entry.origEn} → ${entry.destEn}`
    setForm((prev) => ({
      ...prev,
      route: entry.route,
      bound: boundLabel,
    }))
  }, [selectedRouteId, routeEntries, language])

  const handleStationMouseDown = (routeId: string, order: number) => {
    if (dragSelectionLocked) return
    isDraggingRef.current = true
    setJourneySelection({ routeId, startOrder: order, endOrder: order })
  }

  const handleStationMouseEnter = (routeId: string, order: number) => {
    if (!isDraggingRef.current) return
    setJourneySelection((prev) => {
      if (!prev || prev.routeId !== routeId) return prev
      return { ...prev, endOrder: order }
    })
  }

  useEffect(() => {
    const handleMouseUp = () => {
      isDraggingRef.current = false
    }
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as Journey[]
      if (Array.isArray(parsed)) {
        setJourneys(parsed)
      }
    } catch (error) {
      console.error('Failed to load journeys from storage', error)
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(journeys))
    } catch (error) {
      console.error('Failed to save journeys to storage', error)
    }
  }, [journeys])

  useEffect(() => {
    let cancelled = false

    async function loadDb() {
      try {
        const db: EtaDb = await fetchEtaDb()
        if (cancelled) return

        setEtaDb(db)

        const map: RouteBoundMap = {}
        const entries: RouteListEntry[] = []

        for (const [routeId, meta] of Object.entries(db.routeList)) {
          const routeNumber = meta.route.trim()
          if (!routeNumber) continue

          const normalizedRoute = routeNumber.toUpperCase()
          const companyCodes = Array.isArray(meta.co) ? meta.co.map((code) => code.toLowerCase()) : []
          const routeType = getRouteType(companyCodes[0], normalizedRoute)

          const labelZh = `${meta.orig.zh} → ${meta.dest.zh}`
          const labelEn = `${meta.orig.en} → ${meta.dest.en}`
          if (!map[routeNumber]) {
            map[routeNumber] = []
          }

          if (!map[routeNumber].some((bound) => bound.labelZh === labelZh)) {
            map[routeNumber].push({ routeId, labelZh, labelEn })
          }

          entries.push({
            routeId,
            route: routeNumber,
            serviceType: meta.serviceType ?? '1',
            companyCodes,
            routeType,
            origZh: meta.orig.zh,
            destZh: meta.dest.zh,
            origEn: meta.orig.en,
            destEn: meta.dest.en,
          })
        }

        Object.values(map).forEach((bounds) => {
          bounds.sort((a, b) => a.labelZh.localeCompare(b.labelZh))
        })

        setRouteMap(map)
        setRouteEntries(
          entries.sort((a, b) => {
            if (a.route === b.route) {
              return a.origEn.localeCompare(b.origEn)
            }
            return a.route.localeCompare(b.route, undefined, { numeric: true })
          }),
        )
        setRouteDbError(null)
      } catch (error) {
        console.error('Failed to load route database from hk-bus-eta', error)
        setRouteDbError(
          'Unable to load official route list. You can still type route and bound manually.',
        )
      } finally {
        if (!cancelled) {
          setIsRouteDbLoading(false)
        }
      }
    }

    loadDb()

    return () => {
      cancelled = true
    }
  }, [])

  const knownRoutes = useMemo(() => {
    const set = new Set<string>()
    Object.keys(routeMap).forEach((route) => set.add(route))
    journeys.forEach((j) => {
      if (j.route.trim()) {
        set.add(j.route.trim())
      }
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }, [journeys, routeMap])

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
      return [...routeEntries].sort(sortByCompany).slice(0, 60)
    }

    const term = rawTerm.toLowerCase().normalize('NFKC')
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

    const useOriginDestMatch = term.length >= 2

    return routeEntries
      .filter((entry) => {
        const routeNorm = (entry.route ?? '').trim().normalize('NFKC')
        const routeLower = routeNorm.toLowerCase()
        const routeMatch = routeLower.startsWith(termLower)
        const zhMatch = useOriginDestMatch
          ? entry.origZh.toLowerCase().includes(term) || entry.destZh.toLowerCase().includes(term)
          : false
        const enMatch = useOriginDestMatch
          ? entry.origEn.toLowerCase().includes(term) || entry.destEn.toLowerCase().includes(term)
          : false

        return routeMatch || zhMatch || enMatch
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

  const selectedRouteMeta = useMemo(() => {
    if (!etaDb || !selectedRouteId) return null
    return etaDb.routeList[selectedRouteId] ?? null
  }, [etaDb, selectedRouteId])

  const selectedRouteStops = useMemo(() => {
    if (!etaDb || !selectedRouteMeta) return []
    console.log(selectedRouteMeta)

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
      return {
        id: stopId,
        order: index + 1,
        name,
      }
    })
  }, [etaDb, selectedRouteMeta, language])

  useEffect(() => {
    if (!selectedRouteId || !selectedRouteStops.length) return

    if (!journeySelection || journeySelection.routeId !== selectedRouteId) {
      setForm((prev) => ({ ...prev, fromStop: '', toStop: '' }))
      return
    }

    const start = Math.min(journeySelection.startOrder, journeySelection.endOrder)
    const end = Math.max(journeySelection.startOrder, journeySelection.endOrder)
    const fromStop = selectedRouteStops.find((s) => s.order === start)
    const toStop = selectedRouteStops.find((s) => s.order === end)
    if (fromStop && toStop) {
      setForm((prev) => ({
        ...prev,
        fromStop: fromStop.name,
        toStop: toStop.name,
      }))
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
    const firstKey = `${selectedRouteId}|${firstStop.id}`
    const lastKey = `${selectedRouteId}|${lastStop.id}`
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
  }, [
    journeySelection,
    selectedRouteId,
    selectedRouteStops,
    stationStopData,
    language,
  ])

  const visibleJourneys = useMemo(() => {
    const routeFilter = filterRoute.trim().toLowerCase()
    const boundFilter = filterBound.trim().toLowerCase()

    const filtered = journeys.filter((journey) => {
      const matchesRoute = routeFilter
        ? journey.route.toLowerCase().includes(routeFilter)
        : true
      const matchesBound = boundFilter
        ? journey.bound.toLowerCase().includes(boundFilter)
        : true
      return matchesRoute && matchesBound
    })

    return [...filtered].sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date)
      if (dateCmp !== 0) return dateCmp
      return b.id.localeCompare(a.id)
    })
  }, [journeys, filterRoute, filterBound])

  const updateForm = <K extends keyof JourneyFormState>(key: K, value: JourneyFormState[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedRoute = form.route.trim()
    const trimmedBound = form.bound.trim()
    const trimmedFromStop = form.fromStop.trim()
    const trimmedToStop = form.toStop.trim()

    if (!trimmedRoute || !trimmedBound || !trimmedFromStop || !trimmedToStop) {
      window.alert(t.validationMissingFields)
      return
    }

    const date = form.date || getLocalDateString()

    let matchedRouteId: string | undefined
    const candidates = routeMap[trimmedRoute]
    if (candidates && candidates.length > 0) {
      const match = candidates.find(
        (candidate) =>
          candidate.labelZh === trimmedBound || candidate.labelEn === trimmedBound,
      )
      matchedRouteId = match?.routeId
    }

    const entryBySelection = selectedRouteId
      ? routeEntries.find((e) => e.routeId === selectedRouteId && e.route === trimmedRoute)
      : undefined
    const entryByMatch = matchedRouteId
      ? routeEntries.find((e) => e.routeId === matchedRouteId)
      : null
    const selectedEntry = entryBySelection ?? entryByMatch
    const isSpecialDeparture = selectedEntry?.serviceType && selectedEntry.serviceType != '1'
    const routeToStore = isSpecialDeparture
      ? `${trimmedRoute} (${t.specialDepartureLabel})`
      : trimmedRoute

    const newJourney: Journey = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date,
      route: routeToStore,
      routeId: matchedRouteId,
      bound: trimmedBound,
      fromStop: trimmedFromStop,
      toStop: trimmedToStop,
      time: journeyDuration || undefined,
      vehiclePlate: form.vehiclePlate.trim() || undefined,
      notes: form.notes.trim() || undefined,
    }

    setJourneys((prev) => [...prev, newJourney])
    setForm(createEmptyFormState())
  }

  const handleClearAll = () => {
    if (!journeys.length) return
    const confirmed = window.confirm('Clear all recorded journeys? This cannot be undone.')
    if (!confirmed) return
    setJourneys([])
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1 className="app-title">{t.appTitle}</h1>
          <p className="app-subtitle">{t.appSubtitle}</p>
        </div>
        <div className="header-actions">
          <div className="language-toggle">
            <button
              type="button"
              className={
                language === 'zh-HK'
                  ? 'language-toggle-button language-toggle-button--active'
                  : 'language-toggle-button'
              }
              onClick={() => setLanguage('zh-HK')}
            >
              繁中
            </button>
            <button
              type="button"
              className={
                language === 'en'
                  ? 'language-toggle-button language-toggle-button--active'
                  : 'language-toggle-button'
              }
              onClick={() => setLanguage('en')}
            >
              EN
            </button>
          </div>
          <button type="button" className="clear-button" onClick={handleClearAll}>
            {t.clearAll}
          </button>
        </div>
      </header>

      <nav className="app-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'record'}
          className={`app-tab ${activeTab === 'record' ? 'app-tab--active' : ''}`}
          onClick={() => setActiveTab('record')}
        >
          {t.tabRecord}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'saved'}
          className={`app-tab ${activeTab === 'saved' ? 'app-tab--active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          {t.tabSavedJourneys}
        </button>
      </nav>

      <main className="app-layout">
        {activeTab === 'record' && (
          <>
        <section className="panel">
          <h2 className="panel-title">{t.searchBusRouteTitle}</h2>
          {isRouteDbLoading && <p className="helper-text">{t.routesLoading}</p>}
          {routeDbError && <p className="helper-text helper-text-error">{t.routesError}</p>}

          <div className="route-search">
            <div className="form-field">
              <label htmlFor="routeSearch">{t.routeSearchLabel}</label>
              <input
                id="routeSearch"
                type="text"
                placeholder={t.routeSearchPlaceholder}
                value={routeSearch}
                onChange={(event) => setRouteSearch(event.target.value)}
              />
            </div>

            <div className="route-list">
              {filteredRouteEntries.length === 0 ? (
                <p className="empty-state">{t.noRoutesFound}</p>
              ) : (
                <ul className="route-list-items">
                  {filteredRouteEntries.map((entry: RouteListEntry) => {
                    const primaryCompany = entry.companyCodes[0]
                    const routeStyle = getRouteStyle(primaryCompany, entry.routeType)

                    const companyLabel =
                      entry.companyCodes.length > 0
                        ? entry.companyCodes
                            .map((code) =>
                              language === 'zh-HK'
                                ? COMPANY_LABELS[code] ?? code.toUpperCase()
                                : code.toUpperCase(),
                            )
                            .join(' / ')
                        : language === 'zh-HK'
                          ? '—'
                          : '—'

                    const companyStyle = primaryCompany
                      ? COMPANY_CHIP_COLORS[primaryCompany]
                      : undefined

                    const originLabel = language === 'zh-HK' ? entry.origZh : entry.origEn
                    const destLabel = language === 'zh-HK' ? entry.destZh : entry.destEn

                    const routeDisplayLabel =
                      primaryCompany === 'mtr' && entry.route
                        ? (() => {
                            const labels = MTR_ROUTE_LABELS[entry.route.trim().toUpperCase()]
                            if (labels) {
                              const label = language === 'zh-HK' ? labels.zh : labels.en
                              return `${entry.route}  ${label}`
                            }
                            return entry.route
                          })()
                        : entry.route

                    return (
                      <li key={entry.routeId}>
                        <button
                          type="button"
                          className={
                            selectedRouteId === entry.routeId
                              ? 'route-list-item route-list-item--active'
                              : 'route-list-item'
                          }
                          onClick={() => setSelectedRouteId(entry.routeId)}
                        >
                          <span className="route-list-company" style={companyStyle}>
                            {companyLabel}
                          </span>
                          <span className="route-list-number-wrap">
                            <span className="route-list-number" style={routeStyle}>
                              {routeDisplayLabel}
                            </span>
                            {entry.serviceType != '1' && (
                              <span className="route-list-special-badge">
                                {t.specialDepartureLabel}
                              </span>
                            )}
                          </span>
                          <span className="route-list-origin">{originLabel}</span>
                          <span className="route-list-arrow">→</span>
                          <span className="route-list-dest">{destLabel}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="station-section">
            <h3 className="station-title">{t.stationsForSelectedRoute}</h3>
            {!selectedRouteId && (
              <p className="empty-state">{t.selectRouteHint}</p>
            )}
            {selectedRouteId && selectedRouteStops.length === 0 && (
              <p className="empty-state">{t.noStationsForRoute}</p>
            )}
            {selectedRouteStops.length > 0 && selectedRouteId && (
              <>
                <div className="station-list-actions">
                  <p
                    className={`helper-text station-drag-hint ${
                      selectedRouteId && selectedRouteStops.length > 0 &&
                      (!journeySelection || journeySelection.routeId !== selectedRouteId)
                        ? 'station-drag-hint--highlight'
                        : ''
                    }`}
                  >
                    {t.journeyDragHint}
                  </p>
                  <div className="station-select-buttons">
                    <button
                      type="button"
                      className="station-select-btn"
                      onClick={() =>
                        setJourneySelection({
                          routeId: selectedRouteId,
                          startOrder: 1,
                          endOrder: selectedRouteStops.length,
                        })
                      }
                    >
                      {t.selectAllStations}
                    </button>
                    <button
                      type="button"
                      className="station-select-btn"
                      onClick={() => setJourneySelection(null)}
                    >
                      {t.selectNoneStations}
                    </button>
                    <button
                      type="button"
                      className={`station-select-btn ${dragSelectionLocked ? 'station-select-btn--locked' : ''}`}
                      onClick={() => setDragSelectionLocked((prev) => !prev)}
                      title={dragSelectionLocked ? t.unlockDragSelection : t.lockDragSelection}
                    >
                      {dragSelectionLocked ? t.unlockDragSelection : t.lockDragSelection}
                    </button>
                  </div>
                </div>
                <ul className="station-list station-list--selectable">
                  <li className="station-list-header">
                    <span className="station-order">#</span>
                    <span className="station-name">{t.stationNameLabel}</span>
                    <span className="station-input-col">{t.arrivalTimeLabel}</span>
                    <span className="station-input-col">{t.aboardLabel}</span>
                    <span className="station-input-col">{t.alightingStationLabel}</span>
                    <span className="station-input-col station-remark-col">{t.remarkLabel}</span>
                  </li>
                  {selectedRouteStops.map((stop: { id: string; order: number; name: string }) => {
                    const sel = journeySelection?.routeId === selectedRouteId ? journeySelection : null
                    const start = sel ? Math.min(sel.startOrder, sel.endOrder) : 0
                    const end = sel ? Math.max(sel.startOrder, sel.endOrder) : 0
                    const isInRange = sel ? stop.order >= start && stop.order <= end : false

                    const key = `${selectedRouteId}|${stop.id}`
                    const data = stationStopData[key] ?? {
                      arrivalTime: '',
                      aboard: '',
                      alighting: '',
                      remark: '',
                    }

                    return (
                      <li
                        key={stop.id}
                        className={`station-list-item ${isInRange ? 'station-list-item--selected' : sel ? 'station-list-item--disabled' : ''}`}
                        onMouseDown={() => handleStationMouseDown(selectedRouteId, stop.order)}
                        onMouseEnter={() => handleStationMouseEnter(selectedRouteId, stop.order)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleStationMouseDown(selectedRouteId, stop.order)
                          }
                        }}
                      >
                        <span className="station-order">{stop.order}</span>
                        <span className="station-name">{stop.name}</span>
                        <input
                          type="time"
                          className="station-input"
                          value={data.arrivalTime}
                          onChange={(e) =>
                            updateStationStop(
                              selectedRouteId,
                              stop.id,
                              'arrivalTime',
                              e.target.value,
                            )
                          }
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                        <input
                          type="number"
                          className="station-input"
                          min={0}
                          inputMode="numeric"
                          placeholder="—"
                          value={data.aboard}
                          onChange={(e) =>
                            updateStationStop(selectedRouteId, stop.id, 'aboard', e.target.value)
                          }
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                        <input
                          type="number"
                          className="station-input"
                          min={0}
                          inputMode="numeric"
                          placeholder="—"
                          value={data.alighting}
                          onChange={(e) =>
                            updateStationStop(
                              selectedRouteId,
                              stop.id,
                              'alighting',
                              e.target.value,
                            )
                          }
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                        <input
                          type="text"
                          className="station-input station-remark-input"
                          placeholder="—"
                          value={data.remark}
                          onChange={(e) =>
                            updateStationStop(
                              selectedRouteId,
                              stop.id,
                              'remark',
                              e.target.value,
                            )
                          }
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </div>
        </section>


        <section className="panel">
          <h2 className="panel-title">{t.newJourneyTitle}</h2>
          {!isRouteDbLoading && !routeDbError && (
            <p className="helper-text">{t.newJourneyHelper}</p>
          )}

          <form className="journey-form" onSubmit={handleSubmit}>
            <div className="form-grid">
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
                <label htmlFor="route">{t.routeLabel}</label>
                <div className="route-input-wrap">
                  <input
                    id="route"
                    type="text"
                    placeholder="e.g. 1A"
                    value={form.route}
                    onChange={(event) => updateForm('route', event.target.value)}
                    autoComplete="off"
                    disabled={true}
                  />
                  {selectedRouteId &&
                    (() => {
                      const entry = routeEntries.find((e) => e.routeId === selectedRouteId)
                      return entry?.serviceType !== '1' ? (
                        <span className="route-form-special-badge">
                          {t.specialDepartureLabel}
                        </span>
                      ) : null
                    })()}
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="bound">{t.boundLabel}</label>
                <input
                  id="bound"
                  type="text"
                  placeholder={language === 'zh-HK' ? '例如：往中環' : 'e.g. Inbound / To Central'}
                  value={form.bound}
                  onChange={(event) => updateForm('bound', event.target.value)}
                  disabled={true}
                />
              </div>

              <div className="form-field">
                <label htmlFor="fromStop">{t.fromStopLabel}</label>
                <input
                  id="fromStop"
                  type="text"
                  placeholder="e.g. Mong Kok"
                  value={form.fromStop}
                  onChange={(event) => updateForm('fromStop', event.target.value)}
                  disabled={true}
                />
              </div>

              <div className="form-field">
                <label htmlFor="toStop">{t.toStopLabel}</label>
                <input
                  id="toStop"
                  type="text"
                  placeholder="e.g. Central"
                  value={form.toStop}
                  onChange={(event) => updateForm('toStop', event.target.value)}
                  disabled={true}
                />
              </div>

              <div className="form-field">
                <label htmlFor="duration">{t.durationLabel}</label>
                <div
                  id="duration"
                  className="journey-duration-display"
                  aria-live="polite"
                >
                  {journeyDuration ?? (
                    <span className="journey-duration-placeholder">
                      {t.durationPlaceholder}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="vehiclePlate">{t.vehiclePlateLabel}</label>
                <input
                  id="vehiclePlate"
                  type="text"
                  placeholder={t.vehiclePlatePlaceholder}
                  value={form.vehiclePlate}
                  onChange={(e) =>
                    updateForm('vehiclePlate', sanitizeVehiclePlate(e.target.value))
                  }
                  autoComplete="off"
                  maxLength={8}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="notes">{t.notesLabel}</label>
              <textarea
                id="notes"
                rows={2}
                placeholder="Anything special about this journey..."
                value={form.notes}
                onChange={(event) => updateForm('notes', event.target.value)}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-button">{t.saveJourney}</button>
            </div>
          </form>
        </section>
          </>
        )}

        {activeTab === 'saved' && (
        <section className="panel">
          <h2 className="panel-title">{t.journeysTitle}</h2>

          <div className="filters">
            <div className="form-field">
              <label htmlFor="filterRoute">{t.filterByRoute}</label>
              <input
                id="filterRoute"
                type="text"
                placeholder={t.filterRoutePlaceholder}
                value={filterRoute}
                onChange={(event) => setFilterRoute(event.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="filterBound">{t.filterByBound}</label>
              <input
                id="filterBound"
                type="text"
                placeholder={t.filterBoundPlaceholder}
                value={filterBound}
                onChange={(event) => setFilterBound(event.target.value)}
              />
            </div>
          </div>

          {visibleJourneys.length === 0 ? (
            <p className="empty-state">{t.noJourneys}</p>
          ) : (
            <div className="journey-table-wrapper">
              <table className="journey-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Route</th>
                    <th>Bound</th>
                    <th>From → To</th>
                    <th>Duration</th>
                    <th>{t.vehiclePlateLabel}</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleJourneys.map((journey) => (
                    <tr key={journey.id}>
                      <td>{journey.date}</td>
                      <td>{journey.route}</td>
                      <td>{journey.bound}</td>
                      <td className="from-to-cell">
                        <span className="from-stop">{journey.fromStop}</span>
                        <span className="arrow">→</span>
                        <span className="to-stop">{journey.toStop}</span>
                      </td>
                      <td>{journey.time ?? '-'}</td>
                      <td>{journey.vehiclePlate ?? '-'}</td>
                      <td className="notes-cell">{journey.notes ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        )}
      </main>
    </div>
  )
}

export default App
