import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  // Les migrations sont des fichiers versionnés, pas un `push` improvisé :
  // une base de facturation doit pouvoir rejouer son historique.
  strict: true,
  verbose: true,
})
