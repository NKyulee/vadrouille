/* Géocodage et distances.

   Le géocodeur est l'API Adresse de data.gouv.fr : gratuite, sans clé, sans
   inscription, et faisant autorité sur les adresses françaises. Nominatim
   conviendrait aussi, mais sa politique d'usage interdit les requêtes
   automatisées fréquentes, et il connaît moins bien le détail français. */

export interface Coordonnees {
  latitude: number
  longitude: number
}

export interface AdresseTrouvee extends Coordonnees {
  /** Adresse normalisée telle que renvoyée — pas la saisie de l'utilisateur. */
  label: string
  /** 0 à 1. En dessous de 0,5, le résultat est probablement à côté. */
  score: number
}

const RACINE = 'https://api-adresse.data.gouv.fr/search/'

/**
 * Propose des adresses pour une saisie partielle.
 *
 * Renvoie une liste, jamais un résultat unique : le géocodeur se trompe, et
 * laisser la personne choisir vaut mieux que deviner. Une saisie trop courte
 * ne renvoie rien plutôt que n'importe quoi.
 */
export async function chercherAdresse(saisie: string, limite = 5): Promise<AdresseTrouvee[]> {
  const q = saisie.trim()
  if (q.length < 5) return []

  const reponse = await fetch(`${RACINE}?limit=${limite}&q=${encodeURIComponent(q)}`)
  if (!reponse.ok) throw new Error(`Géocodage indisponible (${reponse.status})`)

  const donnees = (await reponse.json()) as {
    features: {
      geometry: { coordinates: [number, number] }
      properties: { label: string; score: number }
    }[]
  }

  return donnees.features.map((f) => ({
    // GeoJSON range les coordonnées en [longitude, latitude] — l'inverse de
    // l'ordre habituel. C'est l'erreur classique du géocodage.
    longitude: f.geometry.coordinates[0],
    latitude: f.geometry.coordinates[1],
    label: f.properties.label,
    score: f.properties.score,
  }))
}

const RAYON_TERRE_M = 6_371_000

/**
 * Distance à vol d'oiseau, en mètres (formule de haversine).
 *
 * À vol d'oiseau, donc toujours inférieure au trajet réel. Suffisant pour
 * trier « le plus proche d'abord » ; insuffisant pour annoncer un temps de
 * marche, ce qu'on se garde bien de faire.
 */
export function distanceMetres(a: Coordonnees, b: Coordonnees): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.latitude - a.latitude)
  const dLon = rad(b.longitude - a.longitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2
  return 2 * RAYON_TERRE_M * Math.asin(Math.sqrt(h))
}

/** « 250 m », « 1,2 km ». Arrondi : une précision au mètre serait mensongère. */
export function formaterDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres / 10) * 10} m`
  return `${(metres / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`
}

/** Position actuelle du navigateur, ou `null` si refusée ou indisponible. */
export function positionActuelle(): Promise<Coordonnees | null> {
  if (!('geolocation' in navigator)) return Promise.resolve(null)
  return new Promise((resoudre) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resoudre({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      // Refus ou échec : on ne bloque pas, on retombe sur l'adresse du profil.
      () => resoudre(null),
      { timeout: 8000, maximumAge: 300_000 },
    )
  })
}
