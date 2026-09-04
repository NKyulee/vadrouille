import { Button } from 'react-aria-components'
import { Outlet, useNavigation } from 'react-router'
import NavItem from '../../components/NavItem/NavItem.tsx'
import { useSession } from '../../auth/session.ts'
import { LABELS } from '../../labels.ts'

const NAV_ITEMS = [
  { to: '/pro/activites', icon: '🎨', label: LABELS.pro.nav.activites, end: false },
  { to: '/pro/reservations', icon: '🗓', label: LABELS.pro.nav.reservations, end: false },
  { to: '/pro/profil', icon: '🏷', label: LABELS.pro.nav.profil, end: false },
]

export default function ProLayout() {
  const { seDeconnecter } = useSession()
  const { state } = useNavigation()

  /* Même coque que l'espace membre — entête, contenu, barre du bas qui
     devient rail sur grand écran — avec un entête coloré pour qu'on voie
     immédiatement qu'on n'est pas dans l'espace membre.

     On n'y arrive que connecté avec le rôle « professionnel » : la garde de
     route le vérifie, l'API le revérifie, et le RLS a le dernier mot. */
  return (
    <div className="coque coque--pro">
      <a className="lien-evitement" href="#contenu">
        {LABELS.nav.evitement}
      </a>

      <header className="coque__entete">
        <span className="coque__marque coque__marque-pro">
          <span className="coque__marque-role">{LABELS.pro.espace}</span>
          <span>{LABELS.app.nom}</span>
        </span>
        <Button className="coque__bascule" onPress={() => void seDeconnecter()}>
          {LABELS.auth.deconnexion}
        </Button>
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

      <nav className="coque__nav" aria-label={LABELS.pro.nav.aria}>
        <span className="coque__marque coque__marque--rail">{LABELS.pro.espace}</span>
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
