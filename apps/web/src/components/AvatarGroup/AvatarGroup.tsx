import Avatar from '../Avatar/Avatar.tsx'
import { LABELS } from '../../labels.ts'
import type { Membre } from '../../data/types.ts'
import './AvatarGroup.scss'

interface AvatarGroupProps {
  membres: Membre[]
  /** Au-delà, les suivants sont résumés par un « +N ». */
  max?: number
}

export default function AvatarGroup({ membres, max = 4 }: AvatarGroupProps) {
  const visibles = membres.slice(0, max)
  const restants = membres.length - visibles.length

  /* Le groupe porte un seul libellé listant tout le monde, y compris les
     membres résumés par le « +N ». Les avatars eux-mêmes restent décoratifs :
     sans ça le lecteur d'écran énoncerait une suite d'initiales illisible. */
  return (
    <span
      className="groupe-avatars"
      role="img"
      aria-label={LABELS.commun.participantsAria(membres.map((m) => m.prenom))}
    >
      {visibles.map((membre) => (
        <Avatar key={membre.id} initiales={membre.initiales} couleur={membre.couleur} taille="sm" />
      ))}
      {restants > 0 ? <span className="groupe-avatars__reste">+{restants}</span> : null}
    </span>
  )
}
