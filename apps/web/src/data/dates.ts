import type { JourId } from './types.ts'

/* Utilitaires de date, en fonctions pures.

   Tout est manipulé en « AAAA-MM-JJ », jamais en objet Date transporté : une
   séance a lieu un jour donné, pas à un instant donné, et un Date embarque un
   fuseau qui décale la veille ou le lendemain selon l'heure d'exécution.
   Le `T12:00:00` des conversions évite ce piège aux changements d'heure. */

export const JOURS_ORDRE: JourId[] = [
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche',
]

export function versIso(date: Date): string {
  const mois = String(date.getMonth() + 1).padStart(2, '0')
  const jour = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mois}-${jour}`
}

export function depuisIso(iso: string): Date {
  return new Date(`${iso}T12:00:00`)
}

export function ajouterJours(iso: string, nombre: number): string {
  const date = depuisIso(iso)
  date.setDate(date.getDate() + nombre)
  return versIso(date)
}

/** Jour de la semaine d'une date ISO. */
export function jourDe(iso: string): JourId {
  // getDay() : 0 = dimanche. JOURS_ORDRE commence au lundi.
  return JOURS_ORDRE[(depuisIso(iso).getDay() + 6) % 7]
}

/** Date du jour, en ISO court. */
export function aujourdhuiIso(): string {
  return versIso(new Date())
}

/**
 * Les `nombre` prochaines dates ISO à partir de `depuis` inclus.
 * Sert à construire les onglets « les 7 prochains jours ».
 */
export function prochainsJours(depuis: string, nombre: number): string[] {
  return Array.from({ length: nombre }, (_, i) => ajouterJours(depuis, i))
}

/**
 * Occurrences d'un créneau hebdomadaire, à partir de `depuis` inclus.
 * Renvoie `nombre` dates, la première étant le prochain `jour` à venir.
 */
export function occurrencesHebdomadaires(
  jour: JourId,
  depuis: string,
  nombre: number,
): string[] {
  const ecart = (JOURS_ORDRE.indexOf(jour) - JOURS_ORDRE.indexOf(jourDe(depuis)) + 7) % 7
  const premiere = ajouterJours(depuis, ecart)
  return Array.from({ length: nombre }, (_, i) => ajouterJours(premiere, i * 7))
}
