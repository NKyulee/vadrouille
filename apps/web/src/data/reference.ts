import type { CategorieId, Contact, JourId } from './types.ts'

/* Données de référence purement applicatives : elles n'ont pas leur place en
   base, personne ne les modifie, et une table pour sept jours de la semaine
   serait une jointure gratuite à chaque requête. */

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

/* Numéros de la page Aide. Les deux derniers sont des numéros publics
   d'urgence ; les deux premiers appartiennent au lieu. À faire passer en
   base le jour où plusieurs lieux coexisteront — pas avant. */
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
  { id: 'c3', nom: 'Samu', role: 'Urgence médicale', telephone: '15', couleur: 'brique', urgence: true },
  {
    id: 'c4',
    nom: 'Numéro d’urgence européen',
    role: 'Toutes urgences',
    telephone: '112',
    couleur: 'brique',
    urgence: true,
  },
]
