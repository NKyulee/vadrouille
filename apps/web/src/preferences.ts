/* Préférences d'affichage, conservées sur l'appareil.

   Une seule pour l'instant : la taille du texte. Elle agit sur la taille de
   police de <html>, et comme toute l'échelle typographique et les
   espacements sont en `rem`, l'interface entière suit — sans une seule règle
   en double. Les points de rupture, eux, sont en `em` et restent calés sur la
   taille par défaut du navigateur : la disposition ne bascule donc pas quand
   on grossit le texte. */

export type TailleTexte = 'normal' | 'grand' | 'tres-grand'

const CLE = 'vadrouille.taille-texte'
const VALEURS: TailleTexte[] = ['normal', 'grand', 'tres-grand']

/* localStorage lève dans certains contextes (navigation privée sur d'anciens
   Safari, cookies tiers bloqués). Une préférence d'affichage ne doit jamais
   empêcher l'application de démarrer. */
export function lireTailleTexte(): TailleTexte {
  try {
    const valeur = localStorage.getItem(CLE)
    return VALEURS.includes(valeur as TailleTexte) ? (valeur as TailleTexte) : 'normal'
  } catch {
    return 'normal'
  }
}

export function appliquerTailleTexte(taille: TailleTexte): void {
  document.documentElement.dataset.texte = taille
  try {
    localStorage.setItem(CLE, taille)
  } catch {
    // Préférence non conservée d'une visite à l'autre : sans conséquence ici.
  }
}
