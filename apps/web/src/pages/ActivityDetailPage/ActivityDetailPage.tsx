import { Button, Link } from 'react-aria-components'
import { useParams } from 'react-router'
import Avatar from '../../components/Avatar/Avatar.tsx'
import AvatarGroup from '../../components/AvatarGroup/AvatarGroup.tsx'
import {
  CATEGORIES,
  JOURS,
  formaterCentimes,
  membreParId,
  membresParIds,
  placesRestantes,
} from '../../data/index.ts'
import { useTitrePage } from '../../hooks/useTitrePage.ts'
import { LABELS } from '../../labels.ts'
import { useCatalogue } from '../../state/catalogue.ts'
import { useInscriptions } from '../../state/inscriptions.ts'
import type { Activite } from '../../data/types.ts'
import './ActivityDetailPage.scss'

function Introuvable() {
  useTitrePage(LABELS.detail.introuvableTitre)

  return (
    <div className="pile pile--lg">
      <h1>{LABELS.detail.introuvableTitre}</h1>
      <p>{LABELS.detail.introuvableTexte}</p>
      <p>
        <Link className="lien" href="/activites">
          {LABELS.detail.retour}
        </Link>
      </p>
    </div>
  )
}

export default function ActivityDetailPage() {
  const { id } = useParams()
  const { activiteParId } = useCatalogue()
  const activite = activiteParId(id)

  /* Le hook de titre est appelé dans l'un ou l'autre composant, jamais
     conditionnellement ici : le retour anticipé rend un *autre* composant. */
  if (!activite) return <Introuvable />

  return <Detail activite={activite} />
}

function Detail({ activite }: { activite: Activite }) {
  useTitrePage(activite.titre)

  const { seancesDe } = useCatalogue()
  const { estInscrit, basculer } = useInscriptions()

  const categorie = CATEGORIES[activite.categorie]
  const jour = JOURS.find((j) => j.id === activite.jour)
  const responsable = membreParId(activite.responsableId)
  const seances = seancesDe(activite.id)

  return (
    <div className="pile pile--lg">
      <p className="detail__retour">
        <Link className="lien" href="/activites">
          ← {LABELS.detail.retour}
        </Link>
      </p>

      <header className="pile pile--xs">
        <span className="badge">
          <span aria-hidden="true">{categorie.emoji}</span> {categorie.label}
        </span>
        <h1>{activite.titre}</h1>
        <p className="texte-doux">{activite.description}</p>
      </header>

      {/* <dl> plutôt qu'une suite de <p> : ce sont bien des couples
          intitulé/valeur, et les lecteurs d'écran les annoncent comme tels.
          Ces informations sont celles du **créneau** : elles valent pour
          toutes ses séances. */}
      <dl className="fiche">
        <div className="fiche__ligne">
          <dt>{LABELS.detail.creneau}</dt>
          <dd>
            {LABELS.detail.tousLes(
              jour?.long ?? '',
              LABELS.commun.heure(activite.heure),
              LABELS.commun.duree(activite.dureeMinutes),
            )}
          </dd>
        </div>
        <div className="fiche__ligne">
          <dt>{LABELS.detail.ou}</dt>
          <dd>{activite.lieu}</dd>
        </div>
        <div className="fiche__ligne">
          <dt>{LABELS.detail.prix}</dt>
          <dd>{formaterCentimes(activite.prixCentimes)}</dd>
        </div>
        <div className="fiche__ligne">
          <dt>{LABELS.detail.proposePar}</dt>
          <dd>{activite.proposePar}</dd>
        </div>
      </dl>

      {responsable ? (
        <section className="pile pile--sm" aria-labelledby="titre-responsable">
          <h2 id="titre-responsable" className="titre-section">
            {LABELS.detail.responsable}
          </h2>
          <div className="responsable">
            <Avatar initiales={responsable.initiales} couleur={responsable.couleur} />
            <div className="responsable__identite">
              <span className="responsable__nom">
                {responsable.prenom} {responsable.nom}
              </span>
              <span className="texte-sm texte-doux">{LABELS.detail.responsableRole}</span>
            </div>
            {/* <a> natif : un href « tel: » quitte l'application, il n'a rien
                à faire dans le routeur. */}
            {responsable.telephone ? (
              <a
                className="bouton bouton--discret responsable__appel"
                href={`tel:${responsable.telephone.replace(/\s/g, '')}`}
                aria-label={LABELS.aide.appeler(`${responsable.prenom} ${responsable.nom}`)}
              >
                {responsable.telephone}
              </a>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* C'est ici qu'on s'inscrit : à une date, pas au créneau. Chaque
          séance a ses propres places et ses propres inscrits. */}
      <section className="pile pile--sm" aria-labelledby="titre-seances">
        <h2 id="titre-seances" className="titre-section">
          {LABELS.detail.prochainesSeances}
        </h2>

        {seances.length > 0 ? (
          <ul role="list" className="pile pile--sm">
            {seances.map((seance) => {
              const inscrit = estInscrit(seance.id)
              const restantes = placesRestantes(seance)
              const complet = restantes === 0 && !inscrit
              const participants = membresParIds(seance.participants)

              return (
                <li key={seance.id} className="seance" data-inscrit={inscrit || undefined}>
                  <div className="seance__quand">
                    <span className="seance__date">{LABELS.commun.dateLongue(seance.date)}</span>
                    <span className="texte-sm texte-doux">
                      {LABELS.commun.placesRestantes(restantes, seance.placesTotal)}
                    </span>
                  </div>

                  <AvatarGroup membres={participants} max={4} />

                  <Button
                    className={`bouton ${inscrit ? 'bouton--discret' : ''} seance__action`}
                    isDisabled={complet}
                    onPress={() => basculer(seance.id)}
                  >
                    {complet
                      ? LABELS.activites.complet
                      : inscrit
                        ? LABELS.activites.seDesinscrire
                        : LABELS.activites.sInscrire}
                    <span className="hors-ecran">
                      {' '}
                      — {LABELS.commun.dateLongue(seance.date)}
                    </span>
                  </Button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="carte texte-doux">{LABELS.detail.aucuneSeance}</p>
        )}
      </section>
    </div>
  )
}
