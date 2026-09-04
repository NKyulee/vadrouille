import { useState } from 'react'
import { Button, FieldError, Form, Input, Label, Link, Text, TextField } from 'react-aria-components'
import { useLocation, useNavigate } from 'react-router'
import { CANAL_MEMBRE, EN_DEUX_ETAPES, normaliserIdentifiant } from '../../auth/canal.ts'
import { supabase } from '../../auth/supabase.ts'
import { useSession } from '../../auth/session.ts'
import { useTitrePage } from '../../hooks/useTitrePage.ts'
import { LABELS } from '../../labels.ts'
import './LoginPage.scss'

export default function LoginPage() {
  useTitrePage(LABELS.auth.titreMembre)

  const naviguer = useNavigate()
  const { state } = useLocation()
  const { rafraichir } = useSession()

  /** Textes du canal en service — SMS ou courriel. */
  const T = LABELS.auth.membre[CANAL_MEMBRE]

  const [etape, setEtape] = useState<'identifiant' | 'code'>('identifiant')
  const [saisie, setSaisie] = useState('')
  const [identifiant, setIdentifiant] = useState('')
  const [code, setCode] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  const allerAuRetour = () => {
    const retour =
      typeof state === 'object' && state && 'retour' in state ? String(state.retour) : '/'
    naviguer(retour, { replace: true })
  }

  /* Connexion directe, sans code : aucun courriel n'est envoyé, donc aucune
     limite de débit. C'est ce qui distingue ce canal des deux autres. */
  const seConnecterMotDePasse = async () => {
    const email = normaliserIdentifiant(saisie)
    if (!email) {
      setErreur(T.identifiantInvalide)
      return
    }
    setEnvoi(true)
    setErreur(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse })
    setEnvoi(false)
    if (error) {
      // Message unique : distinguer « adresse inconnue » de « mot de passe
      // faux » permettrait d'énumérer les comptes.
      setErreur(LABELS.auth.membre.echecMotDePasse)
      return
    }
    await rafraichir()
    allerAuRetour()
  }

  const demanderCode = async (valeur = saisie) => {
    const normalise = normaliserIdentifiant(valeur)
    if (!normalise) {
      setErreur(T.identifiantInvalide)
      return
    }

    setEnvoi(true)
    setErreur(null)
    /* `shouldCreateUser: false` : personne ne s'inscrit tout seul. Les
       comptes sont créés à l'accueil, avec la clé de service. Sans ça,
       n'importe quelle adresse saisie créerait un compte vide. */
    const { error } =
      CANAL_MEMBRE === 'sms'
        ? await supabase.auth.signInWithOtp({ phone: normalise, options: { shouldCreateUser: false } })
        : await supabase.auth.signInWithOtp({ email: normalise, options: { shouldCreateUser: false } })
    setEnvoi(false)

    if (error) {
      /* Supabase distingue « compte inconnu » du reste. On le dit, parce
         qu'ici ce n'est pas une fuite : l'inscription se fait en présentiel,
         il n'y a rien à énumérer, et laisser quelqu'un réessayer un code qui
         n'arrivera jamais serait cruel. */
      setErreur(error.status === 422 || /not found|signups not allowed/i.test(error.message)
        ? LABELS.auth.membre.inconnu
        : T.echecEnvoi)
      return
    }

    setIdentifiant(normalise)
    setEtape('code')
  }

  const validerCode = async () => {
    setEnvoi(true)
    setErreur(null)
    const { error } =
      CANAL_MEMBRE === 'sms'
        ? await supabase.auth.verifyOtp({ phone: identifiant, token: code, type: 'sms' })
        : await supabase.auth.verifyOtp({ email: identifiant, token: code, type: 'email' })
    setEnvoi(false)

    if (error) {
      setErreur(LABELS.auth.membre.echecCode)
      return
    }
    await rafraichir()
    allerAuRetour()
  }

  return (
    <div className="conteneur conteneur--aere pile pile--lg connexion">
      <h1>{LABELS.auth.titreMembre}</h1>

      {/* role="alert" : sans région live, un lecteur d'écran ne signalerait
          pas l'échec et l'utilisateur resterait devant un formulaire qui
          « ne fait rien ». */}
      <p role="alert" className={erreur ? 'message-erreur' : 'hors-ecran'}>
        {erreur ?? ''}
      </p>

      {!EN_DEUX_ETAPES ? (
        <Form
          className="formulaire"
          validationBehavior="native"
          onSubmit={(e) => {
            e.preventDefault()
            void seConnecterMotDePasse()
          }}
        >
          <p className="texte-doux">{T.intro}</p>

          <TextField
            className="champ"
            isRequired
            type="email"
            value={saisie}
            onChange={setSaisie}
            autoFocus
          >
            <Label className="champ__label">{T.identifiant}</Label>
            <Text slot="description" className="champ__aide">
              {T.identifiantAide}
            </Text>
            <Input
              className="champ__saisie connexion__saisie"
              inputMode="email"
              autoComplete="username"
            />
            <FieldError className="champ__erreur">{T.identifiantInvalide}</FieldError>
          </TextField>

          <TextField
            className="champ"
            isRequired
            type="password"
            value={motDePasse}
            onChange={setMotDePasse}
          >
            <Label className="champ__label">{LABELS.auth.membre.motDePasse}</Label>
            {/* current-password : les gestionnaires de mots de passe le
                reconnaissent et proposent le remplissage. */}
            <Input className="champ__saisie connexion__saisie" autoComplete="current-password" />
            <FieldError className="champ__erreur">
              {LABELS.auth.membre.motDePasseRequis}
            </FieldError>
          </TextField>

          <Button type="submit" className="bouton connexion__valider" isDisabled={envoi}>
            {LABELS.auth.membre.seConnecter}
          </Button>
        </Form>
      ) : etape === 'identifiant' ? (
        <Form
          className="formulaire"
          validationBehavior="native"
          onSubmit={(e) => {
            e.preventDefault()
            void demanderCode()
          }}
        >
          <p className="texte-doux">{T.intro}</p>

          <TextField
            className="champ"
            isRequired
            type={CANAL_MEMBRE === 'sms' ? 'tel' : 'email'}
            value={saisie}
            onChange={setSaisie}
            autoFocus
          >
            <Label className="champ__label">{T.identifiant}</Label>
            <Text slot="description" className="champ__aide">
              {T.identifiantAide}
            </Text>
            {/* Le bon clavier s'ouvre directement sur téléphone, et
                autoComplete permet la saisie assistée. */}
            <Input
              className="champ__saisie connexion__saisie"
              inputMode={CANAL_MEMBRE === 'sms' ? 'tel' : 'email'}
              autoComplete={CANAL_MEMBRE === 'sms' ? 'tel' : 'email'}
            />
            <FieldError className="champ__erreur">{T.identifiantInvalide}</FieldError>
          </TextField>

          <Button type="submit" className="bouton connexion__valider" isDisabled={envoi}>
            {LABELS.auth.membre.demanderCode}
          </Button>
        </Form>
      ) : (
        <Form
          className="formulaire"
          validationBehavior="native"
          onSubmit={(e) => {
            e.preventDefault()
            void validerCode()
          }}
        >
          <p role="status">{T.codeEnvoye(saisie)}</p>

          <TextField className="champ" isRequired value={code} onChange={setCode} autoFocus>
            <Label className="champ__label">{T.code}</Label>
            <Text slot="description" className="champ__aide">
              {LABELS.auth.membre.codeAide}
            </Text>
            {/* one-time-code : iOS et Android proposent le code reçu
                au-dessus du clavier, sans avoir à le retaper. */}
            <Input
              className="champ__saisie connexion__saisie connexion__code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
            />
            <FieldError className="champ__erreur">{LABELS.auth.membre.codeInvalide}</FieldError>
          </TextField>

          <div className="formulaire__actions">
            <Button type="submit" className="bouton connexion__valider" isDisabled={envoi}>
              {LABELS.auth.membre.valider}
            </Button>
            <Button
              className="bouton bouton--discret"
              isDisabled={envoi}
              onPress={() => void demanderCode(identifiant)}
            >
              {LABELS.auth.membre.renvoyer}
            </Button>
            <Button
              className="bouton bouton--discret"
              onPress={() => {
                setEtape('identifiant')
                setCode('')
                setErreur(null)
              }}
            >
              {T.changer}
            </Button>
          </div>
        </Form>
      )}

      <p>
        <Link className="lien" href="/inscription">
          {LABELS.inscription.depuisConnexion}
        </Link>
      </p>

      <p>
        <Link className="lien" href="/connexion-pro">
          {LABELS.auth.versPro}
        </Link>
      </p>
    </div>
  )
}
