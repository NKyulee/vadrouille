import type { CouleurAvatar } from '../../data/types.ts'
import './Avatar.scss'

interface AvatarProps {
  initiales: string
  couleur: CouleurAvatar
  taille?: 'sm' | 'md' | 'lg'
  /* Par défaut l'avatar est décoratif : le nom est déjà écrit à côté, le
     répéter ferait doublon au lecteur d'écran. Passer `nom` seulement quand
     l'avatar est seul à porter l'information. */
  nom?: string
}

export default function Avatar({ initiales, couleur, taille = 'md', nom }: AvatarProps) {
  return (
    <span
      className={`avatar avatar--${taille}`}
      data-couleur={couleur}
      aria-hidden={nom ? undefined : true}
      role={nom ? 'img' : undefined}
      aria-label={nom}
    >
      {initiales}
    </span>
  )
}
