import type { NextFunction, Request, Response } from 'express'
import { supabaseAdmin } from '../supabase/index.ts'

export type Role = 'membre' | 'professionnel'

export interface Session {
  utilisateurId: string
  role: Role
  /** Jeton d'origine, à repasser à Supabase pour que le RLS s'applique. */
  jeton: string
}

declare global {
  namespace Express {
    interface Request {
      session?: Session
    }
  }
}

/**
 * Lit et **valide** le jeton d'accès, sans exiger qu'il y en ait un.
 *
 * La validation est déléguée à Supabase (`getUser`) plutôt que faite en
 * décodant le JWT nous-mêmes : un décodage local dirait ce que le jeton
 * prétend, pas s'il est encore valable. Un compte supprimé ou déconnecté doit
 * être refusé.
 */
export async function lireSession(req: Request, _res: Response, next: NextFunction) {
  const entete = req.headers.authorization
  const jeton = entete?.startsWith('Bearer ') ? entete.slice(7) : undefined

  if (!jeton) {
    next()
    return
  }

  const { data, error } = await supabaseAdmin.auth.getUser(jeton)
  if (error || !data.user) {
    next()
    return
  }

  /* Le rôle se lit dans `app_metadata`, écrit par le serveur seul. Le lire
     dans `user_metadata` serait une faille : l'utilisateur peut le modifier. */
  const role = data.user.app_metadata?.role
  req.session = {
    utilisateurId: data.user.id,
    role: role === 'professionnel' ? 'professionnel' : 'membre',
    jeton,
  }
  next()
}

/* Le contrôle d'accès tient à deux niveaux : ces gardes, et le RLS en base.
   Les gardes donnent un message clair et un bon code HTTP ; le RLS est le
   filet qui rattrape une requête mal filtrée. Aucun des deux ne suffit
   seul — le premier s'oublie, le second ne sait pas expliquer pourquoi. */
export function exigeConnexion(req: Request, res: Response, next: NextFunction) {
  if (!req.session) {
    res.status(401).json({ erreur: 'Connexion requise.' })
    return
  }
  next()
}

export function exigeRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session) {
      res.status(401).json({ erreur: 'Connexion requise.' })
      return
    }
    if (req.session.role !== role) {
      // 403 et non 404 : l'utilisateur est identifié, c'est son rôle qui ne
      // convient pas. Le distinguer aide au débogage sans rien divulguer.
      res.status(403).json({ erreur: 'Accès réservé.' })
      return
    }
    next()
  }
}
