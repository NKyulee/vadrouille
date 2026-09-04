import type { RouteObject } from 'react-router'
import RouteProtegee from './auth/RouteProtegee.tsx'
import AriaRouterLayout from './layouts/AriaRouterLayout/AriaRouterLayout.tsx'
import RootLayout from './layouts/RootLayout/RootLayout.tsx'
import ActivitiesPage from './pages/ActivitiesPage/ActivitiesPage.tsx'
import ErrorPage from './pages/ErrorPage/ErrorPage.tsx'
import HomePage from './pages/HomePage/HomePage.tsx'
import LoginPage from './pages/LoginPage/LoginPage.tsx'
import LoginProPage from './pages/LoginProPage/LoginProPage.tsx'
import NotFoundPage from './pages/NotFoundPage/NotFoundPage.tsx'
import AppProviders from './state/AppProviders.tsx'

/* Découpage par route.

   `lazy` retarde le chargement du module jusqu'à la première visite. Ce qui
   est chargé d'emblée est ce que tout le monde traverse : la connexion, la
   coque, l'accueil et le programme. Le reste arrive à la demande.

   Les deux gros gains sont Leaflet, que seule la carte utilise, et l'espace
   professionnel, que la grande majorité des visiteurs n'ouvrira jamais.

   `lazy` renvoie un objet de route partiel, d'où le `Component` : nos pages
   ont un export par défaut, que React Router ne devine pas. */
const page = (charger: () => Promise<{ default: React.ComponentType }>) => async () => ({
  Component: (await charger()).default,
})

export const routes: RouteObject[] = [
  {
    element: <AriaRouterLayout />,
    errorElement: <ErrorPage />,
    children: [
      // Écrans de connexion : premier contact, chargés d'emblée.
      { path: '/connexion', element: <LoginPage /> },
      { path: '/connexion-pro', element: <LoginProPage /> },
      { path: '/inscription', lazy: page(() => import('./pages/SignupPage/SignupPage.tsx')) },

      /* Espace professionnel, entièrement différé. Déclaré avant l'espace
         membre : sans ça, le `*` de RootLayout attraperait /pro. */
      {
        element: <RouteProtegee role="professionnel" />,
        children: [
          {
            path: '/pro',
            // La coque pro part avec ses pages : personne d'autre ne la charge.
            lazy: page(() => import('./layouts/ProLayout/ProEspace.tsx')),
            errorElement: <ErrorPage />,
            children: [
              { index: true, lazy: page(() => import('./pages/ProActivitiesPage/ProActivitiesPage.tsx')) },
              { path: 'activites', lazy: page(() => import('./pages/ProActivitiesPage/ProActivitiesPage.tsx')) },
              { path: 'activites/nouvelle', lazy: page(() => import('./pages/ProActivityFormPage/ProActivityFormPage.tsx')) },
              { path: 'activites/:id/modifier', lazy: page(() => import('./pages/ProActivityFormPage/ProActivityFormPage.tsx')) },
              { path: 'reservations', lazy: page(() => import('./pages/ProReservationsPage/ProReservationsPage.tsx')) },
              { path: 'reservations/:id', lazy: page(() => import('./pages/ProReservationDetailPage/ProReservationDetailPage.tsx')) },
              { path: 'profil', lazy: page(() => import('./pages/ProProfilePage/ProProfilePage.tsx')) },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },

      // Espace membre.
      {
        element: <RouteProtegee />,
        children: [
          {
            path: '/',
            element: (
              <AppProviders>
                <RootLayout />
              </AppProviders>
            ),
            errorElement: <ErrorPage />,
            children: [
              { index: true, element: <HomePage /> },
              { path: 'activites', element: <ActivitiesPage /> },
              { path: 'activites/:id', lazy: page(() => import('./pages/ActivityDetailPage/ActivityDetailPage.tsx')) },
              // Leaflet et sa feuille de style : ~200 ko que seule la carte utilise.
              { path: 'carte', lazy: page(() => import('./pages/MapPage/MapPage.tsx')) },
              { path: 'contacts', lazy: page(() => import('./pages/ContactsPage/ContactsPage.tsx')) },
              { path: 'aide', lazy: page(() => import('./pages/HelpPage/HelpPage.tsx')) },
              { path: 'profil', lazy: page(() => import('./pages/ProfilePage/ProfilePage.tsx')) },
              { path: 'a-propos', lazy: page(() => import('./pages/AboutPage/AboutPage.tsx')) },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
]
