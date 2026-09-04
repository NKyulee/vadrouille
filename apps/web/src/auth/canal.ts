/* Canal de connexion des membres.

   La cible est le SMS : le public est âgé, le téléphone est l'appareil
   familier, et un code reçu par SMS évite tout mot de passe. Mais l'envoi de
   SMS demande un fournisseur tiers (Twilio, MessageBird…) qui n'est pas
   encore branché.

   En attendant, le même parcours en deux étapes fonctionne par e-mail :
   identifiant, puis code à six chiffres. Écrans, validation et comportement
   sont identiques — seul le canal change.

   Basculer se fait par `VITE_CANAL_MEMBRE=sms` dans .env, sans toucher au
   code, une fois le fournisseur SMS configuré côté Supabase. */

export type CanalMembre = 'email' | 'sms'

export const CANAL_MEMBRE: CanalMembre =
  import.meta.env.VITE_CANAL_MEMBRE === 'sms' ? 'sms' : 'email'

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
