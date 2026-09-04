import { NavLink } from 'react-router'
import './NavItem.scss'

interface NavItemProps {
  to: string
  icon: string
  label: string
  /** `end` évite que « / » reste actif sur toutes les autres routes. */
  end?: boolean
}

export default function NavItem({ to, icon, label, end = false }: NavItemProps) {
  /* NavLink pose aria-current="page" tout seul sur le lien actif : c'est ce
     que lit le SCSS, et ce qu'annoncent les lecteurs d'écran. Pas d'état
     « actif » à passer en prop. */
  return (
    <NavLink to={to} end={end} className="nav-item">
      <span className="nav-item__icone" aria-hidden="true">
        {icon}
      </span>
      <span className="nav-item__label">{label}</span>
    </NavLink>
  )
}
