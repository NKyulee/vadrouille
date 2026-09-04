import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { aujourdhuiIso } from '../data/dates.ts'
import {
  chargerCatalogue,
  chargerLieux,
  chargerParticipants,
  creerActivite,
  modifierActivite,
  supprimerActivite,
} from '../data/requetes.ts'
import type { Activite, ChampsEcriture, Lieu, Membre, Seance } from '../data/types.ts'
import { ContexteCatalogue } from './catalogue.ts'

export default function CatalogueProvider({ children }: { children: ReactNode }) {
  const [activites, setActivites] = useState<readonly Activite[]>([])
  const [seances, setSeances] = useState<readonly Seance[]>([])
  const [participants, setParticipants] = useState<Map<string, Membre[]>>(new Map())
  const [lieux, setLieux] = useState<readonly Lieu[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)

  const recharger = useCallback(async () => {
    try {
      const [catalogue, parSeance, tousLieux] = await Promise.all([
        chargerCatalogue(),
        chargerParticipants(),
        chargerLieux(),
      ])
      setActivites(catalogue.activites)
      setSeances(catalogue.seances)
      setParticipants(parSeance)
      setLieux(tousLieux)
      setErreur(null)
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e))
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void recharger()
  }, [recharger])

  /* Après une écriture, on relit tout plutôt que de rapiécer l'état local :
     la base recalcule les séances, les occupations et les participants, et
     deviner ces effets côté client finirait par diverger. */
  const ajouter = useCallback(
    async (champs: ChampsEcriture) => {
      const id = await creerActivite(champs)
      await recharger()
      return id
    },
    [recharger],
  )

  const modifier = useCallback(
    async (id: string, champs: ChampsEcriture) => {
      await modifierActivite(id, champs)
      await recharger()
    },
    [recharger],
  )

  const supprimer = useCallback(
    async (id: string) => {
      await supprimerActivite(id)
      await recharger()
    },
    [recharger],
  )

  const valeur = useMemo(() => {
    const heureDe = (s: Seance) => activites.find((a) => a.id === s.activiteId)?.heure ?? ''
    return {
      activites,
      seances,
      lieux,
      chargement,
      erreur,
      recharger,
      activiteParId: (id: string | undefined) => activites.find((a) => a.id === id),
      seanceParId: (id: string | undefined) => seances.find((s) => s.id === id),
      duJour: (date: string) =>
        seances.filter((s) => s.date === date).sort((a, b) => heureDe(a).localeCompare(heureDe(b))),
      seancesDe: (activiteId: string) =>
        seances
          .filter((s) => s.activiteId === activiteId && s.date >= aujourdhuiIso())
          .sort((a, b) => a.date.localeCompare(b.date)),
      duProfessionnel: (professionnelId: string) =>
        activites.filter((a) => a.professionnelId === professionnelId),
      participantsDe: (seanceId: string) => participants.get(seanceId) ?? [],
      lieuParId: (id: string | undefined) => lieux.find((l) => l.id === id),
      ajouter,
      modifier,
      supprimer,
    }
  }, [activites, seances, lieux, participants, chargement, erreur, recharger, ajouter, modifier, supprimer])

  return <ContexteCatalogue value={valeur}>{children}</ContexteCatalogue>
}
