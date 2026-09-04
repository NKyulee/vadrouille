import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useIdentite } from '../auth/session.ts'
import { aujourdhuiIso } from '../data/dates.ts'
import {
  SeanceComplete,
  chargerMesInscriptions,
  sInscrire,
  seDesinscrire,
} from '../data/requetes.ts'
import { LABELS } from '../labels.ts'
import { useCatalogue } from './catalogue.ts'
import { ContexteInscriptions } from './inscriptions.ts'

export default function InscriptionsProvider({ children }: { children: ReactNode }) {
  const identite = useIdentite()
  const { seances, recharger } = useCatalogue()
  const [inscrits, setInscrits] = useState<ReadonlySet<string>>(new Set())
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)

  const relire = useCallback(async () => {
    const ids = await chargerMesInscriptions()
    setInscrits(new Set(ids))
    setChargement(false)
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void relire()
  }, [relire])

  /* Pas de mise à jour optimiste : la capacité est vérifiée par la base, et
     afficher « inscrit » avant sa réponse mentirait une fois sur deux quand
     la séance se remplit. On recharge le catalogue pour que le compteur de
     places suive. */
  const basculer = useCallback(
    async (seanceId: string) => {
      setErreur(null)
      try {
        if (inscrits.has(seanceId)) {
          await seDesinscrire(seanceId, identite.profil.id)
        } else {
          await sInscrire(seanceId, identite.profil.id)
        }
      } catch (e) {
        /* La dernière place a pu partir entre l'affichage et le clic : c'est
           un refus normal, pas une panne. On recharge quand même, pour que le
           compteur reflète la réalité. */
        setErreur(e instanceof SeanceComplete ? LABELS.inscriptions.complete : LABELS.inscriptions.echec)
      }
      await Promise.all([relire(), recharger()])
    },
    [inscrits, identite.profil.id, relire, recharger],
  )

  /* Dérivé du catalogue, pas d'une copie : une séance supprimée par le
     professionnel disparaît d'elle-même des inscriptions. */
  const valeur = useMemo(() => {
    const miennes = seances
      .filter((s) => inscrits.has(s.id))
      .sort((a, b) => a.date.localeCompare(b.date))
    const aujourdhui = aujourdhuiIso()
    return {
      estInscrit: (seanceId: string) => inscrits.has(seanceId),
      basculer,
      mesSeances: miennes,
      prochaine: miennes.find((s) => s.date >= aujourdhui),
      nombre: miennes.length,
      chargement,
      erreur,
    }
  }, [seances, inscrits, basculer, chargement, erreur])

  return <ContexteInscriptions value={valeur}>{children}</ContexteInscriptions>
}
