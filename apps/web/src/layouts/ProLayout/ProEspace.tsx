import ProLayout from './ProLayout.tsx'
import { ProAppProviders } from '../../state/AppProviders.tsx'

/* Coque professionnelle et ses fournisseurs d'état, réunis dans un module
   différé par la route.

   Un `React.lazy` sur la seule coque aurait exigé une frontière `<Suspense>`
   au-dessus — sans elle, React lève. Le `lazy` de React Router n'en demande
   pas : il attend le module avant de rendre quoi que ce soit. */
export default function ProEspace() {
  return (
    <ProAppProviders>
      <ProLayout />
    </ProAppProviders>
  )
}
