import type { Language } from '../types'
import type { TranslationKeys } from '../constants/translations'
import type { ThemePreference } from '../hooks/useTheme'
import './AppHeader.css'

type Props = {
  language: Language
  onLanguageChange: (lang: Language) => void
  activeTab: 'record' | 'saved'
  onTabChange: (tab: 'record' | 'saved') => void
  themePreference: ThemePreference
  onThemeChange: (pref: ThemePreference) => void
  t: TranslationKeys
}

const THEME_CYCLE: ThemePreference[] = ['light', 'dark']
const THEME_LABELS: Record<ThemePreference, string> = {
  light: '☀',
  dark: '☾',
}

export function AppHeader({
  language,
  onLanguageChange,
  activeTab,
  onTabChange,
  themePreference,
  onThemeChange,
  t,
}: Props) {
  return (
    <header className="app-header">
      <nav className="app-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'record'}
          className={`app-tab ${activeTab === 'record' ? 'app-tab--active' : ''}`}
          onClick={() => onTabChange('record')}
        >
          {t.tabRecord}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'saved'}
          className={`app-tab ${activeTab === 'saved' ? 'app-tab--active' : ''}`}
          onClick={() => onTabChange('saved')}
        >
          {t.tabSavedJourneys}
        </button>
      </nav>
      <div className="header-actions">
        <div className="theme-toggle">
          {THEME_CYCLE.map((pref) => (
            <button
              key={pref}
              type="button"
              className={`theme-toggle-button${themePreference === pref ? ' theme-toggle-button--active' : ''}`}
              onClick={() => onThemeChange(pref)}
              aria-pressed={themePreference === pref}
            >
              {THEME_LABELS[pref]}
            </button>
          ))}
        </div>
        <div className="language-toggle">
          <button
            type="button"
            className={
              language === 'zh-HK'
                ? 'language-toggle-button language-toggle-button--active'
                : 'language-toggle-button'
            }
            onClick={() => onLanguageChange('zh-HK')}
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
            onClick={() => onLanguageChange('en')}
          >
            EN
          </button>
        </div>
      </div>
    </header>
  )
}
