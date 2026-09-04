import cors from 'cors'
import express from 'express'
import { routesInscription } from './routes/inscription.ts'
import { routesProfil } from './routes/profil.ts'

const app = express()
const port = Number(process.env.PORT ?? 3000)
const origineWeb = process.env.WEB_ORIGIN ?? 'http://localhost:5173'

/* La session Supabase voyage dans un en-tête `Authorization`, pas dans un
   cookie : `credentials` n'est donc pas nécessaire, mais l'origine reste
   déclarée explicitement plutôt qu'ouverte à tous. */
app.use(cors({ origin: origineWeb }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api', routesInscription)
app.use('/api', routesProfil)

app.listen(port, () => {
  console.log(`API sur http://localhost:${port}`)
})
