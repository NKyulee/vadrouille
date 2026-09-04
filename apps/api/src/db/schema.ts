import { sql } from 'drizzle-orm'
import {
  check,
  date,
  integer,
  pgEnum,
  pgPolicy,
  pgTable,
  pgView,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
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

/* Ce qu'un membre a le droit de voir des autres membres : les gens qu'il
   croise, c'est-à-dire ceux qui partagent au moins une séance avec lui.
   Ni annuaire, ni recherche : des personnes âgées, pas des profils publics.

   Le filtrage par ligne passe par `membres_croises()`, une fonction
   SECURITY DEFINER (migration 0003). Une politique RLS sur `membre` qui
   interrogerait `reservation` — elle-même sous RLS — se mordrait la queue.

   La date d'arrivée et l'horodatage restent hors de la vue : ils ne
   regardent personne d'autre. */
export const membreVisible = pgView('membre_visible').as((qb) =>
  qb
    .select({
      userId: membre.userId,
      prenom: membre.prenom,
      nom: membre.nom,
      initiales: membre.initiales,
      couleurAvatar: membre.couleurAvatar,
    })
    .from(membre),
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

/* --- Domaine ---------------------------------------------------------------

   Trois décisions structurent ce qui suit.

   1. Une seule notion. Ce que le membre appelle « s'inscrire » et ce que le
      professionnel appelle « une réservation » sont le même objet : la table
      `reservation`. Deux tables auraient demandé de les synchroniser.

   2. On ne voit que les gens qu'on croise. Un membre accède au profil des
      autres membres uniquement s'ils partagent une séance. Ce sont des
      données personnelles de personnes âgées, pas un annuaire.

   3. Numérotation par professionnel. Chacun est son propre émetteur, donc
      sa propre séquence — continue et sans trou (voir `compteur_facture`). */

export const jourEnum = pgEnum('jour', [
  'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche',
])
export const categorieEnum = pgEnum('categorie', ['atelier', 'sortie', 'jeu', 'sport', 'partage'])
export const statutReservationEnum = pgEnum('statut_reservation', [
  'en-attente', 'confirmee', 'annulee',
])
export const statutFactureEnum = pgEnum('statut_facture', ['a-emettre', 'emise', 'payee'])

/** Créneau hebdomadaire récurrent. Ce n'est pas ce qu'on réserve. */
export const activite = pgTable(
  'activite',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    professionnelId: uuid('professionnel_id')
      .notNull()
      .references(() => professionnel.userId, { onDelete: 'cascade' }),
    titre: text('titre').notNull(),
    description: text('description').notNull().default(''),
    jour: jourEnum('jour').notNull(),
    heure: time('heure').notNull(),
    dureeMinutes: integer('duree_minutes').notNull(),
    lieu: text('lieu').notNull(),
    categorie: categorieEnum('categorie').notNull(),
    /** En centimes. Jamais un flottant : voir apps/web/src/data/monnaie.ts. */
    prixCentimes: integer('prix_centimes').notNull().default(0),
    placesParDefaut: integer('places_par_defaut').notNull(),
    /** Membre qui anime et reste joignable le jour même. */
    responsableId: uuid('responsable_id').references(() => membre.userId, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('prix_positif', sql`${table.prixCentimes} >= 0`),
    check('places_positives', sql`${table.placesParDefaut} > 0`),
    check('duree_positive', sql`${table.dureeMinutes} > 0`),
    // Le programme est public pour qui est connecté : on vient d'abord voir
    // ce qui se passe, sans être inscrit à quoi que ce soit.
    pgPolicy('activite_lecture', {
      for: 'select',
      to: authenticatedRole,
      using: sql`true`,
    }),
    pgPolicy('activite_ecriture_proprietaire', {
      for: 'all',
      to: authenticatedRole,
      using: sql`${table.professionnelId} = ${authUid}`,
      withCheck: sql`${table.professionnelId} = ${authUid}`,
    }),
  ],
)

/** Occurrence datée d'un créneau. C'est elle qu'on réserve. */
export const seance = pgTable(
  'seance',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    activiteId: uuid('activite_id')
      .notNull()
      .references(() => activite.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    /** Reprise de `places_par_defaut`, mais modifiable séance par séance. */
    placesTotal: integer('places_total').notNull(),
    /** Une séance annulée reste visible : les inscrits doivent le savoir. */
    annulee: timestamp('annulee', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('seance_unique_par_date').on(table.activiteId, table.date),
    check('places_seance_positives', sql`${table.placesTotal} > 0`),
    pgPolicy('seance_lecture', { for: 'select', to: authenticatedRole, using: sql`true` }),
    pgPolicy('seance_ecriture_proprietaire', {
      for: 'all',
      to: authenticatedRole,
      using: sql`EXISTS (SELECT 1 FROM activite a WHERE a.id = ${table.activiteId} AND a.professionnel_id = ${authUid})`,
      withCheck: sql`EXISTS (SELECT 1 FROM activite a WHERE a.id = ${table.activiteId} AND a.professionnel_id = ${authUid})`,
    }),
  ],
)

/** L'inscription du membre **et** la réservation du professionnel : le même
    objet, vu des deux côtés. */
export const reservation = pgTable(
  'reservation',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    seanceId: uuid('seance_id')
      .notNull()
      .references(() => seance.id, { onDelete: 'cascade' }),
    membreId: uuid('membre_id')
      .notNull()
      .references(() => membre.userId, { onDelete: 'cascade' }),
    /** Le membre peut venir accompagné. 1 par défaut. */
    personnes: integer('personnes').notNull().default(1),
    /* `en-attente` n'est pas une validation à obtenir : c'est la liste
       d'attente quand la séance est pleine. Faire patienter quelqu'un pour
       une place libre serait absurde pour ce public. */
    statut: statutReservationEnum('statut').notNull().default('confirmee'),
    reserveeLe: timestamp('reservee_le', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('une_reservation_par_membre_et_seance').on(table.seanceId, table.membreId),
    check('personnes_positives', sql`${table.personnes} > 0`),
    pgPolicy('reservation_membre', {
      for: 'all',
      to: authenticatedRole,
      using: sql`${table.membreId} = ${authUid}`,
      withCheck: sql`${table.membreId} = ${authUid}`,
    }),
    // Le professionnel voit et gère celles qui portent sur ses séances.
    pgPolicy('reservation_professionnel', {
      for: 'all',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM seance s JOIN activite a ON a.id = s.activite_id
        WHERE s.id = ${table.seanceId} AND a.professionnel_id = ${authUid})`,
      withCheck: sql`EXISTS (
        SELECT 1 FROM seance s JOIN activite a ON a.id = s.activite_id
        WHERE s.id = ${table.seanceId} AND a.professionnel_id = ${authUid})`,
    }),
  ],
)

/* Compteur de facturation, un par professionnel et par année.

   Pourquoi pas une SEQUENCE Postgres : une séquence n'est pas
   transactionnelle. Un rollback consomme quand même le numéro et laisse un
   trou — exactement ce que l'article 242 nonies A du CGI interdit. Une ligne
   verrouillée par `SELECT … FOR UPDATE` sérialise l'attribution et ne saute
   jamais un numéro. */
export const compteurFacture = pgTable(
  'compteur_facture',
  {
    professionnelId: uuid('professionnel_id')
      .notNull()
      .references(() => professionnel.userId, { onDelete: 'cascade' }),
    annee: integer('annee').notNull(),
    dernier: integer('dernier').notNull().default(0),
  },
  (table) => [unique('compteur_par_pro_et_annee').on(table.professionnelId, table.annee)],
)

/** Une facture par réservation payante. Rien pour une séance gratuite. */
export const facture = pgTable(
  'facture',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reservationId: uuid('reservation_id')
      .notNull()
      .unique()
      .references(() => reservation.id, { onDelete: 'restrict' }),
    professionnelId: uuid('professionnel_id')
      .notNull()
      .references(() => professionnel.userId, { onDelete: 'restrict' }),
    annee: integer('annee').notNull(),
    sequence: integer('sequence').notNull(),
    /** « F-2026-0001 ». Composé à l'émission, jamais recalculé. */
    numero: text('numero').notNull(),
    /** Figé à l'émission : une facture ne suit pas les changements de tarif. */
    montantCentimes: integer('montant_centimes').notNull(),
    statut: statutFactureEnum('statut').notNull().default('a-emettre'),
    emiseLe: date('emise_le'),
    payeeLe: date('payee_le'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('numero_unique_par_pro').on(table.professionnelId, table.annee, table.sequence),
    check('montant_positif', sql`${table.montantCentimes} >= 0`),
    /* `on delete restrict` sur la réservation, et aucune politique de
       suppression : une facture émise est une pièce comptable, conservée dix
       ans. On l'annule par un avoir, on ne l'efface pas. */
    pgPolicy('facture_professionnel', {
      for: 'all',
      to: authenticatedRole,
      using: sql`${table.professionnelId} = ${authUid}`,
      withCheck: sql`${table.professionnelId} = ${authUid}`,
    }),
    pgPolicy('facture_lecture_membre', {
      for: 'select',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM reservation r
        WHERE r.id = ${table.reservationId} AND r.membre_id = ${authUid})`,
    }),
  ],
)
