import { Button, Link } from 'react-aria-components'
import AvatarGroup from '../AvatarGroup/AvatarGroup.tsx'
import { CATEGORIES, membresParIds, placesRestantes } from '../../data/mock.ts'
import { LABELS } from '../../labels.ts'
import type { Activite, Seance } from '../../data/types.ts'
import './ActivityCard.scss'

interface ActivityCardProps {
  /** L'occurrence datée : c'est elle qu'on réserve. */
  seance: Seance
  /** Le créneau dont elle vient : titre, lieu, horaire, prix. */
  activite: Activite
  inscrit: boolean
  onBasculerInscription?: (seanceId: string) => void
  /** À activer dans les listes qui mêlent plusieurs dates. */
  montrerDate?: boolean
}

export default function ActivityCard({
  seance,
  activite,
  inscrit,
  onBasculerInscription,
  montrerDate = false,
}: ActivityCardProps) {
  const categorie = CATEGORIES[activite.categorie]
  const participants = membresParIds(seance.participants)
  const restantes = placesRestantes(seance)
  const complet = restantes === 0 && !inscrit

  return (
    <article className="activite" data-inscrit={inscrit || undefined}>
      <div className="activite__entete">
        <span className="activite__pastille" aria-hidden="true">
          {categorie.emoji}
        </span>
        <div className="activite__intitule">
          {/* Lien étendu : le <a> ne porte que le titre — donc un seul arrêt
              clavier, et un libellé qui a du sens hors contexte — mais son
              ::after couvre toute la carte, qui devient cliquable à la souris.
              Imbriquer le bouton d'inscription dans le lien serait du HTML
              invalide et le rendrait inatteignable au clavier. */}
          <h3 className="activite__titre">
            <Link className="activite__lien" href={`/activites/${activite.id}`}>
              {activite.titre}
            </Link>
          </h3>
          <p className="activite__meta texte-sm texte-doux">
            {montrerDate ? <>{LABELS.commun.dateCourte(seance.date)}{' · '}</> : null}
            <time>{LABELS.commun.heure(activite.heure)}</time>
            {' · '}
            {LABELS.commun.duree(activite.dureeMinutes)}
            {' · '}
            {activite.lieu}
          </p>
        </div>
      </div>

      <p className="activite__description">{activite.description}</p>

      <div className="activite__pied">
        <span className="rangee rangee--xs">
          <AvatarGroup membres={participants} />
          {/* Les places restantes sont propres à cette séance : c'est tout
              l'intérêt de la distinction créneau / occurrence. */}
          <span className="texte-sm texte-doux">
            {LABELS.commun.placesRestantes(restantes, seance.placesTotal)}
          </span>
        </span>

        {onBasculerInscription ? (
          <Button
            className={`bouton ${inscrit ? 'bouton--discret' : ''} activite__action`}
            isDisabled={complet}
            onPress={() => onBasculerInscription(seance.id)}
          >
            {complet
              ? LABELS.activites.complet
              : inscrit
                ? LABELS.activites.seDesinscrire
                : LABELS.activites.sInscrire}
            <span className="hors-ecran">
              {' '}
              — {activite.titre}, {LABELS.commun.dateCourte(seance.date)}
            </span>
          </Button>
        ) : (
          <span className={`badge ${inscrit ? 'badge--succes' : ''}`}>
            {inscrit ? LABELS.activites.inscrit : categorie.label}
          </span>
        )}
      </div>
    </article>
  )
}
