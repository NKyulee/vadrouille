import { Router } from 'express'
import { supabaseAdmin } from '../supabase/index.ts'

export const routesInscription = Router()

/* Création de compte.

   Elle passe par le serveur, avec la clé de service, et non par
   `supabase.auth.signUp()` côté navigateur. Raison : `signUp` déclenche un
   courriel de confirmation, et le service intégré de Supabase est bridé à
   quelques envois par heure — l'inscription échouerait la plupart du temps.

   CONSÉQUENCE À CONNAÎTRE : l'adresse n'est donc **pas vérifiée**. C'est
   acceptable ici parce que l'inscription se fait à l'accueil, en présence de
   la personne. Avant d'ouvrir l'inscription au public, il faut brancher un
   SMTP applicatif, réactiver « Confirm email » côté Supabase, et faire
   repasser ce parcours par `signUp`. */

const MOT_DE_PASSE_MINIMUM = 8

/* Limitation sommaire : un point de création de compte est une cible.

   On compte les comptes **effectivement créés**, pas les requêtes reçues.
   Compter les échecs de validation reviendrait à bloquer un quart d'heure
   quiconque se trompe cinq fois dans le formulaire — c'est-à-dire le public
   même que cette application vise. Un formulaire mal rempli n'est pas une
   attaque.

   En mémoire, donc remis à zéro au redémarrage et non partagé entre
   plusieurs instances. Suffisant pour freiner un script ; à remplacer par une
   limitation en base ou en amont le jour d'une vraie mise en ligne. */
const creations = new Map<string, { compte: number; depuis: number }>()
const FENETRE_MS = 15 * 60 * 1000
const MAX_PAR_FENETRE = 5

function quotaAtteint(ip: string): boolean {
  const t = creations.get(ip)
  return Boolean(t && Date.now() - t.depuis <= FENETRE_MS && t.compte >= MAX_PAR_FENETRE)
}

function compterCreation(ip: string): void {
  const maintenant = Date.now()
  const t = creations.get(ip)
  if (!t || maintenant - t.depuis > FENETRE_MS) {
    creations.set(ip, { compte: 1, depuis: maintenant })
    return
  }
  t.compte += 1
}

/** « 06 12 34 56 78 » → « +33612345678 ». */
function versE164(saisie: string): string | null {
  const chiffres = saisie.replace(/\D/g, '')
  if (/^0\d{9}$/.test(chiffres)) return `+33${chiffres.slice(1)}`
  if (/^33\d{9}$/.test(chiffres)) return `+${chiffres}`
  return null
}

routesInscription.post('/inscription', async (req, res) => {
  const ip = req.ip ?? 'inconnu'
  if (quotaAtteint(ip)) {
    res.status(429).json({ erreur: 'Trop de tentatives. Réessayez dans un quart d’heure.' })
    return
  }

  const { email, motDePasse, telephone, prenom, nom } = req.body as Record<string, unknown>

  /* Validation côté serveur, en plus de celle du formulaire : le navigateur
     ne protège rien, on peut appeler cette route directement. */
  const adresse = typeof email === 'string' ? email.trim().toLowerCase() : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(adresse)) {
    res.status(400).json({ erreur: 'Adresse électronique invalide.', champ: 'email' })
    return
  }
  if (typeof motDePasse !== 'string' || motDePasse.length < MOT_DE_PASSE_MINIMUM) {
    res.status(400).json({
      erreur: `Le mot de passe doit faire au moins ${MOT_DE_PASSE_MINIMUM} caractères.`,
      champ: 'motDePasse',
    })
    return
  }
  const numero = typeof telephone === 'string' ? versE164(telephone) : null
  if (!numero) {
    res.status(400).json({ erreur: 'Numéro de téléphone invalide.', champ: 'telephone' })
    return
  }
  if (typeof prenom !== 'string' || prenom.trim() === '') {
    res.status(400).json({ erreur: 'Le prénom est obligatoire.', champ: 'prenom' })
    return
  }

  const nomComplet = `${prenom.trim()}${typeof nom === 'string' && nom.trim() ? ` ${nom.trim()}` : ''}`

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email: adresse,
    password: motDePasse,
    email_confirm: true,
    app_metadata: { role: 'membre' },
    // Le déclencheur `creer_profil_a_l_inscription` lit ces deux valeurs pour
    // composer le profil : ni le nom ni le numéro ne se perdent en route.
    user_metadata: { name: nomComplet, telephone: numero },
  })

  if (error) {
    // Adresse déjà prise : on le dit. Il n'y a rien à énumérer — c'est un
    // service de quartier, pas un réseau social, et laisser quelqu'un
    // buter sans comprendre serait pire.
    const deja = /already|exists|registered/i.test(error.message)
    res.status(deja ? 409 : 400).json({
      erreur: deja ? 'Un compte existe déjà avec cette adresse.' : error.message,
      champ: deja ? 'email' : undefined,
    })
    return
  }

  compterCreation(ip)
  res.status(201).json({ cree: true })
})
