import { RouterProvider } from 'react-aria-components'
import { Outlet, useHref, useNavigate } from 'react-router'
import type { NavigateOptions } from 'react-router'
import SessionProvider from '../../auth/SessionProvider.tsx'

/* Branche la navigation de React Aria sur React Router, et monte la session
   au-dessus de tout le reste.

   Sans le RouterProvider, un <Link href> de react-aria-components provoque un
   rechargement complet de la page au lieu d'une navigation côté client. Ça
   vaut pour tout composant React Aria qui accepte un href.

   Le SessionProvider est ici, et non plus bas : les écrans de connexion en
   ont besoin autant que les pages protégées, et l'état des données métier
   (monté plus bas) dépend de qui est connecté.

   Ce layout doit rester à l'intérieur du RouterProvider de react-router :
   useNavigate n'existe pas en dehors du contexte du routeur. */
declare module 'react-aria-components' {
  interface RouterConfig {
    routerOptions: NavigateOptions
  }
}

export default function AriaRouterLayout() {
  const navigate = useNavigate()

  return (
    <RouterProvider navigate={navigate} useHref={useHref}>
      <SessionProvider>
        <Outlet />
      </SessionProvider>
    </RouterProvider>
  )
}
