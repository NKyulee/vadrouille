import { createContext, useContext } from 'react'
import type { Activite, ChampsEcriture, Lieu, Membre, Seance } from '../data/types.ts'

/* Le catalogue porte les deux niveaux — créneaux et occurrences datées — et
   les participants visibles. Il est partagé par les deux espaces.

   Les données viennent maintenant de Supabase : d'où `chargement` et
   `erreur`, absents tant que tout tenait en mémoire. Un écran ne doit ni
   afficher une liste vide pendant le chargement, ni faire comme si de rien
   n'était en cas de panne réseau. */
export interface Catalogue {
  activites: readonly Activite[]
  seances: readonly Seance[]
  lieux: readonly Lieu[]
  chargement: boolean
  erreur: string | null
  recharger: () => Promise<void>

  activiteParId: (id: string | undefined) => Activite | undefined
  seanceParId: (id: string | undefined) => Seance | undefined
  /** Séances d'une date donnée, triées par heure de début. */
  duJour: (date: string) => Seance[]
  /** Prochaines occurrences d'un créneau, à partir d'aujourd'hui. */
  seancesDe: (activiteId: string) => Seance[]
  duProfessionnel: (professionnelId: string) => Activite[]
  /** Vide tant qu'on n'est pas soi-même inscrit à la séance. */
  participantsDe: (seanceId: string) => Membre[]
  lieuParId: (id: string | undefined) => Lieu | undefined

  ajouter: (activite: ChampsEcriture) => Promise<string>
  modifier: (id: string, champs: ChampsEcriture) => Promise<void>
  supprimer: (id: string) => Promise<void>
}

export const ContexteCatalogue = createContext<Catalogue | null>(null)

export function useCatalogue(): Catalogue {
  const valeur = useContext(ContexteCatalogue)
  if (!valeur) throw new Error('useCatalogue doit être appelé sous <CatalogueProvider>.')
  return valeur
}
