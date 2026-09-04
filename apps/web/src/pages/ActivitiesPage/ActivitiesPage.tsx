import { useState } from 'react'
import { Link, Tab, TabList, TabPanel, Tabs } from 'react-aria-components'
import ActivityCard from '../../components/ActivityCard/ActivityCard.tsx'
import { JOURS, aujourdhuiIso, jourDe, prochainsJours } from '../../data/index.ts'
import { useTitrePage } from '../../hooks/useTitrePage.ts'
import { LABELS } from '../../labels.ts'
import { useCatalogue } from '../../state/catalogue.ts'
import { useInscriptions } from '../../state/inscriptions.ts'
import './ActivitiesPage.scss'

export default function ActivitiesPage() {
  useTitrePage(LABELS.activites.titre)

  /* Les onglets sont les sept prochains jours, pas les sept jours de la
     semaine : ce qu'on réserve est une séance datée, la date doit donc être
     dans l'interface. Aujourd'hui d'abord — c'est ce qu'on vient consulter. */
  const aujourdhui = aujourdhuiIso()
  const [date, setDate] = useState(aujourdhui)
  const jours = prochainsJours(aujourdhui, 7)

  const { duJour, activiteParId } = useCatalogue()
  const { estInscrit, basculer, erreur } = useInscriptions()

  const libelle = (iso: string) => JOURS.find((j) => j.id === jourDe(iso))

  return (
    <div className="pile pile--lg">
      <div className="rangee rangee--espacee rangee--repli">
        <h1>{LABELS.activites.titre}</h1>
        {/* Un lien plutôt qu'une sixième entrée de nav : la barre du bas
            en compte déjà cinq, et « où ça se passe » est une facette du
            programme, pas une section à part. */}
        <Link className="lien" href="/carte">
          {LABELS.carte.versCarte}
        </Link>
      </div>

      {/* role="alert" : un refus doit être annoncé, pas seulement affiché. */}
      <p role="alert" className={erreur ? 'message-erreur' : 'hors-ecran'}>
        {erreur ?? ''}
      </p>

      {/* Un vrai tablist : les jours changent un panneau dans la même page,
          sans changer d'URL. React Aria fournit gratuitement les flèches
          gauche/droite, Home et End, et le roving tabindex. */}
      <Tabs selectedKey={date} onSelectionChange={(cle) => setDate(String(cle))} className="jours">
        <TabList className="jours__liste" aria-label={LABELS.activites.joursAria}>
          {jours.map((iso) => (
            <Tab key={iso} id={iso} className="jours__onglet">
              {/* Les deux libellés sont toujours dans le DOM ; le SCSS n'en
                  montre qu'un. Le masqué l'est en `display: none`, donc
                  jamais lu en double. */}
              <span className="jours__court" aria-hidden="true">
                {libelle(iso)?.court} {Number(iso.slice(8, 10))}
              </span>
              <span className="jours__long">{LABELS.commun.dateLongue(iso)}</span>
            </Tab>
          ))}
        </TabList>

        {jours.map((iso) => {
          const seances = duJour(iso)
          return (
            <TabPanel key={iso} id={iso} className="jours__panneau pile pile--sm">
              <p className="texte-sm texte-doux jours__date">{LABELS.commun.dateLongue(iso)}</p>

              {seances.length > 0 ? (
                <ul role="list" className="grille grille--cartes">
                  {seances.map((seance) => {
                    const activite = activiteParId(seance.activiteId)
                    if (!activite) return null
                    return (
                      <li key={seance.id}>
                        <ActivityCard
                          seance={seance}
                          activite={activite}
                          inscrit={estInscrit(seance.id)}
                          onBasculerInscription={basculer}
                        />
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="carte texte-doux">
                  {LABELS.activites.aucune(libelle(iso)?.long ?? '')}
                </p>
              )}
            </TabPanel>
          )
        })}
      </Tabs>
    </div>
  )
}
