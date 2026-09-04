import { useState } from 'react'
import { Button, FieldError, Form, Input, Label, Link, Text, TextField } from 'react-aria-components'
import { useNavigate } from 'react-router'
import { supabase } from '../../auth/supabase.ts'
import { useSession } from '../../auth/session.ts'
import { useTitrePage } from '../../hooks/useTitrePage.ts'
import { LABELS } from '../../labels.ts'
import '../LoginPage/LoginPage.scss'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export default function SignupPage() {
  useTitrePage(LABELS.inscription.titre)

  const naviguer = useNavigate()
  const { rafraichir } = useSession()

  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  const inscrire = async () => {
    setEnvoi(true)
    setErreur(null)

    /* L'inscription passe par l'API, pas par `signUp` : celui-ci enverrait un
       courriel de confirmation, et le service intégré de Supabase est bridé.
       La validation est refaite côté serveur — le formulaire ne protège rien. */
    const reponse = await fetch(`${API}/api/inscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, motDePasse, telephone, prenom, nom }),
    }).catch(() => null)

    if (!reponse?.ok) {
      const corps = (await reponse?.json().catch(() => null)) as { erreur?: string } | null
      setErreur(corps?.erreur ?? LABELS.inscription.echec)
      setEnvoi(false)
      return
    }

    // Compte créé : on enchaîne sur la connexion, sans faire retaper.
    const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse })
    setEnvoi(false)
    if (error) {
      setErreur(LABELS.inscription.creeMaisPasConnecte)
      return
    }
    await rafraichir()
    naviguer('/', { replace: true })
  }

  return (
    <div className="conteneur conteneur--aere pile pile--lg connexion">
      <h1>{LABELS.inscription.titre}</h1>

      <p role="alert" className={erreur ? 'message-erreur' : 'hors-ecran'}>
        {erreur ?? ''}
      </p>

      <Form
        className="formulaire"
        validationBehavior="native"
        onSubmit={(e) => {
          e.preventDefault()
          void inscrire()
        }}
      >
        <p className="texte-doux">{LABELS.inscription.intro}</p>

        <div className="formulaire__grille">
          <TextField className="champ" isRequired value={prenom} onChange={setPrenom} autoFocus>
            <Label className="champ__label">{LABELS.profil.prenom}</Label>
            <Input className="champ__saisie connexion__saisie" autoComplete="given-name" />
            <FieldError className="champ__erreur">{LABELS.profil.requis}</FieldError>
          </TextField>

          <TextField className="champ" value={nom} onChange={setNom}>
            <Label className="champ__label">{LABELS.profil.nom}</Label>
            <Input className="champ__saisie connexion__saisie" autoComplete="family-name" />
          </TextField>
        </div>

        <TextField className="champ" isRequired type="email" value={email} onChange={setEmail}>
          <Label className="champ__label">{LABELS.inscription.email}</Label>
          <Text slot="description" className="champ__aide">
            {LABELS.inscription.emailAide}
          </Text>
          <Input className="champ__saisie connexion__saisie" autoComplete="username" />
          <FieldError className="champ__erreur">{LABELS.inscription.emailInvalide}</FieldError>
        </TextField>

        {/* Obligatoire : c'est par là que l'association rappelle quelqu'un —
            un changement d'horaire, une sortie annulée. */}
        <TextField
          className="champ"
          isRequired
          type="tel"
          value={telephone}
          onChange={setTelephone}
        >
          <Label className="champ__label">{LABELS.inscription.telephone}</Label>
          <Text slot="description" className="champ__aide">
            {LABELS.inscription.telephoneAide}
          </Text>
          <Input className="champ__saisie connexion__saisie" inputMode="tel" autoComplete="tel" />
          <FieldError className="champ__erreur">{LABELS.inscription.telephoneInvalide}</FieldError>
        </TextField>

        <TextField
          className="champ"
          isRequired
          type="password"
          value={motDePasse}
          onChange={setMotDePasse}
          minLength={8}
        >
          <Label className="champ__label">{LABELS.inscription.motDePasse}</Label>
          <Text slot="description" className="champ__aide">
            {LABELS.inscription.motDePasseAide}
          </Text>
          <Input className="champ__saisie connexion__saisie" autoComplete="new-password" />
          <FieldError className="champ__erreur">{LABELS.inscription.motDePasseCourt}</FieldError>
        </TextField>

        <Button type="submit" className="bouton connexion__valider" isDisabled={envoi}>
          {LABELS.inscription.valider}
        </Button>
      </Form>

      <p>
        <Link className="lien" href="/connexion">
          {LABELS.inscription.dejaInscrit}
        </Link>
      </p>
    </div>
  )
}
