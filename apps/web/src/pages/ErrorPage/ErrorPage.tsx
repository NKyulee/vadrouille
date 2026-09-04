import { Link } from 'react-aria-components'
import { isRouteErrorResponse, useRouteError } from 'react-router'
import { useTitrePage } from '../../hooks/useTitrePage.ts'
import { LABELS } from '../../labels.ts'

export default function ErrorPage() {
  const error = useRouteError()

  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : LABELS.erreurs.titreParDefaut
  const detail = isRouteErrorResponse(error)
    ? error.data
    : error instanceof Error
      ? error.message
      : String(error)

  // Le titre suit l'erreur : « 404 Not Found · La vadrouille ».
  useTitrePage(title)

  return (
    <div className="conteneur conteneur--aere">
      <div className="pile pile--lg">
        <h1>{title}</h1>
        <p>{LABELS.erreurs.inattendue}</p>
        {detail ? <code className="bloc-code">{detail}</code> : null}
        <p>
          <Link className="lien" href="/">
            {LABELS.erreurs.retour}
          </Link>
        </p>
      </div>
    </div>
  )
}
