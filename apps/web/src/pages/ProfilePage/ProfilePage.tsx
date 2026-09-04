import { useState } from 'react'
import { Button, Label, Link, Radio, RadioGroup, Switch, Text } from 'react-aria-components'
import ActivityCard from '../../components/ActivityCard/ActivityCard.tsx'
import Avatar from '../../components/Avatar/Avatar.tsx'
import MemberProfileForm from '../../components/MemberProfileForm/MemberProfileForm.tsx'

import { useMembre, useSession } from '../../auth/session.ts'
import { useTitrePage } from '../../hooks/useTitrePage.ts'
import { LABELS } from '../../labels.ts'
import { appliquerTailleTexte, lireTailleTexte } from '../../preferences.ts'
import type { TailleTexte } from '../../preferences.ts'
import { useCatalogue } from '../../state/catalogue.ts'
import { useInscriptions } from '../../state/inscriptions.ts'
import './ProfilePage.scss'

const TAILLES: TailleTexte[] = ['normal', 'grand', 'tres-grand']

export default function ProfilePage() {
  useTitrePage(LABELS.profil.titre)

  const membre = useMembre()
  const { seDeconnecter, rafraichir } = useSession()
  const { mesSeances, nombre, estInscrit, basculer } = useInscriptions()
  const { activiteParId } = useCatalogue()

  /* Lu une seule fois au montage : la source de vérité est l'attribut sur
     <html>, ce state ne sert qu'à cocher le bon bouton. */
  const [taille, setTaille] = useState<TailleTexte>(lireTailleTexte)
  const [rappels, setRappels] = useState(true)

  const changerTaille = (valeur: string) => {
    const choisie = valeur as TailleTexte
    setTaille(choisie)
    appliquerTailleTexte(choisie)
  }

  return (
    <div className="pile pile--lg">
      <h1 className="hors-ecran">{LABELS.profil.titre}</h1>

      <header className="profil__entete">
        <Avatar initiales={membre.initiales} couleur={membre.couleur} taille="lg" />
        <div>
          <p className="profil__nom">
            {membre.prenom} {membre.nom}
          </p>
          {membre.membreDepuis ? (
            <p className="texte-sm texte-doux">
              {LABELS.profil.membreDepuis(membre.membreDepuis)}
            </p>
          ) : null}
          <p className="texte-sm texte-doux">{LABELS.profil.resume(nombre)}</p>
        </div>
      </header>

      <section className="pile pile--sm" aria-labelledby="titre-inscriptions">
        <h2 id="titre-inscriptions" className="titre-section">
          {LABELS.profil.mesInscriptions}
        </h2>

        {mesSeances.length > 0 ? (
          <ul role="list" className="grille grille--cartes">
            {mesSeances.map((seance) => {
              const activite = activiteParId(seance.activiteId)
              if (!activite) return null
              return (
                <li key={seance.id}>
                  <ActivityCard
                    seance={seance}
                    activite={activite}
                    inscrit={estInscrit(seance.id)}
                    onBasculerInscription={basculer}
                    montrerDate
                  />
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="carte texte-doux">{LABELS.profil.aucuneInscription}</p>
        )}

        <p>
          <Link className="lien" href="/activites">
            {LABELS.profil.voirProgramme}
          </Link>
        </p>
      </section>

      <section className="pile pile--sm" aria-labelledby="titre-informations">
        <h2 id="titre-informations" className="titre-section">
          {LABELS.profil.mesInformations}
        </h2>
        {/* Le nom du compte vient de l'adresse électronique quand personne ne
            l'a renseigné : « Yunguyen94 » plutôt que « Yun ». D'où cet écran,
            qui laisse chacun se corriger sans passer par l'accueil. */}
        <MemberProfileForm membre={membre} onEnregistre={rafraichir} />
      </section>

      <section className="pile pile--sm" aria-labelledby="titre-compte">
        <h2 id="titre-compte" className="titre-section">
          {LABELS.profil.compte}
        </h2>
        <div className="carte">
          <Button className="bouton bouton--discret" onPress={() => void seDeconnecter()}>
            {LABELS.auth.deconnexion}
          </Button>
        </div>
      </section>

      <section className="pile pile--sm" aria-labelledby="titre-preferences">
        <h2 id="titre-preferences" className="titre-section">
          {LABELS.profil.preferences}
        </h2>

        <div className="carte pile pile--lg">
          {/* RadioGroup de React Aria : flèches pour passer d'une option à
              l'autre, un seul arrêt de tabulation pour le groupe, et le
              <Text slot="description"> est relié par aria-describedby. */}
          <RadioGroup
            className="preference"
            value={taille}
            onChange={changerTaille}
            orientation="horizontal"
          >
            <Label className="preference__label">{LABELS.profil.tailleTexte}</Label>
            <Text slot="description" className="texte-sm texte-doux">
              {LABELS.profil.tailleTexteAide}
            </Text>
            <div className="preference__choix">
              {TAILLES.map((valeur) => (
                <Radio key={valeur} value={valeur} className="puce">
                  {LABELS.profil.tailles[valeur]}
                </Radio>
              ))}
            </div>
          </RadioGroup>

          <Switch className="bascule" isSelected={rappels} onChange={setRappels}>
            <span className="bascule__piste">
              <span className="bascule__pastille" />
            </span>
            <span className="bascule__texte">
              <span className="preference__label">{LABELS.profil.rappels}</span>
              <span className="texte-sm texte-doux">{LABELS.profil.rappelsAide}</span>
            </span>
          </Switch>
        </div>
      </section>
    </div>
  )
}
