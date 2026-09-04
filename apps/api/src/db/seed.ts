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
  if (!membre) {
    const commun = {
      email: MEMBRE.email,
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

  console.log('Comptes de démonstration prêts :')
  console.log(`  membre        ${membre.email ?? MEMBRE.email}  (code par courriel)`)
  if (membre.phone) console.log(`                +${membre.phone}  (code SMS, si activé)`)
  console.log(`  professionnel ${PRO.email}`)
  if (creeMaintenant) {
    console.log(`  mot de passe  ${PRO.motDePasse}`)
    console.log('  (noté nulle part ailleurs — le relancer ne le réaffichera pas)')
  }
}

await peupler()
process.exit(0)
