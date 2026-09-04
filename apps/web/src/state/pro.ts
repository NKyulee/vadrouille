import { createContext, useContext } from 'react'
import type { Professionnel, Reservation, StatutFacture, StatutReservation } from '../data/types.ts'

/* État de l'espace professionnel : sa fiche, ses réservations et leur
   facturation. Séparé du catalogue, qui lui est partagé avec les membres. */
export interface EspacePro {
  profil: Professionnel
  enregistrerProfil: (profil: Professionnel) => void
  reservations: readonly Reservation[]
  /** Réservations portant sur les séances de ces créneaux, par date de séance. */
  pourActivites: (activiteIds: readonly string[]) => Reservation[]
  parId: (id: string | undefined) => Reservation | undefined
  changerStatut: (id: string, statut: StatutReservation) => void
  changerStatutFacture: (id: string, statut: StatutFacture) => void
  /** Total facturé mais pas encore encaissé, **en centimes**. */
  resteAEncaisser: number
}

export const ContextePro = createContext<EspacePro | null>(null)

export function usePro(): EspacePro {
  const valeur = useContext(ContextePro)
  if (!valeur) throw new Error('usePro doit être appelé sous <ProProvider>.')
  return valeur
}
