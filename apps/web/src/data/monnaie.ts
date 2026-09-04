/* Les montants sont des **centimes en entier**, jamais des euros en flottant.

   Un `number` JavaScript est un flottant binaire : 0.1 + 0.2 vaut
   0.30000000000000004, et un total de facturation dérive au fil des additions.
   En centimes, tout est de l'arithmétique entière — exacte tant qu'on reste
   sous 2^53, soit 90 000 milliards d'euros.

   C'est aussi ce que la base attendra : `integer` en centimes, ou `numeric`
   avec une échelle fixe. Jamais un `float`.

   Le suffixe `Centimes` sur les champs n'est pas décoratif : c'est ce qui
   empêche de multiplier un prix par cent une fois de trop. */

/** Saisie humaine en euros → stockage en centimes. Arrondi au centime. */
export function eurosVersCentimes(euros: number): number {
  // Math.round est indispensable : 4.35 * 100 vaut 434.99999999999994.
  return Math.round(euros * 100)
}

/** Centimes → euros, pour pré-remplir un champ de saisie. */
export function centimesVersEuros(centimes: number): number {
  return centimes / 100
}

/**
 * « Gratuit », « 4 € », « 4,50 € ».
 *
 * Les centimes ne sont affichés que s'il y en a : sur un programme
 * d'activités à 2 ou 4 €, « 4,00 € » est du bruit. Le formatage passe par
 * Intl, qui pose l'espace insécable étroit avant le symbole comme le veut
 * l'usage français.
 */
export function formaterCentimes(centimes: number): string {
  if (centimes === 0) return 'Gratuit'

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    // Pas `trailingZeroDisplay`, absent des Safari un peu anciens : on décide
    // nous-mêmes du nombre de décimales.
    minimumFractionDigits: centimes % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(centimesVersEuros(centimes))
}

/** Total d'une liste de montants. Somme entière, donc exacte. */
export function totalCentimes(montants: readonly number[]): number {
  return montants.reduce((total, montant) => total + montant, 0)
}
