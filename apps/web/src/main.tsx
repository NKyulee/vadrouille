import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.scss'
import App from './App.tsx'
import { appliquerTailleTexte, lireTailleTexte } from './preferences.ts'

// Avant le rendu : l'attribut est posé dès le premier peinturage, sinon le
// texte s'afficherait en taille normale puis sauterait.
appliquerTailleTexte(lireTailleTexte())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
