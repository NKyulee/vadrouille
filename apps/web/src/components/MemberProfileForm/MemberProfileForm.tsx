import { useState } from 'react'
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Radio,
  RadioGroup,
  Text,
  TextField,
} from 'react-aria-components'
import Avatar from '../Avatar/Avatar.tsx'
import { changerMotDePasse, enregistrerProfilMembre } from '../../data/index.ts'
import { LABELS } from '../../labels.ts'
import type { CouleurAvatar, Membre } from '../../data/types.ts'
import './MemberProfileForm.scss'

const COULEURS: CouleurAvatar[] = ['foret', 'or', 'brique', 'ardoise', 'prune']

/** Deux premières lettres, recalculées quand le nom change. */
function initiales(prenom: string, nom: string): string {
  const a = prenom.trim()[0] ?? ''
  const b = nom.trim()[0] ?? prenom.trim()[1] ?? ''
  return `${a}${b}`.toUpperCase()
}

interface Props {
  membre: Membre
  /** Recharge la session : le nom affiché partout doit suivre. */
  onEnregistre: () => Promise<void>
}

export default function MemberProfileForm({ membre, onEnregistre }: Props) {
  const [prenom, setPrenom] = useState(membre.prenom)
  const [nom, setNom] = useState(membre.nom)
  const [couleur, setCouleur] = useState<CouleurAvatar>(membre.couleur)
  const [issue, setIssue] = useState<{ texte: string; erreur: boolean } | null>(null)
  const [envoi, setEnvoi] = useState(false)

  const [motDePasse, setMotDePasse] = useState('')
  const [issueMdp, setIssueMdp] = useState<{ texte: string; erreur: boolean } | null>(null)

  const enregistrer = async () => {
    setEnvoi(true)
    setIssue(null)
    try {
      await enregistrerProfilMembre({
        ...membre,
        prenom: prenom.trim(),
        nom: nom.trim(),
        initiales: initiales(prenom, nom),
        couleur,
      })
      // La session porte le nom affiché dans l'entête et les avatars : sans
      // ce rechargement, l'ancien nom resterait à l'écran jusqu'au prochain
      // chargement de page.
      await onEnregistre()
      setIssue({ texte: LABELS.profil.enregistre, erreur: false })
    } catch {
      setIssue({ texte: LABELS.profil.echecEnregistrement, erreur: true })
    }
    setEnvoi(false)
  }

  const changerLeMotDePasse = async () => {
    setIssueMdp(null)
    try {
      await changerMotDePasse(motDePasse)
      setMotDePasse('')
      setIssueMdp({ texte: LABELS.profil.motDePasseChange, erreur: false })
    } catch {
      setIssueMdp({ texte: LABELS.profil.echecMotDePasse, erreur: true })
    }
  }

  return (
    <div className="pile pile--lg">
      <Form
        className="formulaire"
        validationBehavior="native"
        onSubmit={(e) => {
          e.preventDefault()
          void enregistrer()
        }}
      >
        {/* Aperçu en direct : on voit ce qu'on obtient avant d'enregistrer. */}
        <div className="rangee rangee--sm">
          <Avatar initiales={initiales(prenom, nom) || membre.initiales} couleur={couleur} taille="lg" />
          <p className="texte-doux">
            {prenom} {nom}
          </p>
        </div>

        <p role="status" className={issue ? (issue.erreur ? 'message-erreur' : 'message-issue') : 'hors-ecran'}>
          {issue?.texte ?? ''}
        </p>

        <div className="formulaire__grille">
          <TextField className="champ" isRequired value={prenom} onChange={setPrenom}>
            <Label className="champ__label">{LABELS.profil.prenom}</Label>
            <Input className="champ__saisie" autoComplete="given-name" />
            <FieldError className="champ__erreur">{LABELS.profil.requis}</FieldError>
          </TextField>

          <TextField className="champ" value={nom} onChange={setNom}>
            <Label className="champ__label">{LABELS.profil.nom}</Label>
            <Input className="champ__saisie" autoComplete="family-name" />
          </TextField>
        </div>

        {/* La couleur porte un nom écrit : la pastille seule ne dirait rien à
            qui ne distingue pas les teintes. */}
        <RadioGroup
          className="preference"
          value={couleur}
          onChange={(v) => setCouleur(v as CouleurAvatar)}
        >
          <Label className="preference__label">{LABELS.profil.couleur}</Label>
          <div className="preference__choix">
            {COULEURS.map((c) => (
              <Radio key={c} value={c} className="pastille-choix">
                <Avatar initiales={initiales(prenom, nom) || '··'} couleur={c} taille="sm" />
                <span>{LABELS.profil.couleurs[c]}</span>
              </Radio>
            ))}
          </div>
        </RadioGroup>

        <div className="formulaire__actions">
          <Button type="submit" className="bouton" isDisabled={envoi}>
            {LABELS.profil.enregistrer}
          </Button>
        </div>
      </Form>

      <Form
        className="formulaire"
        validationBehavior="native"
        onSubmit={(e) => {
          e.preventDefault()
          void changerLeMotDePasse()
        }}
      >
        <p className="champ__label">{LABELS.profil.motDePasse}</p>

        <p role="status" className={issueMdp ? (issueMdp.erreur ? 'message-erreur' : 'message-issue') : 'hors-ecran'}>
          {issueMdp?.texte ?? ''}
        </p>

        <TextField
          className="champ"
          isRequired
          type="password"
          value={motDePasse}
          onChange={setMotDePasse}
          minLength={8}
        >
          <Label className="champ__label">{LABELS.profil.nouveauMotDePasse}</Label>
          <Text slot="description" className="champ__aide">
            {LABELS.profil.motDePasseAide}
          </Text>
          {/* new-password : les gestionnaires de mots de passe proposent d'en
              générer un, et n'écrasent pas l'ancien avant validation. */}
          <Input className="champ__saisie" autoComplete="new-password" />
          <FieldError className="champ__erreur">{LABELS.profil.motDePasseCourt}</FieldError>
        </TextField>

        <div className="formulaire__actions">
          <Button type="submit" className="bouton bouton--discret">
            {LABELS.profil.changerMotDePasse}
          </Button>
        </div>
      </Form>
    </div>
  )
}
