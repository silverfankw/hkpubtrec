export const COMPANY_LABELS: Record<string, string> = {
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

export const COMPANY_CHIP_COLORS: Record<string, { backgroundColor: string; color: string }> = {
  gmb: { backgroundColor: '#009E60', color: '#ffffff' },
  kmb: { backgroundColor: '#CF0001', color: '#ffffff' },
  ctb: { backgroundColor: '#FFD700', color: '#0059BD' },
  nlb: { backgroundColor: '#027233', color: '#ffffff' },
  lrtfeeder: { backgroundColor: '#0E2A51', color: '#ffffff' },
  lightrail: { backgroundColor: '#D3A809', color: '#ffffff' },
  mtr: { backgroundColor: '#B0274A', color: '#ffffff' },
}

export const MTR_ROUTE_LABELS: Record<string, { zh: string; en: string }> = {
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
