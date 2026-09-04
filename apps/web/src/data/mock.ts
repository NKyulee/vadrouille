/* Données factices, en attendant l'API.

   Tout est statique et synchrone : aucun composant ne doit dépendre de la
   forme de ce fichier, seulement des types de `types.ts`. Le jour où l'API
   existe, on remplace les accesseurs du bas par des fetch — les pages ne
   bougent pas. */

import { ajouterJours, aujourdhuiIso, occurrencesHebdomadaires } from './dates.ts'
import type {
  Activite,
  CategorieId,
  Contact,
  JourId,
  Membre,
  Professionnel,
  Reservation,
  Seance,
} from './types.ts'

export const JOURS: { id: JourId; court: string; long: string }[] = [
  { id: 'lundi', court: 'Lun', long: 'Lundi' },
  { id: 'mardi', court: 'Mar', long: 'Mardi' },
  { id: 'mercredi', court: 'Mer', long: 'Mercredi' },
  { id: 'jeudi', court: 'Jeu', long: 'Jeudi' },
  { id: 'vendredi', court: 'Ven', long: 'Vendredi' },
  { id: 'samedi', court: 'Sam', long: 'Samedi' },
  { id: 'dimanche', court: 'Dim', long: 'Dimanche' },
]

export const CATEGORIES: Record<CategorieId, { label: string; emoji: string }> = {
  atelier: { label: 'Atelier', emoji: '🎨' },
  sortie: { label: 'Sortie', emoji: '🚶' },
  jeu: { label: 'Jeu', emoji: '🃏' },
  sport: { label: 'Sport', emoji: '🤸' },
  partage: { label: 'Partage', emoji: '☕' },
}

export const MEMBRES: Membre[] = [
  { id: 'm1', prenom: 'Simone', nom: 'Ferrand', initiales: 'SF', couleur: 'foret', telephone: '06 31 08 44 12' },
  { id: 'm2', prenom: 'Robert', nom: 'Ozanne', initiales: 'RO', couleur: 'or', telephone: '06 77 20 51 39' },
  { id: 'm3', prenom: 'Yvette', nom: 'Kaczmarek', initiales: 'YK', couleur: 'brique', telephone: '06 14 65 90 28' },
  { id: 'm4', prenom: 'Marcel', nom: 'Dubreuil', initiales: 'MD', couleur: 'ardoise', telephone: '06 52 83 17 40' },
  { id: 'm5', prenom: 'Fatoumata', nom: 'Diallo', initiales: 'FD', couleur: 'prune', telephone: '06 09 74 26 61' },
  { id: 'm6', prenom: 'Henri', nom: 'Vasseur', initiales: 'HV', couleur: 'foret', telephone: '06 88 35 02 77' },
  { id: 'm7', prenom: 'Léonie', nom: 'Bastide', initiales: 'LB', couleur: 'or', telephone: '06 25 49 63 15' },
]

/** L'utilisateur connecté, en attendant l'authentification. */
export const MEMBRE_COURANT: Membre = {
  id: 'moi',
  prenom: 'Colette',
  nom: 'Marchand',
  initiales: 'CM',
  couleur: 'foret',
  membreDepuis: 'mars 2024',
}

export const PRO_COURANT: Professionnel = {
  id: 'pro1',
  prenom: 'Nadia',
  nom: 'Brahimi',
  initiales: 'NB',
  couleur: 'prune',
  structure: 'Atelier des Cascades',
  email: 'nadia.brahimi@atelier-cascades.fr',
  telephone: '01 43 58 22 07',
  siret: '812 445 903 00027',
  presentation:
    "Ateliers créatifs et pratiques pour les habitants du quartier, depuis 2016. Aucun niveau requis, le matériel est toujours fourni.",
}

export const ACTIVITES: Activite[] = [
  {
    id: 'a1',
    titre: 'Atelier aquarelle',
    description: 'Paysages au lavis. Le matériel est fourni, aucun niveau requis.',
    jour: 'lundi',
    heure: '10:00',
    dureeMinutes: 90,
    lieu: 'Salle Jaurès',
    proposePar: 'Atelier des Cascades',
    professionnelId: 'pro1',
    responsableId: 'm7',
    prixCentimes: 400,
    categorie: 'atelier',
    placesParDefaut: 10,
  },
  {
    id: 'a2',
    titre: 'Café des voisins',
    description: 'On se retrouve pour parler de tout et de rien, sans programme.',
    jour: 'lundi',
    heure: '15:30',
    dureeMinutes: 60,
    lieu: 'La vadrouille — accueil',
    proposePar: 'La vadrouille',
    responsableId: 'm2',
    prixCentimes: 0,
    categorie: 'partage',
    placesParDefaut: 12,
  },
  {
    id: 'a3',
    titre: 'Gymnastique douce',
    description: 'Assis ou debout, chacun à son rythme. Prévoir une bouteille d’eau.',
    jour: 'mardi',
    heure: '09:30',
    dureeMinutes: 45,
    lieu: 'Gymnase Colette',
    proposePar: 'Association Bouge !',
    responsableId: 'm4',
    prixCentimes: 300,
    categorie: 'sport',
    placesParDefaut: 15,
  },
  {
    id: 'a4',
    titre: 'Tarot',
    description: 'Trois tables, débutants bienvenus — on réexplique les annonces.',
    jour: 'mardi',
    heure: '14:00',
    dureeMinutes: 120,
    lieu: 'Salle Jaurès',
    proposePar: 'La vadrouille',
    responsableId: 'm6',
    prixCentimes: 0,
    categorie: 'jeu',
    placesParDefaut: 12,
  },
  {
    id: 'a5',
    titre: 'Marché de Belleville',
    description: 'Départ groupé depuis La vadrouille, retour vers midi. Trajet à plat.',
    jour: 'mercredi',
    heure: '10:00',
    dureeMinutes: 120,
    lieu: 'Rendez-vous à l’accueil',
    proposePar: 'La vadrouille',
    responsableId: 'm2',
    prixCentimes: 0,
    categorie: 'sortie',
    placesParDefaut: 8,
  },
  {
    id: 'a6',
    titre: 'Chorale',
    description: 'Chansons françaises. On reprend « Les Copains d’abord ».',
    jour: 'mercredi',
    heure: '16:00',
    dureeMinutes: 90,
    lieu: 'Salle Jaurès',
    proposePar: 'Atelier des Cascades',
    professionnelId: 'pro1',
    responsableId: 'm7',
    prixCentimes: 200,
    categorie: 'atelier',
    placesParDefaut: 20,
  },
  {
    id: 'a7',
    titre: 'Initiation au smartphone',
    description: 'Appels vidéo et photos. Venir avec son téléphone si possible.',
    jour: 'jeudi',
    heure: '10:30',
    dureeMinutes: 60,
    lieu: 'Salle informatique',
    proposePar: 'Atelier des Cascades',
    professionnelId: 'pro1',
    responsableId: 'm5',
    prixCentimes: 0,
    categorie: 'atelier',
    placesParDefaut: 6,
  },
  {
    id: 'a8',
    titre: 'Scrabble',
    description: 'Parties en duo. Un dictionnaire est à disposition.',
    jour: 'jeudi',
    heure: '14:30',
    dureeMinutes: 90,
    lieu: 'La vadrouille — accueil',
    proposePar: 'La vadrouille',
    responsableId: 'm1',
    prixCentimes: 0,
    categorie: 'jeu',
    placesParDefaut: 10,
  },
  {
    id: 'a9',
    titre: 'Cuisine partagée',
    description: 'On prépare le repas ensemble, et on le mange ensemble.',
    jour: 'vendredi',
    heure: '11:00',
    dureeMinutes: 150,
    lieu: 'Cuisine de La vadrouille',
    proposePar: 'Atelier des Cascades',
    professionnelId: 'pro1',
    responsableId: 'm3',
    prixCentimes: 600,
    categorie: 'partage',
    placesParDefaut: 8,
  },
  {
    id: 'a10',
    titre: 'Cinéma du vendredi',
    description: 'Projection sous-titrée, suivie d’une discussion libre.',
    jour: 'vendredi',
    heure: '17:00',
    dureeMinutes: 120,
    lieu: 'Salle Jaurès',
    proposePar: 'Ciné-club des Cascades',
    responsableId: 'm6',
    prixCentimes: 300,
    categorie: 'sortie',
    placesParDefaut: 25,
  },
  {
    id: 'a11',
    titre: 'Jardin partagé',
    description: 'Plantation des semis de printemps. Gants fournis.',
    jour: 'samedi',
    heure: '10:00',
    dureeMinutes: 120,
    lieu: 'Jardin, rue des Cascades',
    proposePar: 'Jardin partagé des Cascades',
    responsableId: 'm4',
    prixCentimes: 0,
    categorie: 'sortie',
    placesParDefaut: 10,
  },
  {
    id: 'a12',
    titre: 'Thé musical',
    description: 'Écoute commentée. Ce mois-ci : les valses de Chopin.',
    jour: 'dimanche',
    heure: '15:00',
    dureeMinutes: 90,
    lieu: 'La vadrouille — accueil',
    proposePar: 'Atelier des Cascades',
    professionnelId: 'pro1',
    responsableId: 'm3',
    prixCentimes: 200,
    categorie: 'partage',
    placesParDefaut: 15,
  },
]

/* Les séances sont dérivées des créneaux, pas saisies : six occurrences par
   activité à partir d'aujourd'hui. C'est ce que ferait une tâche planifiée
   côté serveur, ou une vue calculée en base.

   Les identifiants sont déterministes (« s-a1-0 ») : lisibles au débogage, et
   stables d'un rendu à l'autre. */

const SEMAINES_GENEREES = 6

/** Amorce des inscriptions, appliquée à la première occurrence seulement. */
const AMORCES: Record<string, { participants: string[]; inscrit: boolean }> = {
  a1: { participants: ['m1', 'm3', 'm7'], inscrit: true },
  a2: { participants: ['m2', 'm4', 'm5', 'm6'], inscrit: false },
  a3: { participants: ['m1', 'm4'], inscrit: true },
  a4: { participants: ['m2', 'm3', 'm6', 'm7'], inscrit: false },
  a5: { participants: ['m1', 'm2', 'm5'], inscrit: false },
  a6: { participants: ['m3', 'm4', 'm6', 'm7'], inscrit: true },
  a7: { participants: ['m5'], inscrit: false },
  a8: { participants: ['m1', 'm7'], inscrit: false },
  a9: { participants: ['m2', 'm3', 'm4', 'm5', 'm6'], inscrit: true },
  a10: { participants: ['m1', 'm6', 'm7'], inscrit: false },
  a11: { participants: ['m2', 'm4'], inscrit: false },
  a12: { participants: ['m3', 'm5', 'm7'], inscrit: false },
}

export function genererSeances(
  activites: readonly Activite[],
  depuis: string,
  semaines = SEMAINES_GENEREES,
): Seance[] {
  return activites.flatMap((activite) =>
    occurrencesHebdomadaires(activite.jour, depuis, semaines).map((date, index) => {
      const amorce = index === 0 ? AMORCES[activite.id] : undefined
      return {
        id: `s-${activite.id}-${index}`,
        activiteId: activite.id,
        date,
        placesTotal: activite.placesParDefaut,
        participants: amorce?.participants ?? [],
        inscritParDefaut: amorce?.inscrit ?? false,
      }
    }),
  )
}

export const SEANCES: Seance[] = genererSeances(ACTIVITES, aujourdhuiIso())

/* Réservations d'amorce. Elles pointent sur des séances **générées**, par
   rang d'occurrence : des dates en dur deviendraient orphelines dès que la
   fenêtre de génération aurait avancé. */

const AUJOURDHUI = aujourdhuiIso()

export const RESERVATIONS: Reservation[] = [
  { id: 'r1', seanceId: 's-a1-0', membreId: 'm1', reserveeLe: ajouterJours(AUJOURDHUI, -11), personnes: 1, statut: 'confirmee', facture: { numero: 'F-2026-0142', montantCentimes: 400, statut: 'payee', emiseLe: ajouterJours(AUJOURDHUI, -10), payeeLe: ajouterJours(AUJOURDHUI, -7) } },
  { id: 'r2', seanceId: 's-a1-0', membreId: 'm3', reserveeLe: ajouterJours(AUJOURDHUI, -9), personnes: 2, statut: 'confirmee', facture: { numero: 'F-2026-0143', montantCentimes: 800, statut: 'emise', emiseLe: ajouterJours(AUJOURDHUI, -8) } },
  { id: 'r3', seanceId: 's-a1-1', membreId: 'm7', reserveeLe: ajouterJours(AUJOURDHUI, -3), personnes: 1, statut: 'en-attente', facture: { numero: 'F-2026-0151', montantCentimes: 400, statut: 'a-emettre' } },
  { id: 'r4', seanceId: 's-a6-0', membreId: 'm4', reserveeLe: ajouterJours(AUJOURDHUI, -16), personnes: 1, statut: 'confirmee', facture: { numero: 'F-2026-0138', montantCentimes: 200, statut: 'payee', emiseLe: ajouterJours(AUJOURDHUI, -15), payeeLe: ajouterJours(AUJOURDHUI, -15) } },
  { id: 'r5', seanceId: 's-a6-0', membreId: 'm6', reserveeLe: ajouterJours(AUJOURDHUI, -5), personnes: 1, statut: 'annulee', facture: { numero: 'F-2026-0147', montantCentimes: 0, statut: 'a-emettre' } },
  { id: 'r6', seanceId: 's-a7-0', membreId: 'm5', reserveeLe: ajouterJours(AUJOURDHUI, -2), personnes: 1, statut: 'confirmee', facture: { numero: 'F-2026-0152', montantCentimes: 0, statut: 'a-emettre' } },
  { id: 'r7', seanceId: 's-a9-0', membreId: 'm2', reserveeLe: ajouterJours(AUJOURDHUI, -7), personnes: 2, statut: 'confirmee', facture: { numero: 'F-2026-0145', montantCentimes: 1200, statut: 'emise', emiseLe: ajouterJours(AUJOURDHUI, -6) } },
  { id: 'r8', seanceId: 's-a9-0', membreId: 'm3', reserveeLe: ajouterJours(AUJOURDHUI, -1), personnes: 1, statut: 'en-attente', facture: { numero: 'F-2026-0153', montantCentimes: 600, statut: 'a-emettre' } },
  { id: 'r9', seanceId: 's-a12-0', membreId: 'm5', reserveeLe: ajouterJours(AUJOURDHUI, -4), personnes: 1, statut: 'confirmee', facture: { numero: 'F-2026-0149', montantCentimes: 200, statut: 'emise', emiseLe: ajouterJours(AUJOURDHUI, -3) } },
]

export const CONTACTS: Contact[] = [
  {
    id: 'c1',
    nom: 'Accueil de La vadrouille',
    role: 'Du lundi au samedi, 9 h – 18 h',
    telephone: '01 42 00 18 30',
    couleur: 'foret',
    urgence: false,
  },
  {
    id: 'c2',
    nom: 'Nadia Brahimi',
    role: 'Votre référente',
    telephone: '06 12 44 71 05',
    couleur: 'prune',
    urgence: false,
  },
  {
    id: 'c3',
    nom: 'Samu',
    role: 'Urgence médicale',
    telephone: '15',
    couleur: 'brique',
    urgence: true,
  },
  {
    id: 'c4',
    nom: 'Numéro d’urgence européen',
    role: 'Toutes urgences',
    telephone: '112',
    couleur: 'brique',
    urgence: true,
  },
]

/** Amorce du contexte Inscriptions : des identifiants de **séances**. */
export const INSCRIPTIONS_INITIALES: string[] = SEANCES.filter((s) => s.inscritParDefaut).map(
  (s) => s.id,
)

/* --- Sélecteurs -------------------------------------------------------------
   Fonctions pures : elles reçoivent les listes en argument et n'en supposent
   aucune. ACTIVITES et SEANCES ne sont que l'amorce du catalogue — le
   professionnel crée et supprime, donc les listes vivantes sont dans le
   contexte. Les composants passent par les hooks d'état, jamais par ces
   tableaux. */

export function activiteParId(
  activites: readonly Activite[],
  id: string | undefined,
): Activite | undefined {
  return id ? activites.find((a) => a.id === id) : undefined
}

export function seanceParId(
  seances: readonly Seance[],
  id: string | undefined,
): Seance | undefined {
  return id ? seances.find((s) => s.id === id) : undefined
}

/** Séances d'une date donnée, triées par heure de début de leur activité. */
export function seancesDuJour(
  seances: readonly Seance[],
  activites: readonly Activite[],
  date: string,
): Seance[] {
  const heure = (s: Seance) => activiteParId(activites, s.activiteId)?.heure ?? ''
  return seances.filter((s) => s.date === date).sort((a, b) => heure(a).localeCompare(heure(b)))
}

/** Prochaines occurrences d'un créneau, à partir de `depuis` inclus. */
export function seancesDeLActivite(
  seances: readonly Seance[],
  activiteId: string,
  depuis: string,
): Seance[] {
  return seances
    .filter((s) => s.activiteId === activiteId && s.date >= depuis)
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Séances auxquelles le membre est inscrit, de la plus proche à la plus lointaine. */
export function mesSeances(
  seances: readonly Seance[],
  inscrits: ReadonlySet<string>,
): Seance[] {
  return seances.filter((s) => inscrits.has(s.id)).sort((a, b) => a.date.localeCompare(b.date))
}

export function prochaineSeance(
  seances: readonly Seance[],
  inscrits: ReadonlySet<string>,
  depuis: string,
): Seance | undefined {
  return mesSeances(seances, inscrits).find((s) => s.date >= depuis)
}

/** Reste-t-il de la place sur cette séance ? */
export function placesRestantes(seance: Seance): number {
  return Math.max(0, seance.placesTotal - seance.participants.length)
}

export function membreParId(id: string): Membre | undefined {
  return MEMBRES.find((m) => m.id === id)
}

export function membresParIds(ids: string[]): Membre[] {
  return ids.map((id) => MEMBRES.find((m) => m.id === id)).filter((m) => m !== undefined)
}
