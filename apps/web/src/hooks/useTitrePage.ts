import { useEffect } from 'react'
import { LABELS } from '../labels.ts'

/* Met à jour le titre de l'onglet à l'affichage d'une page.

   Le titre est le premier repère pour retrouver un onglet parmi d'autres, et
   il alimente l'historique et les favoris — « La vadrouille » quatre fois de
   suite n'aide personne.

   Sans argument, le nom de l'application seul : c'est la convention pour
   l'accueil.

   Volontairement en `document.title` plutôt qu'avec la balise <title>
   déclarative de React 19 : `index.html` en contient déjà une, et le
   navigateur retient la première du document. Les deux coexisteraient, et
   c'est la statique qui gagnerait. Ici la balise d'index.html sert de titre
   d'attente avant le montage, puis ce hook prend le relais.

   Pas de restauration au démontage : la page suivante pose le sien, et
   repasser par le titre par défaut entre les deux ferait clignoter l'onglet. */
export function useTitrePage(titre?: string) {
  useEffect(() => {
    document.title = LABELS.app.titreOnglet(titre)
  }, [titre])
}
