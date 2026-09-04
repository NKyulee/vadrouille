/* Modèle de domaine de La vadrouille.
   Ces types sont la frontière avec la future API : quand `mock.ts` sera
   remplacé par de vrais appels réseau, seule la source des données change,
   les composants restent identiques. */

/** Jour de la semaine, tel qu'utilisé comme clé d'onglet. */
export type JourId =
  | 'lundi'
  | 'mardi'
  | 'mercredi'
  | 'jeudi'
  | 'vendredi'
  | 'samedi'
  | 'dimanche'

export type CategorieId = 'atelier' | 'sortie' | 'jeu' | 'sport' | 'partage'

/** Couleurs d'avatar disponibles (voir Avatar.scss). */
export type CouleurAvatar = 'foret' | 'or' | 'brique' | 'ardoise' | 'prune'

export interface Membre {
  /** Identifiant Supabase (auth.users.id). */
  id: string
  prenom: string
  nom: string
  /** Calculées une fois ici plutôt que dans le rendu. */
  initiales: string
  couleur: CouleurAvatar
  /** Mois d'arrivée, en toutes lettres. Renseigné pour le membre courant. */
  membreDepuis?: string
  /** Renseigné pour les membres joignables (responsables d'activité). */
  telephone?: string
  /** Adresse du domicile, facultative. Sert au tri « près de chez moi ». */
  adresse?: string
  latitude?: number
  longitude?: number
}

export interface Activite {
  id: string
  titre: string
  description: string
  jour: JourId
  /** Format 24 h « HH:MM », trié tel quel. */
  heure: string
  dureeMinutes: number
  lieuId: string
  /** Dénormalisé à la lecture, pour éviter une jointure dans chaque écran. */
  lieu: string
  /** Professionnel propriétaire. Seul lui peut la modifier. */
  professionnelId: string
  /** Raison sociale du propriétaire, lue via `professionnel_public`. */
  proposePar: string
  /** Membre qui anime et reste le contact le jour même. */
  responsableId?: string
  /** Prix de la séance, **en centimes**. 0 = gratuit. Voir monnaie.ts. */
  prixCentimes: number
  categorie: CategorieId
  /** Capacité appliquée aux séances créées à partir de ce créneau. Une séance
      peut ensuite avoir la sienne (salle plus petite, sortie limitée…). */
  placesParDefaut: number
}

/* Une `Activite` est un **créneau hebdomadaire récurrent** — « l'aquarelle,
   le lundi à 10 h ». Ce qu'on réserve, c'est une `Seance` : une occurrence
   datée de ce créneau.

   Sans cette distinction, les places et les inscrits seraient comptés tous
   lundis confondus, et deux personnes pourraient prendre la même dernière
   place à deux dates différentes. */
export interface Seance {
  id: string
  activiteId: string
  /** Date ISO « AAAA-MM-JJ ». L'heure vient de l'activité. */
  date: string
  /** Capacité de cette occurrence précise. */
  placesTotal: number
  /* Nombre de places occupées, lu depuis la vue `seance_occupation`.
     L'identité des inscrits est une donnée personnelle et vit ailleurs
     (`seance_participant`) ; un décompte n'en est pas une. */
  placesPrises: number
}

export interface Contact {
  id: string
  nom: string
  role: string
  telephone: string
  couleur: CouleurAvatar
  /** Mis en avant dans la page Aide. */
  urgence: boolean
}

/* --- Côté professionnel ---------------------------------------------------
   Le professionnel propose des activités ; les membres y réservent une place,
   et chaque réservation porte sa facturation. */

export interface Professionnel {
  id: string
  prenom: string
  nom: string
  initiales: string
  couleur: CouleurAvatar
  /** Raison sociale, affichée comme « proposé par » côté membre. */
  structure: string
  email: string
  telephone: string
  siret: string
  /** Présentation libre, visible des membres. */
  presentation: string
}

export type StatutReservation = 'en-attente' | 'confirmee' | 'annulee'

/** `a-emettre` → `emise` → `payee`. Une réservation annulée reste facturable
    ou non selon le moment : le statut de la facture est donc indépendant. */
export type StatutFacture = 'a-emettre' | 'emise' | 'payee'

export interface Facture {
  numero: string
  /** Montant total **en centimes**, pour toutes les personnes de la
      réservation. Figé à l'émission : une facture ne suit pas le tarif. */
  montantCentimes: number
  statut: StatutFacture
  /** Dates ISO (AAAA-MM-JJ), renseignées au fur et à mesure. */
  emiseLe?: string
  payeeLe?: string
}

export interface Reservation {
  id: string
  /** La réservation porte sur une occurrence datée, pas sur le créneau. */
  seanceId: string
  membreId: string
  /** Date ISO de la prise de réservation. */
  reserveeLe: string
  /** Une réservation peut couvrir un accompagnant. */
  personnes: number
  statut: StatutReservation
  /** Absente pour une séance gratuite : il n'y a rien à facturer. */
  facture?: Facture
}

/** Une salle, un jardin, un point de rendez-vous. Porte ses coordonnées. */
export interface Lieu {
  id: string
  nom: string
  /** Adresse normalisée par le géocodeur, pas la saisie. */
  adresse: string
  latitude: number
  longitude: number
}

/* Ce qu'on écrit d'une activité. `proposePar` et `lieu` sont dénormalisés à
   la lecture — les inclure ici inviterait à les écrire, et à diverger de leur
   source. */
export type ChampsEcriture = Omit<Activite, 'id' | 'proposePar' | 'lieu'>
