import { createContext, useContext } from 'react'
import type { Professionnel, Reservation, StatutReservation } from '../data/types.ts'

/* État de l'espace professionnel : sa fiche et les réservations sur ses
   séances. Le catalogue, lui, est commun aux deux espaces. */
export interface EspacePro {
  profil: Professionnel
  enregistrerProfil: (profil: Professionnel) => Promise<void>
  reservations: readonly Reservation[]
  chargement: boolean
  /** Réservations portant sur les séances de ces créneaux, par date. */
  pourActivites: (activiteIds: readonly string[]) => Reservation[]
  parId: (id: string | undefined) => Reservation | undefined
  changerStatut: (id: string, statut: StatutReservation) => Promise<void>
  /** Attribue le numéro côté base : la séquence doit rester continue. */
  emettre: (reservationId: string) => Promise<void>
  marquerPayee: (reservationId: string) => Promise<void>
  /** Total facturé mais pas encore encaissé, **en centimes**. */
  resteAEncaisser: number
}

export const ContextePro = createContext<EspacePro | null>(null)

export function usePro(): EspacePro {
  const valeur = useContext(ContextePro)
  if (!valeur) throw new Error('usePro doit être appelé sous <ProProvider>.')
  return valeur
}
