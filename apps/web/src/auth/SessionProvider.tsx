import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from './supabase.ts'
import { ContexteSession } from './session.ts'
import type { Identite } from './session.ts'
import type { CouleurAvatar } from '../data/types.ts'

/* L'API renvoie les colonnes telles qu'en base, en snake_case. La conversion
   se fait ici, à la frontière : le reste de l'application ne connaît que les
   types du domaine. */
interface ReponseProfil {
  role: 'membre' | 'professionnel'
  profil: Record<string, string | null>
}

function versIdentite(reponse: ReponseProfil, email: string): Identite {
  const p = reponse.profil
  const commun = {
    id: String(p.user_id),
    prenom: String(p.prenom),
    nom: String(p.nom),
    initiales: String(p.initiales),
    couleur: (p.couleur_avatar ?? 'foret') as CouleurAvatar,
  }

  if (reponse.role === 'professionnel') {
    return {
      role: 'professionnel',
      profil: {
        ...commun,
        structure: String(p.structure),
        email,
        telephone: String(p.telephone),
        siret: String(p.siret),
        presentation: String(p.presentation ?? ''),
      },
    }
  }

  return {
    role: 'membre',
    profil: { ...commun, membreDepuis: p.membre_depuis ?? undefined },
  }
}

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/**
 * Qui est connecté, et avec quel rôle.
 *
 * Le rôle vient de l'API, pas du jeton lu côté navigateur. On *pourrait* le
 * décoder du JWT — il est dans `app_metadata` — mais faire décider le front
 * de ses propres droits est une mauvaise habitude : le jour où quelqu'un
 * bricole le stockage local, l'écran s'ouvre. C'est le serveur qui répond,
 * et le RLS qui tranche pour de bon.
 */
export default function SessionProvider({ children }: { children: ReactNode }) {
  const [identite, setIdentite] = useState<Identite | undefined>(undefined)
  const [chargement, setChargement] = useState(true)

  const rafraichir = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    const jeton = data.session?.access_token
    // L'e-mail vit dans auth.users, pas dans la table profil : on le prend
    // sur la session plutôt que d'en dupliquer une copie en base.
    const email = data.session?.user.email ?? ''

    if (!jeton) {
      setIdentite(undefined)
      setChargement(false)
      return
    }

    try {
      const reponse = await fetch(`${API}/api/moi`, {
        headers: { Authorization: `Bearer ${jeton}` },
      })
      setIdentite(
        reponse.ok ? versIdentite((await reponse.json()) as ReponseProfil, email) : undefined,
      )
    } catch {
      // API injoignable : on reste déconnecté plutôt que d'ouvrir des écrans
      // sur la foi d'un jeton qu'on n'a pas pu faire valider.
      setIdentite(undefined)
    }
    setChargement(false)
  }, [])

  useEffect(() => {
    /* C'est précisément le cas d'usage d'un effet : synchroniser avec un
       système extérieur — ici Supabase et l'API. La règle du linter vise les
       états dérivables au rendu ; celui-ci ne l'est pas, il vient du réseau. */
    // oxlint-disable-next-line react/set-state-in-effect
    void rafraichir()

    /* Supabase émet aussi sur les autres onglets : se déconnecter d'un côté
       ferme la session partout, sans rechargement. */
    const { data } = supabase.auth.onAuthStateChange(() => {
      void rafraichir()
    })
    return () => data.subscription.unsubscribe()
  }, [rafraichir])

  const seDeconnecter = useCallback(async () => {
    await supabase.auth.signOut()
    setIdentite(undefined)
  }, [])

  const valeur = useMemo(
    () => ({ identite, chargement, seDeconnecter, rafraichir }),
    [identite, chargement, seDeconnecter, rafraichir],
  )

  return <ContexteSession value={valeur}>{children}</ContexteSession>
}
