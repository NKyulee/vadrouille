/* Point d'entrée des données : types, dates, monnaie, référence et requêtes.
   Les pages importent d'ici, jamais d'un fichier précis — c'est ce qui a
   permis de remplacer les données factices par Supabase sans les toucher. */
export * from './dates.ts'
export * from './geo.ts'
export * from './monnaie.ts'
export * from './reference.ts'
export * from './requetes.ts'
export type * from './types.ts'
