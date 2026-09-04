import { Navigate, Outlet, useLocation } from 'react-router'
import { useSession } from './session.ts'
import type { Role } from './session.ts'
import { LABELS } from '../labels.ts'

/**
 * Garde de route. **Confort d'affichage, pas sécurité** : elle évite de
 * montrer un écran vide à quelqu'un qui n'y a pas droit. La protection
 * réelle est côté serveur — les gardes de l'API et le RLS en base.
 * Contourner celle-ci ne donne accès à aucune donnée.
 */
export default function RouteProtegee({ role }: { role?: Role }) {
  const { identite, chargement } = useSession()
  const { pathname } = useLocation()

  // Rien pendant la vérification : afficher l'écran de connexion puis le
  // remplacer ferait clignoter la page à chaque chargement.
  if (chargement) {
    return (
      <p className="conteneur conteneur--aere" role="status">
        {LABELS.auth.verification}
      </p>
    )
  }

  if (!identite) {
    // `state` garde la destination : après connexion, on y retourne plutôt
    // que d'atterrir bêtement sur l'accueil.
    return <Navigate to="/connexion" replace state={{ retour: pathname }} />
  }

  /* Mauvais rôle : on renvoie vers *son* espace, pas vers une page d'erreur.
     Un membre qui tombe sur /pro s'est trompé de lien, il n'a pas besoin
     d'un 403. */
  if (role && identite.role !== role) {
    return <Navigate to={identite.role === 'professionnel' ? '/pro' : '/'} replace />
  }

  return <Outlet />
}
