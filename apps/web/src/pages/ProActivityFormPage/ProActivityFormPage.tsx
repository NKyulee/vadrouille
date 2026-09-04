import { Link } from 'react-aria-components'
import { useNavigate, useParams } from 'react-router'
import ActivityForm from '../../components/ActivityForm/ActivityForm.tsx'
import type { ChampsActivite } from '../../components/ActivityForm/ActivityForm.tsx'
import { useTitrePage } from '../../hooks/useTitrePage.ts'
import { LABELS } from '../../labels.ts'
import { useCatalogue } from '../../state/catalogue.ts'
import { usePro } from '../../state/pro.ts'

export default function ProActivityFormPage() {
  const { id } = useParams()
  const naviguer = useNavigate()
  const { activiteParId, ajouter, modifier } = useCatalogue()
  const { profil } = usePro()

  const activite = activiteParId(id)
  const edition = Boolean(id)
  useTitrePage(edition ? LABELS.pro.formulaire.titreEdition : LABELS.pro.formulaire.titreCreation)

  // Un identifiant inconnu en édition : on le dit, plutôt qu'un formulaire vide.
  if (edition && !activite) {
    return (
      <div className="pile pile--lg">
        <h1>{LABELS.detail.introuvableTitre}</h1>
        <p>{LABELS.detail.introuvableTexte}</p>
        <p>
          <Link className="lien" href="/pro/activites">
            {LABELS.pro.activites.titre}
          </Link>
        </p>
      </div>
    )
  }

  const enregistrer = (champs: ChampsActivite) => {
    // Le lieu est obligatoire : sans lui, l'activité n'apparaîtrait pas sur
    // la carte. `<Select>` n'a pas de validation native, d'où ce garde-fou.
    if (!champs.lieuId) return

    /* Le formulaire ne saisit que ce qui se saisit : le propriétaire et le
       nom de la structure sont composés ici, le pro n'a pas à ressaisir sa
       propre identité. Les inscrits, eux, vivent sur les séances — c'est le
       catalogue qui les reporte à la régénération. */
    const complet = {
      ...champs,
      lieuId: champs.lieuId,
      proposePar: profil.structure,
      professionnelId: profil.id,
    }

    if (activite) {
      modifier(activite.id, complet)
    } else {
      ajouter(complet)
    }

    naviguer('/pro/activites', {
      state: {
        message: activite
          ? LABELS.pro.formulaire.modifiee(champs.titre)
          : LABELS.pro.formulaire.creee(champs.titre),
      },
    })
  }

  return (
    <div className="pile pile--lg">
      <p>
        <Link className="lien" href="/pro/activites">
          ← {LABELS.pro.activites.titre}
        </Link>
      </p>

      <h1>{edition ? LABELS.pro.formulaire.titreEdition : LABELS.pro.formulaire.titreCreation}</h1>

      <ActivityForm
        activite={activite}
        onEnregistrer={enregistrer}
        onAnnuler={() => naviguer('/pro/activites')}
      />
    </div>
  )
}
