import { useMemo } from 'react'
import type { RouteListEntry } from '../types'
import './RouteKeypad.css'

type Props = {
  value: string
  routeEntries: RouteListEntry[]
  onChar: (char: string) => void
  onBackspace: () => void
  onClear: () => void
}

export function RouteKeypad({ value, routeEntries, onChar, onBackspace, onClear }: Props) {
  const { validDigits, letters } = useMemo(() => {
    const prefix = value.trim().toUpperCase()
    const next = new Set<string>()
    for (const entry of routeEntries) {
      const route = (entry.route ?? '').trim().toUpperCase()
      if (route.startsWith(prefix) && route.length > prefix.length) {
        next.add(route[prefix.length])
      }
    }
    return {
      validDigits: new Set([...next].filter((c) => /[0-9]/.test(c))),
      letters: [...next].filter((c) => /[A-Z]/.test(c)).sort(),
    }
  }, [value, routeEntries])

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

  return (
    <div className="route-keypad">
      <div className="route-keypad-numgrid">
        {digits.map((d) => (
          <button
            key={d}
            type="button"
            className={`route-keypad-btn${validDigits.has(d) ? '' : ' route-keypad-btn--dim'}`}
            onMouseDown={(e) => {
              e.preventDefault()
              if (validDigits.has(d)) onChar(d)
            }}
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          className="route-keypad-btn route-keypad-btn--action"
          onMouseDown={(e) => {
            e.preventDefault()
            onClear()
          }}
          disabled={value.length === 0}
        >
          ✕
        </button>
        <button
          type="button"
          className={`route-keypad-btn${validDigits.has('0') ? '' : ' route-keypad-btn--dim'}`}
          onMouseDown={(e) => {
            e.preventDefault()
            if (validDigits.has('0')) onChar('0')
          }}
        >
          0
        </button>
        <button
          type="button"
          className="route-keypad-btn route-keypad-btn--action"
          onMouseDown={(e) => {
            e.preventDefault()
            onBackspace()
          }}
          disabled={value.length === 0}
        >
          <span style={{ fontSize: '2em', lineHeight: 1 }}>⌫</span>
        </button>
      </div>
      {letters.length > 0 && (
        <div className="route-keypad-letters">
          {letters.map((l) => (
            <button
              key={l}
              type="button"
              className="route-keypad-btn route-keypad-btn--letter"
              onMouseDown={(e) => {
                e.preventDefault()
                onChar(l)
              }}
            >
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
