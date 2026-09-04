import { useMemo, useState } from 'react'
import { Button, Link } from 'react-aria-components'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { distanceMetres, formaterDistance, positionActuelle } from '../../data/index.ts'
import type { Coordonnees, Lieu } from '../../data/index.ts'
import { useMembre } from '../../auth/session.ts'
import { useTitrePage } from '../../hooks/useTitrePage.ts'
import { LABELS } from '../../labels.ts'
import { useCatalogue } from '../../state/catalogue.ts'
import 'leaflet/dist/leaflet.css'
import './MapPage.scss'

/* Centre par défaut : le lieu le plus fréquent. Ouvrir la carte sur l'océan
   parce qu'on ne sait pas où habite la personne serait absurde. */
const ZOOM_QUARTIER = 15

export default function MapPage() {
  useTitrePage(LABELS.carte.titre)

  const membre = useMembre()
  const { lieux, activites, seances, chargement } = useCatalogue()
  const [positionVive, setPositionVive] = useState<Coordonnees | null>(null)
  const [recherchePosition, setRecherchePosition] = useState(false)

  /* Deux sources pour « chez moi », dans cet ordre : la position du
     navigateur si on l'a demandée, sinon l'adresse du profil. L'adresse est
     la source fiable — une autorisation de géolocalisation est un obstacle
     de plus pour le public visé, et donne où l'on est, pas où l'on habite. */
  const chezMoi: Coordonnees | null = useMemo(
    () =>
      positionVive ??
      (membre.latitude !== undefined && membre.longitude !== undefined
        ? { latitude: membre.latitude, longitude: membre.longitude }
        : null),
    // Objet littéral : sans mémorisation il change à chaque rendu, et le
    // calcul des distances plus bas se referait pour rien.
    [positionVive, membre.latitude, membre.longitude],
  )

  const lieuxAvecActivites = useMemo(() => {
    const compte = new Map<string, { lieu: Lieu; activites: string[] }>()
    for (const a of activites) {
      const lieu = lieux.find((l) => l.id === a.lieuId)
      if (!lieu) continue
      const entree = compte.get(lieu.id) ?? { lieu, activites: [] }
      entree.activites.push(a.titre)
      compte.set(lieu.id, entree)
    }

    return [...compte.values()]
      .map((e) => ({
        ...e,
        /* Séances à venir : un lieu sans rien de programmé n'intéresse
           personne, même s'il a hébergé des activités par le passé. */
        seances: seances.filter(
          (s) => activites.find((a) => a.id === s.activiteId)?.lieuId === e.lieu.id,
        ).length,
        distance: chezMoi ? distanceMetres(chezMoi, e.lieu) : null,
      }))
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
  }, [activites, seances, lieux, chezMoi])

  const centre: Coordonnees | undefined =
    chezMoi ?? lieuxAvecActivites[0]?.lieu ?? undefined

  const demanderPosition = async () => {
    setRecherchePosition(true)
    setPositionVive(await positionActuelle())
    setRecherchePosition(false)
  }

  if (chargement) {
    return (
      <p className="conteneur conteneur--aere" role="status">
        {LABELS.carte.chargement}
      </p>
    )
  }

  return (
    <div className="pile pile--lg">
      <div className="rangee rangee--espacee rangee--repli">
        <h1>{LABELS.carte.titre}</h1>
        <Link className="lien" href="/activites">
          {LABELS.carte.versListe}
        </Link>
      </div>

      {!chezMoi ? (
        <div className="carte-info pile pile--sm">
          <p>{LABELS.carte.sansPosition}</p>
          <div className="rangee rangee--xs rangee--repli">
            <Button
              className="bouton bouton--discret"
              isDisabled={recherchePosition}
              onPress={() => void demanderPosition()}
            >
              {LABELS.carte.utiliserPosition}
            </Button>
            <Link className="bouton bouton--discret" href="/profil">
              {LABELS.carte.renseignerAdresse}
            </Link>
          </div>
        </div>
      ) : null}

      {centre ? (
        <MapContainer
          className="carte-osm"
          center={[centre.latitude, centre.longitude]}
          zoom={ZOOM_QUARTIER}
          scrollWheelZoom={false}
        >
          {/* OpenStreetMap : libre, sans clé. L'attribution est obligatoire —
              c'est la condition de la licence, pas une politesse. */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {chezMoi ? (
            <Marker position={[chezMoi.latitude, chezMoi.longitude]}>
              <Popup>{LABELS.carte.chezMoi}</Popup>
            </Marker>
          ) : null}

          {lieuxAvecActivites.map(({ lieu, activites: titres, distance }) => (
            <Marker key={lieu.id} position={[lieu.latitude, lieu.longitude]}>
              <Popup>
                <strong>{lieu.nom}</strong>
                <br />
                {lieu.adresse}
                {distance !== null ? (
                  <>
                    <br />
                    {LABELS.carte.aDistance(formaterDistance(distance))}
                  </>
                ) : null}
                <br />
                {titres.join(', ')}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      ) : null}

      {/* La carte n'est pas utilisable au clavier ni au lecteur d'écran : la
          même information est donc donnée en liste, triée par distance. Ce
          n'est pas un doublon, c'est l'équivalent accessible. */}
      <section className="pile pile--sm" aria-labelledby="titre-liste-lieux">
        <h2 id="titre-liste-lieux" className="titre-section">
          {chezMoi ? LABELS.carte.parDistance : LABELS.carte.tousLesLieux}
        </h2>

        <ul role="list" className="grille grille--large">
          {lieuxAvecActivites.map(({ lieu, activites: titres, distance }) => (
            <li key={lieu.id} className="lieu-ligne">
              <div className="lieu-ligne__identite">
                <span className="lieu-ligne__nom">{lieu.nom}</span>
                <span className="texte-sm texte-doux">{lieu.adresse}</span>
                <span className="texte-sm texte-doux">{titres.join(' · ')}</span>
              </div>
              {distance !== null ? (
                <span className="badge">{formaterDistance(distance)}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
