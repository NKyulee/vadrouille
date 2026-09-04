import type { RouteObject } from 'react-router'
import RouteProtegee from './auth/RouteProtegee.tsx'
import AriaRouterLayout from './layouts/AriaRouterLayout/AriaRouterLayout.tsx'
import ProLayout from './layouts/ProLayout/ProLayout.tsx'
import RootLayout from './layouts/RootLayout/RootLayout.tsx'
import AboutPage from './pages/AboutPage/AboutPage.tsx'
import ActivitiesPage from './pages/ActivitiesPage/ActivitiesPage.tsx'
import ActivityDetailPage from './pages/ActivityDetailPage/ActivityDetailPage.tsx'
import ContactsPage from './pages/ContactsPage/ContactsPage.tsx'
import ErrorPage from './pages/ErrorPage/ErrorPage.tsx'
import HelpPage from './pages/HelpPage/HelpPage.tsx'
import HomePage from './pages/HomePage/HomePage.tsx'
import LoginPage from './pages/LoginPage/LoginPage.tsx'
import MapPage from './pages/MapPage/MapPage.tsx'
import LoginProPage from './pages/LoginProPage/LoginProPage.tsx'
import NotFoundPage from './pages/NotFoundPage/NotFoundPage.tsx'
import ProActivitiesPage from './pages/ProActivitiesPage/ProActivitiesPage.tsx'
import ProActivityFormPage from './pages/ProActivityFormPage/ProActivityFormPage.tsx'
import ProProfilePage from './pages/ProProfilePage/ProProfilePage.tsx'
import ProReservationDetailPage from './pages/ProReservationDetailPage/ProReservationDetailPage.tsx'
import ProReservationsPage from './pages/ProReservationsPage/ProReservationsPage.tsx'
import ProfilePage from './pages/ProfilePage/ProfilePage.tsx'
import AppProviders, { ProAppProviders } from './state/AppProviders.tsx'

export const routes: RouteObject[] = [
  {
    element: <AriaRouterLayout />,
    errorElement: <ErrorPage />,
    children: [
      // --- Publiques : les deux écrans de connexion ---
      { path: '/connexion', element: <LoginPage /> },
      { path: '/connexion-pro', element: <LoginProPage /> },

      /* --- Espace professionnel ---
         Déclaré avant l'espace membre : sans ça, le `*` de RootLayout
         attraperait /pro et afficherait un 404. */
      {
        element: <RouteProtegee role="professionnel" />,
        children: [
          {
            path: '/pro',
            element: (
              <ProAppProviders>
                <ProLayout />
              </ProAppProviders>
            ),
            errorElement: <ErrorPage />,
            children: [
              { index: true, element: <ProActivitiesPage /> },
              { path: 'activites', element: <ProActivitiesPage /> },
              { path: 'activites/nouvelle', element: <ProActivityFormPage /> },
              { path: 'activites/:id/modifier', element: <ProActivityFormPage /> },
              { path: 'reservations', element: <ProReservationsPage /> },
              { path: 'reservations/:id', element: <ProReservationDetailPage /> },
              { path: 'profil', element: <ProProfilePage /> },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },

      // --- Espace membre ---
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
              { path: 'activites/:id', element: <ActivityDetailPage /> },
              { path: 'carte', element: <MapPage /> },
              { path: 'contacts', element: <ContactsPage /> },
              { path: 'aide', element: <HelpPage /> },
              { path: 'profil', element: <ProfilePage /> },
              { path: 'a-propos', element: <AboutPage /> },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
]
