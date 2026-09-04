import { Router } from 'express'
import { exigeConnexion, lireSession } from './session.ts'
import { supabasePourUtilisateur } from '../supabase/index.ts'

export const routesProfil = Router()

routesProfil.use(lireSession)

/**
 * Profil de la personne connectée, rôle compris.
 *
 * C'est ce que le front appelle au démarrage pour savoir qui il sert et quel
 * espace afficher. 401 sans session — le front en déduit l'écran de
 * connexion, sans jamais décider du rôle lui-même.
 *
 * La lecture passe par le client **au nom de l'utilisateur**, pas par la clé
 * de service : le RLS s'applique donc, et une erreur de filtre ici ne peut
 * pas retourner le profil de quelqu'un d'autre.
 */
routesProfil.get('/moi', exigeConnexion, async (req, res) => {
  const { utilisateurId, role, jeton } = req.session!
  const supabase = supabasePourUtilisateur(jeton)
  const table = role === 'professionnel' ? 'professionnel' : 'membre'

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', utilisateurId)
    .maybeSingle()

  if (error) {
    res.status(500).json({ erreur: error.message })
    return
  }
  if (!data) {
    res.status(404).json({ erreur: `Profil ${table} introuvable.` })
    return
  }

  res.json({ role, profil: data })
})
