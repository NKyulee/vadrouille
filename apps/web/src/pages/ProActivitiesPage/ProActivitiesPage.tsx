import { useState } from 'react'
import { Button, Link } from 'react-aria-components'
import { useLocation } from 'react-router'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog.tsx'
import { CATEGORIES, JOURS, formaterCentimes } from '../../data/index.ts'
import { useTitrePage } from '../../hooks/useTitrePage.ts'
import { LABELS } from '../../labels.ts'
import { useCatalogue } from '../../state/catalogue.ts'
import { usePro } from '../../state/pro.ts'
import type { Activite } from '../../data/types.ts'
import './ProActivitiesPage.scss'

export default function ProActivitiesPage() {
  useTitrePage(LABELS.pro.activites.titre)

  const { duProfessionnel, supprimer } = useCatalogue()
  const { profil, pourActivites } = usePro()
  const activites = duProfessionnel(profil.id)

  /* Message d'issue : soit posé par le formulaire au retour de navigation,
     soit produit ici par une suppression. */
  const { state } = useLocation()
  const [message, setMessage] = useState<string | null>(
    typeof state === 'object' && state && 'message' in state ? String(state.message) : null,
  )
  const [aSupprimer, setASupprimer] = useState<Activite | null>(null)

  return (
    <div className="pile pile--lg">
      <div className="rangee rangee--espacee rangee--repli">
        <h1>{LABELS.pro.activites.titre}</h1>
        <Link className="bouton" href="/pro/activites/nouvelle">
          + {LABELS.pro.activites.nouvelle}
        </Link>
      </div>

      <p className="texte-doux">{LABELS.pro.activites.intro}</p>

      {/* role="status" : l'issue d'une création ou d'une suppression est
          annoncée, pas seulement affichée. */}
      <p role="status" className={message ? 'message-issue' : 'hors-ecran'}>
        {message ?? ''}
      </p>

      {activites.length > 0 ? (
        <ul role="list" className="grille grille--large">
          {activites.map((activite) => {
            const jour = JOURS.find((j) => j.id === activite.jour)
            const reservations = pourActivites([activite.id])
            return (
              <li key={activite.id} className="pro-activite">
                <div className="pro-activite__intitule">
                  <h2 className="pro-activite__titre">{activite.titre}</h2>
                  <p className="texte-sm texte-doux">
                    {LABELS.commun.quand(
                      jour?.long ?? '',
                      LABELS.commun.heure(activite.heure),
                      LABELS.commun.duree(activite.dureeMinutes),
                    )}
                  </p>
                  <p className="texte-sm texte-doux">
                    {activite.lieu} · {formaterCentimes(activite.prixCentimes)} ·{' '}
                    {CATEGORIES[activite.categorie].label}
                  </p>
                  <p className="texte-sm">
                    <strong>{LABELS.pro.activites.reservations(reservations.length)}</strong>
                  </p>
                </div>

                <div className="pro-activite__actions">
                  <Link
                    className="bouton bouton--discret"
                    href={`/pro/activites/${activite.id}/modifier`}
                    aria-label={LABELS.pro.activites.modifier(activite.titre)}
                  >
                    {LABELS.pro.formulaire.titreEdition.split(' ')[0]}
                  </Link>
                  <Button
                    className="bouton bouton--discret"
                    aria-label={LABELS.pro.activites.supprimer(activite.titre)}
                    onPress={() => setASupprimer(activite)}
                  >
                    {LABELS.pro.suppression.confirmer}
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="carte texte-doux">{LABELS.pro.activites.aucune}</p>
      )}

      {aSupprimer ? (
        <ConfirmDialog
          ouvert
          onOuvertChange={(ouvert) => {
            if (!ouvert) setASupprimer(null)
          }}
          titre={LABELS.pro.suppression.titre}
          texte={LABELS.pro.suppression.texte(aSupprimer.titre)}
          avertissement={
            pourActivites([aSupprimer.id]).length > 0
              ? LABELS.pro.suppression.avecReservations(pourActivites([aSupprimer.id]).length)
              : undefined
          }
          libelleConfirmer={LABELS.pro.suppression.confirmer}
          libelleAnnuler={LABELS.pro.suppression.annuler}
          onConfirmer={() => {
            supprimer(aSupprimer.id)
            setMessage(LABELS.pro.suppression.faite(aSupprimer.titre))
            setASupprimer(null)
          }}
        />
      ) : null}
    </div>
  )
}
