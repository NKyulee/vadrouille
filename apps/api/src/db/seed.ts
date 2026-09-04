import { supabaseAdmin } from '../supabase/index.ts'

/* Comptes de démonstration.

   Les utilisateurs sont créés via l'API d'administration de Supabase, pas par
   un INSERT dans `auth.users` : c'est elle qui hache le mot de passe et pose
   les enregistrements associés. Une insertion directe produirait des comptes
   impossibles à connecter.

   Le rôle est écrit dans `app_metadata`, jamais dans `user_metadata` : le
   second est modifiable par l'utilisateur lui-même.

   Idempotent : relancer le script ne duplique rien. */

const MEMBRE = {
  prenom: 'Colette',
  nom: 'Marchand',
  initiales: 'CM',
  /* Les deux identifiants sont posés dès la création : l'e-mail sert
     aujourd'hui, le téléphone servira dès qu'un fournisseur SMS sera
     branché. Basculer ne demandera alors aucune reprise de données. */
  email: process.env.SEED_MEMBRE_EMAIL ?? 'colette.marchand@exemple.fr',
  telephone: '+33612345678',
  membreDepuis: 'mars 2024',
}

/* Le mot de passe du compte de démonstration n'est pas écrit ici : ce fichier
   part dans le dépôt, et le compte, lui, existera vraiment sur le projet
   Supabase. Il vient de SEED_PRO_PASSWORD, ou il est tiré au hasard et
   affiché une fois à la création. */
const MOT_DE_PASSE_PRO =
  process.env.SEED_PRO_PASSWORD ?? `demo-${crypto.randomUUID().slice(0, 12)}`

/* Le membre aussi a un mot de passe. Ce n'est pas la cible — le public visé
   se connectera par SMS — mais c'est le seul canal qui ne dépende d'aucun
   service tiers, donc le seul utilisable tant que ni SMTP ni SMS ne sont
   branchés. Voir apps/web/src/auth/canal.ts. */
const MOT_DE_PASSE_MEMBRE =
  process.env.SEED_MEMBRE_PASSWORD ?? `demo-${crypto.randomUUID().slice(0, 12)}`

const PRO = {
  prenom: 'Nadia',
  nom: 'Brahimi',
  initiales: 'NB',
  email: 'nadia.brahimi@atelier-cascades.fr',
  motDePasse: MOT_DE_PASSE_PRO,
  structure: 'Atelier des Cascades',
  telephone: '01 43 58 22 07',
  siret: '812 445 903 00027',
  presentation:
    "Ateliers créatifs et pratiques pour les habitants du quartier, depuis 2016. Aucun niveau requis, le matériel est toujours fourni.",
}

async function trouverParEmail(email: string) {
  const { data } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  return data?.users.find((u) => u.email === email)
}

async function trouverMembre() {
  const { data } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  return data?.users.find(
    (u) => u.email === MEMBRE.email || u.phone === MEMBRE.telephone.replace('+', ''),
  )
}

async function peupler() {
  // --- Professionnel : e-mail + mot de passe ---
  let pro = await trouverParEmail(PRO.email)
  const creeMaintenant = !pro
  if (!pro) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: PRO.email,
      password: PRO.motDePasse,
      email_confirm: true,
      app_metadata: { role: 'professionnel' },
      user_metadata: { name: `${PRO.prenom} ${PRO.nom}` },
    })
    if (error) throw error
    pro = data.user
  }

  await supabaseAdmin.from('professionnel').upsert({
    user_id: pro.id,
    prenom: PRO.prenom,
    nom: PRO.nom,
    initiales: PRO.initiales,
    couleur_avatar: 'prune',
    structure: PRO.structure,
    telephone: PRO.telephone,
    siret: PRO.siret,
    presentation: PRO.presentation,
  })

  /* --- Membre : pas de mot de passe ---
     Le compte est créé avec son numéro déjà confirmé. C'est ce que ferait
     l'inscription assistée à l'accueil : quelqu'un enregistre la personne,
     qui n'aura ensuite qu'à recevoir son code. */
  let membre = await trouverMembre()
  const membreCreeMaintenant = !membre

  /* Compte déjà là, mais peut-être sans mot de passe : les premiers comptes
     de démonstration ont été créés à l'époque du code par courriel. On le
     (re)pose, faute de pouvoir savoir s'il en a un — l'API d'administration
     ne l'expose pas, et c'est heureux. */
  if (membre) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(membre.id, {
      password: MOT_DE_PASSE_MEMBRE,
    })
    if (error) throw error
    console.log(`  mot de passe membre réinitialisé : ${MOT_DE_PASSE_MEMBRE}`)
  }

  if (!membre) {
    const commun = {
      email: MEMBRE.email,
      password: MOT_DE_PASSE_MEMBRE,
      // `email_confirm` : le compte est créé à l'accueil, en présence de la
      // personne. Aucun courriel de confirmation n'est donc envoyé — et
      // aucun quota d'envoi consommé.
      email_confirm: true,
      app_metadata: { role: 'membre' },
      user_metadata: { name: `${MEMBRE.prenom} ${MEMBRE.nom}` },
    }

    /* Le téléphone n'est accepté que si le fournisseur SMS est activé côté
       Supabase. S'il ne l'est pas, on crée le compte sans, plutôt que
       d'échouer : l'e-mail suffit pour se connecter aujourd'hui. */
    let creation = await supabaseAdmin.auth.admin.createUser({
      ...commun,
      phone: MEMBRE.telephone,
      phone_confirm: true,
    })
    if (creation.error) {
      console.warn(`  (téléphone ignoré : ${creation.error.message})`)
      creation = await supabaseAdmin.auth.admin.createUser(commun)
    }
    if (creation.error) throw creation.error
    membre = creation.data.user
  }

  await supabaseAdmin.from('membre').upsert({
    user_id: membre.id,
    prenom: MEMBRE.prenom,
    nom: MEMBRE.nom,
    initiales: MEMBRE.initiales,
    couleur_avatar: 'foret',
    membre_depuis: MEMBRE.membreDepuis,
  })

  await peuplerDomaine(pro.id, membre.id)

  console.log('Comptes de démonstration prêts :')
  console.log(`  membre        ${membre.email ?? MEMBRE.email}`)
  if (membreCreeMaintenant) {
    console.log(`  mot de passe  ${MOT_DE_PASSE_MEMBRE}`)
  }
  if (membre.phone) console.log(`                +${membre.phone}  (code SMS, si activé)`)
  console.log(`  professionnel ${PRO.email}`)
  if (creeMaintenant) {
    console.log(`  mot de passe  ${PRO.motDePasse}`)
    console.log('  (noté nulle part ailleurs — le relancer ne le réaffichera pas)')
  }
}


/* --- Domaine ----------------------------------------------------------------
   Un programme d'exemple pour que les écrans montrent quelque chose. Les
   séances ne sont pas insérées à la main : c'est `generer_seances()` en base
   qui les produit, comme en production. */

const ACTIVITES = [
  { titre: 'Atelier aquarelle', jour: 'lundi', heure: '10:00', duree: 90, lieu: 'Salle Jaurès',
    categorie: 'atelier', prix: 400, places: 10,
    description: 'Paysages au lavis. Le matériel est fourni, aucun niveau requis.' },
  { titre: 'Café des voisins', jour: 'lundi', heure: '15:30', duree: 60, lieu: 'La vadrouille — accueil',
    categorie: 'partage', prix: 0, places: 12,
    description: 'On se retrouve pour parler de tout et de rien, sans programme.' },
  { titre: 'Gymnastique douce', jour: 'mardi', heure: '09:30', duree: 45, lieu: 'Gymnase Colette',
    categorie: 'sport', prix: 300, places: 15,
    description: 'Assis ou debout, chacun à son rythme. Prévoir une bouteille d’eau.' },
  { titre: 'Tarot', jour: 'mardi', heure: '14:00', duree: 120, lieu: 'Salle Jaurès',
    categorie: 'jeu', prix: 0, places: 12,
    description: 'Trois tables, débutants bienvenus — on réexplique les annonces.' },
  { titre: 'Marché de Belleville', jour: 'mercredi', heure: '10:00', duree: 120, lieu: 'Rendez-vous à l’accueil',
    categorie: 'sortie', prix: 0, places: 8,
    description: 'Départ groupé, retour vers midi. Trajet à plat.' },
  { titre: 'Chorale', jour: 'mercredi', heure: '16:00', duree: 90, lieu: 'Salle Jaurès',
    categorie: 'atelier', prix: 200, places: 20,
    description: 'Chansons françaises. On reprend « Les Copains d’abord ».' },
  { titre: 'Initiation au smartphone', jour: 'jeudi', heure: '10:30', duree: 60, lieu: 'Salle informatique',
    categorie: 'atelier', prix: 0, places: 6,
    description: 'Appels vidéo et photos. Venir avec son téléphone si possible.' },
  { titre: 'Scrabble', jour: 'jeudi', heure: '14:30', duree: 90, lieu: 'La vadrouille — accueil',
    categorie: 'jeu', prix: 0, places: 10,
    description: 'Parties en duo. Un dictionnaire est à disposition.' },
  { titre: 'Cuisine partagée', jour: 'vendredi', heure: '11:00', duree: 150, lieu: 'Cuisine de La vadrouille',
    categorie: 'partage', prix: 600, places: 8,
    description: 'On prépare le repas ensemble, et on le mange ensemble.' },
  { titre: 'Cinéma du vendredi', jour: 'vendredi', heure: '17:00', duree: 120, lieu: 'Salle Jaurès',
    categorie: 'sortie', prix: 300, places: 25,
    description: 'Projection sous-titrée, suivie d’une discussion libre.' },
  { titre: 'Jardin partagé', jour: 'samedi', heure: '10:00', duree: 120, lieu: 'Jardin, rue des Cascades',
    categorie: 'sortie', prix: 0, places: 10,
    description: 'Plantation des semis de printemps. Gants fournis.' },
  { titre: 'Thé musical', jour: 'dimanche', heure: '15:00', duree: 90, lieu: 'La vadrouille — accueil',
    categorie: 'partage', prix: 200, places: 15,
    description: 'Écoute commentée. Ce mois-ci : les valses de Chopin.' },
] as const

async function peuplerDomaine(proId: string, membreId: string) {
  const { count } = await supabaseAdmin
    .from('activite')
    .select('*', { count: 'exact', head: true })
    .eq('professionnel_id', proId)

  if (count && count > 0) {
    console.log(`  (${count} activité(s) déjà en base — domaine inchangé)`)
    return
  }

  for (const a of ACTIVITES) {
    const { data, error } = await supabaseAdmin
      .from('activite')
      .insert({
        professionnel_id: proId,
        titre: a.titre,
        description: a.description,
        jour: a.jour,
        heure: a.heure,
        duree_minutes: a.duree,
        lieu: a.lieu,
        categorie: a.categorie,
        prix_centimes: a.prix,
        places_par_defaut: a.places,
        responsable_id: membreId,
      })
      .select('id')
      .single()
    if (error) throw error

    /* Les séances passent par la fonction de la base — même chemin qu'en
       production. `generer_seances` vérifie que l'appelant est le
       propriétaire, d'où le passage par le SQL d'administration. */
    const { error: eSeances } = await supabaseAdmin.rpc('generer_seances_admin', {
      p_activite_id: data.id,
      p_semaines: 6,
    })
    if (eSeances) throw eSeances
  }

  // Quelques inscriptions, pour que les écrans ne soient pas vides.
  const { data: seances } = await supabaseAdmin
    .from('seance')
    .select('id, activite_id, date')
    .order('date')
    .limit(60)

  const parActivite = new Map<string, { id: string }[]>()
  for (const s of seances ?? []) {
    const liste = parActivite.get(s.activite_id) ?? []
    liste.push(s)
    parActivite.set(s.activite_id, liste)
  }

  // Le membre de démonstration s'inscrit à la première séance d'un créneau
  // sur trois : de quoi remplir « Vos inscriptions » sans tout saturer.
  let i = 0
  for (const [, liste] of parActivite) {
    if (i++ % 3 === 0 && liste[0]) {
      await supabaseAdmin.from('reservation').insert({ seance_id: liste[0].id, membre_id: membreId })
    }
  }

  console.log(`  ${ACTIVITES.length} activités et leurs séances créées`)
}

/* Appel en fin de fichier : les constantes ci-dessus doivent être évaluées
   avant, sinon `ACTIVITES` est encore dans sa zone morte temporelle. */
await peupler()
process.exit(0)
