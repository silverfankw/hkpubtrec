import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import html2canvas from 'html2canvas'
import type { Journey, Language, RouteListEntry } from '../types'
import type { TranslationKeys } from '../constants/translations'
import { COMPANY_CHIP_COLORS, COMPANY_LABELS } from '../constants/companies'
import './ExportImageModal.css'

type SummaryField = 'date' | 'period' | 'route' | 'bound' | 'fromStop' | 'toStop' | 'vehiclePlate' | 'notes'
type StopCol = 'arrivalTime' | 'boarding' | 'alighting' | 'onBoard' | 'totalPassengers' | 'remark'

const SUMMARY_FIELD_DEFS: { key: SummaryField; getLabel: (t: TranslationKeys) => string; defaultOn: boolean; mandatory: boolean }[] = [
  { key: 'date', getLabel: t => t.dateLabel, defaultOn: true, mandatory: true },
  { key: 'period', getLabel: t => t.periodLabel, defaultOn: true, mandatory: true },
  { key: 'route', getLabel: t => t.routeLabel, defaultOn: true, mandatory: true },
  { key: 'bound', getLabel: t => t.boundLabel, defaultOn: true, mandatory: true },
  { key: 'fromStop', getLabel: t => t.fromStopLabel, defaultOn: true, mandatory: true },
  { key: 'toStop', getLabel: t => t.toStopLabel, defaultOn: true, mandatory: true },
  { key: 'vehiclePlate', getLabel: t => t.vehiclePlateLabel, defaultOn: true, mandatory: true },
  { key: 'notes', getLabel: t => t.notesLabel, defaultOn: false, mandatory: false },
]

const STOP_COL_DEFS: { key: StopCol; getLabel: (t: TranslationKeys) => string; defaultOn: boolean }[] = [
  { key: 'arrivalTime', getLabel: t => t.arrivalTimeLabel, defaultOn: true },
  { key: 'boarding', getLabel: t => t.boardingLabel, defaultOn: true },
  { key: 'alighting', getLabel: t => t.alightingLabel, defaultOn: true },
  { key: 'onBoard', getLabel: t => t.onBoardLabel, defaultOn: true },
  { key: 'totalPassengers', getLabel: t => t.totalPassengersLabel, defaultOn: false },
  { key: 'remark', getLabel: t => t.remarkLabel, defaultOn: false },
]

// Remove "(optional)" / "(選填)" suffixes for use in the exported image
function cleanLabel(label: string): string {
  return label.replace(/\s*[（(][選选]?填[）)]/g, '').replace(/\s*\(optional\)/i, '').trim()
}

type Props = {
  journey: Journey
  routeEntries: RouteListEntry[]
  language: Language
  t: TranslationKeys
  onClose: () => void
}

export function ExportImageModal({ journey, routeEntries, language, t, onClose }: Props) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  const [summaryOn, setSummaryOn] = useState<Record<SummaryField, boolean>>(
    () => Object.fromEntries(SUMMARY_FIELD_DEFS.map(f => [f.key, f.defaultOn])) as Record<SummaryField, boolean>
  )
  const [colsOn, setColsOn] = useState<Record<StopCol, boolean>>(
    () => Object.fromEntries(STOP_COL_DEFS.map(f => [f.key, f.defaultOn])) as Record<StopCol, boolean>
  )

  // Derived values
  const periodStr = journey.stops?.length
    ? `${journey.stops[0]?.arrivalTime || '—'} – ${journey.stops[journey.stops.length - 1]?.arrivalTime || '—'}`
    : '—'

  const formatStopOrder = (order: number) => {
    if (language === 'zh-HK') return `第${order}個站 `
    const suffix = order === 1 ? 'st' : order === 2 ? 'nd' : order === 3 ? 'rd' : 'th'
    return `${order}${suffix} stop `
  }

  const fromStopOrder = journey.stops?.[0]?.order
  const toStopOrder = journey.stops?.length ? journey.stops[journey.stops.length - 1]?.order : undefined

  const initial = journey.initialOnBoard ?? 0
  let cumulative = initial
  let cumulativeAboard = 0
  const stopRows = (journey.stops ?? []).map(stop => {
    const aboard = parseInt(stop.aboard ?? '0', 10) || 0
    const alighting = parseInt(stop.alighting ?? '0', 10) || 0
    cumulative += aboard - alighting
    cumulativeAboard += aboard
    const totalPassengers = initial + cumulativeAboard
    return { stop, cumOnBoard: cumulative, totalPassengers }
  })

  const routeEntry = journey.routeId
    ? routeEntries.find(e => e.routeId === journey.routeId)
    : null

  const routeNode: ReactNode = routeEntry ? (() => {
    const firstCode = routeEntry.companyCodes[0]
    const chip = firstCode ? COMPANY_CHIP_COLORS[firstCode.toLowerCase()] : null
    const chipLabel = routeEntry.companyCodes
      .map(code => language === 'zh-HK'
        ? COMPANY_LABELS[code.toLowerCase()] ?? code.toUpperCase()
        : code.toUpperCase()
      )
      .join(' / ')
    return (
      <span>
        {chip ? (
          <span style={{ backgroundColor: chip.backgroundColor, color: chip.color, padding: '2px 5px', borderRadius: '3px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.02em', display: 'inline-block', verticalAlign: 'middle' }}>
            {chipLabel}
          </span>
        ) : (
          <span style={{ fontWeight: 600, fontSize: '11px', verticalAlign: 'middle' }}>{chipLabel}</span>
        )}
        {' '}
        <span style={{ verticalAlign: 'middle' }}>{journey.route}</span>
      </span>
    )
  })() : <>{journey.route}</>

  const summaryRows: { key: SummaryField; label: string; value: ReactNode }[] = [
    { key: 'date', label: t.dateLabel, value: journey.date },
    { key: 'period', label: t.periodLabel, value: periodStr },
    { key: 'route', label: t.routeLabel, value: routeNode },
    { key: 'bound', label: t.boundLabel, value: journey.bound },
    {
      key: 'fromStop',
      label: t.fromStopLabel,
      value: <>{journey.fromStop ?? '—'}{fromStopOrder != null ? <span style={{ fontSize: '0.75em', color: '#4f46e5', fontWeight: 500, verticalAlign: 'super', marginLeft: '0.3em' }}>{formatStopOrder(fromStopOrder)}</span> : ''}</>,
    },
    {
      key: 'toStop',
      label: t.toStopLabel,
      value: <>{journey.toStop ?? '—'}{toStopOrder != null ? <span style={{ fontSize: '0.75em', color: '#4f46e5', fontWeight: 500, verticalAlign: 'super', marginLeft: '0.3em' }}>{formatStopOrder(toStopOrder)}</span> : ''}</>,
    },
    { key: 'vehiclePlate', label: t.vehiclePlateLabel, value: journey.vehiclePlate ?? '—' },
    { key: 'notes', label: cleanLabel(t.notesLabel), value: journey.notes ?? '—' },
  ].filter(r => {
    const def = SUMMARY_FIELD_DEFS.find(f => f.key === r.key)
    return def?.mandatory || summaryOn[r.key]
  })

  const activeCols = STOP_COL_DEFS.filter(c => colsOn[c.key])
  const hasStops = stopRows.length > 0

  const COL_WIDTHS: Record<StopCol, number> = {
    arrivalTime: 76,
    boarding: 60,
    alighting: 60,
    onBoard: 60,
    totalPassengers: 60,
    remark: 96,
  }

  const handleExport = async () => {
    if (!contentRef.current) return
    setExporting(true)
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
      })
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `journey-${journey.date.replace(/\//g, '')}-${journey.route}.png`
      a.click()
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      {/* Modal dialog */}
      <div className="export-modal-overlay" onClick={onClose}>
        <div className="export-modal" onClick={e => e.stopPropagation()}>
          <div className="export-modal-header">
            <h3 className="export-modal-title">{t.exportAsImage}</h3>
            <button className="export-modal-close" onClick={onClose} aria-label="Close">✕</button>
          </div>
          <p className="export-modal-subtitle">{t.exportImageTitle}</p>

          <div className="export-modal-sections">
            {/* Journey summary fields — mandatory shown as disabled checked, notes as interactive */}
            <div className="export-modal-section">
              <div className="export-modal-section-label">{t.exportImageSummarySection}</div>
              <div className="export-modal-checkboxes">
                {SUMMARY_FIELD_DEFS.map(f => (
                  <label
                    key={f.key}
                    className={`export-modal-checkbox-label${f.mandatory ? ' export-modal-checkbox-label--disabled' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={f.mandatory ? true : summaryOn[f.key]}
                      disabled={f.mandatory}
                      onChange={f.mandatory ? () => {} : e => setSummaryOn(prev => ({ ...prev, [f.key]: e.target.checked }))}
                    />
                    <span>{cleanLabel(f.getLabel(t))}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Stop column fields */}
            {hasStops && (
              <div className="export-modal-section">
                <div className="export-modal-section-label-row">
                  <div className="export-modal-section-label">{t.exportImageStopSection}</div>
                  <button
                    className="export-modal-select-all-btn"
                    onClick={() => {
                      const allOn = STOP_COL_DEFS.every(f => colsOn[f.key])
                      setColsOn(Object.fromEntries(STOP_COL_DEFS.map(f => [f.key, !allOn])) as Record<StopCol, boolean>)
                    }}
                  >
                    {STOP_COL_DEFS.every(f => colsOn[f.key]) ? t.selectNoneStations : t.selectAllStations}
                  </button>
                </div>
                <p className="export-modal-note">{t.exportImageStopNote}</p>
                <div className="export-modal-checkboxes">
                  {STOP_COL_DEFS.map(f => (
                    <label key={f.key} className="export-modal-checkbox-label">
                      <input
                        type="checkbox"
                        checked={colsOn[f.key]}
                        onChange={e => setColsOn(prev => ({ ...prev, [f.key]: e.target.checked }))}
                      />
                      <span>{cleanLabel(f.getLabel(t))}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="export-modal-actions">
            <button className="export-modal-btn-cancel" onClick={onClose} disabled={exporting}>
              {t.cancel}
            </button>
            <button className="export-modal-btn-export" onClick={handleExport} disabled={exporting}>
              {exporting ? t.exportingLabel : t.exportAsImage}
            </button>
          </div>
        </div>
      </div>

      {/* Off-screen export content rendered for html2canvas capture */}
      <div className="export-offscreen-container">
        <div
          ref={contentRef}
          style={{
            width: '800px',
            background: '#ffffff',
            fontFamily: "'Noto Sans HK', -apple-system, 'Helvetica Neue', sans-serif",
            fontSize: '13px',
            color: '#0f172a',
            padding: '28px 32px',
            boxSizing: 'border-box',
          }}
        >
          {/* Header band */}
          <div
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              borderRadius: '10px',
              padding: '16px 22px',
              marginBottom: '20px',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '0.01em' }}>
              {journey.route}　{journey.bound}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', opacity: 0.88 }}>{journey.date}</div>
            </div>
          </div>

          {/* Journey summary */}
          {summaryRows.length > 0 && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '14px',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <tbody>
                  {Array.from({ length: Math.ceil(summaryRows.length / 2) }, (_, i) => {
                    const left = summaryRows[i * 2]
                    const right = summaryRows[i * 2 + 1]
                    return (
                      <tr key={i} style={{ verticalAlign: 'top' }}>
                        <td style={{ color: '#64748b', fontWeight: 600, paddingBottom: '3px', paddingRight: '6px', whiteSpace: 'nowrap' }}>
                          {left.label}
                        </td>
                        <td style={{ color: '#0f172a', paddingBottom: '3px', paddingRight: '12px' }}>
                          {left.value}
                        </td>
                        {right ? (
                          <>
                            <td style={{ color: '#64748b', fontWeight: 600, paddingBottom: '3px', paddingRight: '6px', whiteSpace: 'nowrap' }}>
                              {right.label}
                            </td>
                            <td style={{ color: '#0f172a', paddingBottom: '3px' }}>
                              {right.value}
                            </td>
                          </>
                        ) : (
                          <><td /><td /></>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Stop list */}
          {hasStops && (
            <div style={{ borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              {/* Stop list section title */}
              <div
                style={{
                  background: 'linear-gradient(to right, #eff2f6, #e6e8ed)',
                  padding: '7px 12px',
                  fontWeight: 700,
                  fontSize: '11.5px',
                  color: '#334155',
                  borderBottom: '1px solid #e2e8f0',
                  letterSpacing: '0.01em',
                }}
              >
                {t.savedJourneyStopDetails}
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                {/* Column header */}
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ width: '28px', padding: '6px 6px', color: '#64748b', fontWeight: 600, textAlign: 'center' }}>#</th>
                    <th style={{ padding: '6px 8px', color: '#64748b', fontWeight: 600, textAlign: 'left' }}>{t.stationNameLabel}</th>
                    {activeCols.map(c => (
                      <th
                        key={c.key}
                        style={{
                          width: `${COL_WIDTHS[c.key]}px`,
                          padding: '6px 6px',
                          color: '#64748b',
                          fontWeight: 600,
                          textAlign: 'center',
                          lineHeight: '1.3',
                        }}
                      >
                        {cleanLabel(c.getLabel(t))}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {/* Initial on-board row */}
                  {initial > 0 && (
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontStyle: 'italic', color: '#64748b' }}>
                      <td style={{ padding: '5px 6px', textAlign: 'center' }}>—</td>
                      <td style={{ padding: '5px 8px' }}>{t.journeyTableInitialOnBoard}</td>
                      {activeCols.map(c => (
                        <td key={c.key} style={{ padding: '5px 6px', textAlign: 'center' }}>
                          {c.key === 'onBoard' ? initial : '—'}
                        </td>
                      ))}
                    </tr>
                  )}

                  {/* Stop rows */}
                  {stopRows.map(({ stop, cumOnBoard, totalPassengers }, idx) => (
                    <tr
                      key={`${stop.stopId}-${stop.order}`}
                      style={{
                        background: idx % 2 === 0 ? '#ffffff' : '#f9fafb',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      <td style={{ padding: '5px 6px', textAlign: 'center', color: '#9ca3af' }}>{stop.order}</td>
                      <td style={{ padding: '5px 8px', color: '#111827' }}>{stop.name}</td>
                      {activeCols.map(c => {
                        let val: string | number = '—'
                        if (c.key === 'arrivalTime') val = stop.arrivalTime || '—'
                        else if (c.key === 'boarding') val = stop.aboard || '—'
                        else if (c.key === 'alighting') val = stop.alighting || '—'
                        else if (c.key === 'onBoard') val = cumOnBoard
                        else if (c.key === 'totalPassengers') val = totalPassengers > 0 ? totalPassengers : '—'
                        else if (c.key === 'remark') val = stop.remark || '—'
                        return (
                          <td
                            key={c.key}
                            style={{
                              padding: '5px 6px',
                              textAlign: 'center',
                              color: '#475569',
                            }}
                          >
                            {val}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
