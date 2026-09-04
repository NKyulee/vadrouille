import { createClient } from '@supabase/supabase-js'

/* Deux clients, deux niveaux de privilège. Les confondre est la faute
   classique sur Supabase.

   `anon` respecte le RLS : c'est le client qu'on utilise **au nom d'un
   utilisateur**, en lui passant son jeton. Il ne voit que ce que les
   politiques laissent voir.

   `service_role` **contourne le RLS**. Il ne sert qu'aux opérations
   d'administration côté serveur — créer un compte, poser un rôle. Sa clé ne
   doit jamais quitter le serveur ni apparaître dans un dépôt : quiconque
   l'obtient lit et écrit toute la base. */

function exige(nom: string): string {
  const valeur = process.env[nom]
  if (!valeur) {
    throw new Error(
      `${nom} est absent. Copier .env.example en .env à la racine et y mettre les clés du projet Supabase.`,
    )
  }
  return valeur
}

const url = exige('SUPABASE_URL')

/** Client d'administration. Jamais exposé au navigateur. */
export const supabaseAdmin = createClient(url, exige('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { autoRefreshToken: false, persistSession: false },
})

/**
 * Client agissant au nom d'un utilisateur, soumis au RLS.
 * Le jeton vient de l'en-tête Authorization de la requête entrante.
 */
export function supabasePourUtilisateur(jeton: string) {
  return createClient(url, exige('SUPABASE_ANON_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${jeton}` } },
  })
}
