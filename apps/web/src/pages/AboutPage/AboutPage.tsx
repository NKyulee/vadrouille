import { useEffect, useState } from 'react'
import { useTitrePage } from '../../hooks/useTitrePage.ts'
import { LABELS } from '../../labels.ts'

type ApiStatus = 'chargement' | 'enLigne' | 'injoignable'

const STATUS_CLASS: Record<ApiStatus, string> = {
  chargement: 'badge',
  enLigne: 'badge badge--succes',
  injoignable: 'badge badge--danger',
}

export default function AboutPage() {
  useTitrePage(LABELS.aPropos.titre)

  const [apiStatus, setApiStatus] = useState<ApiStatus>('chargement')

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then(() => setApiStatus('enLigne'))
      .catch(() => setApiStatus('injoignable'))
  }, [])

  return (
    <div className="pile pile--lg">
      <h1>{LABELS.aPropos.titre}</h1>
      <p>{LABELS.aPropos.texte}</p>

      <div className="carte">
        <div className="rangee rangee--espacee">
          <span>{LABELS.etatApi.label}</span>
          {/* aria-live : le badge change après le rendu initial, sans ça le
              lecteur d'écran ne signalerait rien. */}
          <span className={STATUS_CLASS[apiStatus]} aria-live="polite">
            {LABELS.etatApi[apiStatus]}
            <span className="hors-ecran"> — {LABELS.etatApi.aria}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
