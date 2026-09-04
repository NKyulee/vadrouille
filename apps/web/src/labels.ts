/* Tous les textes de l'interface, à un seul endroit.

   Pourquoi un fichier plutôt que des chaînes dans le JSX : pour retrouver et
   corriger une formulation sans ouvrir chaque composant. Ce n'est pas de
   l'i18n — il n'y a qu'une langue, et aucune bibliothèque derrière.

   Les entrées qui prennent un argument sont des fonctions : c'est ce qui
   garde la phrase entière ici, plutôt qu'un morceau de phrase recollé dans
   le rendu. */

/* Sorti de l'objet : `titreOnglet` en a besoin, et une propriété ne peut pas
   se référencer elle-même dans un littéral. */
const NOM_APP = 'La vadrouille'

export const LABELS = {
  app: {
    nom: NOM_APP,
    baseline: 'Votre programme de la semaine',
    /* Titre de l'onglet du navigateur. Le nom de la page vient en premier :
       un onglet réduit ne montre que ses premiers caractères, et c'est la
       page qui distingue un onglet d'un autre, pas le nom de l'application.
       Sans argument : le nom seul, pour l'accueil. */
    titreOnglet: (page?: string) => (page ? `${page} · ${NOM_APP}` : NOM_APP),
  },

  nav: {
    aria: 'Navigation principale',
    accueil: 'Accueil',
    activites: 'Activités',
    contacts: 'Contacts',
    aide: 'Aide',
    profil: 'Profil',
    evitement: 'Aller au contenu',
    chargement: 'Chargement de la page…',
  },

  accueil: {
    salutation: (prenom: string) => `Bonjour ${prenom}`,
    prochaine: 'Votre prochaine sortie',
    aucuneProchaine: 'Aucune activité prévue pour le moment.',
    parcourir: 'Voir le programme',
    mesActivites: 'Vos inscriptions',
    aujourdhui: "Aujourd'hui à La vadrouille",
    aucuneAujourdhui: "Rien de prévu aujourd'hui.",
  },

  activites: {
    titre: 'Activités',
    joursAria: 'Jour de la semaine',
    aucune: (jour: string) => `Aucune activité le ${jour.toLowerCase()}.`,
    inscrit: 'Inscrit',
    sInscrire: "S'inscrire",
    seDesinscrire: 'Se désinscrire',
    complet: 'Complet',
    voirDetail: (titre: string) => `Voir le détail de ${titre}`,
  },

  detail: {
    retour: 'Retour au programme',
    introuvableTitre: 'Activité introuvable',
    introuvableTexte: "Cette activité n'existe pas ou n'est plus au programme.",
    quand: 'Quand',
    ou: 'Où',
    prix: 'Prix',
    proposePar: 'Proposé par',
    responsable: 'Responsable',
    responsableRole: "Anime la séance, et reste joignable le jour même.",
    participants: 'Participants',
    aucunParticipant: 'Personne inscrit pour le moment. Soyez la première !',
    creneau: 'Créneau',
    /** « Tous les lundis, 10 h 00 · 1 h 30 » */
    tousLes: (jour: string, heure: string, duree: string) =>
      `Tous les ${jour.toLowerCase()}s, ${heure} · ${duree}`,
    prochainesSeances: 'Prochaines séances',
    aucuneSeance: 'Aucune séance programmée pour le moment.',
    inscriptionComplete: "Il n'y a plus de place pour cette séance.",
  },

  profil: {
    titre: 'Profil',
    membreDepuis: (mois: string) => `Membre depuis ${mois}`,
    /** « 3 activités cette semaine », « aucune activité cette semaine ». */
    resume: (nombre: number) =>
      nombre === 0
        ? 'Aucune activité cette semaine'
        : `${nombre} activité${nombre > 1 ? 's' : ''} cette semaine`,
    mesInscriptions: 'Vos inscriptions',
    aucuneInscription: "Vous n'êtes inscrite à aucune activité pour le moment.",
    voirProgramme: 'Voir le programme',
    compte: 'Votre compte',
    mesInformations: 'Vos informations',
    identite: 'Qui vous êtes',
    sansNom: 'Nom non renseigné',
    ouVousHabitez: 'Où vous habitez',
    adresseEnregistreeAvec: 'Choisissez une proposition, puis enregistrez plus haut.',
    prenom: 'Prénom',
    nom: 'Nom',
    requis: 'Ce champ est obligatoire.',
    telephone: 'Numéro de téléphone',
    telephoneAide: "C'est par là qu'on vous joint en cas de changement.",
    emailTitre: 'Changer d’adresse électronique',
    email: 'Adresse électronique',
    emailAide:
      'Elle vous sert à vous connecter. Un courriel de confirmation est envoyé à la nouvelle adresse : le changement ne prend effet qu’une fois le lien suivi.',
    emailInvalide: 'Indiquer une adresse du type nom@domaine.fr.',
    changerEmail: 'Changer mon adresse',
    emailConfirmationEnvoyee:
      'Un courriel de confirmation a été envoyé. Suivez le lien pour valider la nouvelle adresse.',
    echecEmail:
      "L'adresse n'a pas pu être changée. Le service d'envoi de courriels n'est pas encore configuré.",
    adresse: 'Votre adresse',
    adresseAide:
      'Facultative. Elle sert uniquement à classer les lieux du plus proche au plus loin.',
    chercherAdresse: 'Chercher cette adresse',
    couleur: 'Couleur de votre pastille',
    couleurs: {
      foret: 'Vert',
      or: 'Doré',
      brique: 'Brique',
      ardoise: 'Ardoise',
      prune: 'Prune',
    },
    enregistrer: 'Enregistrer',
    enregistre: 'Vos informations ont été enregistrées.',
    echecEnregistrement: "Vos informations n'ont pas pu être enregistrées.",
    motDePasse: 'Changer de mot de passe',
    nouveauMotDePasse: 'Nouveau mot de passe',
    motDePasseAide: 'Au moins 8 caractères.',
    motDePasseCourt: 'Le mot de passe doit faire au moins 8 caractères.',
    changerMotDePasse: 'Changer le mot de passe',
    motDePasseChange: 'Votre mot de passe a été changé.',
    echecMotDePasse: "Le mot de passe n'a pas pu être changé.",
    preferences: 'Préférences',
    tailleTexte: 'Taille du texte',
    tailleTexteAide: "S'applique à toute l'application, et reste en mémoire sur cet appareil.",
    tailles: {
      normal: 'Normale',
      grand: 'Grande',
      'tres-grand': 'Très grande',
    },
    rappels: 'Rappels avant une activité',
    rappelsAide: 'Une notification une heure avant le début.',
  },

  inscription: {
    titre: 'Créer un compte',
    intro: 'Quelques informations, et vous pourrez réserver vos activités.',
    email: 'Adresse électronique',
    emailAide: 'Elle vous servira à vous connecter.',
    emailInvalide: 'Indiquer une adresse du type nom@domaine.fr.',
    telephone: 'Numéro de téléphone',
    telephoneAide: "Obligatoire : c'est par là qu'on vous joint en cas de changement.",
    telephoneInvalide: 'Indiquer un numéro à 10 chiffres, par exemple 06 12 34 56 78.',
    motDePasse: 'Mot de passe',
    motDePasseAide: 'Au moins 8 caractères.',
    motDePasseCourt: 'Le mot de passe doit faire au moins 8 caractères.',
    valider: 'Créer mon compte',
    dejaInscrit: 'J’ai déjà un compte',
    echec: "Le compte n'a pas pu être créé. Réessayez dans un instant.",
    creeMaisPasConnecte: 'Compte créé. Connectez-vous avec votre adresse et votre mot de passe.',
    depuisConnexion: 'Pas encore de compte ? En créer un',
  },

  auth: {
    verification: 'Vérification de votre session…',
    profilManquantTitre: 'Votre compte n’est pas encore rattaché',
    profilManquantTexte:
      'La connexion a fonctionné, mais aucun profil n’est associé à ce compte. Passez à l’accueil : on le rattache en une minute.',
    titreMembre: 'Se connecter',
    titrePro: 'Espace professionnel',

    /* Deux jeux de textes, un par canal : libellé, aide et message d'erreur
       doivent parler de ce que la personne a réellement sous les yeux.
       Voir auth/canal.ts. */
    membre: {
      sms: {
        intro: 'Entrez votre numéro de téléphone. Vous recevrez un code par SMS.',
        identifiant: 'Numéro de téléphone',
        identifiantAide: 'Le numéro que vous avez donné à l’accueil.',
        identifiantInvalide: 'Indiquer un numéro à 10 chiffres, par exemple 06 12 34 56 78.',
        codeEnvoye: (ou: string) => `Un code à 6 chiffres a été envoyé au ${ou}.`,
        code: 'Code reçu par SMS',
        changer: 'Modifier le numéro',
        echecEnvoi: "Le code n'a pas pu être envoyé. Vérifiez le numéro.",
      },
      motdepasse: {
        intro: 'Entrez votre adresse et votre mot de passe.',
        identifiant: 'Adresse électronique',
        identifiantAide: 'L’adresse que vous avez donnée à l’accueil.',
        identifiantInvalide: 'Indiquer une adresse du type nom@domaine.fr.',
        codeEnvoye: () => '',
        code: '',
        changer: '',
        echecEnvoi: '',
      },
      email: {
        intro: 'Entrez votre adresse électronique. Vous recevrez un code par courriel.',
        identifiant: 'Adresse électronique',
        identifiantAide: 'L’adresse que vous avez donnée à l’accueil.',
        identifiantInvalide: 'Indiquer une adresse du type nom@domaine.fr.',
        codeEnvoye: (ou: string) => `Un code à 6 chiffres a été envoyé à ${ou}.`,
        code: 'Code reçu par courriel',
        changer: 'Modifier l’adresse',
        echecEnvoi: "Le code n'a pas pu être envoyé. Vérifiez l'adresse.",
      },
      demanderCode: 'Recevoir mon code',
      codeAide: 'Six chiffres. Le code est valable quelques minutes.',
      codeInvalide: 'Indiquer les 6 chiffres reçus.',
      valider: 'Me connecter',
      renvoyer: 'Renvoyer un code',
      echecCode: 'Ce code ne correspond pas, ou il a expiré.',
      inconnu: "Ce compte n'existe pas. Passez à l'accueil, on vous inscrit.",
      motDePasse: 'Mot de passe',
      motDePasseRequis: 'Le mot de passe est obligatoire.',
      seConnecter: 'Me connecter',
      echecMotDePasse: 'Adresse ou mot de passe incorrect.',

    },

    pro: {
      intro: 'Connectez-vous pour gérer vos activités et vos réservations.',
      email: 'Adresse électronique',
      emailInvalide: 'Indiquer une adresse du type nom@domaine.fr.',
      motDePasse: 'Mot de passe',
      motDePasseRequis: 'Le mot de passe est obligatoire.',
      valider: 'Se connecter',
      echec: 'Adresse ou mot de passe incorrect.',
    },

    versPro: 'Vous êtes intervenant ? Connexion professionnelle',
    versMembre: 'Vous êtes adhérent ? Connexion par SMS',
    deconnexion: 'Se déconnecter',
  },

  pro: {
    espace: 'Espace pro',
    nav: {
      aria: 'Navigation professionnelle',
      activites: 'Mes activités',
      reservations: 'Réservations',
      profil: 'Ma fiche',
    },

    activites: {
      titre: 'Mes activités',
      intro: 'Les activités que vous proposez à La vadrouille.',
      aucune: "Vous ne proposez encore aucune activité.",
      nouvelle: 'Nouvelle activité',
      modifier: (titre: string) => `Modifier ${titre}`,
      supprimer: (titre: string) => `Supprimer ${titre}`,
      /** « 3 réservations » sur la vignette d'une activité. */
      reservations: (n: number) => `${n} réservation${n > 1 ? 's' : ''}`,
    },

    formulaire: {
      titreCreation: 'Nouvelle activité',
      titreEdition: "Modifier l'activité",
      nom: "Nom de l'activité",
      description: 'Description',
      descriptionAide: 'Ce que les membres liront avant de réserver.',
      jour: 'Jour',
      heure: 'Heure de début',
      duree: 'Durée (minutes)',
      lieu: 'Lieu',
      categorie: 'Catégorie',
      prix: 'Prix par personne (€)',
      prixAide: 'Laisser à 0 pour une activité gratuite.',
      places: 'Nombre de places',
      responsable: 'Responsable sur place',
      enregistrer: 'Enregistrer',
      annuler: 'Annuler',
      requis: 'Ce champ est obligatoire.',
      heureInvalide: 'Indiquer une heure au format 14:30.',
      creee: (titre: string) => `« ${titre} » a été ajoutée au programme.`,
      modifiee: (titre: string) => `« ${titre} » a été mise à jour.`,
    },

    suppression: {
      titre: "Supprimer l'activité ?",
      texte: (titre: string) =>
        `« ${titre} » sera retirée du programme, et les membres inscrits perdront leur place.`,
      avecReservations: (n: number) =>
        `${n} réservation${n > 1 ? 's sont' : ' est'} déjà enregistrée${n > 1 ? 's' : ''} sur cette activité.`,
      confirmer: 'Supprimer',
      annuler: 'Annuler',
      faite: (titre: string) => `« ${titre} » a été supprimée.`,
    },

    reservations: {
      titre: 'Réservations',
      intro: 'Toutes les réservations sur vos activités, de la plus proche à la plus lointaine.',
      aucune: 'Aucune réservation pour le moment.',
      resteAEncaisser: (montant: string) => `${montant} en attente de règlement`,
      voirDetail: (membre: string, activite: string) =>
        `Voir la réservation de ${membre} pour ${activite}`,
      personnes: (n: number) => `${n} personne${n > 1 ? 's' : ''}`,
      reserveeLe: (date: string) => `Réservée le ${date}`,
      seanceDu: (date: string) => `Séance du ${date}`,
    },

    detail: {
      retour: 'Retour aux réservations',
      titre: 'Réservation',
      introuvableTitre: 'Réservation introuvable',
      introuvableTexte: "Cette réservation n'existe pas ou a été supprimée.",
      membre: 'Membre',
      activite: 'Activité',
      seance: 'Séance',
      personnes: 'Personnes',
      statut: 'Statut',
      confirmer: 'Confirmer',
      annuler: 'Annuler la réservation',
      facturation: 'Facturation',
      numero: 'Numéro',
      montant: 'Montant',
      emiseLe: 'Émise le',
      payeeLe: 'Réglée le',
      emettre: 'Émettre la facture',
      aEmettre: (montant: string) => `${montant} à facturer. La facture recevra son numéro à l'émission.`,
      marquerPayee: 'Marquer comme réglée',
      immuable: "Une facture réglée ne se modifie plus : la corriger demande un avoir.",
      gratuite: "Cette séance est gratuite : il n'y a rien à facturer.",
    },

    statuts: {
      'en-attente': 'En attente',
      confirmee: 'Confirmée',
      annulee: 'Annulée',
    },

    statutsFacture: {
      'a-emettre': 'À émettre',
      emise: 'Émise',
      payee: 'Réglée',
    },

    profil: {
      titre: 'Ma fiche',
      intro: 'Ces informations apparaissent sur vos activités, côté membre.',
      structure: 'Nom de la structure',
      prenom: 'Prénom',
      nom: 'Nom',
      email: 'Adresse électronique',
      emailInvalide: 'Indiquer une adresse du type nom@domaine.fr.',
      telephone: 'Téléphone',
      siret: 'SIRET',
      presentation: 'Présentation',
      presentationAide: 'Quelques lignes sur votre structure et vos ateliers.',
      enregistrer: 'Enregistrer',
      enregistre: 'Vos informations ont été enregistrées.',
    },
  },

  carte: {
    titre: 'Où ça se passe',
    chargement: 'Chargement de la carte…',
    versListe: 'Revenir au programme',
    versCarte: 'Voir sur une carte',
    chezMoi: 'Chez vous',
    aDistance: (d: string) => `à ${d} de chez vous`,
    parDistance: 'Les lieux, du plus proche au plus loin',
    tousLesLieux: 'Les lieux',
    sansPosition:
      'Pour classer les lieux du plus proche au plus loin, indiquez où vous habitez.',
    utiliserPosition: 'Utiliser ma position actuelle',
    renseignerAdresse: 'Renseigner mon adresse',
  },

  lieu: {
    nouveau: 'Ajouter un lieu',
    nom: 'Nom du lieu',
    nomAide: 'Ce que les membres liront : « Salle Jaurès », « Jardin partagé ».',
    adresse: 'Adresse',
    adresseAide: 'Numéro, rue et ville. Elle sert à placer le point sur la carte.',
    chercher: 'Chercher cette adresse',
    aucuneAdresse: "Aucune adresse trouvée. Précisez le numéro et la ville.",
    scoreFaible: '(correspondance incertaine)',
    geocodageIndisponible: "Le service d'adresses ne répond pas. Réessayez dans un instant.",
    echecCreation: "Le lieu n'a pas pu être enregistré.",
    enregistrer: 'Enregistrer ce lieu',
  },

  inscriptions: {
    complete: "Cette séance vient d'afficher complet. Essayez une autre date.",
    echec: "L'inscription n'a pas pu être enregistrée. Réessayez dans un instant.",
  },

  contacts: {
    titre: 'Contacts',
    intro: 'Les membres que vous croisez à La vadrouille.',
    membresAria: 'Liste des membres',
  },

  aide: {
    titre: 'Aide',
    intro: 'Un doute, un imprévu ? Appelez, on décroche.',
    urgences: 'Urgences',
    quotidien: 'Au quotidien',
    appeler: (nom: string) => `Appeler ${nom}`,
    aPropos: 'À propos de La vadrouille',
  },

  aPropos: {
    titre: 'À propos',
    texte: 'Monorepo pnpm : Vite + React + React Aria côté web, Express côté api.',
  },

  erreurs: {
    titreParDefaut: 'Erreur',
    introuvableTitre: 'Page introuvable',
    introuvableTexte: "Cette page n'existe pas.",
    inattendue: 'Une erreur inattendue est survenue.',
    retour: "Retour à l'accueil",
  },

  etatApi: {
    label: 'API',
    aria: "état de l'API",
    chargement: '…',
    enLigne: 'en ligne',
    injoignable: 'injoignable',
  },

  commun: {
    /** « 1 h 30 », « 45 min ». */
    duree: (minutes: number) => {
      const h = Math.floor(minutes / 60)
      const min = minutes % 60
      if (h === 0) return `${min} min`
      return min === 0 ? `${h} h` : `${h} h ${min}`
    },
    /** « 3 inscrits sur 10 ». */
    places: (pris: number, total: number) =>
      `${pris} inscrit${pris > 1 ? 's' : ''} sur ${total}`,
    /** « 7 places libres », « complet ». Porte sur une séance, pas sur le créneau. */
    placesRestantes: (restantes: number, total: number) =>
      restantes === 0
        ? 'Complet'
        : `${restantes} place${restantes > 1 ? 's' : ''} libre${restantes > 1 ? 's' : ''} sur ${total}`,
    /** Lu à voix haute derrière un groupe d'avatars. */
    participantsAria: (noms: string[]) =>
      noms.length === 0 ? 'Personne inscrit pour le moment' : `Avec ${noms.join(', ')}`,
    /** « 10:00 » → « 10 h 00 », la forme française. */
    heure: (heure: string) => heure.replace(':', ' h '),
    /** « Lundi, 10 h 00 » */
    quand: (jour: string, heure: string, duree: string) =>
      `${jour}, ${heure} · ${duree}`,
    /** « 2026-09-07 » → « lundi 7 septembre 2026 ». */
    dateLongue: (iso: string) =>
      new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    /** « 2026-09-07 » → « 07/09/2026 ». */
    dateCourte: (iso: string) =>
      new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR'),
  },
} as const
