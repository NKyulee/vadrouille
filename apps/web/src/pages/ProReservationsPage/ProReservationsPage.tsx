import { Link } from 'react-aria-components'
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
import './ProReservationsPage.scss'

export default function ProReservationsPage() {
  useTitrePage(LABELS.pro.reservations.titre)

  const { duProfessionnel, activiteParId, seanceParId } = useCatalogue()
  const { profil, pourActivites, resteAEncaisser } = usePro()

  const mesActivites = duProfessionnel(profil.id)
  const reservations = pourActivites(mesActivites.map((a) => a.id))

  return (
    <div className="pile pile--lg">
      <h1>{LABELS.pro.reservations.titre}</h1>
      <p className="texte-doux">{LABELS.pro.reservations.intro}</p>

      {resteAEncaisser > 0 ? (
        <p className="encaissement">
          {LABELS.pro.reservations.resteAEncaisser(formaterCentimes(resteAEncaisser))}
        </p>
      ) : null}

      {reservations.length > 0 ? (
        <ul role="list" className="pile pile--sm">
          {reservations.map((reservation) => {
            const membre = membreParId(reservation.membreId)
            const seance = seanceParId(reservation.seanceId)
            const activite = activiteParId(seance?.activiteId)
            if (!membre || !seance || !activite) return null
            return (
              <li key={reservation.id} className="reservation">
                <Avatar initiales={membre.initiales} couleur={membre.couleur} />

                <div className="reservation__intitule">
                  {/* Lien étendu, comme sur les cartes d'activité : un seul
                      arrêt clavier, mais toute la ligne cliquable. */}
                  <p className="reservation__titre">
                    <Link
                      className="reservation__lien"
                      href={`/pro/reservations/${reservation.id}`}
                      aria-label={LABELS.pro.reservations.voirDetail(membre.prenom, activite.titre)}
                    >
                      {membre.prenom} {membre.nom}
                    </Link>
                  </p>
                  <p className="texte-sm texte-doux">{activite.titre}</p>
                  <p className="texte-sm texte-doux">
                    {LABELS.pro.reservations.seanceDu(LABELS.commun.dateCourte(seance.date))}{' '}
                    · {LABELS.pro.reservations.personnes(reservation.personnes)} ·{' '}
                    {formaterCentimes(reservation.facture.montantCentimes)}
                  </p>
                </div>

                <div className="reservation__statuts">
                  <StatutReservationBadge statut={reservation.statut} />
                  <StatutFactureBadge statut={reservation.facture.statut} />
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="carte texte-doux">{LABELS.pro.reservations.aucune}</p>
      )}
    </div>
  )
}
