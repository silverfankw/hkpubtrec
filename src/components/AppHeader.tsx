import type { Language } from '../types'
import type { TranslationKeys } from '../constants/translations'
import './AppHeader.css'

type Props = {
  language: Language
  onLanguageChange: (lang: Language) => void
  activeTab: 'record' | 'saved'
  onTabChange: (tab: 'record' | 'saved') => void
  t: TranslationKeys
}

export function AppHeader({ language, onLanguageChange, activeTab, onTabChange, t }: Props) {
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
