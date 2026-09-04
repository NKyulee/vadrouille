import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],

  /* Vite lit les fichiers .env dans le dossier du projet — ici `apps/web` —
     alors que le dépôt n'en a qu'un, à la racine, partagé avec l'API.
     Sans cette ligne, `import.meta.env.VITE_*` est vide alors que le fichier
     est bien rempli : Vite ne le cherche simplement pas au bon endroit.
     Le chemin est résolu depuis ce fichier de configuration. */
  envDir: fileURLToPath(new URL('../..', import.meta.url)),
  build: {
    /* Plancher de compatibilité CSS. Sans ce réglage, la cible Vite par
       défaut réécrit le CSS en syntaxe récente, et trois choses cassent sur
       un appareil un peu ancien — un iPad sous iOS 15, typiquement :

       1. les `min-width:` des media queries redeviennent `width>=48em`
          (Media Queries Level 4, Safari 16.4+). Un navigateur qui ne la
          comprend pas ignore la règle *entière* : plus aucun style
          responsive, l'application s'affiche en colonne unique étirée.
       2. le repli `min-height: 100vh` posé avant `100dvh` est supprimé.
       3. `:focus-visible` est regroupé avec `[data-focus-visible]` dans un
          même sélecteur. Si `:focus-visible` n'est pas reconnu, le groupe
          entier est invalidé — et l'anneau de focus disparaît aussi pour
          les composants React Aria.

       Le coût est d'environ 2 ko non compressés (0,2 ko en gzip). */
    cssTarget: ['chrome87', 'safari14', 'firefox78', 'edge88'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
