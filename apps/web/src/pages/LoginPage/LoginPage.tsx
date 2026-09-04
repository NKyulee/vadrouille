import { useState } from 'react'
import { Button, FieldError, Form, Input, Label, Link, Text, TextField } from 'react-aria-components'
import { useLocation, useNavigate } from 'react-router'
import { supabase } from '../../auth/supabase.ts'
import { useSession } from '../../auth/session.ts'
import { useTitrePage } from '../../hooks/useTitrePage.ts'
import { LABELS } from '../../labels.ts'
import './LoginPage.scss'

/** « 06 12 34 56 78 » → « +33612345678 ». Supabase veut du format E.164. */
function versE164(saisie: string): string | null {
  const chiffres = saisie.replace(/\D/g, '')
  if (/^0\d{9}$/.test(chiffres)) return `+33${chiffres.slice(1)}`
  if (/^33\d{9}$/.test(chiffres)) return `+${chiffres}`
  return null
}

export default function LoginPage() {
  useTitrePage(LABELS.auth.titreMembre)

  const naviguer = useNavigate()
  const { state } = useLocation()
  const { rafraichir } = useSession()

  const [etape, setEtape] = useState<'numero' | 'code'>('numero')
  const [saisieNumero, setSaisieNumero] = useState('')
  const [numero, setNumero] = useState('')
  const [code, setCode] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  const demanderCode = async () => {
    const e164 = versE164(saisieNumero)
    if (!e164) {
      setErreur(LABELS.auth.membre.telephoneInvalide)
      return
    }
    setEnvoi(true)
    setErreur(null)
    const { error } = await supabase.auth.signInWithOtp({ phone: e164 })
    setEnvoi(false)
    if (error) {
      setErreur(LABELS.auth.membre.echecEnvoi)
      return
    }
    setNumero(e164)
    setEtape('code')
  }

  const validerCode = async () => {
    setEnvoi(true)
    setErreur(null)
    const { error } = await supabase.auth.verifyOtp({ phone: numero, token: code, type: 'sms' })
    setEnvoi(false)
    if (error) {
      setErreur(LABELS.auth.membre.echecCode)
      return
    }
    await rafraichir()
    const retour = typeof state === 'object' && state && 'retour' in state ? String(state.retour) : '/'
    naviguer(retour, { replace: true })
  }

  return (
    <div className="conteneur conteneur--aere pile pile--lg connexion">
      <h1>{LABELS.auth.titreMembre}</h1>

      {/* Le message d'erreur est dans une région live : sans ça, un lecteur
          d'écran ne signalerait pas l'échec, l'utilisateur resterait devant
          un formulaire qui « ne fait rien ». */}
      <p role="alert" className={erreur ? 'message-erreur' : 'hors-ecran'}>
        {erreur ?? ''}
      </p>

      {etape === 'numero' ? (
        <Form
          className="formulaire"
          validationBehavior="native"
          onSubmit={(e) => {
            e.preventDefault()
            void demanderCode()
          }}
        >
          <p className="texte-doux">{LABELS.auth.membre.intro}</p>

          <TextField
            className="champ"
            isRequired
            type="tel"
            value={saisieNumero}
            onChange={setSaisieNumero}
            autoFocus
          >
            <Label className="champ__label">{LABELS.auth.membre.telephone}</Label>
            <Text slot="description" className="champ__aide">
              {LABELS.auth.membre.telephoneAide}
            </Text>
            {/* inputMode numérique : sur téléphone, le clavier à chiffres
                s'ouvre directement. autoComplete pour la saisie assistée. */}
            <Input className="champ__saisie connexion__saisie" inputMode="tel" autoComplete="tel" />
            <FieldError className="champ__erreur">
              {LABELS.auth.membre.telephoneInvalide}
            </FieldError>
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
          <p role="status">{LABELS.auth.membre.codeEnvoye(saisieNumero)}</p>

          <TextField
            className="champ"
            isRequired
            value={code}
            onChange={setCode}
            autoFocus
          >
            <Label className="champ__label">{LABELS.auth.membre.code}</Label>
            <Text slot="description" className="champ__aide">
              {LABELS.auth.membre.codeAide}
            </Text>
            {/* one-time-code : iOS et Android proposent le code du SMS
                au-dessus du clavier, sans le retaper. */}
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
            <Button className="bouton bouton--discret" onPress={() => void demanderCode()}>
              {LABELS.auth.membre.renvoyer}
            </Button>
            <Button
              className="bouton bouton--discret"
              onPress={() => {
                setEtape('numero')
                setCode('')
                setErreur(null)
              }}
            >
              {LABELS.auth.membre.changerNumero}
            </Button>
          </div>
        </Form>
      )}

      <p className="texte-sm texte-doux">{LABELS.auth.membre.pasDeCompte}</p>

      <p>
        <Link className="lien" href="/connexion-pro">
          {LABELS.auth.versPro}
        </Link>
      </p>
    </div>
  )
}
