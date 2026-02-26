export type SavedStop = {
  stopId: string
  order: number
  name: string
  arrivalTime: string
  aboard: string
  alighting: string
  remark: string
}

export type Journey = {
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
  stops?: SavedStop[]
  initialOnBoard?: number
  totalOnBoard?: number
}

export type JourneyFormState = {
  date: string
  route: string
  bound: string
  fromStop: string
  toStop: string
  vehiclePlate: string
  notes: string
}

export type BoundOption = {
  routeId: string
  labelZh: string
  labelEn: string
}

export type RouteBoundMap = Record<string, BoundOption[]>

export type RouteListEntry = {
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

export type Language = 'zh-HK' | 'en'

// Define types of route for styling and special handling purposes
export type RouteType =
  | 'regular' //  Regular route
  | 'xhtEhc' // Cross Harbour Crossing / Eastern Harbour Crossing route
  | 'marathon'  // Marathon event only special route
  | 'whc' // Western Harbour Crossing special route
  | 'airport' //  Airport route
  | 'external'  // External route (Tung Chung / Airport Logistics Area to external destinations)
  | 'overnight' //  Overnight route ('N' routes, KMB overnight routes)
  | 'airportOvernight'  // Overnight airport route ('NA' routes)
  | 'premier' // Premier route (KMB P960 / P968)
  | 'shuttle' //  Shuttle route (Tung Chung / Airport Logistics Area shuttle routes)
  | 'disneyRecreational'  //  Disney recreational route ('R' routes)
  | 'r8'  // Route R8
  | 'awe' // KMB AWE type route (X33, X36, X40, X43, X47)
  | 'peak'  // CTB Peak type route (15, 15C, X15)
  | 'hkSightseeing' // CTB H-type route (H1, H2, H3, H4)
  | 'nlbSpecial' // NLB Special route (7S, 34S)
  | 'nlbExpress' // NLB Express route (NB2, X11R)
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

export type RouteStyle = { backgroundColor?: string; color?: string }

export type JourneySelection = {
  routeId: string
  startOrder: number
  endOrder: number
}

export type StopInputData = {
  arrivalTime: string
  aboard: string
  alighting: string
  remark: string
}
