import type { ReactNode } from 'react'
import CatalogueProvider from './CatalogueProvider.tsx'
import InscriptionsProvider from './InscriptionsProvider.tsx'
import ProProvider from './ProProvider.tsx'

/* Deux compositions, une par espace : chacun ne monte que l'état dont il a
   besoin. Le catalogue est commun aux deux — c'est la même donnée métier —
   mais un membre n'a que faire des réservations d'un professionnel, et
   inversement.

   L'ordre compte : InscriptionsProvider et ProProvider dérivent tous deux du
   catalogue.

   Ces fournisseurs sont montés **sous** la session, jamais au-dessus : les
   données métier n'ont de sens qu'une fois qu'on sait qui les regarde, et
   ProProvider lit directement le profil connecté. */

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <CatalogueProvider>
      <InscriptionsProvider>{children}</InscriptionsProvider>
    </CatalogueProvider>
  )
}

export function ProAppProviders({ children }: { children: ReactNode }) {
  return (
    <CatalogueProvider>
      <ProProvider>{children}</ProProvider>
    </CatalogueProvider>
  )
}
