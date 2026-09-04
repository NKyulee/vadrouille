import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { RESERVATIONS } from '../data/mock.ts'
import { totalCentimes } from '../data/monnaie.ts'
import type { Professionnel, Reservation, StatutFacture, StatutReservation } from '../data/types.ts'
import { useCatalogue } from './catalogue.ts'
import { appliquerStatutFacture, aujourdhuiIso } from './facturation.ts'
import { ContextePro } from './pro.ts'
import { useIdentite } from '../auth/session.ts'

export default function ProProvider({ children }: { children: ReactNode }) {
  // Une réservation ne connaît que sa séance : il faut le catalogue pour
  // remonter au créneau et pour trier par date.
  const { seances } = useCatalogue()
  /* Le profil vient de la session, pas d'une constante : on est ici derrière
     une garde de rôle « professionnel », l'identité est donc garantie. */
  const identite = useIdentite()
  if (identite.role !== 'professionnel') {
    throw new Error("<ProProvider> monté hors de l'espace professionnel.")
  }
  const [profil, setProfil] = useState<Professionnel>(identite.profil)
  const [reservations, setReservations] = useState<readonly Reservation[]>(RESERVATIONS)

  const changerStatut = useCallback((id: string, statut: StatutReservation) => {
    setReservations((precedent) => precedent.map((r) => (r.id === id ? { ...r, statut } : r)))
  }, [])

  const changerStatutFacture = useCallback((id: string, statut: StatutFacture) => {
    const aujourdhui = aujourdhuiIso()
    setReservations((precedent) =>
      precedent.map((r) =>
        r.id === id ? { ...r, facture: appliquerStatutFacture(r.facture, statut, aujourdhui) } : r,
      ),
    )
  }, [])

  const valeur = useMemo(
    () => ({
      profil,
      enregistrerProfil: setProfil,
      reservations,
      pourActivites: (activiteIds: readonly string[]) => {
        const concernees = new Map(
          seances.filter((s) => activiteIds.includes(s.activiteId)).map((s) => [s.id, s.date]),
        )
        return reservations
          .filter((r) => concernees.has(r.seanceId))
          .sort((a, b) => (concernees.get(a.seanceId) ?? '').localeCompare(concernees.get(b.seanceId) ?? ''))
      },
      parId: (id: string | undefined) =>
        id ? reservations.find((r) => r.id === id) : undefined,
      changerStatut,
      changerStatutFacture,
      // Somme d'entiers : exacte, contrairement à une addition d'euros
      // en flottant qui dérive au fil des factures.
      resteAEncaisser: totalCentimes(
        reservations.filter((r) => r.facture.statut === 'emise').map((r) => r.facture.montantCentimes),
      ),
    }),
    [seances, profil, reservations, changerStatut, changerStatutFacture],
  )

  return <ContextePro value={valeur}>{children}</ContextePro>
}
