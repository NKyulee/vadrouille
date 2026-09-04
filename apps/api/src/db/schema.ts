import { sql } from 'drizzle-orm'
import { pgPolicy, pgTable, pgView, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { authUid, authUsers, authenticatedRole, serviceRole } from 'drizzle-orm/supabase'

/* Schéma métier, côté Supabase.

   L'identité de connexion n'est plus à nous : elle vit dans `auth.users`,
   gérée par GoTrue. On ne crée, ne modifie ni ne supprime rien dans ce
   schéma — on s'y réfère seulement.

   Ce qui reste à nous, ce sont les **profils** : ce que le domaine sait d'une
   personne, par opposition à ce qui sert à la connecter.

   Le cloisonnement passe par le RLS, donc par Postgres — pas par un `if`
   dans Express. Une requête qui oublierait un filtre ne peut pas fuiter :
   la base refuse les lignes d'elle-même. C'est la raison principale d'être
   passé sur Supabase. */

/** Le rôle est dans `app_metadata`, écrit par le serveur uniquement.
    Surtout pas dans `user_metadata`, que l'utilisateur peut modifier
    lui-même : il s'y promouvrait professionnel en une requête. */
const roleCourant = sql`(auth.jwt() -> 'app_metadata' ->> 'role')`

export const membre = pgTable(
  'membre',
  {
    /* La clé primaire **est** l'identifiant Supabase. Pas de clé technique
       en plus : elle inviterait à désynchroniser les deux. La cascade fait
       partir le profil avec le compte, comme l'exige le droit à l'effacement. */
    userId: uuid('user_id')
      .primaryKey()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    prenom: text('prenom').notNull(),
    nom: text('nom').notNull(),
    /** Deux lettres, calculées à l'enregistrement plutôt qu'à chaque rendu. */
    initiales: text('initiales').notNull(),
    couleurAvatar: text('couleur_avatar').notNull().default('foret'),
    /** Mois d'arrivée en toutes lettres, tel qu'affiché. */
    membreDepuis: text('membre_depuis'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy('membre_lit_son_profil', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy('membre_modifie_son_profil', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    /* Pas de politique d'insertion pour les utilisateurs : un profil est
       créé par l'API avec la clé de service, à l'inscription assistée à
       l'accueil. Personne ne se crée un profil tout seul. */
  ],
)

export const professionnel = pgTable(
  'professionnel',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    prenom: text('prenom').notNull(),
    nom: text('nom').notNull(),
    initiales: text('initiales').notNull(),
    couleurAvatar: text('couleur_avatar').notNull().default('prune'),
    structure: text('structure').notNull(),
    telephone: text('telephone').notNull(),
    siret: text('siret').notNull(),
    presentation: text('presentation').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    /* La table complète porte le SIRET et le téléphone : elle n'est lisible
       que par son propriétaire. Ce que les membres doivent voir passe par la
       vue `professionnel_public` plus bas — le RLS filtre des lignes, pas
       des colonnes. */
    pgPolicy('pro_lit_son_profil', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid} AND ${roleCourant} = 'professionnel'`,
    }),
    pgPolicy('pro_modifie_son_profil', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid} AND ${roleCourant} = 'professionnel'`,
      withCheck: sql`${table.userId} = ${authUid} AND ${roleCourant} = 'professionnel'`,
    }),
    pgPolicy('service_gere_les_pros', {
      for: 'all',
      to: serviceRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
)

/* Ce qu'un membre a le droit de voir d'un intervenant : de quoi afficher
   « proposé par » et le responsable d'une séance. Ni SIRET ni téléphone —
   le RLS ne sait pas masquer une colonne, une vue si.

   `security_invoker = false` : la vue s'exécute avec les droits de son
   propriétaire, sinon le RLS de la table sous-jacente la viderait. */
export const professionnelPublic = pgView('professionnel_public').as((qb) =>
  qb
    .select({
      userId: professionnel.userId,
      prenom: professionnel.prenom,
      nom: professionnel.nom,
      initiales: professionnel.initiales,
      couleurAvatar: professionnel.couleurAvatar,
      structure: professionnel.structure,
      presentation: professionnel.presentation,
    })
    .from(professionnel),
)
