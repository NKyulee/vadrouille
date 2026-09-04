/* Canal de connexion des membres.

   Trois valeurs, une seule variable d'environnement — aucun code à changer
   pour passer de l'une à l'autre.

   `motdepasse` (défaut) : adresse et mot de passe, en un écran. Ne déclenche
     aucun envoi de courriel, donc aucune limite de débit. C'est ce qui marche
     aujourd'hui.

   `email` : code à six chiffres reçu par courriel. Suppose un SMTP applicatif
     configuré côté Supabase — le service intégré est bridé à quelques envois
     par heure et renvoie `over_email_send_rate_limit`.

   `sms` : la cible. Le téléphone est l'appareil familier du public visé, et
     un code reçu par SMS évite tout mot de passe à retenir. Suppose un
     fournisseur SMS branché. */

export type CanalMembre = 'motdepasse' | 'email' | 'sms'

const CANAUX: CanalMembre[] = ['motdepasse', 'email', 'sms']

export const CANAL_MEMBRE: CanalMembre = CANAUX.includes(
  import.meta.env.VITE_CANAL_MEMBRE as CanalMembre,
)
  ? (import.meta.env.VITE_CANAL_MEMBRE as CanalMembre)
  : 'motdepasse'

/** Vrai si le canal se fait en deux temps : identifiant, puis code reçu. */
export const EN_DEUX_ETAPES = CANAL_MEMBRE !== 'motdepasse'

/** « 06 12 34 56 78 » → « +33612345678 ». Supabase attend du format E.164. */
export function versE164(saisie: string): string | null {
  const chiffres = saisie.replace(/\D/g, '')
  if (/^0\d{9}$/.test(chiffres)) return `+33${chiffres.slice(1)}`
  if (/^33\d{9}$/.test(chiffres)) return `+${chiffres}`
  return null
}

/** Normalise l'identifiant saisi, ou `null` s'il est invalide. */
export function normaliserIdentifiant(saisie: string): string | null {
  if (CANAL_MEMBRE === 'sms') return versE164(saisie)
  const email = saisie.trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? email : null
}
