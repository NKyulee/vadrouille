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
import {
  changerEmail,
  changerMotDePasse,
  chercherAdresse,
  enregistrerProfilMembre,
} from '../../data/index.ts'
import type { AdresseTrouvee } from '../../data/index.ts'
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
  /** Adresse de connexion, qui vit dans le compte et non dans le profil. */
  email: string
  /** Recharge la session : le nom affiché partout doit suivre. */
  onEnregistre: () => Promise<void>
}

export default function MemberProfileForm({ membre, email, onEnregistre }: Props) {
  const [prenom, setPrenom] = useState(membre.prenom)
  const [nom, setNom] = useState(membre.nom)
  const [couleur, setCouleur] = useState<CouleurAvatar>(membre.couleur)
  const [telephone, setTelephone] = useState(membre.telephone ?? '')
  const [issue, setIssue] = useState<{ texte: string; erreur: boolean } | null>(null)
  const [envoi, setEnvoi] = useState(false)

  /* L'adresse ne sert qu'à classer les lieux du plus proche au plus loin.
     Facultative : personne n'a à dire où il habite pour consulter le
     programme. Seules les coordonnées sont conservées, avec le libellé
     normalisé — jamais la saisie brute. */
  const [saisieAdresse, setSaisieAdresse] = useState(membre.adresse ?? '')
  const [propositions, setPropositions] = useState<AdresseTrouvee[]>([])
  const [choisie, setChoisie] = useState<AdresseTrouvee | null>(null)

  const [motDePasse, setMotDePasse] = useState('')
  const [issueMdp, setIssueMdp] = useState<{ texte: string; erreur: boolean } | null>(null)

  const [nouvelEmail, setNouvelEmail] = useState(email)
  const [issueEmail, setIssueEmail] = useState<{ texte: string; erreur: boolean } | null>(null)

  const changerLAdresse = async () => {
    setIssueEmail(null)
    try {
      await changerEmail(nouvelEmail)
      setIssueEmail({ texte: LABELS.profil.emailConfirmationEnvoyee, erreur: false })
    } catch {
      setIssueEmail({ texte: LABELS.profil.echecEmail, erreur: true })
    }
  }

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
        telephone: telephone.trim(),
        ...(choisie
          ? { adresse: choisie.label, latitude: choisie.latitude, longitude: choisie.longitude }
          : {}),
        ...(saisieAdresse.trim() === ''
          ? { adresse: undefined, latitude: undefined, longitude: undefined }
          : {}),
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

        {/* Obligatoire à l'inscription, donc affiché comme tel ici aussi.
            C'est le numéro par lequel l'association rappelle. */}
        <TextField className="champ" isRequired type="tel" value={telephone} onChange={setTelephone}>
          <Label className="champ__label">{LABELS.profil.telephone}</Label>
          <Text slot="description" className="champ__aide">
            {LABELS.profil.telephoneAide}
          </Text>
          <Input className="champ__saisie" inputMode="tel" autoComplete="tel" />
          <FieldError className="champ__erreur">{LABELS.profil.requis}</FieldError>
        </TextField>

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

        <TextField className="champ" value={saisieAdresse} onChange={setSaisieAdresse}>
          <Label className="champ__label">{LABELS.profil.adresse}</Label>
          <Text slot="description" className="champ__aide">
            {LABELS.profil.adresseAide}
          </Text>
          <Input className="champ__saisie" autoComplete="street-address" />
        </TextField>

        <div className="rangee rangee--xs rangee--repli">
          <Button
            className="bouton bouton--discret"
            isDisabled={saisieAdresse.trim().length < 5}
            onPress={() => void chercherAdresse(saisieAdresse).then(setPropositions)}
          >
            {LABELS.profil.chercherAdresse}
          </Button>
        </div>

        {propositions.length > 0 ? (
          <ul role="list" className="pile pile--xs">
            {propositions.map((p) => (
              <li key={p.label}>
                <Button
                  className={`bouton bouton--discret proposition ${choisie?.label === p.label ? 'proposition--choisie' : ''}`}
                  onPress={() => {
                    setChoisie(p)
                    setSaisieAdresse(p.label)
                  }}
                >
                  {p.label}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}

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
          void changerLAdresse()
        }}
      >
        <p className="champ__label">{LABELS.profil.emailTitre}</p>

        <p role="status" className={issueEmail ? (issueEmail.erreur ? 'message-erreur' : 'message-issue') : 'hors-ecran'}>
          {issueEmail?.texte ?? ''}
        </p>

        <TextField className="champ" isRequired type="email" value={nouvelEmail} onChange={setNouvelEmail}>
          <Label className="champ__label">{LABELS.profil.email}</Label>
          {/* L'adresse sert à se connecter : Supabase exige de confirmer la
              nouvelle par courriel avant de l'appliquer. Sans vérification,
              on pourrait inscrire une adresse qui n'est pas la sienne. */}
          <Text slot="description" className="champ__aide">
            {LABELS.profil.emailAide}
          </Text>
          <Input className="champ__saisie" autoComplete="username" />
          <FieldError className="champ__erreur">{LABELS.profil.emailInvalide}</FieldError>
        </TextField>

        <div className="formulaire__actions">
          <Button type="submit" className="bouton bouton--discret" isDisabled={nouvelEmail.trim() === email}>
            {LABELS.profil.changerEmail}
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
