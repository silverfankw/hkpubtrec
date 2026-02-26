import type { Language } from '../types'
import type { TranslationKeys } from '../constants/translations'
import './AppHeader.css'

type Props = {
  language: Language
  onLanguageChange: (lang: Language) => void
  t: TranslationKeys
  onClearAll: () => void
}

export function AppHeader({ language, onLanguageChange, t, onClearAll }: Props) {
  return (
    <header className="app-header">
      <div>
        <h1 className="app-title">{t.appTitle}</h1>
        <p className="app-subtitle">{t.appSubtitle}</p>
      </div>
      <div className="header-actions">
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
        <button type="button" className="clear-button" onClick={onClearAll}>
          {t.clearAll}
        </button>
      </div>
    </header>
  )
}
