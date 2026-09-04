import { createContext, useContext } from 'react'
import type { Seance } from '../data/types.ts'

/* Les inscriptions portent sur des **séances**, pas sur des créneaux : on
   s'inscrit à l'aquarelle du 7, pas « à l'aquarelle ».

   Côté base, une inscription **est** une réservation : la même ligne, vue du
   membre. C'est la décision qui évite d'avoir deux tables à synchroniser. */
export interface Inscriptions {
  estInscrit: (seanceId: string) => boolean
  /* Ne rejette pas : l'échec est exposé par `erreur`. Une promesse rejetée
     depuis un gestionnaire de clic passerait inaperçue, et l'utilisateur
     resterait devant un bouton qui « ne fait rien ». */
  basculer: (seanceId: string) => Promise<void>
  /** Dernier échec, à afficher dans une région live. `null` si tout va bien. */
  erreur: string | null
  /** Séances inscrites, de la plus proche à la plus lointaine. */
  mesSeances: Seance[]
  prochaine: Seance | undefined
  nombre: number
  chargement: boolean
}

export const ContexteInscriptions = createContext<Inscriptions | null>(null)

export function useInscriptions(): Inscriptions {
  const valeur = useContext(ContexteInscriptions)
  if (!valeur) throw new Error('useInscriptions doit être appelé sous <InscriptionsProvider>.')
  return valeur
}
