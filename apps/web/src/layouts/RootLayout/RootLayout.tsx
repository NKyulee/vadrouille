import { Outlet, useNavigation } from 'react-router'
import NavItem from '../../components/NavItem/NavItem.tsx'
import { LABELS } from '../../labels.ts'

const NAV_ITEMS = [
  { to: '/', icon: '🏠', label: LABELS.nav.accueil, end: true },
  { to: '/activites', icon: '🎨', label: LABELS.nav.activites, end: false },
  { to: '/contacts', icon: '👥', label: LABELS.nav.contacts, end: false },
  { to: '/aide', icon: '☎', label: LABELS.nav.aide, end: false },
  { to: '/profil', icon: '👤', label: LABELS.nav.profil, end: false },
]

export default function RootLayout() {
  /* Les routes différées bloquent la navigation le temps de charger leur
     module. Sans repère, l'interface paraît figée — et sur une connexion
     lente, on reclique. Le `role="status"` l'annonce aussi aux lecteurs
     d'écran, qui n'ont aucun autre indice. */
  const { state } = useNavigation()

  /* Un seul DOM pour tous les écrans, redistribué par le SCSS : barre du bas
     sur téléphone, rail latéral à partir de 62em. Pas de rendu conditionnel —
     deux arbres à maintenir finiraient par diverger, et le basculement au
     redimensionnement démonterait les composants.

     La marque apparaît deux fois, une par disposition, et celle qui ne sert
     pas est en `display: none` — donc retirée de l'arbre d'accessibilité, pas
     seulement invisible. Un simple masquage visuel la ferait lire deux fois.

     <main> est placé avant <nav> : sur téléphone la navigation est en bas, et
     l'ordre du DOM suit l'ordre visuel. Sur grand écran le rail passe à
     gauche par la grille, sans bouger dans le DOM — on arrive donc au contenu
     avant la navigation, ce qui reste parfaitement utilisable et c'est
     justement ce que le lien d'évitement vise. */
  return (
    <div className="coque">
      <a className="lien-evitement" href="#contenu">
        {LABELS.nav.evitement}
      </a>

      <header className="coque__entete">
        <span className="coque__marque">{LABELS.app.nom}</span>
      </header>

      <div
        className="coque__attente"
        data-active={state === 'loading' || undefined}
        role="status"
        aria-label={state === 'loading' ? LABELS.nav.chargement : undefined}
      />

      <main id="contenu" className="coque__contenu" tabIndex={-1}>
        <Outlet />
      </main>

      {/* Une <nav> avec des liens, pas un tablist : chaque entrée est une
          route à part entière, avec sa propre URL. Un role="tablist" ferait
          annoncer « onglet 2 sur 4 » là où l'utilisateur change de page. */}
      <nav className="coque__nav" aria-label={LABELS.nav.aria}>
        <span className="coque__marque coque__marque--rail">{LABELS.app.nom}</span>
        <ul role="list" className="coque__nav-liste">
          {NAV_ITEMS.map((item) => (
            <li key={item.to} className="coque__nav-item">
              <NavItem to={item.to} icon={item.icon} label={item.label} end={item.end} />
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
