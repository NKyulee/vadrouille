import { Link } from 'react-aria-components'
import ActivityCard from '../../components/ActivityCard/ActivityCard.tsx'
import Avatar from '../../components/Avatar/Avatar.tsx'
import { aujourdhuiIso } from '../../data/index.ts'
import { useMembre } from '../../auth/session.ts'
import { useTitrePage } from '../../hooks/useTitrePage.ts'
import { LABELS } from '../../labels.ts'
import { useCatalogue } from '../../state/catalogue.ts'
import { useInscriptions } from '../../state/inscriptions.ts'
import './HomePage.scss'

export default function HomePage() {
  useTitrePage()

  const membre = useMembre()
  const { prochaine, estInscrit } = useInscriptions()
  const { duJour, activiteParId } = useCatalogue()

  const aujourdhui = aujourdhuiIso()
  const seancesDuJour = duJour(aujourdhui)
  const activiteDe = (activiteId: string) => activiteParId(activiteId)

  return (
    <div className="pile pile--lg">
      <header className="rangee rangee--sm">
        <Avatar initiales={membre.initiales} couleur={membre.couleur} taille="lg" />
        <div>
          <h1 className="accueil__salutation">
            {LABELS.accueil.salutation(membre.prenom)}
          </h1>
          <p className="texte-doux texte-sm">{LABELS.app.baseline}</p>
        </div>
      </header>

      <section className="pile pile--sm" aria-labelledby="titre-prochaine">
        <h2 id="titre-prochaine" className="titre-section">
          {LABELS.accueil.prochaine}
        </h2>
        {prochaine && activiteDe(prochaine.activiteId) ? (
          <ActivityCard
            seance={prochaine}
            activite={activiteDe(prochaine.activiteId)!}
            inscrit
            montrerDate
          />
        ) : (
          <p className="carte texte-doux">{LABELS.accueil.aucuneProchaine}</p>
        )}
      </section>

      <section className="pile pile--sm" aria-labelledby="titre-aujourdhui">
        <div className="rangee rangee--espacee">
          <h2 id="titre-aujourdhui" className="titre-section">
            {LABELS.accueil.aujourdhui}
          </h2>
          <span className="texte-sm texte-doux">{LABELS.commun.dateLongue(aujourdhui)}</span>
        </div>

        {seancesDuJour.length > 0 ? (
          <ul role="list" className="grille grille--cartes">
            {seancesDuJour.map((seance) => {
              const activite = activiteDe(seance.activiteId)
              if (!activite) return null
              return (
                <li key={seance.id}>
                  <ActivityCard
                    seance={seance}
                    activite={activite}
                    inscrit={estInscrit(seance.id)}
                  />
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="carte texte-doux">{LABELS.accueil.aucuneAujourdhui}</p>
        )}

        <p>
          <Link className="lien" href="/activites">
            {LABELS.accueil.parcourir}
          </Link>
        </p>
      </section>
    </div>
  )
}
