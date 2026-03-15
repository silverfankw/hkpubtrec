import { useState } from 'react'
import type { JourneySelection } from '../types'

export type SelectionPhase = 'idle' | 'awaiting-end'

export function useStationDrag() {
  const [journeySelection, setJourneySelection] = useState<JourneySelection | null>(null)
  const [dragSelectionLocked, setDragSelectionLocked] = useState(false)
  const [selectionPhase, setSelectionPhase] = useState<SelectionPhase>('idle')

  const handleStationMouseDown = (routeId: string, order: number) => {
    if (dragSelectionLocked) return

    if (selectionPhase === 'awaiting-end') {
      if (journeySelection?.routeId === routeId && journeySelection.startOrder === order) {
        return
      }

      setJourneySelection((prev) => {
        if (!prev || prev.routeId !== routeId) return prev
        return { ...prev, endOrder: order }
      })
      setSelectionPhase('idle')
      return
    }

    setJourneySelection({ routeId, startOrder: order, endOrder: order })
    setSelectionPhase('awaiting-end')
  }

  return {
    journeySelection,
    setJourneySelection,
    dragSelectionLocked,
    setDragSelectionLocked,
    selectionPhase,
    setSelectionPhase,
    handleStationMouseDown,
  }
}
