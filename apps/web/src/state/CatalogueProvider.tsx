import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { aujourdhuiIso, occurrencesHebdomadaires } from '../data/dates.ts'
import {
  ACTIVITES,
  SEANCES,
  activiteParId,
  seanceParId,
  seancesDeLActivite,
  seancesDuJour,
} from '../data/mock.ts'
import type { Activite, Seance } from '../data/types.ts'
import { ContexteCatalogue } from './catalogue.ts'

const SEMAINES_GENEREES = 6

/**
 * (Re)construit les séances d'un créneau.
 *
 * Les inscrits sont repris **par rang d'occurrence**, pas par date : si le
 * professionnel déplace son atelier du lundi au mardi, les gens inscrits à la
 * première séance restent inscrits à la première séance. Les perdre serait
 * pire que de les déplacer.
 */
function regenerer(activite: Activite, existantes: readonly Seance[], depuis: string): Seance[] {
  const anciennes = existantes
    .filter((s) => s.activiteId === activite.id)
    .sort((a, b) => a.date.localeCompare(b.date))

  return occurrencesHebdomadaires(activite.jour, depuis, SEMAINES_GENEREES).map((date, index) => ({
    id: `s-${activite.id}-${index}`,
    activiteId: activite.id,
    date,
    placesTotal: activite.placesParDefaut,
    participants: anciennes[index]?.participants ?? [],
    inscritParDefaut: anciennes[index]?.inscritParDefaut ?? false,
  }))
}

export default function CatalogueProvider({ children }: { children: ReactNode }) {
  const [activites, setActivites] = useState<readonly Activite[]>(ACTIVITES)
  const [seances, setSeances] = useState<readonly Seance[]>(SEANCES)

  const ajouter = useCallback((champs: Omit<Activite, 'id'>) => {
    /* Identifiant tiré de l'horloge : suffisant tant qu'il n'y a pas d'API,
       et impossible à télescoper avec les « a1 »… des données d'amorce. */
    const id = `a-${Date.now().toString(36)}`
    const activite = { ...champs, id }
    setActivites((precedent) => [...precedent, activite])
    setSeances((precedent) => [...precedent, ...regenerer(activite, [], aujourdhuiIso())])
    return id
  }, [])

  const modifier = useCallback((id: string, champs: Omit<Activite, 'id'>) => {
    const activite = { ...champs, id }
    setActivites((precedent) => precedent.map((a) => (a.id === id ? activite : a)))
    setSeances((precedent) => [
      ...precedent.filter((s) => s.activiteId !== id),
      ...regenerer(activite, precedent, aujourdhuiIso()),
    ])
  }, [])

  // Les séances partent avec le créneau : sans ça, elles resteraient
  // orphelines et les pages planteraient en cherchant leur activité.
  const supprimer = useCallback((id: string) => {
    setActivites((precedent) => precedent.filter((a) => a.id !== id))
    setSeances((precedent) => precedent.filter((s) => s.activiteId !== id))
  }, [])

  const valeur = useMemo(
    () => ({
      activites,
      seances,
      activiteParId: (id: string | undefined) => activiteParId(activites, id),
      seanceParId: (id: string | undefined) => seanceParId(seances, id),
      duJour: (date: string) => seancesDuJour(seances, activites, date),
      seancesDe: (activiteId: string) => seancesDeLActivite(seances, activiteId, aujourdhuiIso()),
      duProfessionnel: (professionnelId: string) =>
        activites.filter((a) => a.professionnelId === professionnelId),
      ajouter,
      modifier,
      supprimer,
    }),
    [activites, seances, ajouter, modifier, supprimer],
  )

  return <ContexteCatalogue value={valeur}>{children}</ContexteCatalogue>
}
