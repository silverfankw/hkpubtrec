import type { Language } from '../types'

export const translations: Record<
  Language,
  {
    appTitle: string
    clearAll: string
    routeSearchPlaceholder: string
    noRoutesFound: string
    noStationsForRoute: string
    dateLabel: string
    routeLabel: string
    boundLabel: string
    fromStopLabel: string
    toStopLabel: string
    fromToLabel: string
    boardingLabel: string
    alightingLabel: string
    notesLabel: string
    notesPlaceholderLabel: string
    saveJourney: string
    filterByRoute: string
    filterRoutePlaceholder: string
    noJourneys: string
    routesLoading: string
    routesError: string
    validationMissingFields: string
    validationSelectStopRange: string
    validationCountsMustBeNumber: string
    stationNameLabel: string
    arrivalTimeLabel: string
    onBoardLabel: string
    initialOnBoardLabel: string
    initialOnBoardPlaceholder: string
    remarkLabel: string
    journeyDragHint: string
    tapEndHint: string
    lockSelectionHint: string
    enterDataHint: string
    combinedInputHint: string
    stationInputFormatLabel: string
    stationInputFormatExample: string
    durationLabel: string
    durationPlaceholder: string
    selectAllStations: string
    selectNoneStations: string
    lockStationRangeSelection: string
    unlockStationRangeSelection: string
    specialDepartureLabel: string
    specialDepartureLabelShort: string
    tabRecord: string
    tabSavedJourneys: string
    vehiclePlateLabel: string
    vehiclePlatePlaceholder: string
    journeySavedNotification: string
    savedJourneyStopDetails: string
    noStopDataSaved: string
    periodLabel: string
    routeAndBoundLabel: string
    routeFormPlaceholder: string
    routeBoundToggleExpand: string
    routeBoundToggleCollapse: string
    switchBoundLabel: string
    confirmSaveTitle: string
    confirmSave: string
    cancel: string
    journeyTableInitialOnBoard: string
    sortDateClickAsc: string
    sortDateClickDesc: string
    removeJourney: string
    removeJourneyConfirm: string
    boundToPrefix: string
    timeOrderWarning: string
    crossMidnightLabel: string
    crossMidnightHint: string
    validationEndTimeBeforeStart: string
    changeRouteBtn: string
    journeyTotalRow: string
    totalPassengersLabel: string
    exportJourney: string
    exportAllJourneys: string
    importJourneys: string
    importSuccess: string
    importError: string
    validationDateFormat: string
  }
> = {
  'zh-HK': {
    appTitle: '公共交通工具行程紀錄',
    clearAll: '刪除全部行程',
    routeSearchPlaceholder: '以路線編號搜尋，如：10 / 70K / 268X / E32A',
    noRoutesFound: '找不到相關路線，請嘗試其他關鍵字。',
    noStationsForRoute: '此路線未有可用的車站資料。',
    dateLabel: '日期',
    routeLabel: '路線',
    boundLabel: '方向',
    fromStopLabel: '上車站',
    toStopLabel: '落車站',
    fromToLabel: '上車站及落車站',
    notesLabel: '備註（選填）',
    notesPlaceholderLabel: "行程中的特別事項",
    saveJourney: '儲存行程',
    filterByRoute: '以路線篩選',
    filterRoutePlaceholder: '搜尋路線',
    noJourneys: '暫未有行程紀錄，可在右方新增第一個紀錄。',
    routesLoading: '正在載入香港官方巴士路線資料…',
    routesError: '未能載入官方路線列表，你仍然可以手動輸入路線及方向。',
    validationMissingFields: '請填寫路線、方向、上車站及落車站。',
    validationSelectStopRange: '請拖曳選取起訖站範圍。',
    validationCountsMustBeNumber: '上車及落車人數必須為數字。',
    stationNameLabel: '車站',
    arrivalTimeLabel: '到站時間',
    boardingLabel: '上車人數',
    alightingLabel: '落車人數',
    onBoardLabel: '車上人數',
    initialOnBoardLabel: '起點站前車上人數',
    initialOnBoardPlaceholder: '若由中途站開始選取，請輸入該站開出前的車上人數',
    remarkLabel: '行程備註 (選填)',
    journeyDragHint: '點擊以選擇 起點車站。',
    tapEndHint: '點擊另一車站以設定 行程終點站。',
    lockSelectionHint: '按鎖定選取按鈕，再輸入各個站的相關數據。',
    enterDataHint: '輸入各個站的相關數據。如要重新選取起點/終點站，請先按解鎖選取。',
    combinedInputHint: '點擊以輸入數據，格式為\'HHMM+上車人數-落車人數/備註\' (HHMM為24小時制)',
    stationInputFormatLabel: '輸入格式為\'HHMM+上車人數-落車人數/備註\' (HHMM為24小時制)',
    stationInputFormatExample: '例: 1324+3-7/有乘客滋擾車長（13:24到達該站, 3位乘客上車, 7位乘客落車, 備註:有乘客滋擾車長）',
    durationLabel: '行程時間',
    durationPlaceholder: '請輸入首尾站到站時間以計算',
    selectAllStations: '全選',
    selectNoneStations: '取消選取',
    lockStationRangeSelection: '鎖定選取',
    unlockStationRangeSelection: '解鎖選取',
    specialDepartureLabel: '特別班次',
    specialDepartureLabelShort: '特',
    tabRecord: '新增行程',
    tabSavedJourneys: '已紀錄行程',
    vehiclePlateLabel: '車牌 / 車號',
    vehiclePlatePlaceholder: '字母或數字 (不包括 I/O/Q)',
    journeySavedNotification: '行程已儲存',
    savedJourneyStopDetails: '停站詳情',
    noStopDataSaved: '此行程未有儲存停站資料。',
    periodLabel: '時段',
    routeAndBoundLabel: '路線及方向',
    routeFormPlaceholder: '請選擇路線及方向',
    routeBoundToggleExpand: '展開路線搜尋',
    routeBoundToggleCollapse: '收合路線搜尋',
    switchBoundLabel: '切換方向',
    confirmSaveTitle: '確認行程資料',
    confirmSave: '確認儲存',
    cancel: '取消',
    journeyTableInitialOnBoard: '起點前',
    sortDateClickAsc: '按此以遞升排序',
    sortDateClickDesc: '按此以遞降排序',
    removeJourney: '刪除',
    removeJourneyConfirm: '確定要刪除此行程？此操作無法復原。',
    boundToPrefix: '往 ',
    timeOrderWarning: '此站到站時間早於上一站',
    crossMidnightLabel: '跨午夜行程',
    crossMidnightHint: '若行程跨越午夜（例如 23:58 上車，00:12 落車），請勾選此項。',
    validationEndTimeBeforeStart: '終點站到站時間不能早於起點站。如為跨午夜行程，請勾選「跨午夜行程」。',
    changeRouteBtn: '更改路線',
    journeyTotalRow: '總計',
    totalPassengersLabel: '總人數',
    exportJourney: '匯出此行程',
    exportAllJourneys: '匯出全部行程',
    importJourneys: '匯入行程',
    importSuccess: '已匯入 {count} 個行程，跳過 {skipped} 個重複紀錄。',
    importError: '匯入失敗，請確認檔案格式正確。',
    validationDateFormat: '請輸入 YYYY/MM/DD 格式的有效日期，且不可超過今天。',
  },
  en: {
    appTitle: 'Public Transport Journey Record',
    clearAll: 'Delete all journeys',
    routeSearchPlaceholder: 'Search by Route No., e.g. 10 / 70K / 268X / E32A',
    noRoutesFound: 'No routes found. Try another keyword.',
    noStationsForRoute: 'No station data available for this route.',
    dateLabel: 'Date',
    routeLabel: 'Route',
    boundLabel: 'Bound / direction',
    fromStopLabel: 'Starting stop',
    toStopLabel: 'Destination',
    fromToLabel: 'From → To',
    notesLabel: 'Notes (optional)',
    notesPlaceholderLabel: 'Remark about this journey...',
    saveJourney: 'Save journey',
    filterByRoute: 'Filter by route',
    filterRoutePlaceholder: 'Search route',
    noJourneys: 'No journeys recorded yet. Add your first journey on the right.',
    routesLoading: 'Loading official Hong Kong bus routes…',
    routesError: 'Unable to load official route list. You can still type route and bound manually.',
    validationMissingFields: 'Please fill in route, bound, starting stop and destination.',
    validationSelectStopRange: 'Please drag to select your journey stop range.',
    validationCountsMustBeNumber: 'Boarding and alighting counts must be numbers.',
    stationNameLabel: 'Station',
    arrivalTimeLabel: 'Arrival Time',
    boardingLabel: 'No. of Aboard pax',
    alightingLabel: 'No. of Alighting Pax',
    onBoardLabel: 'On board',
    initialOnBoardLabel: 'No. of Passenger before this stop',
    initialOnBoardPlaceholder: 'If selection starts from a mid-route stop, enter passengers on board before that stop',
    remarkLabel: 'Journey remark (optional)',
    journeyDragHint: 'Tap a starting station.',
    tapEndHint: 'Tap another station to set the end of your journey range.',
    lockSelectionHint: 'Lock the selection, then enter data for each station.',
    enterDataHint: 'Enter data for each station.',
    combinedInputHint: 'Tap to enter data. Format: HHMM+aboard-alighting/remark',
    stationInputFormatLabel: 'HHMM+aboard-alighting/remark',
    stationInputFormatExample: 'e.g. 1324+3-7/Pax nuisance (13:24, 3 boarding, 7 alighting, note: Pax nuisance)',
    durationLabel: 'Duration',
    durationPlaceholder: 'Enter first & last stop arrival times to calculate',
    selectAllStations: 'Select all',
    selectNoneStations: 'Select none',
    lockStationRangeSelection: 'Lock selection',
    unlockStationRangeSelection: 'Unlock selection',
    specialDepartureLabel: 'Special',
    specialDepartureLabelShort: 'Sp.',
    tabRecord: 'Add journey',
    tabSavedJourneys: 'Saved journeys',
    vehiclePlateLabel: 'Plate / Fleet no.',
    vehiclePlatePlaceholder: 'Letters & numbers (excl. I, O, Q)',
    journeySavedNotification: 'Journey saved',
    savedJourneyStopDetails: 'Stop details',
    noStopDataSaved: 'No stop data saved for this journey.',
    periodLabel: 'Period',
    routeAndBoundLabel: 'Route & Bound',
    routeFormPlaceholder: 'Select route and bound',
    routeBoundToggleExpand: 'Expand route search',
    routeBoundToggleCollapse: 'Collapse route search',
    switchBoundLabel: 'Switch direction',
    confirmSaveTitle: 'Confirm journey data',
    confirmSave: 'Confirm save',
    cancel: 'Cancel',
    journeyTableInitialOnBoard: 'Initial',
    sortDateClickAsc: 'Click to sort ascending',
    sortDateClickDesc: 'Click to sort descending',
    removeJourney: 'Remove',
    removeJourneyConfirm: 'Remove this journey? This cannot be undone.',
    boundToPrefix: 'To ',
    timeOrderWarning: 'Arrival time is earlier than previous stop',
    crossMidnightLabel: 'Cross-midnight journey',
    crossMidnightHint: 'Tick this if the journey crosses midnight (e.g. board at 23:58, alight at 00:12).',
    validationEndTimeBeforeStart: 'End time cannot be earlier than start time. If this is a cross-midnight journey, please tick "Cross-midnight journey".',
    changeRouteBtn: 'Change route',
    journeyTotalRow: 'Total',
    totalPassengersLabel: 'Total Pax',
    exportJourney: 'Export this journey',
    exportAllJourneys: 'Export all journeys',
    importJourneys: 'Import journeys',
    importSuccess: 'Imported {count} journey(s), skipped {skipped} duplicate(s).',
    importError: 'Import failed. Please check the file format.',
    validationDateFormat: 'Please enter a valid date in YYYY/MM/DD format, not in the future.',
  },
}

export type TranslationKeys = typeof translations['zh-HK']
