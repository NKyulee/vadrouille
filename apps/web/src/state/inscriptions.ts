import { createContext, useContext } from 'react'
import type { Seance } from '../data/types.ts'

/* Les inscriptions portent sur des **séances**, pas sur des créneaux : on
   s'inscrit à l'aquarelle du 7, pas « à l'aquarelle ». */
export interface Inscriptions {
  estInscrit: (seanceId: string) => boolean
  basculer: (seanceId: string) => void
  /** Séances inscrites, de la plus proche à la plus lointaine. */
  mesSeances: Seance[]
  prochaine: Seance | undefined
  nombre: number
}

export const ContexteInscriptions = createContext<Inscriptions | null>(null)

export function useInscriptions(): Inscriptions {
  const valeur = useContext(ContexteInscriptions)
  if (!valeur) throw new Error('useInscriptions doit être appelé sous <InscriptionsProvider>.')
  return valeur
}
