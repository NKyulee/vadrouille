import { createContext, useContext } from 'react'
import type { Activite, Seance } from '../data/types.ts'

/* Le catalogue porte les deux niveaux : les créneaux hebdomadaires
   (`Activite`) et leurs occurrences datées (`Seance`). Il est partagé par les
   deux espaces — le professionnel modifie, les membres consultent. */
export interface Catalogue {
  activites: readonly Activite[]
  seances: readonly Seance[]
  activiteParId: (id: string | undefined) => Activite | undefined
  seanceParId: (id: string | undefined) => Seance | undefined
  /** Séances d'une date donnée, triées par heure. */
  duJour: (date: string) => Seance[]
  /** Prochaines occurrences d'un créneau, à partir d'aujourd'hui. */
  seancesDe: (activiteId: string) => Seance[]
  duProfessionnel: (professionnelId: string) => Activite[]
  /** Renvoie l'identifiant attribué à la nouvelle activité. */
  ajouter: (activite: Omit<Activite, 'id'>) => string
  /** Régénère les séances : changer de jour déplace toutes les occurrences. */
  modifier: (id: string, champs: Omit<Activite, 'id'>) => void
  /** Supprime le créneau **et** ses séances. */
  supprimer: (id: string) => void
}

export const ContexteCatalogue = createContext<Catalogue | null>(null)

export function useCatalogue(): Catalogue {
  const valeur = useContext(ContexteCatalogue)
  if (!valeur) throw new Error('useCatalogue doit être appelé sous <CatalogueProvider>.')
  return valeur
}
