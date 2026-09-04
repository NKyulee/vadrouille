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

type Issue = { texte: string; erreur: boolean } | null

/* Message d'issue à hauteur réservée.

   Basculer entre « masqué » et « affiché » décalerait tout ce qui suit au
   moment où le message apparaît — au moment précis où l'on regarde ailleurs,
   vers le bouton qu'on vient de presser. La place est donc tenue en
   permanence. */
function MessageIssue({ issue }: { issue: Issue }) {
  return (
    <p
      role="status"
      className={`bloc__issue ${issue ? (issue.erreur ? 'bloc__issue--erreur' : 'bloc__issue--succes') : ''}`}
    >
      {issue?.texte ?? ''}
    </p>
  )
}

interface Props {
  membre: Membre
  /** Adresse de connexion, qui vit dans le compte et non dans le profil. */
  email: string
  onEnregistre: () => Promise<void>
}

export default function MemberProfileForm({ membre, email, onEnregistre }: Props) {
  const [prenom, setPrenom] = useState(membre.prenom)
  const [nom, setNom] = useState(membre.nom)
  const [telephone, setTelephone] = useState(membre.telephone ?? '')
  const [couleur, setCouleur] = useState<CouleurAvatar>(membre.couleur)
  const [saisieAdresse, setSaisieAdresse] = useState(membre.adresse ?? '')
  const [propositions, setPropositions] = useState<AdresseTrouvee[]>([])
  const [choisie, setChoisie] = useState<AdresseTrouvee | null>(null)
  const [recherche, setRecherche] = useState(false)
  const [issue, setIssue] = useState<Issue>(null)
  const [envoi, setEnvoi] = useState(false)

  const [nouvelEmail, setNouvelEmail] = useState(email)
  const [issueEmail, setIssueEmail] = useState<Issue>(null)

  const [motDePasse, setMotDePasse] = useState('')
  const [issueMdp, setIssueMdp] = useState<Issue>(null)

  const apercu = initiales(prenom, nom) || membre.initiales

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
      // ce rechargement, l'ancien nom resterait à l'écran.
      await onEnregistre()
      setIssue({ texte: LABELS.profil.enregistre, erreur: false })
    } catch {
      setIssue({ texte: LABELS.profil.echecEnregistrement, erreur: true })
    }
    setEnvoi(false)
  }

  const chercher = async () => {
    setRecherche(true)
    setPropositions(await chercherAdresse(saisieAdresse).catch(() => []))
    setRecherche(false)
  }

  const changerLAdresse = async () => {
    setIssueEmail(null)
    try {
      await changerEmail(nouvelEmail)
      setIssueEmail({ texte: LABELS.profil.emailConfirmationEnvoyee, erreur: false })
    } catch {
      setIssueEmail({ texte: LABELS.profil.echecEmail, erreur: true })
    }
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
    <div className="profil-formulaire">
      {/* Un bloc par sujet, avec un vrai <h3>. Auparavant les deux derniers
          n'avaient qu'un <p> en guise de titre : aucune structure pour un
          lecteur d'écran, et rien pour guider l'œil. */}
      <Form
        className="bloc"
        validationBehavior="native"
        onSubmit={(e) => {
          e.preventDefault()
          void enregistrer()
        }}
      >
        <header className="bloc__entete">
          <Avatar initiales={apercu} couleur={couleur} taille="lg" />
          <div className="bloc__intitule">
            <h3 className="bloc__titre">{LABELS.profil.identite}</h3>
            <p className="texte-sm texte-doux">
              {prenom || nom ? `${prenom} ${nom}`.trim() : LABELS.profil.sansNom}
            </p>
          </div>
        </header>

        <MessageIssue issue={issue} />

        <div className="bloc__champs">
          <div className="champs-cote-a-cote">
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

          <TextField
            className="champ"
            isRequired
            type="tel"
            value={telephone}
            onChange={setTelephone}
          >
            <Label className="champ__label">{LABELS.profil.telephone}</Label>
            <Text slot="description" className="champ__aide">
              {LABELS.profil.telephoneAide}
            </Text>
            <Input className="champ__saisie" inputMode="tel" autoComplete="tel" />
            <FieldError className="champ__erreur">{LABELS.profil.requis}</FieldError>
          </TextField>

          {/* Chaque couleur porte son nom écrit : une pastille seule ne dit
              rien à qui ne distingue pas les teintes. */}
          <RadioGroup
            className="champ"
            value={couleur}
            onChange={(v) => setCouleur(v as CouleurAvatar)}
          >
            <Label className="champ__label">{LABELS.profil.couleur}</Label>
            <div className="nuancier">
              {COULEURS.map((c) => (
                <Radio key={c} value={c} className="nuancier__choix">
                  <Avatar initiales={apercu} couleur={c} taille="sm" />
                  <span>{LABELS.profil.couleurs[c]}</span>
                </Radio>
              ))}
            </div>
          </RadioGroup>
        </div>

        <div className="bloc__pied">
          <Button type="submit" className="bouton" isDisabled={envoi}>
            {LABELS.profil.enregistrer}
          </Button>
        </div>
      </Form>

      {/* L'adresse postale n'est pas de l'identité : elle ne sert qu'à classer
          les lieux. Son propre bloc, avec sa propre explication. */}
      <section className="bloc">
        <header className="bloc__entete">
          <span className="bloc__pastille" aria-hidden="true">
            📍
          </span>
          <div className="bloc__intitule">
            <h3 className="bloc__titre">{LABELS.profil.ouVousHabitez}</h3>
            <p className="texte-sm texte-doux">{LABELS.profil.adresseAide}</p>
          </div>
        </header>

        <div className="bloc__champs">
          <TextField className="champ" value={saisieAdresse} onChange={setSaisieAdresse}>
            <Label className="champ__label">{LABELS.profil.adresse}</Label>
            <div className="champ-avec-action">
              <Input className="champ__saisie" autoComplete="street-address" />
              <Button
                className="bouton bouton--discret"
                isDisabled={recherche || saisieAdresse.trim().length < 5}
                onPress={() => void chercher()}
              >
                {LABELS.profil.chercherAdresse}
              </Button>
            </div>
          </TextField>

          {propositions.length > 0 ? (
            <ul role="list" className="propositions">
              {propositions.map((p) => (
                <li key={p.label}>
                  <Button
                    className={`proposition ${choisie?.label === p.label ? 'proposition--choisie' : ''}`}
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

          <p className="texte-sm texte-doux">{LABELS.profil.adresseEnregistreeAvec}</p>
        </div>
      </section>

      <Form
        className="bloc"
        validationBehavior="native"
        onSubmit={(e) => {
          e.preventDefault()
          void changerLAdresse()
        }}
      >
        <header className="bloc__entete">
          <span className="bloc__pastille" aria-hidden="true">
            ✉
          </span>
          <div className="bloc__intitule">
            <h3 className="bloc__titre">{LABELS.profil.emailTitre}</h3>
            <p className="texte-sm texte-doux">{LABELS.profil.emailAide}</p>
          </div>
        </header>

        <MessageIssue issue={issueEmail} />

        <div className="bloc__champs">
          <TextField
            className="champ"
            isRequired
            type="email"
            value={nouvelEmail}
            onChange={setNouvelEmail}
          >
            <Label className="champ__label">{LABELS.profil.email}</Label>
            <Input className="champ__saisie" autoComplete="username" />
            <FieldError className="champ__erreur">{LABELS.profil.emailInvalide}</FieldError>
          </TextField>
        </div>

        <div className="bloc__pied">
          <Button
            type="submit"
            className="bouton bouton--discret"
            isDisabled={nouvelEmail.trim() === email}
          >
            {LABELS.profil.changerEmail}
          </Button>
        </div>
      </Form>

      <Form
        className="bloc"
        validationBehavior="native"
        onSubmit={(e) => {
          e.preventDefault()
          void changerLeMotDePasse()
        }}
      >
        <header className="bloc__entete">
          <span className="bloc__pastille" aria-hidden="true">
            🔒
          </span>
          <div className="bloc__intitule">
            <h3 className="bloc__titre">{LABELS.profil.motDePasse}</h3>
            <p className="texte-sm texte-doux">{LABELS.profil.motDePasseAide}</p>
          </div>
        </header>

        <MessageIssue issue={issueMdp} />

        <div className="bloc__champs">
          <TextField
            className="champ"
            isRequired
            type="password"
            value={motDePasse}
            onChange={setMotDePasse}
            minLength={8}
          >
            <Label className="champ__label">{LABELS.profil.nouveauMotDePasse}</Label>
            {/* new-password : les gestionnaires proposent d'en générer un et
                n'écrasent pas l'ancien avant validation. */}
            <Input className="champ__saisie" autoComplete="new-password" />
            <FieldError className="champ__erreur">{LABELS.profil.motDePasseCourt}</FieldError>
          </TextField>
        </div>

        <div className="bloc__pied">
          <Button type="submit" className="bouton bouton--discret">
            {LABELS.profil.changerMotDePasse}
          </Button>
        </div>
      </Form>
    </div>
  )
}
