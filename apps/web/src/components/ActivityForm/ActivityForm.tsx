import { useState } from 'react'
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  NumberField,
  Popover,
  Select,
  SelectValue,
  Text,
  TextArea,
  TextField,
} from 'react-aria-components'
import { CATEGORIES, JOURS } from '../../data/index.ts'
import { useCatalogue } from '../../state/catalogue.ts'
import { centimesVersEuros, eurosVersCentimes } from '../../data/monnaie.ts'
import { LABELS } from '../../labels.ts'
import type { Activite, CategorieId, JourId } from '../../data/types.ts'
import './ActivityForm.scss'

/** Champs saisis par le professionnel. Le reste (propriétaire, participants)
    est composé par la page, pas par le formulaire. */
export interface ChampsActivite {
  titre: string
  description: string
  jour: JourId
  heure: string
  dureeMinutes: number
  lieu: string
  categorie: CategorieId
  prixCentimes: number
  placesParDefaut: number
  responsableId: string | undefined
}

const VIDE: ChampsActivite = {
  titre: '',
  description: '',
  jour: 'lundi',
  heure: '10:00',
  dureeMinutes: 60,
  lieu: '',
  categorie: 'atelier',
  prixCentimes: 0,
  placesParDefaut: 10,
  responsableId: undefined,
}

function depuisActivite(activite: Activite): ChampsActivite {
  const { titre, description, jour, heure, dureeMinutes, lieu, categorie } = activite
  return {
    titre,
    description,
    jour,
    heure,
    dureeMinutes,
    lieu,
    categorie,
    prixCentimes: activite.prixCentimes,
    placesParDefaut: activite.placesParDefaut,
    responsableId: activite.responsableId,
  }
}

interface ActivityFormProps {
  /** Absent en création. */
  activite?: Activite
  onEnregistrer: (champs: ChampsActivite) => void
  onAnnuler: () => void
}

export default function ActivityForm({ activite, onEnregistrer, onAnnuler }: ActivityFormProps) {
  /* Les responsables proposés sont les membres qu'on croise : la base ne
     laisse pas voir les autres, et désigner quelqu'un qu'on ne connaît pas
     n'aurait pas de sens. */
  const { participantsDe, seances } = useCatalogue()
  const responsablesPossibles = [
    ...new Map(seances.flatMap((s) => participantsDe(s.id)).map((m) => [m.id, m])).values(),
  ]
  const [valeurs, setValeurs] = useState<ChampsActivite>(() =>
    activite ? depuisActivite(activite) : VIDE,
  )

  const modifier = <C extends keyof ChampsActivite>(champ: C, valeur: ChampsActivite[C]) =>
    setValeurs((precedent) => ({ ...precedent, [champ]: valeur }))

  /* validationBehavior="native" laisse le navigateur bloquer l'envoi et
     placer le focus sur le premier champ fautif ; <FieldError> remplace le
     message par le nôtre, en français, relié par aria-describedby. */
  return (
    <Form
      className="formulaire"
      validationBehavior="native"
      onSubmit={(evenement) => {
        evenement.preventDefault()
        onEnregistrer(valeurs)
      }}
    >
      <TextField
        className="champ"
        isRequired
        value={valeurs.titre}
        onChange={(v) => modifier('titre', v)}
      >
        <Label className="champ__label">{LABELS.pro.formulaire.nom}</Label>
        <Input className="champ__saisie" autoComplete="off" />
        <FieldError className="champ__erreur">{LABELS.pro.formulaire.requis}</FieldError>
      </TextField>

      <TextField
        className="champ"
        isRequired
        value={valeurs.description}
        onChange={(v) => modifier('description', v)}
      >
        <Label className="champ__label">{LABELS.pro.formulaire.description}</Label>
        <Text slot="description" className="champ__aide">
          {LABELS.pro.formulaire.descriptionAide}
        </Text>
        <TextArea className="champ__saisie champ__zone" rows={3} />
        <FieldError className="champ__erreur">{LABELS.pro.formulaire.requis}</FieldError>
      </TextField>

      <div className="formulaire__grille">
        <Select
          className="champ"
          selectedKey={valeurs.jour}
          onSelectionChange={(cle) => modifier('jour', cle as JourId)}
        >
          <Label className="champ__label">{LABELS.pro.formulaire.jour}</Label>
          <Button className="champ__saisie champ__declencheur">
            <SelectValue />
            <span aria-hidden="true">▾</span>
          </Button>
          <Popover className="liste-deroulante">
            <ListBox>
              {JOURS.map((j) => (
                <ListBoxItem key={j.id} id={j.id} className="liste-deroulante__option">
                  {j.long}
                </ListBoxItem>
              ))}
            </ListBox>
          </Popover>
        </Select>

        {/* type="time" : clavier adapté sur téléphone, et le navigateur valide
            le format lui-même. La valeur reste « HH:MM », comme en base. */}
        <TextField
          className="champ"
          isRequired
          value={valeurs.heure}
          onChange={(v) => modifier('heure', v)}
        >
          <Label className="champ__label">{LABELS.pro.formulaire.heure}</Label>
          <Input className="champ__saisie" type="time" />
          <FieldError className="champ__erreur">{LABELS.pro.formulaire.heureInvalide}</FieldError>
        </TextField>

        <NumberField
          className="champ"
          minValue={15}
          step={15}
          value={valeurs.dureeMinutes}
          onChange={(v) => modifier('dureeMinutes', v)}
        >
          <Label className="champ__label">{LABELS.pro.formulaire.duree}</Label>
          <Input className="champ__saisie" />
          <FieldError className="champ__erreur" />
        </NumberField>

        <NumberField
          className="champ"
          minValue={1}
          value={valeurs.placesParDefaut}
          onChange={(v) => modifier('placesParDefaut', v)}
        >
          <Label className="champ__label">{LABELS.pro.formulaire.places}</Label>
          <Input className="champ__saisie" />
          <FieldError className="champ__erreur" />
        </NumberField>

        {/* Le champ se saisit en euros — c'est ce qu'un humain tape — et la
            conversion en centimes se fait ici, à la frontière. `step` au
            centime pour que les flèches ne sautent pas l'euro. */}
        <NumberField
          className="champ"
          minValue={0}
          step={0.5}
          formatOptions={{ style: 'currency', currency: 'EUR' }}
          value={centimesVersEuros(valeurs.prixCentimes)}
          onChange={(v) => modifier('prixCentimes', eurosVersCentimes(v))}
        >
          <Label className="champ__label">{LABELS.pro.formulaire.prix}</Label>
          <Text slot="description" className="champ__aide">
            {LABELS.pro.formulaire.prixAide}
          </Text>
          <Input className="champ__saisie" />
          <FieldError className="champ__erreur" />
        </NumberField>

        <Select
          className="champ"
          selectedKey={valeurs.categorie}
          onSelectionChange={(cle) => modifier('categorie', cle as CategorieId)}
        >
          <Label className="champ__label">{LABELS.pro.formulaire.categorie}</Label>
          <Button className="champ__saisie champ__declencheur">
            <SelectValue />
            <span aria-hidden="true">▾</span>
          </Button>
          <Popover className="liste-deroulante">
            <ListBox>
              {Object.entries(CATEGORIES).map(([id, categorie]) => (
                <ListBoxItem key={id} id={id} className="liste-deroulante__option">
                  {categorie.label}
                </ListBoxItem>
              ))}
            </ListBox>
          </Popover>
        </Select>
      </div>

      <TextField
        className="champ"
        isRequired
        value={valeurs.lieu}
        onChange={(v) => modifier('lieu', v)}
      >
        <Label className="champ__label">{LABELS.pro.formulaire.lieu}</Label>
        <Input className="champ__saisie" autoComplete="off" />
        <FieldError className="champ__erreur">{LABELS.pro.formulaire.requis}</FieldError>
      </TextField>

      <Select
        className="champ"
        selectedKey={valeurs.responsableId ?? null}
        onSelectionChange={(cle) => modifier('responsableId', cle ? String(cle) : undefined)}
      >
        <Label className="champ__label">{LABELS.pro.formulaire.responsable}</Label>
        <Button className="champ__saisie champ__declencheur">
          <SelectValue />
          <span aria-hidden="true">▾</span>
        </Button>
        <Popover className="liste-deroulante">
          <ListBox>
            {responsablesPossibles.map((membre) => (
              <ListBoxItem key={membre.id} id={membre.id} className="liste-deroulante__option">
                {membre.prenom} {membre.nom}
              </ListBoxItem>
            ))}
          </ListBox>
        </Popover>
      </Select>

      <div className="formulaire__actions">
        <Button type="submit" className="bouton">
          {LABELS.pro.formulaire.enregistrer}
        </Button>
        <Button className="bouton bouton--discret" onPress={onAnnuler}>
          {LABELS.pro.formulaire.annuler}
        </Button>
      </div>
    </Form>
  )
}
