# Vadrouille

Monorepo pnpm : front Vite + React + TypeScript + React Aria + Sass + React
Router, back Node + Express + TypeScript, authentification et base sur
Supabase.

L'application front est **La vadrouille** : le programme d'activités d'un lieu de
vie associatif. Deux espaces — les **membres** consultent et réservent, les
**professionnels** proposent les activités et suivent leur facturation. Pensée pour le téléphone d'abord, mais utilisable telle quelle
du petit écran au grand — voir « Adaptation aux écrans ». Et pour un public
qui navigue parfois au clavier physique ou à la télécommande d'assistance :
c'est ce qui explique les cibles à 48 px, l'anneau de focus épais et l'échelle
typographique qui démarre à 17 px.

## Prérequis

- Node >= 22
- pnpm (`corepack enable`)

## Installation

```bash
pnpm install
```

## Développement

```bash
pnpm dev
```

- web : http://localhost:5173
- api : http://localhost:3000

Le serveur Vite proxifie `/api` vers l'API, donc pas de CORS en dev.

## Build

```bash
pnpm build
```

## Structure

```
apps/
  web/   Vite + React 19 + TypeScript + React Aria Components 1 + Sass + React Router 8
  api/   Node + Express 5 + TypeScript + Drizzle (tsx en dev, tsc pour le build)
```

## Interface : React Aria Components

Les composants interactifs viennent de
[React Aria Components](https://react-spectrum.adobe.com/react-aria/) (Adobe).

React Aria fournit le **comportement** — clavier, ARIA, gestion du focus,
interactions tactiles — et **rien d'autre** : aucun style, et aucune primitive
de mise en page. Il n'y a pas d'équivalent de `Stack`, `Card` ou `Title`. Ce
qui n'est pas interactif est donc du HTML sémantique habillé par le CSS du
projet.

### Où sont les styles

Sass, en syntaxe moderne : `@use`, jamais `@import` (déprécié).

```
src/
  styles/index.scss      point d'entrée, importé une fois dans main.tsx
  styles/_tokens.scss    palette, espacements, typo, rayons + thème sombre
  styles/_mixins.scss    a-partir-de(), jusqu-a(), cible-tactile(), tronquer()
  styles/_base.scss      reset, typographie, focus, lien d'évitement
  styles/_layout.scss    primitives : .pile .rangee .carte .badge .lien .bouton
  <Composant>/<Composant>.scss   styles locaux, à côté du .tsx
```

`_tokens.scss` remplace l'ancien `theme.ts` : c'est le seul fichier à éditer
pour la charte. Il travaille à deux niveaux, et la distinction compte :

| Niveau | Exemple | Quand |
|---|---|---|
| Variable Sass | `$forest` | compilation : calculs, mixins, `color.mix()` |
| Propriété CSS | `--couleur-primaire` | exécution : **c'est ce qui bascule en sombre** |

Une couleur écrite en `$variable` dans un composant ne suivra pas le thème
sombre. Toujours passer par `var(--...)` côté composant.

Le thème sombre tient dans un unique bloc `@media (prefers-color-scheme: dark)`
en bas de `_tokens.scss`, qui redéfinit les mêmes propriétés.

Pour utiliser les mixins dans un fichier de composant :

```scss
@use '../../styles/mixins' as *;

.ma-carte {
  @include cible-tactile;

  @include a-partir-de('sm') {
    padding: var(--espace-lg);
  }
}
```

Il n'y a plus de configuration PostCSS : Vite compile le Sass directement.

### Styler un composant React Aria

React Aria n'expose pas de props de style : il pose des **data-attributs** que
le CSS vient cibler. Ils remplacent `:hover` / `:active`, et gèrent des cas que
le CSS natif ne couvre pas — `data-focus-visible` n'apparaît qu'à la navigation
clavier, jamais au clic souris.

```css
.bouton[data-hovered] { … }
.bouton[data-pressed] { … }
.bouton[data-disabled] { … }
.onglet[data-selected] { … }
```

L'anneau de focus est défini **une seule fois**, dans `base.css`, pour
`:focus-visible` et `[data-focus-visible]` : tous les éléments — natifs comme
React Aria — ont le même repère visuel. Il est volontairement épais et
contrasté (`--focus-epaisseur`, `--focus-couleur`).

### Liens et navigation

`AriaRouterLayout` branche React Aria sur React Router. Sans lui, un
`<Link href>` de React Aria rechargerait toute la page au lieu de naviguer
côté client. Ça vaut pour tout composant React Aria acceptant un `href` :
`Menu`, `Breadcrumbs`, `GridList`…

Deux cas, deux composants :

| Besoin | Composant |
|---|---|
| Lien simple | `Link` de `react-aria-components` |
| Lien de navigation avec état actif | `NavLink` de `react-router` |

`NavLink` pose `aria-current="page"` tout seul sur le lien actif : c'est ce que
lit le CSS (`.coque__lien[aria-current='page']`) et ce qu'annoncent les
lecteurs d'écran. Pas d'attribut « actif » à gérer à la main.

### Ajouter un composant

Tout est dans le même package, rien à installer :

```tsx
import { Tabs, TabList, Tab, TabPanel } from 'react-aria-components'
```

Puis écrire le CSS à côté du composant, en ciblant les data-attributs. Le
[catalogue des composants](https://react-spectrum.adobe.com/react-aria/components.html)
liste les data-attributs de chacun.

Pour un cas non couvert, les hooks bas niveau restent disponibles
(`pnpm --filter web add react-aria react-stately`), mais ils demandent
d'écrire le DOM soi-même — à réserver aux composants vraiment sur mesure.

## Détail d'une activité

`/activites/:id` affiche la fiche complète : quand, où, prix, structure qui la
propose, membre responsable (joignable par téléphone), participants, et le
bouton d'inscription — le même état partagé que la liste, donc les deux vues
restent d'accord.

Un identifiant inconnu ne plante pas : la page rend son propre message
« Activité introuvable » avec un retour au programme.

### Le lien étendu, et pourquoi pas plus simple

Une carte doit à la fois **ouvrir le détail au clic** et **garder son bouton
d'inscription**. Envelopper la carte entière dans un `<a>` mettrait un
`<button>` dans un lien : HTML invalide, et le bouton devient inatteignable au
clavier. Le motif retenu :

```
<article class="activite">          position: relative
  <h3><a class="activite__lien">    ::after { position:absolute; inset:0 }
  …
  <div class="activite__pied">      position: relative; z-index: 1
    <button class="activite__action">
```

Le `<a>` ne porte que le titre — un seul arrêt clavier, et un libellé qui a du
sens hors contexte — mais son `::after` couvre la carte, qui devient cliquable
à la souris. Le pied repasse au-dessus, sinon le pseudo-élément intercepterait
le clic sur le bouton.

Deux conséquences à connaître : le texte de la carte n'est plus sélectionnable
à la souris, et l'anneau de focus n'entoure que le titre, pas la carte.
Encadrer la carte demanderait `:has()`, hors du plancher de compatibilité visé
(voir « Compatibilité des media queries »).

## État partagé : les inscriptions

Trois écrans travaillent sur la même donnée — Activités la modifie, Accueil et
Profil l'affichent. Un `useState` par page les ferait diverger : on s'inscrit
depuis Activités et Profil ne le voit pas. L'état vit donc dans un contexte,
monté dans `RootLayout` au-dessus de l'`<Outlet />`.

```
state/inscriptions.ts          contexte + hook useInscriptions()
state/InscriptionsProvider.tsx le fournisseur
```

```tsx
const { estInscrit, basculer, mesActivites, prochaine, nombre } = useInscriptions()
```

Le fichier est scindé en deux parce qu'un module qui exporte à la fois un
composant et un hook casse le rafraîchissement à chaud — et déclenche la règle
`react/only-export-components` d'oxlint.

Côté données, `Activite.inscritParDefaut` **n'est que l'amorce** du contexte au
premier rendu. Aucun composant ne doit lire ce champ : la vérité est dans
`useInscriptions()`. Les sélecteurs `mesActivites` et `prochaineActivite` de
`mock.ts` prennent d'ailleurs les inscriptions en argument, ils ne les
devinent pas.

## Profil et préférences

`ProfilePage` réunit l'identité du membre, ses inscriptions (les mêmes cartes
que sur Activités, désinscription comprise) et les préférences d'affichage.

### Taille du texte

C'est une vraie préférence, pas une maquette : elle agit tout de suite et
survit au rechargement.

Le mécanisme tient en une ligne de CSS. `preferences.ts` pose
`data-texte="grand"` sur `<html>`, et `_base.scss` fait grossir la police de
la racine :

```scss
:root[data-texte='grand'] { font-size: 112.5%; }
```

Comme toute l'échelle typographique **et** tous les espacements sont en `rem`,
l'interface entière suit — aucune règle en double. Les points de rupture, eux,
sont en `em` : ils restent calés sur la taille par défaut du navigateur, donc
la disposition ne bascule pas quand on grossit le texte.

L'attribut est appliqué dans `main.tsx` **avant** le rendu, sinon la page
s'afficherait en taille normale puis sauterait. Et chaque accès à
`localStorage` est sous `try/catch` : il lève en navigation privée sur
d'anciens Safari, et une préférence d'affichage ne doit jamais empêcher
l'application de démarrer.

## Créneau et séance

Le modèle distingue deux niveaux, et c'est la distinction structurante du
projet :

| | `Activite` | `Seance` |
|---|---|---|
| Ce que c'est | un **créneau hebdomadaire** | une **occurrence datée** |
| Exemple | « l'aquarelle, le lundi à 10 h » | « l'aquarelle du 7 septembre » |
| Porte | titre, description, lieu, prix, responsable, `placesParDefaut` | `date`, `placesTotal`, `participants` |
| Se réserve | non | **oui** |

Les confondre était un vrai bug : les places et les inscrits étaient comptés
**tous lundis confondus**. Deux personnes pouvaient prendre la dernière place
à deux dates différentes, et « 3 inscrits sur 10 » ne voulait rien dire.

Ce qui en découle :

- Une inscription porte un identifiant de **séance**, pas d'activité.
- Une `Reservation` porte `seanceId` ; sa date vient de la séance.
- `placesParDefaut` sur le créneau n'est qu'un gabarit : chaque séance a son
  `placesTotal`, qu'on pourra faire varier (salle plus petite, sortie limitée).

### Génération des séances

Les séances ne sont pas saisies : `genererSeances()` produit six occurrences
par créneau à partir d'aujourd'hui. C'est ce que ferait une tâche planifiée
côté serveur, ou une vue calculée en base.

Les identifiants sont déterministes — `s-a1-0`, `s-a1-1` — donc lisibles au
débogage et stables d'un rendu à l'autre. Les réservations d'amorce s'y
rattachent **par rang d'occurrence** : des dates en dur deviendraient
orphelines dès que la fenêtre de génération aurait avancé.

Quand le professionnel modifie un créneau, `CatalogueProvider` régénère ses
séances et **reporte les inscrits par rang**. Déplacer l'atelier du lundi au
mardi déplace les inscrits avec lui ; les perdre serait pire. Supprimer un
créneau supprime ses séances, sinon elles resteraient orphelines.

### Dates

`data/dates.ts` regroupe les manipulations, en fonctions pures. Tout circule
en chaînes « AAAA-MM-JJ », jamais en objet `Date` : une séance a lieu un jour
donné, pas à un instant donné, et un `Date` embarque un fuseau qui décale la
veille ou le lendemain selon l'heure d'exécution. Les conversions passent par
`T12:00:00` pour rester à l'abri des changements d'heure.

Côté membre, les onglets d'Activités sont les **sept prochains jours**, plus
les sept jours de la semaine : ce qu'on réserve est daté, la date doit être
dans l'interface.

## Les montants sont des centimes

`prixCentimes` et `montantCentimes` : des **entiers**, jamais des euros en
flottant. Tout passe par `data/monnaie.ts`.

Un `number` JavaScript est un flottant binaire. `0.1 + 0.2` vaut
`0.30000000000000004`, et cent additions de `0.01` ne font pas `1`. Sur un
total de facturation, ça dérive. En centimes, tout est de l'arithmétique
entière — exacte jusqu'à 90 000 milliards d'euros.

Le suffixe `Centimes` sur les champs n'est pas décoratif : c'est ce qui évite
de multiplier un prix par cent une fois de trop.

| Fonction | Rôle |
|---|---|
| `eurosVersCentimes(4.35)` | `435` — avec `Math.round`, car `4.35 * 100` vaut `434.99999999999994` |
| `centimesVersEuros(435)` | `4.35`, pour pré-remplir un champ |
| `formaterCentimes(400)` | `« 4 € »` — `« Gratuit »` à 0, décimales seulement s'il y en a |
| `totalCentimes([...])` | somme entière, donc exacte |

La saisie reste en euros — c'est ce qu'un humain tape — et la conversion se
fait à la frontière, dans `ActivityForm`. Nulle part ailleurs.

Côté base, ce sera `integer` en centimes, ou `numeric` à échelle fixe. Jamais
un `float`.

## Authentification

Supabase (GoTrue) porte l'identité ; l'API et le RLS portent les droits.

### Mise en route

1. Créer un projet sur [supabase.com](https://supabase.com).
2. Copier `.env.example` en `.env` à la racine et renseigner les clés
   (onglets *API* et *Database* du tableau de bord).
3. `pnpm --filter api db:migrate` puis `pnpm --filter api db:seed`.

Le dépôt n'a **qu'un seul `.env`, à la racine**, partagé par l'API et le
front. Vite, lui, cherche par défaut dans le dossier du projet (`apps/web`) :
d'où `envDir` dans `vite.config.ts`. Sans cette ligne, `import.meta.env.VITE_*`
est vide alors que le fichier est correctement rempli — une panne silencieuse
et déroutante.

`SUPABASE_SERVICE_ROLE_KEY` **contourne le RLS** : côté serveur uniquement,
jamais dans un dépôt. Seules `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
ont le droit d'arriver dans le bundle.

#### La chaîne de connexion

Prendre celle du **pooler**, pas la connexion directe :

```
postgresql://postgres.<ref>:<mot-de-passe>@aws-<n>-<region>.pooler.supabase.com:6543/postgres
```

`db.<ref>.supabase.co` — l'accès direct — n'a plus d'enregistrement DNS sans
l'option IPv4, et les adresses IPv6 d'un réseau domestique sont souvent
locales, donc non routables. Le pooler résout en IPv4 et accepte le DDL des
migrations, y compris en mode transaction (port 6543).

Le mot de passe est celui de la **base**, pas une clé d'API. Il se réinitialise
dans *Settings › Database*. Encoder les caractères spéciaux (`@`, `:`, `/`,
`#`, `%`), sinon l'URL est mal découpée et l'échec est silencieux.

### Deux publics, deux parcours

| | Membres | Professionnels |
|---|---|---|
| Connexion | code à 6 chiffres | e-mail + mot de passe |
| Écran | `/connexion` | `/connexion-pro` |
| Pourquoi | le public est âgé : le mot de passe est le premier obstacle à l'usage, pas la première protection | utilisateurs pro manipulant factures et SIRET : le standard s'applique |

#### Le canal des membres

Une variable, trois valeurs, aucun code à modifier :

| `VITE_CANAL_MEMBRE` | Parcours | Ce qu'il exige |
|---|---|---|
| `motdepasse` *(défaut)* | adresse + mot de passe, un écran | rien |
| `email` | code à 6 chiffres par courriel | un SMTP applicatif |
| `sms` | code à 6 chiffres par SMS | un fournisseur SMS |

La **cible est le SMS** : le téléphone est l'appareil familier du public visé,
et un code reçu évite tout mot de passe à retenir.

Le mot de passe est ce qui fonctionne sans dépendre de personne. Le SMTP
intégré de Supabase est bridé à quelques envois par heure et renvoie
`over_email_send_rate_limit` — utilisable pour essayer, pas pour développer.
`signInWithPassword`, lui, ne déclenche **aucun envoi**, donc aucune limite.

Libellés, type de clavier, `autoComplete` et validation s'adaptent seuls
(`auth/canal.ts`). Les comptes de démonstration portent **les deux
identifiants** dès leur création : basculer ne demandera aucune reprise de
données.

Pour recevoir un code à six chiffres plutôt qu'un lien à cliquer, le modèle
*Authentication › Email Templates › Magic Link* doit contenir `{{ .Token }}`.

`shouldCreateUser: false` sur la demande de code : personne ne s'inscrit seul,
les comptes sont créés à l'accueil avec la clé de service.

Les champs de connexion des membres sont volontairement plus grands
qu'ailleurs, et l'`autoComplete="one-time-code"` fait proposer le code du SMS
au-dessus du clavier, sans le retaper.

### Le rôle est dans `app_metadata`

Jamais dans `user_metadata`, que l'utilisateur peut modifier lui-même : il s'y
promouvrait professionnel en une requête. `app_metadata` n'est écrit que par
le serveur, avec la clé de service.

### Trois niveaux de contrôle, et un seul qui compte

```
RouteProtegee (front)  confort : évite d'afficher un écran vide
exigeRole (API)        message clair et bon code HTTP
RLS (Postgres)         la vraie barrière
```

Contourner la garde du front ne donne accès à **aucune donnée** : une requête
mal filtrée ne peut pas fuiter, la base refuse les lignes d'elle-même. C'est
la raison d'être du choix Supabase.

### Ce que le RLS protège

`membre` et `professionnel` ne sont lisibles que par leur propriétaire, et la
politique professionnelle exige en plus le rôle dans le jeton. Comme le RLS
filtre des lignes et non des colonnes, ce qu'un membre doit voir d'un
intervenant — nom, structure, présentation, mais ni SIRET ni téléphone —
passe par la vue `professionnel_public`.

### Ce qu'on a perdu en venant de better-auth

Supabase émet des JWT d'accès valables environ une heure, non révocables un
par un. Couper un accès prend donc jusqu'à une heure — les jetons de
rafraîchissement, eux, sont révocables immédiatement. Avec des sessions en
base, la coupure était instantanée. C'est le compromis assumé en échange du
RLS et de la gestion des SMS et du MFA.

## Le schéma métier

Sept tables, deux vues, cinq fonctions. Trois décisions le structurent.

### Une seule notion : la réservation

Ce que le membre appelle « s'inscrire » et ce que le professionnel appelle
« une réservation » sont **le même objet**. Deux tables auraient demandé de
les synchroniser en permanence, pour rien.

`en-attente` n'est pas une validation à obtenir : c'est la **liste d'attente**
quand la séance est pleine. Faire patienter quelqu'un devant une place libre
n'aurait aucun sens pour ce public.

Une séance gratuite ne produit **aucune** facture — pas une facture à 0 €. Il
n'y a rien à facturer, donc rien à numéroter.

### On ne voit que les gens qu'on croise

Un membre accède au profil d'un autre membre uniquement s'ils **partagent une
séance**. Ce sont des données personnelles de personnes âgées, pas un
annuaire.

Le filtrage passe par la vue `membre_visible`, qui s'appuie sur la fonction
`membres_croises()` en `SECURITY DEFINER`. Une politique RLS posée sur
`membre` et interrogeant `reservation` — elle-même sous RLS — se mordrait la
queue. La vue omet aussi la date d'arrivée : elle ne regarde personne d'autre.

### Numérotation par professionnel

Chacun est son propre émetteur, donc sa propre séquence.

**Une `SEQUENCE` Postgres ne convient pas** : elle n'est pas transactionnelle.
Un rollback consomme le numéro et laisse un trou, ce que l'article 242 nonies
A du CGI interdit. D'où `compteur_facture`, une ligne par professionnel et par
année, incrémentée sous `SELECT … FOR UPDATE` dans `emettre_facture()`.

Une facture émise est une pièce comptable : le déclencheur `facture_immuable`
refuse toute modification du numéro, du montant, de la séquence ou de
l'année. Seul le statut évolue. On annule par un avoir, on n'efface pas — d'où
le `on delete restrict` vers la réservation.

### Ce que la base fait elle-même

| Règle | Où | Pourquoi pas dans le code |
|---|---|---|
| Capacité d'une séance | déclencheur `verifier_capacite` | deux personnes peuvent viser la dernière place au même instant ; un `if` applicatif ne le voit pas. `FOR UPDATE` sur la séance sérialise les candidats |
| Génération des séances | `generer_seances()` | dérivée du créneau, jamais saisie. Appelée à la création et par une tâche planifiée pour faire glisser la fenêtre |
| Numéro de facture | `emettre_facture()` | continuité légale, impossible à garantir depuis plusieurs processus |
| Cloisonnement | RLS sur les 7 tables | une requête mal filtrée ne peut pas fuiter |

Les erreurs métier portent un `SQLSTATE` dédié, pour que l'application
distingue un refus d'une panne : `VD001` séance complète, `VD002` introuvable,
`VD003` accès refusé, `VD004` séance gratuite, `VD005` facture immuable.

`compteur_facture` a le RLS **activé et forcé, sans aucune politique** :
personne n'y accède, même si un `GRANT` était ajouté par mégarde plus tard.
Seule `emettre_facture()` y touche.

## D'où viennent les données

`data/requetes.ts` interroge **Supabase directement depuis le navigateur**,
sans passer par l'API Express. Ce n'est pas un raccourci : le RLS s'applique
de toute façon, et une couche d'API qui relaierait les mêmes requêtes
n'ajouterait qu'un endroit de plus où oublier un filtre. L'API garde `/api/moi`
— la seule chose qu'on ne veut pas laisser le navigateur décider.

Il reste des données en dur, dans `data/reference.ts` : les jours de la
semaine, les catégories, les numéros d'urgence. Une table pour sept jours
serait une jointure gratuite à chaque requête.

### Combien, et qui

Le RLS ne montre à un membre que **ses propres** réservations. Sans
précaution, il ne saurait donc pas s'il reste de la place sur une séance
qu'il n'a pas rejointe. D'où deux vues, parce que les deux informations n'ont
pas la même sensibilité :

| Vue | Contenu | Qui y accède |
|---|---|---|
| `seance_occupation` | places prises / total | tout le monde : un décompte n'est pas une donnée personnelle |
| `seance_participant` | qui est inscrit | seulement si on est soi-même sur la séance, ou si on en est le professionnel |

Conséquence assumée : sur le programme, on voit « 7 places libres » mais pas
les visages. Les avatars apparaissent une fois inscrit. C'est le prolongement
direct de « on ne voit que les gens qu'on croise ».

**PostgREST ne sait pas embarquer une vue** dans une requête : il lui faut une
clé étrangère détectable, et une vue n'en a pas. `seance_occupation` porte
donc l'activité et la date, et se lit seule — on n'interroge plus la table
`seance` côté front.

### Chargement et échecs

Les trois contextes exposent désormais `chargement` et, pour les
inscriptions, `erreur`. Ce n'était pas nécessaire tant que tout tenait en
mémoire.

L'échec qui compte : la dernière place peut partir **entre l'affichage et le
clic**. Le déclencheur de capacité renvoie alors `VD001`, que
`data/requetes.ts` traduit en `SeanceComplete`. Le contexte le rattrape et le
présente comme un refus normal dans une région `role="alert"` — une promesse
rejetée depuis un gestionnaire de clic passerait inaperçue, et l'utilisateur
resterait devant un bouton qui « ne fait rien ».

Après chaque écriture, on **relit** plutôt que de rapiécer l'état local : la
base recalcule les séances, les occupations et les participants, et deviner
ces effets côté client finirait par diverger.

### Supprimer une activité déjà facturée échoue

`facture` référence `reservation` en `on delete restrict`. Supprimer une
activité dont une séance porte une facture émise est donc refusé par la base
— c'est voulu, une pièce comptable ne s'efface pas. Le bouton *Supprimer* de
l'espace professionnel remonte l'erreur telle quelle ; il reste à en faire un
message clair et à proposer l'avoir.

## Les deux espaces

`RootLayout` (membre) et `ProLayout` (professionnel) partagent la même coque —
entête, contenu, barre du bas qui devient rail au-dessus de 62em — définie une
seule fois dans `styles/_coque.scss`. Seul l'entête change de couleur côté pro,
pour qu'on voie d'un coup d'œil qu'on a changé d'espace.

Le passage d'un espace à l'autre est un **simple lien**, dans les deux sens :
il n'y a pas d'authentification dans le projet. C'est le point à remplacer par
un vrai contrôle d'accès le moment venu.

### Catalogue partagé

Les activités ne sont plus un tableau figé : le professionnel les crée, les
modifie et les supprime, et les membres doivent voir le résultat. D'où un
troisième contexte, monté au-dessus des **deux** espaces dans
`AriaRouterLayout` :

```
state/AppProviders.tsx    compose les trois, dans cet ordre
  CatalogueProvider       les activités (création / modification / suppression)
    InscriptionsProvider  les inscriptions du membre — dérivées du catalogue
      ProProvider         fiche pro, réservations, facturation
```

L'ordre n'est pas arbitraire : `InscriptionsProvider` lit le catalogue. Il en
dérive `mesActivites` plutôt que d'en garder une copie — une activité
supprimée par le professionnel disparaît donc d'elle-même des inscriptions,
sans code de nettoyage.

`ACTIVITES` dans `mock.ts` n'est plus que l'amorce du catalogue. Les sélecteurs
(`activitesDuJour`, `mesActivites`, `activiteParId`) reçoivent désormais la
liste en argument : ce sont des fonctions pures, elles ne supposent aucune
source. Les composants passent par `useCatalogue()`, jamais par le tableau.

### Facturation

Une réservation porte une facture, qui suit trois états :
`à émettre → émise → réglée`, avec retour arrière possible.

La transition vit dans `state/facturation.ts`, en fonction **pure** hors du
composant — c'est la seule vraie règle métier de l'espace pro, et les dates
qu'elle pose (émission, règlement) ne doivent pas dépendre du rendu. La date
du jour lui est passée en argument, pour la même raison.

### Formulaires

`ActivityForm` et `ProProfilePage` utilisent `Form` de React Aria en
`validationBehavior="native"` : le navigateur bloque l'envoi et place le focus
sur le premier champ fautif, et `<FieldError>` remplace le message par le
nôtre, en français, relié par `aria-describedby`.

Deux choix qui reviennent :

- `type="time"` et `type="email"` sur les `Input` — le navigateur valide le
  format lui-même et sert le bon clavier sur téléphone.
- Le formulaire ne saisit **que ce qui se saisit**. Le propriétaire, le nom de
  la structure et la liste des participants sont composés par la page : le pro
  n'a pas à ressaisir sa propre identité, et modifier une activité ne doit pas
  faire perdre leur place aux inscrits.

La suppression passe par `ConfirmDialog`, qui s'appuie sur `Modal` +
`Dialog role="alertdialog"` : piégeage du focus, retour du focus au
déclencheur, Échap, inertie du reste de la page. Le focus initial est sur
**Annuler**, jamais sur l'action destructrice.

## Adaptation aux écrans

Mobile d'abord, avec trois seuils. Ils sont déclarés une fois dans la map
`$ruptures` de `_tokens.scss`, et utilisés partout via les mixins.

| Seuil | Cible | Navigation | Grilles |
|---|---|---|---|
| — | téléphone | barre fixe en bas | 1 colonne |
| `sm` 48em | tablette | barre fixe en bas | 2 colonnes |
| `md` 62em | ordinateur | rail latéral à gauche | 2 colonnes |
| `lg` 75em | grand écran | rail latéral, plus large | 3 colonnes |

La largeur de contenu, l'échelle typographique et la largeur du rail sont des
propriétés CSS redéfinies par seuil, en bas de `_tokens.scss`. Il n'y a donc
qu'un endroit à toucher pour élargir ou resserrer l'ensemble.

### Un seul DOM, deux dispositions

`RootLayout` ne fait **aucun rendu conditionnel** : la barre du bas et le rail
latéral sont le même `<nav>`, replacé par la grille CSS. Deux arbres React
finiraient par diverger, et basculer de l'un à l'autre au redimensionnement
démonterait les composants (état perdu, focus perdu).

Corollaire : quand un élément ne sert qu'à une disposition — la marque, le
libellé abrégé des jours — il est masqué en `display: none`, jamais seulement
à l'œil. Un masquage visuel le laisserait dans l'arbre d'accessibilité et le
ferait lire **deux fois**.

`<main>` est placé avant `<nav>` dans le DOM. Sur téléphone c'est aussi
l'ordre visuel. Sur grand écran le rail passe à gauche par la grille sans
bouger dans le DOM : on atteint donc le contenu avant la navigation, ce qui
reste opérable et correspond à ce que vise le lien d'évitement.

### Grilles de listes

`.grille` donne les colonnes. Le modificateur dépend de ce que contient
le `<li>` :

| Classe | Quand | Effet |
|---|---|---|
| `.grille .grille--cartes` | le `<li>` **enveloppe** une carte | hauteurs égales sur la ligne |
| `.grille .grille--large` | le `<li>` **est** la ligne | 2 colonnes max |

Ne pas mettre `--cartes` quand le `<li>` est lui-même la carte : ses enfants
directs se feraient étirer, et un avatar deviendrait un rectangle.

### Compatibilité des media queries

Les mixins écrivent du `min-width` / `max-width`, pas la syntaxe d'intervalle
`width >= 48em`. Celle-ci n'existe qu'à partir de Safari 16.4 et Chrome 104,
et un navigateur qui ne la reconnaît pas **ignore la règle entière** : plus
aucun style responsive, l'application retombe en colonne unique étirée. Sur un
public équipé d'appareils anciens, ça n'est pas acceptable.

Ça ne suffit pas seul : la cible CSS par défaut de Vite *réécrit* ces
`min-width` en syntaxe d'intervalle. D'où le `build.cssTarget` dans
`vite.config.ts`, qui protège aussi le repli `100vh` avant `100dvh` et empêche
le regroupement de `:focus-visible` avec `[data-focus-visible]` — un regroupement
qui ferait disparaître l'anneau de focus partout si `:focus-visible` n'est pas
reconnu. Le fichier explique le détail.

## Textes et données

Deux fichiers pour retrouver vite ce qu'on cherche.

### `src/labels.ts`

Tous les textes de l'interface, groupés par écran. Ce n'est **pas** de l'i18n :
une seule langue, aucune bibliothèque. Le but est de corriger une formulation
sans ouvrir chaque composant.

Les entrées qui prennent un argument sont des fonctions, pour que la phrase
entière reste dans le fichier plutôt que d'être recollée dans le JSX :

```ts
LABELS.accueil.salutation('Colette')   // « Bonjour Colette »
LABELS.commun.duree(90)                // « 1 h 30 »
LABELS.commun.places(3, 10)            // « 3 inscrits sur 10 »
```

### `src/data/`

```
data/types.ts   modèle de domaine : Membre, Activite, Contact, JourId…
data/mock.ts    données factices + accesseurs
```

`types.ts` est la frontière avec la future API. Les composants n'importent
jamais les tableaux bruts de `mock.ts` : ils passent par les accesseurs du bas
du fichier (`activitesDuJour`, `prochaineActivite`, `membresParIds`,
`jourAujourdhui`). Le jour où l'API existe, ces fonctions deviennent des
`fetch` — et rien d'autre ne bouge.

## Composants

```
components/Avatar/         initiales sur pastille colorée
components/AvatarGroup/    avatars chevauchés + « +N »
components/ActivityCard/   une activité en liste : horaire, lieu, participants, inscription
components/NavItem/        une entrée de la barre de navigation du bas
```

Un point d'accessibilité qui revient partout : **la couleur ne porte jamais
l'information seule**. Une activité où l'on est inscrit a un liseré vert *et*
un bouton qui dit « Se désinscrire ». L'entrée de nav active a une couleur
*une* pastille *et* une graisse. Un contact d'urgence a un liseré rouge *et*
se trouve sous le titre « Urgences ».

Côté avatars : les pastilles sont décoratives (`aria-hidden`) parce que le nom
est déjà écrit à côté. Le groupe, lui, porte un seul `aria-label` qui liste
tout le monde — sinon le lecteur d'écran énoncerait une suite d'initiales
illisible.

## Routage

[React Router 8](https://reactrouter.com) en mode *data router*. Depuis la v8 tout
est dans le package `react-router` (`react-router-dom` n'est plus publié).

```
src/
  main.tsx                    bootstrap : createRoot + import du SCSS
  App.tsx                     composition : RouterProvider
  routes.tsx                  table de routes (testable, sans effet de bord)
  router.tsx                  createBrowserRouter(routes)
  labels.ts                   tous les textes de l'interface
  preferences.ts              préférences d'affichage, gardées sur l'appareil
  hooks/useTitrePage.ts       titre de l'onglet, une ligne par page
  state/                      état partagé : catalogue, inscriptions, espace pro
  data/                       types, dates, monnaie, référence, requêtes Supabase
  styles/                     jetons, mixins, reset, primitives
  components/<Nom>/<Nom>.tsx  un composant par dossier, avec son .scss
  layouts/AriaRouterLayout/   pont React Aria <-> React Router
  layouts/RootLayout/         coque : entête + <Outlet /> + barre du bas
  pages/<Nom>/<Nom>.tsx       une page par dossier
```

| Route | Page | Dans la barre du bas |
|---|---|---|
| `/` | `HomePage` | 🏠 Accueil |
| `/activites` | `ActivitiesPage` | 🎨 Activités |
| `/activites/:id` | `ActivityDetailPage` | — (depuis une carte) |
| `/contacts` | `ContactsPage` | 👥 Contacts |
| `/aide` | `HelpPage` | ☎ Aide |
| `/profil` | `ProfilePage` | 👤 Profil |
| `/a-propos` | `AboutPage` (+ état de l'API) | — lien depuis Aide |
| `*` | `NotFoundPage` (rendu dans le layout, nav conservée) | — |
| — | `ErrorPage` via `errorElement` (erreurs levées) | — |

### Espace professionnel

| Route | Page | Dans la nav pro |
|---|---|---|
| `/pro`, `/pro/activites` | `ProActivitiesPage` | 🎨 Mes activités |
| `/pro/activites/nouvelle` | `ProActivityFormPage` | — |
| `/pro/activites/:id/modifier` | `ProActivityFormPage` | — |
| `/pro/reservations` | `ProReservationsPage` | 🗓 Réservations |
| `/pro/reservations/:id` | `ProReservationDetailPage` | — |
| `/pro/profil` | `ProProfilePage` | 🏷 Ma fiche |

`/pro` est déclaré **avant** `/` dans `routes.tsx`. Sans ça, le `*` de
l'espace membre attraperait `/pro` et afficherait un 404.

Les routes sont imbriquées sous `AriaRouterLayout`, placé **au-dessus** de
`RootLayout` *et* de son `errorElement`, pour que les liens React Aria
fonctionnent aussi sur la page d'erreur.

La table de routes est volontairement séparée de l'instance du router :
`createBrowserRouter` touche `document` à l'import, donc importer `router.tsx`
hors navigateur casse. `routes.tsx` s'importe partout, ce qui permet de tester
une route avec `createMemoryRouter(routes, { initialEntries: ['/a-propos'] })`.

Pour ajouter une page : créer `pages/MaPage/MaPage.tsx`, l'enregistrer dans
`routes.tsx`, mettre son titre dans `labels.ts`, et l'ajouter à `NAV_ITEMS`
dans `RootLayout.tsx` si elle doit apparaître dans la barre du bas.

### Titre de l'onglet

Chaque page pose le sien, en une ligne, avec le libellé qu'elle affiche déjà —
rien à dupliquer :

```tsx
useTitrePage(LABELS.activites.titre)   // « Activités · La vadrouille »
useTitrePage()                         // « La vadrouille » — accueil
useTitrePage(title)                    // ErrorPage : suit l'erreur
```

Le nom de la page vient **avant** celui de l'application : un onglet réduit ne
montre que ses premiers caractères, et c'est la page qui distingue un onglet
d'un autre. Le format est centralisé dans `LABELS.app.titreOnglet`.

Le hook écrit dans `document.title` plutôt que d'utiliser la balise `<title>`
déclarative de React 19. `index.html` en contient déjà une, le navigateur
retient la première du document, et les deux coexisteraient — c'est la
statique qui gagnerait. Telle quelle, la balise d'`index.html` sert de titre
d'attente avant le montage, puis le hook prend le relais.

### Navigation du bas : `<nav>`, pas `tablist`

La barre du bas est une `<nav>` avec des liens, **pas** un `role="tablist"`.
Chaque entrée est une route avec sa propre URL : un tablist ferait annoncer
« onglet 2 sur 4 » là où l'utilisateur change de page, et casserait le retour
arrière et le partage de lien.

Le vrai `tablist` du projet est ailleurs — les jours de la semaine dans
`ActivitiesPage`, qui changent un panneau *dans* la page sans changer d'URL.
C'est exactement le cas d'usage de `Tabs` de React Aria, qui fournit alors
gratuitement les flèches gauche/droite, `Home` / `End` et le roving tabindex.
