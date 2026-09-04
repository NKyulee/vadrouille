import { useState } from 'react'
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Text,
  TextArea,
  TextField,
} from 'react-aria-components'
import Avatar from '../../components/Avatar/Avatar.tsx'
import { useTitrePage } from '../../hooks/useTitrePage.ts'
import { LABELS } from '../../labels.ts'
import { usePro } from '../../state/pro.ts'
import type { Professionnel } from '../../data/types.ts'

/** Deux premières lettres des initiales, recalculées quand le nom change. */
function initiales(prenom: string, nom: string): string {
  return `${prenom.trim()[0] ?? ''}${nom.trim()[0] ?? ''}`.toUpperCase()
}

export default function ProProfilePage() {
  useTitrePage(LABELS.pro.profil.titre)

  const { profil, enregistrerProfil } = usePro()
  const [valeurs, setValeurs] = useState<Professionnel>(profil)
  const [enregistre, setEnregistre] = useState(false)

  const modifier = <C extends keyof Professionnel>(champ: C, valeur: Professionnel[C]) => {
    setValeurs((precedent) => ({ ...precedent, [champ]: valeur }))
    setEnregistre(false)
  }

  return (
    <div className="pile pile--lg">
      <h1>{LABELS.pro.profil.titre}</h1>
      <p className="texte-doux">{LABELS.pro.profil.intro}</p>

      <div className="rangee rangee--sm">
        <Avatar
          initiales={initiales(valeurs.prenom, valeurs.nom) || valeurs.initiales}
          couleur={valeurs.couleur}
          taille="lg"
        />
        <p className="texte-doux">{valeurs.structure}</p>
      </div>

      <p role="status" className={enregistre ? 'message-issue' : 'hors-ecran'}>
        {enregistre ? LABELS.pro.profil.enregistre : ''}
      </p>

      <Form
        className="formulaire"
        validationBehavior="native"
        onSubmit={(evenement) => {
          evenement.preventDefault()
          enregistrerProfil({
            ...valeurs,
            initiales: initiales(valeurs.prenom, valeurs.nom) || valeurs.initiales,
          })
          setEnregistre(true)
        }}
      >
        <TextField
          className="champ"
          isRequired
          value={valeurs.structure}
          onChange={(v) => modifier('structure', v)}
        >
          <Label className="champ__label">{LABELS.pro.profil.structure}</Label>
          <Input className="champ__saisie" autoComplete="organization" />
          <FieldError className="champ__erreur">{LABELS.pro.formulaire.requis}</FieldError>
        </TextField>

        <div className="formulaire__grille">
          <TextField
            className="champ"
            isRequired
            value={valeurs.prenom}
            onChange={(v) => modifier('prenom', v)}
          >
            <Label className="champ__label">{LABELS.pro.profil.prenom}</Label>
            <Input className="champ__saisie" autoComplete="given-name" />
            <FieldError className="champ__erreur">{LABELS.pro.formulaire.requis}</FieldError>
          </TextField>

          <TextField
            className="champ"
            isRequired
            value={valeurs.nom}
            onChange={(v) => modifier('nom', v)}
          >
            <Label className="champ__label">{LABELS.pro.profil.nom}</Label>
            <Input className="champ__saisie" autoComplete="family-name" />
            <FieldError className="champ__erreur">{LABELS.pro.formulaire.requis}</FieldError>
          </TextField>

          {/* type="email" : le navigateur valide la forme, et sert le bon
              clavier sur téléphone. */}
          <TextField
            className="champ"
            isRequired
            type="email"
            value={valeurs.email}
            onChange={(v) => modifier('email', v)}
          >
            <Label className="champ__label">{LABELS.pro.profil.email}</Label>
            <Input className="champ__saisie" autoComplete="email" />
            <FieldError className="champ__erreur">{LABELS.pro.profil.emailInvalide}</FieldError>
          </TextField>

          <TextField
            className="champ"
            isRequired
            type="tel"
            value={valeurs.telephone}
            onChange={(v) => modifier('telephone', v)}
          >
            <Label className="champ__label">{LABELS.pro.profil.telephone}</Label>
            <Input className="champ__saisie" autoComplete="tel" />
            <FieldError className="champ__erreur">{LABELS.pro.formulaire.requis}</FieldError>
          </TextField>
        </div>

        <TextField
          className="champ"
          isRequired
          value={valeurs.siret}
          onChange={(v) => modifier('siret', v)}
        >
          <Label className="champ__label">{LABELS.pro.profil.siret}</Label>
          <Input className="champ__saisie" inputMode="numeric" autoComplete="off" />
          <FieldError className="champ__erreur">{LABELS.pro.formulaire.requis}</FieldError>
        </TextField>

        <TextField
          className="champ"
          value={valeurs.presentation}
          onChange={(v) => modifier('presentation', v)}
        >
          <Label className="champ__label">{LABELS.pro.profil.presentation}</Label>
          <Text slot="description" className="champ__aide">
            {LABELS.pro.profil.presentationAide}
          </Text>
          <TextArea className="champ__saisie champ__zone" rows={4} />
        </TextField>

        <div className="formulaire__actions">
          <Button type="submit" className="bouton">
            {LABELS.pro.profil.enregistrer}
          </Button>
        </div>
      </Form>
    </div>
  )
}
