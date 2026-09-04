import Avatar from '../../components/Avatar/Avatar.tsx'
import { MEMBRES } from '../../data/index.ts'
import { useTitrePage } from '../../hooks/useTitrePage.ts'
import { LABELS } from '../../labels.ts'
import { useCatalogue } from '../../state/catalogue.ts'
import { useInscriptions } from '../../state/inscriptions.ts'
import './ContactsPage.scss'

export default function ContactsPage() {
  useTitrePage(LABELS.contacts.titre)

  const { mesSeances } = useInscriptions()
  const { activiteParId } = useCatalogue()

  /* Activités que l'on partage avec ce membre — c'est ce qui donne du sens
     à la liste : « où est-ce que je le croise ? ». Dédoublonné par titre :
     se retrouver trois lundis de suite ne fait pas trois mentions. */
  const activitesPartagees = (membreId: string) => [
    ...new Set(
      mesSeances
        .filter((seance) => seance.participants.includes(membreId))
        .map((seance) => activiteParId(seance.activiteId)?.titre)
        .filter((titre) => titre !== undefined),
    ),
  ]

  return (
    <div className="pile pile--lg">
      <h1>{LABELS.contacts.titre}</h1>
      <p className="texte-doux">{LABELS.contacts.intro}</p>

      <ul role="list" className="grille grille--large" aria-label={LABELS.contacts.membresAria}>
        {MEMBRES.map((membre) => {
          const partagees = activitesPartagees(membre.id)
          return (
            <li key={membre.id} className="membre">
              <Avatar initiales={membre.initiales} couleur={membre.couleur} />
              <div className="membre__identite">
                <span className="membre__nom">
                  {membre.prenom} {membre.nom}
                </span>
                {partagees.length > 0 ? (
                  <span className="texte-sm texte-doux">{partagees.join(' · ')}</span>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
