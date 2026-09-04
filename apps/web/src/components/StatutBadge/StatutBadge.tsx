import { LABELS } from '../../labels.ts'
import type { StatutFacture, StatutReservation } from '../../data/types.ts'
import './StatutBadge.scss'

/* Un statut ne se lit jamais à la couleur seule : le libellé est toujours
   écrit, la couleur ne fait que confirmer. */
export function StatutReservationBadge({ statut }: { statut: StatutReservation }) {
  return (
    <span className="statut" data-statut={statut}>
      {LABELS.pro.statuts[statut]}
    </span>
  )
}

export function StatutFactureBadge({ statut }: { statut: StatutFacture }) {
  return (
    <span className="statut" data-facture={statut}>
      {LABELS.pro.statutsFacture[statut]}
    </span>
  )
}
