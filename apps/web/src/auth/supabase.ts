import { createClient } from '@supabase/supabase-js'

/* Client navigateur. Il ne porte que la clé **anonyme** : elle respecte le
   RLS, donc la publier dans le bundle est sans danger. La clé de service, qui
   contourne le RLS, ne doit jamais arriver jusqu'ici. */

const url = import.meta.env.VITE_SUPABASE_URL
const cle = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !cle) {
  throw new Error(
    'VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont absents. Copier .env.example en .env à la racine du dépôt.',
  )
}

export const supabase = createClient(url, cle, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Le jeton d'accès expire en une heure ; le rafraîchissement est
    // automatique tant que l'onglet vit. Pour notre public, se faire
    // déconnecter en pleine navigation serait rédhibitoire.
    detectSessionInUrl: false,
  },
})
