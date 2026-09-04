import { createContext, useContext } from 'react'
import type { Membre, Professionnel } from '../data/types.ts'

export type Role = 'membre' | 'professionnel'

/* L'adresse de connexion accompagne l'identité sans appartenir au profil :
   elle vit dans auth.users, pas dans nos tables. La dupliquer en base ferait
   deux sources pour la même information. */
export type Identite = { email: string } & (
  | { role: 'membre'; profil: Membre }
  | { role: 'professionnel'; profil: Professionnel }
)

export interface Session {
  /** `undefined` tant qu'on n'a pas fini d'interroger l'API. */
  identite: Identite | undefined
  /* Connecté, mais sans profil métier : le compte existe dans Supabase Auth
     et rien ne lui correspond dans `membre` ni `professionnel`. Distinct de
     « pas connecté » — sans quoi on renverrait vers l'écran de connexion,
     qui réussirait, qui renverrait encore : une boucle sans issue. */
  profilManquant: boolean
  /** Vrai pendant la vérification initiale : ne rien afficher avant. */
  chargement: boolean
  seDeconnecter: () => Promise<void>
  rafraichir: () => Promise<void>
}

export const ContexteSession = createContext<Session | null>(null)

export function useSession(): Session {
  const valeur = useContext(ContexteSession)
  if (!valeur) throw new Error('useSession doit être appelé sous <SessionProvider>.')
  return valeur
}

/** Lance une erreur si personne n'est connecté. À n'appeler que dans une page
    déjà derrière une garde de route. */
export function useIdentite(): Identite {
  const { identite } = useSession()
  if (!identite) throw new Error("useIdentite appelé hors d'une route protégée.")
  return identite
}

/** Idem, en exigeant le rôle membre. */
export function useMembre(): Membre {
  const identite = useIdentite()
  if (identite.role !== 'membre') throw new Error('useMembre appelé hors de l\'espace membre.')
  return identite.profil
}
