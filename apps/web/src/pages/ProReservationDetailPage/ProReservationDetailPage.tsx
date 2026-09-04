import { Button, Link } from 'react-aria-components'
import { useParams } from 'react-router'
import Avatar from '../../components/Avatar/Avatar.tsx'
import {
  StatutFactureBadge,
  StatutReservationBadge,
} from '../../components/StatutBadge/StatutBadge.tsx'
import { formaterCentimes, membreParId } from '../../data/index.ts'
import { useTitrePage } from '../../hooks/useTitrePage.ts'
import { LABELS } from '../../labels.ts'
import { useCatalogue } from '../../state/catalogue.ts'
import { usePro } from '../../state/pro.ts'
import './ProReservationDetailPage.scss'

function Introuvable() {
  useTitrePage(LABELS.pro.detail.introuvableTitre)
  return (
    <div className="pile pile--lg">
      <h1>{LABELS.pro.detail.introuvableTitre}</h1>
      <p>{LABELS.pro.detail.introuvableTexte}</p>
      <p>
        <Link className="lien" href="/pro/reservations">
          {LABELS.pro.detail.retour}
        </Link>
      </p>
    </div>
  )
}

export default function ProReservationDetailPage() {
  const { id } = useParams()
  const { parId: reservationParId, changerStatut, changerStatutFacture } = usePro()
  const { activiteParId, seanceParId } = useCatalogue()

  const reservation = reservationParId(id)
  const seance = seanceParId(reservation?.seanceId)
  const activite = activiteParId(seance?.activiteId)
  const membre = reservation ? membreParId(reservation.membreId) : undefined

  useTitrePage(reservation && membre ? `${LABELS.pro.detail.titre} — ${membre.prenom}` : undefined)

  if (!reservation || !seance || !activite || !membre) return <Introuvable />

  const { facture } = reservation
  const gratuite = facture.montantCentimes === 0

  return (
    <div className="pile pile--lg">
      <p>
        <Link className="lien" href="/pro/reservations">
          ← {LABELS.pro.detail.retour}
        </Link>
      </p>

      <header className="rangee rangee--sm">
        <Avatar initiales={membre.initiales} couleur={membre.couleur} taille="lg" />
        <div>
          <h1>
            {membre.prenom} {membre.nom}
          </h1>
          <p className="texte-doux">{activite.titre}</p>
        </div>
      </header>

      <dl className="fiche">
        <div className="fiche__ligne">
          <dt>{LABELS.pro.detail.seance}</dt>
          <dd>{LABELS.commun.dateLongue(seance.date)}</dd>
        </div>
        <div className="fiche__ligne">
          <dt>{LABELS.pro.detail.personnes}</dt>
          <dd>{LABELS.pro.reservations.personnes(reservation.personnes)}</dd>
        </div>
        <div className="fiche__ligne">
          <dt>{LABELS.detail.ou}</dt>
          <dd>{activite.lieu}</dd>
        </div>
        <div className="fiche__ligne">
          <dt>{LABELS.pro.detail.statut}</dt>
          <dd>
            <StatutReservationBadge statut={reservation.statut} />
          </dd>
        </div>
      </dl>

      <section className="pile pile--sm" aria-labelledby="titre-statut">
        <h2 id="titre-statut" className="titre-section">
          {LABELS.pro.detail.statut}
        </h2>
        <div className="rangee rangee--xs rangee--repli">
          <Button
            className="bouton"
            isDisabled={reservation.statut === 'confirmee'}
            onPress={() => changerStatut(reservation.id, 'confirmee')}
          >
            {LABELS.pro.detail.confirmer}
          </Button>
          <Button
            className="bouton bouton--discret"
            isDisabled={reservation.statut === 'annulee'}
            onPress={() => changerStatut(reservation.id, 'annulee')}
          >
            {LABELS.pro.detail.annuler}
          </Button>
        </div>
      </section>

      <section className="pile pile--sm" aria-labelledby="titre-facturation">
        <h2 id="titre-facturation" className="titre-section">
          {LABELS.pro.detail.facturation}
        </h2>

        {gratuite ? (
          <p className="carte texte-doux">{LABELS.pro.detail.gratuite}</p>
        ) : (
          <>
            <dl className="fiche">
              <div className="fiche__ligne">
                <dt>{LABELS.pro.detail.numero}</dt>
                <dd className="facture__numero">{facture.numero}</dd>
              </div>
              <div className="fiche__ligne">
                <dt>{LABELS.pro.detail.montant}</dt>
                <dd>{formaterCentimes(facture.montantCentimes)}</dd>
              </div>
              <div className="fiche__ligne">
                <dt>{LABELS.pro.detail.statut}</dt>
                <dd>
                  <StatutFactureBadge statut={facture.statut} />
                </dd>
              </div>
              {facture.emiseLe ? (
                <div className="fiche__ligne">
                  <dt>{LABELS.pro.detail.emiseLe}</dt>
                  <dd>{LABELS.commun.dateCourte(facture.emiseLe)}</dd>
                </div>
              ) : null}
              {facture.payeeLe ? (
                <div className="fiche__ligne">
                  <dt>{LABELS.pro.detail.payeeLe}</dt>
                  <dd>{LABELS.commun.dateCourte(facture.payeeLe)}</dd>
                </div>
              ) : null}
            </dl>

            {/* Une seule progression possible à la fois : les boutons hors
                de l'étape courante sont désactivés plutôt que masqués, pour
                que la suite du parcours reste lisible. */}
            <div className="rangee rangee--xs rangee--repli">
              <Button
                className="bouton"
                isDisabled={facture.statut !== 'a-emettre'}
                onPress={() => changerStatutFacture(reservation.id, 'emise')}
              >
                {LABELS.pro.detail.emettre}
              </Button>
              <Button
                className="bouton"
                isDisabled={facture.statut !== 'emise'}
                onPress={() => changerStatutFacture(reservation.id, 'payee')}
              >
                {LABELS.pro.detail.marquerPayee}
              </Button>
              <Button
                className="bouton bouton--discret"
                isDisabled={facture.statut === 'a-emettre'}
                onPress={() => changerStatutFacture(reservation.id, 'a-emettre')}
              >
                {LABELS.pro.detail.rouvrir}
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
