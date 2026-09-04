import { useState } from 'react'
import { Button, FieldError, Form, Input, Label, Link, TextField } from 'react-aria-components'
import { useLocation, useNavigate } from 'react-router'
import { supabase } from '../../auth/supabase.ts'
import { useSession } from '../../auth/session.ts'
import { useTitrePage } from '../../hooks/useTitrePage.ts'
import { LABELS } from '../../labels.ts'
import '../LoginPage/LoginPage.scss'

export default function LoginProPage() {
  useTitrePage(LABELS.auth.titrePro)

  const naviguer = useNavigate()
  const { state } = useLocation()
  const { rafraichir } = useSession()

  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  const seConnecter = async () => {
    setEnvoi(true)
    setErreur(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse })
    setEnvoi(false)
    if (error) {
      /* Message unique pour un e-mail inconnu comme pour un mot de passe
         faux : distinguer les deux permettrait d'énumérer les comptes. */
      setErreur(LABELS.auth.pro.echec)
      return
    }
    await rafraichir()
    const retour =
      typeof state === 'object' && state && 'retour' in state ? String(state.retour) : '/pro'
    naviguer(retour, { replace: true })
  }

  return (
    <div className="conteneur conteneur--aere pile pile--lg connexion">
      <h1>{LABELS.auth.titrePro}</h1>

      <p role="alert" className={erreur ? 'message-erreur' : 'hors-ecran'}>
        {erreur ?? ''}
      </p>

      <Form
        className="formulaire"
        validationBehavior="native"
        onSubmit={(e) => {
          e.preventDefault()
          void seConnecter()
        }}
      >
        <p className="texte-doux">{LABELS.auth.pro.intro}</p>

        <TextField
          className="champ"
          isRequired
          type="email"
          value={email}
          onChange={setEmail}
          autoFocus
        >
          <Label className="champ__label">{LABELS.auth.pro.email}</Label>
          <Input className="champ__saisie" autoComplete="username" />
          <FieldError className="champ__erreur">{LABELS.auth.pro.emailInvalide}</FieldError>
        </TextField>

        <TextField
          className="champ"
          isRequired
          type="password"
          value={motDePasse}
          onChange={setMotDePasse}
        >
          <Label className="champ__label">{LABELS.auth.pro.motDePasse}</Label>
          {/* current-password : les gestionnaires de mots de passe le
              reconnaissent et proposent le remplissage. */}
          <Input className="champ__saisie" autoComplete="current-password" />
          <FieldError className="champ__erreur">{LABELS.auth.pro.motDePasseRequis}</FieldError>
        </TextField>

        <div className="formulaire__actions">
          <Button type="submit" className="bouton" isDisabled={envoi}>
            {LABELS.auth.pro.valider}
          </Button>
        </div>
      </Form>

      <p>
        <Link className="lien" href="/connexion">
          {LABELS.auth.versMembre}
        </Link>
      </p>
    </div>
  )
}
