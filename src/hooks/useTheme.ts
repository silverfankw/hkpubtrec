import { useState, useEffect } from 'react'

export type ThemePreference = 'light' | 'dark'

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    const stored = localStorage.getItem('theme')
    return stored === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', preference)
    localStorage.setItem('theme', preference)
  }, [preference])

  return { preference, setPreference }
}
