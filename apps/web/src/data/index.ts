/* Point d'entrée unique des données : types, utilitaires de date et
   sélecteurs. Évite aux pages de savoir si une fonction vient de `dates.ts`
   ou de `mock.ts` — et le jour où `mock.ts` devient un client d'API, seul ce
   fichier change. */
export * from './dates.ts'
export * from './monnaie.ts'
export * from './mock.ts'
export type * from './types.ts'
