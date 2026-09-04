import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { aujourdhuiIso } from '../data/dates.ts'
import { INSCRIPTIONS_INITIALES, mesSeances, prochaineSeance } from '../data/mock.ts'
import { useCatalogue } from './catalogue.ts'
import { ContexteInscriptions } from './inscriptions.ts'

export default function InscriptionsProvider({ children }: { children: ReactNode }) {
  const { seances } = useCatalogue()
  const [inscrits, setInscrits] = useState<ReadonlySet<string>>(
    () => new Set(INSCRIPTIONS_INITIALES),
  )

  const basculer = useCallback((seanceId: string) => {
    setInscrits((precedent) => {
      const suivant = new Set(precedent)
      if (!suivant.delete(seanceId)) suivant.add(seanceId)
      return suivant
    })
  }, [])

  /* Dérivé du catalogue, pas d'une copie : une séance supprimée par le
     professionnel disparaît d'elle-même des inscriptions, sans nettoyage. */
  const valeur = useMemo(() => {
    const miennes = mesSeances(seances, inscrits)
    return {
      estInscrit: (seanceId: string) => inscrits.has(seanceId),
      basculer,
      mesSeances: miennes,
      prochaine: prochaineSeance(seances, inscrits, aujourdhuiIso()),
      nombre: miennes.length,
    }
  }, [seances, inscrits, basculer])

  return <ContexteInscriptions value={valeur}>{children}</ContexteInscriptions>
}
