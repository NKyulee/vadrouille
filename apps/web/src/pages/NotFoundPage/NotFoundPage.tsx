import { Link } from 'react-aria-components'
import { useTitrePage } from '../../hooks/useTitrePage.ts'
import { LABELS } from '../../labels.ts'

export default function NotFoundPage() {
  useTitrePage(LABELS.erreurs.introuvableTitre)

  return (
    <div className="pile pile--lg">
      <h1>{LABELS.erreurs.introuvableTitre}</h1>
      <p>{LABELS.erreurs.introuvableTexte}</p>
      <p>
        <Link className="lien" href="/">
          {LABELS.erreurs.retour}
        </Link>
      </p>
    </div>
  )
}
