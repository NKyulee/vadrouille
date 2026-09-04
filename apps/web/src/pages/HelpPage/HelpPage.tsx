import { Link } from 'react-aria-components'
import Avatar from '../../components/Avatar/Avatar.tsx'
import { CONTACTS } from '../../data/index.ts'
import { useTitrePage } from '../../hooks/useTitrePage.ts'
import { LABELS } from '../../labels.ts'
import type { Contact } from '../../data/types.ts'
import './HelpPage.scss'

/* Lien téléphonique en <a> natif, volontairement pas le <Link> de React Aria :
   un href « tel: » quitte l'application, il n'a rien à faire dans le routeur. */
function LigneContact({ contact }: { contact: Contact }) {
  return (
    <li className="contact" data-urgence={contact.urgence || undefined}>
      <Avatar initiales={contact.telephone.length <= 3 ? '!' : '☎'} couleur={contact.couleur} />
      <div className="contact__identite">
        <span className="contact__nom">{contact.nom}</span>
        <span className="texte-sm texte-doux">{contact.role}</span>
      </div>
      <a
        className="bouton contact__appel"
        href={`tel:${contact.telephone.replace(/\s/g, '')}`}
        aria-label={LABELS.aide.appeler(contact.nom)}
      >
        {contact.telephone}
      </a>
    </li>
  )
}

export default function HelpPage() {
  useTitrePage(LABELS.aide.titre)

  const urgences = CONTACTS.filter((c) => c.urgence)
  const quotidien = CONTACTS.filter((c) => !c.urgence)

  return (
    <div className="pile pile--lg">
      <h1>{LABELS.aide.titre}</h1>
      <p className="texte-doux">{LABELS.aide.intro}</p>

      <section className="pile pile--sm" aria-labelledby="titre-quotidien">
        <h2 id="titre-quotidien" className="titre-section">
          {LABELS.aide.quotidien}
        </h2>
        <ul role="list" className="grille grille--large">
          {quotidien.map((contact) => (
            <LigneContact key={contact.id} contact={contact} />
          ))}
        </ul>
      </section>

      <section className="pile pile--sm" aria-labelledby="titre-urgences">
        <h2 id="titre-urgences" className="titre-section">
          {LABELS.aide.urgences}
        </h2>
        <ul role="list" className="grille grille--large">
          {urgences.map((contact) => (
            <LigneContact key={contact.id} contact={contact} />
          ))}
        </ul>
      </section>

      <p>
        <Link className="lien" href="/a-propos">
          {LABELS.aide.aPropos}
        </Link>
      </p>
    </div>
  )
}
