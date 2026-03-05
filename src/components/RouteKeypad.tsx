import { useMemo } from 'react'
import type { MouseEvent } from 'react'
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
  const hasLetters = letters.length > 0
  const withMouseDown = (action: () => void) => (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    action()
  }

  return (
    <div className={`route-keypad${hasLetters ? ' route-keypad--with-letters' : ' route-keypad--no-letters'}`}>
      <div className="route-keypad-body">
        <div className="route-keypad-numgrid">
          {digits.map((d) => (
            <button
              key={d}
              type="button"
              className={`route-keypad-btn${validDigits.has(d) ? '' : ' route-keypad-btn--dim'}`}
              onMouseDown={withMouseDown(() => {
                if (validDigits.has(d)) onChar(d)
              })}
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            className="route-keypad-btn route-keypad-btn--action"
            onMouseDown={withMouseDown(onClear)}
            disabled={value.length === 0}
          >
            ✕
          </button>
          <button
            type="button"
            className={`route-keypad-btn${validDigits.has('0') ? '' : ' route-keypad-btn--dim'}`}
            onMouseDown={withMouseDown(() => {
              if (validDigits.has('0')) onChar('0')
            })}
          >
            0
          </button>
          <button
            type="button"
            className="route-keypad-btn route-keypad-btn--action"
            onMouseDown={withMouseDown(onBackspace)}
            disabled={value.length === 0}
          >
            <span style={{ fontSize: '2em', lineHeight: 1 }}>⌫</span>
          </button>
        </div>

        {hasLetters && (
          <div className="route-keypad-letters" role="group" aria-label="Route suffix letters">
            {letters.map((l) => (
              <button
                key={l}
                type="button"
                className="route-keypad-btn route-keypad-btn--letter"
                onMouseDown={withMouseDown(() => onChar(l))}
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
