import { useState } from 'react'
import type { Language } from './types'
import { translations } from './constants/translations'
import { useRouteDb } from './hooks/useRouteDb'
import { useJourneys } from './hooks/useJourneys'
import { AppHeader } from './components/AppHeader'
import { RecordTab } from './components/RecordTab'
import { SavedTab } from './components/SavedTab'
import './App.css'

function App() {
  const [language, setLanguage] = useState<Language>('zh-HK')
  const [activeTab, setActiveTab] = useState<'record' | 'saved'>('record')
  const [saveNotificationVisible, setSaveNotificationVisible] = useState(false)

  const t = translations[language]
  const { etaDb, routeMap, routeEntries, isRouteDbLoading, routeDbError } = useRouteDb()
  const { journeys, addJourney, removeJourney, clearAll, importJourneys } = useJourneys()

  const showNotification = () => {
    setSaveNotificationVisible(true)
    setTimeout(() => setSaveNotificationVisible(false), 3000)
  }

  return (
    <div className="app">
      {saveNotificationVisible && (
        <div className="save-notification" role="status" aria-live="polite">
          {t.journeySavedNotification}
        </div>
      )}

      <AppHeader
        language={language}
        onLanguageChange={setLanguage}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        t={t}
      />

      <main className="app-layout">
        {activeTab === 'record' && (
          <RecordTab
            etaDb={etaDb}
            routeMap={routeMap}
            routeEntries={routeEntries}
            isRouteDbLoading={isRouteDbLoading}
            routeDbError={routeDbError}
            language={language}
            t={t}
            onSaveJourney={addJourney}
            onShowNotification={showNotification}
            onSwitchToSaved={() => setActiveTab('saved')}
          />
        )}
        {activeTab === 'saved' && (
          <SavedTab
            journeys={journeys}
            routeEntries={routeEntries}
            language={language}
            t={t}
            onRemoveJourney={removeJourney}
            onClearAll={clearAll}
            onImportJourneys={importJourneys}
          />
        )}
      </main>
    </div>
  )
}

export default App
