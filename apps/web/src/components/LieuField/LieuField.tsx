import { useState } from 'react'
import {
  Button,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
  Text,
  TextField,
} from 'react-aria-components'
import { chercherAdresse, creerLieu } from '../../data/index.ts'
import type { AdresseTrouvee, Lieu } from '../../data/index.ts'
import { LABELS } from '../../labels.ts'
import './LieuField.scss'

interface Props {
  lieux: readonly Lieu[]
  valeur: string | undefined
  onChange: (lieuId: string) => void
  /** Recharge le catalogue après création d'un lieu. */
  onLieuCree: () => Promise<void>
}

/* Choisir un lieu existant, ou en créer un.

   La plupart des activités se tiennent dans les mêmes salles : proposer la
   liste d'abord évite de ressaisir — et de créer des doublons qui
   pollueraient la carte. */
export default function LieuField({ lieux, valeur, onChange, onLieuCree }: Props) {
  const [creation, setCreation] = useState(false)
  const [nom, setNom] = useState('')
  const [saisieAdresse, setSaisieAdresse] = useState('')
  const [propositions, setPropositions] = useState<AdresseTrouvee[]>([])
  const [choisie, setChoisie] = useState<AdresseTrouvee | null>(null)
  const [recherche, setRecherche] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const chercher = async () => {
    setRecherche(true)
    setErreur(null)
    try {
      const resultats = await chercherAdresse(saisieAdresse)
      setPropositions(resultats)
      if (resultats.length === 0) setErreur(LABELS.lieu.aucuneAdresse)
    } catch {
      setErreur(LABELS.lieu.geocodageIndisponible)
    }
    setRecherche(false)
  }

  const enregistrer = async () => {
    if (!choisie || !nom.trim()) return
    setErreur(null)
    try {
      const id = await creerLieu({
        nom: nom.trim(),
        adresse: choisie.label,
        latitude: choisie.latitude,
        longitude: choisie.longitude,
      })
      await onLieuCree()
      onChange(id)
      setCreation(false)
      setNom('')
      setSaisieAdresse('')
      setPropositions([])
      setChoisie(null)
    } catch {
      setErreur(LABELS.lieu.echecCreation)
    }
  }

  if (!creation) {
    return (
      <div className="pile pile--xs">
        <Select
          className="champ"
          selectedKey={valeur ?? null}
          onSelectionChange={(cle) => onChange(String(cle))}
        >
          <Label className="champ__label">{LABELS.pro.formulaire.lieu}</Label>
          <Button className="champ__saisie champ__declencheur">
            <SelectValue />
            <span aria-hidden="true">▾</span>
          </Button>
          <Popover className="liste-deroulante">
            <ListBox>
              {lieux.map((l) => (
                <ListBoxItem
                  key={l.id}
                  id={l.id}
                  textValue={l.nom}
                  className="liste-deroulante__option"
                >
                  <span className="lieu-option">
                    <span>{l.nom}</span>
                    <span className="texte-sm texte-doux">{l.adresse}</span>
                  </span>
                </ListBoxItem>
              ))}
            </ListBox>
          </Popover>
        </Select>

        <Button className="bouton bouton--discret" onPress={() => setCreation(true)}>
          + {LABELS.lieu.nouveau}
        </Button>
      </div>
    )
  }

  return (
    <div className="creation-lieu pile pile--sm">
      <p className="champ__label">{LABELS.lieu.nouveau}</p>

      <p role="alert" className={erreur ? 'message-erreur' : 'hors-ecran'}>
        {erreur ?? ''}
      </p>

      <TextField className="champ" value={nom} onChange={setNom} isRequired>
        <Label className="champ__label">{LABELS.lieu.nom}</Label>
        <Text slot="description" className="champ__aide">
          {LABELS.lieu.nomAide}
        </Text>
        <Input className="champ__saisie" autoComplete="off" />
      </TextField>

      <TextField className="champ" value={saisieAdresse} onChange={setSaisieAdresse}>
        <Label className="champ__label">{LABELS.lieu.adresse}</Label>
        <Text slot="description" className="champ__aide">
          {LABELS.lieu.adresseAide}
        </Text>
        <Input className="champ__saisie" autoComplete="off" />
      </TextField>

      <div className="rangee rangee--xs rangee--repli">
        <Button
          className="bouton bouton--discret"
          isDisabled={recherche || saisieAdresse.trim().length < 5}
          onPress={() => void chercher()}
        >
          {LABELS.lieu.chercher}
        </Button>
      </div>

      {/* On propose, on ne devine pas : le géocodeur se trompe, et une salle
          placée au mauvais endroit sur la carte enverrait quelqu'un ailleurs. */}
      {propositions.length > 0 ? (
        <ul role="list" className="propositions">
          {propositions.map((p) => (
            <li key={p.label}>
              <Button
                className={`proposition ${choisie?.label === p.label ? 'proposition--choisie' : ''}`}
                onPress={() => setChoisie(p)}
              >
                {p.label}
                {p.score < 0.5 ? <span className="texte-sm"> {LABELS.lieu.scoreFaible}</span> : null}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="rangee rangee--xs rangee--repli">
        <Button
          className="bouton"
          isDisabled={!choisie || !nom.trim()}
          onPress={() => void enregistrer()}
        >
          {LABELS.lieu.enregistrer}
        </Button>
        <Button className="bouton bouton--discret" onPress={() => setCreation(false)}>
          {LABELS.pro.formulaire.annuler}
        </Button>
      </div>
    </div>
  )
}
