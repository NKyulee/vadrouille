import type { Facture, StatutFacture } from '../data/types.ts'

/* Transition d'une facture d'un statut à l'autre.

   Fonction pure, hors du composant : c'est la seule règle métier de l'espace
   professionnel, et les dates qu'elle pose ne doivent pas dépendre du rendu.
   `aujourdhui` est un paramètre pour la même raison.

   - `emise`     : horodate l'émission si elle ne l'était pas déjà
   - `payee`     : horodate le règlement, et l'émission si on l'a sautée
   - `a-emettre` : retour en arrière, les deux dates disparaissent */
export function appliquerStatutFacture(
  facture: Facture,
  statut: StatutFacture,
  aujourdhui: string,
): Facture {
  if (statut === 'a-emettre') {
    const { emiseLe: _emise, payeeLe: _payee, ...reste } = facture
    return { ...reste, statut }
  }

  if (statut === 'emise') {
    return { ...facture, statut, emiseLe: facture.emiseLe ?? aujourdhui }
  }

  return {
    ...facture,
    statut,
    emiseLe: facture.emiseLe ?? aujourdhui,
    payeeLe: aujourdhui,
  }
}

/** Date du jour au format ISO court. */
export function aujourdhuiIso(): string {
  return new Date().toISOString().slice(0, 10)
}
