import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useIdentite } from '../auth/session.ts'
import { totalCentimes } from '../data/monnaie.ts'
import {
  changerStatutReservation,
  chargerReservations,
  emettreFacture,
  enregistrerProfilPro,
  marquerFacturePayee,
} from '../data/requetes.ts'
import type { Professionnel, Reservation, StatutReservation } from '../data/types.ts'
import { useCatalogue } from './catalogue.ts'
import { ContextePro } from './pro.ts'

export default function ProProvider({ children }: { children: ReactNode }) {
  // Une réservation ne connaît que sa séance : il faut le catalogue pour
  // remonter au créneau et pour trier par date.
  const { seances, recharger } = useCatalogue()
  const identite = useIdentite()
  if (identite.role !== 'professionnel') {
    throw new Error("<ProProvider> monté hors de l'espace professionnel.")
  }

  const [profil, setProfil] = useState<Professionnel>(identite.profil)
  const [reservations, setReservations] = useState<readonly Reservation[]>([])
  const [chargement, setChargement] = useState(true)

  const relire = useCallback(async () => {
    setReservations(await chargerReservations())
    setChargement(false)
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void relire()
  }, [relire])

  const enregistrer = useCallback(async (suivant: Professionnel) => {
    await enregistrerProfilPro(suivant)
    setProfil(suivant)
  }, [])

  const changerStatut = useCallback(
    async (id: string, statut: StatutReservation) => {
      await changerStatutReservation(id, statut)
      // Le compteur de places de la séance bouge avec le statut.
      await Promise.all([relire(), recharger()])
    },
    [relire, recharger],
  )

  const emettre = useCallback(
    async (reservationId: string) => {
      await emettreFacture(reservationId)
      await relire()
    },
    [relire],
  )

  const marquerPayee = useCallback(
    async (reservationId: string) => {
      await marquerFacturePayee(reservationId)
      await relire()
    },
    [relire],
  )

  const valeur = useMemo(() => {
    const dateDe = new Map(seances.map((s) => [s.id, s.date]))
    return {
      profil,
      enregistrerProfil: enregistrer,
      reservations,
      chargement,
      pourActivites: (activiteIds: readonly string[]) => {
        const concernees = new Set(
          seances.filter((s) => activiteIds.includes(s.activiteId)).map((s) => s.id),
        )
        return reservations
          .filter((r) => concernees.has(r.seanceId))
          .sort((a, b) => (dateDe.get(a.seanceId) ?? '').localeCompare(dateDe.get(b.seanceId) ?? ''))
      },
      parId: (id: string | undefined) => reservations.find((r) => r.id === id),
      changerStatut,
      emettre,
      marquerPayee,
      // Somme d'entiers : exacte, contrairement à une addition d'euros
      // en flottant qui dérive au fil des factures.
      resteAEncaisser: totalCentimes(
        reservations
          .filter((r) => r.facture?.statut === 'emise')
          .map((r) => r.facture?.montantCentimes ?? 0),
      ),
    }
  }, [seances, profil, reservations, chargement, enregistrer, changerStatut, emettre, marquerPayee])

  return <ContextePro value={valeur}>{children}</ContextePro>
}
