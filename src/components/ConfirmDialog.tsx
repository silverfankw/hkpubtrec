import { useEffect } from 'react'
import type { Journey } from '../types'
import type { TranslationKeys } from '../constants/translations'
import './ConfirmDialog.css'

type Props = {
  journey: Journey
  t: TranslationKeys
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ journey, t, onConfirm, onCancel }: Props) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onCancel])

  return (
    <div className="confirm-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div className="confirm-dialog">
        <h2 id="confirm-dialog-title" className="confirm-dialog-title">{t.confirmSaveTitle}</h2>
        <dl className="confirm-dialog-grid">
          <dt>{t.dateLabel}</dt>
          <dd>{journey.date}</dd>
          <dt>{t.routeAndBoundLabel}</dt>
          <dd>{journey.route} {journey.bound}</dd>
          <dt>{t.fromToLabel}</dt>
          <dd>{journey.fromStop} → {journey.toStop}</dd>
          <dt>{t.vehiclePlateLabel}</dt>
          <dd>{journey.vehiclePlate || '—'}</dd>
          {journey.notes && (
            <>
              <dt>{t.notesLabel}</dt>
              <dd className="confirm-dialog-notes">{journey.notes}</dd>
            </>
          )}
        </dl>
        <div className="confirm-dialog-actions">
          <button type="button" className="confirm-dialog-btn confirm-dialog-btn--secondary" onClick={onCancel}>
            {t.cancel}
          </button>
          <button type="button" className="confirm-dialog-btn confirm-dialog-btn--primary" onClick={onConfirm}>
            {t.confirmSave}
          </button>
        </div>
      </div>
    </div>
  )
}
