import { supabase } from '../auth/supabase.ts'
import type {
  Activite,
  ChampsEcriture,
  Lieu,
  CategorieId,
  JourId,
  Membre,
  Professionnel,
  Reservation,
  Seance,
  StatutFacture,
  StatutReservation,
} from './types.ts'

/* Accès aux données. Remplace l'ancien `mock.ts`.

   Les requêtes partent **directement du navigateur** vers Supabase, sans
   passer par l'API Express. Ce n'est pas un raccourci : le RLS s'applique de
   toute façon, et une couche d'API qui se contenterait de relayer des
   requêtes n'ajouterait qu'un endroit de plus où oublier un filtre.

   Chaque fonction convertit le snake_case de la base vers les types du
   domaine. C'est la seule frontière où les deux conventions se croisent. */

/* --- Conversions ----------------------------------------------------------- */

type LigneActivite = {
  id: string
  professionnel_id: string
  titre: string
  description: string
  jour: JourId
  heure: string
  duree_minutes: number
  lieu_id: string
  lieu?: { nom: string } | { nom: string }[] | null
  categorie: CategorieId
  prix_centimes: number
  places_par_defaut: number
  responsable_id: string | null
  professionnel_public?: { structure: string } | null
}

function versActivite(l: LigneActivite): Activite {
  return {
    id: l.id,
    professionnelId: l.professionnel_id,
    titre: l.titre,
    description: l.description,
    // La base stocke « 10:00:00 » ; l'application manipule « 10:00 ».
    heure: l.heure.slice(0, 5),
    jour: l.jour,
    dureeMinutes: l.duree_minutes,
    lieuId: l.lieu_id,
    lieu: (Array.isArray(l.lieu) ? l.lieu[0]?.nom : l.lieu?.nom) ?? '',
    categorie: l.categorie,
    prixCentimes: l.prix_centimes,
    placesParDefaut: l.places_par_defaut,
    responsableId: l.responsable_id ?? undefined,
    proposePar: l.professionnel_public?.structure ?? '',
  }
}

function versMembre(l: {
  user_id: string
  prenom: string
  nom: string
  initiales: string
  couleur_avatar: string
}): Membre {
  return {
    id: l.user_id,
    prenom: l.prenom,
    nom: l.nom,
    initiales: l.initiales,
    couleur: l.couleur_avatar as Membre['couleur'],
  }
}

/* --- Catalogue -------------------------------------------------------------- */

/**
 * Le programme et ses occupations, en deux requêtes.
 *
 * `places_prises` vient d'une vue à part : le nombre de places n'est pas une
 * donnée personnelle, alors que l'identité des inscrits en est une. Le RLS
 * cache les réservations d'autrui, donc sans cette vue personne ne saurait
 * s'il reste de la place.
 */
export async function chargerCatalogue(): Promise<{
  activites: Activite[]
  seances: Seance[]
}> {
  const [{ data: activites, error: eA }, { data: seances, error: eS }] = await Promise.all([
    supabase.from('activite').select('*, professionnel_public(structure), lieu(nom)').order('heure'),
    /* On interroge la vue, pas la table : PostgREST ne sait pas embarquer
       une vue dans une requête, faute de clé étrangère détectable. La vue
       porte donc aussi l'activité et la date. */
    supabase.from('seance_occupation').select('*').order('date'),
  ])

  if (eA) throw new Error(eA.message)
  if (eS) throw new Error(eS.message)

  return {
    activites: (activites ?? []).map((l) => versActivite(l as LigneActivite)),
    seances: (seances ?? []).map((l) => {
      // PostgREST renvoie un tableau pour une jointure, même 1:1.
      const occupation = (
        Array.isArray(l.seance_occupation) ? l.seance_occupation[0] : l.seance_occupation
      ) as { places_prises: number } | null
      return {
        id: l.id,
        activiteId: l.activite_id,
        date: l.date,
        placesTotal: l.places_total,
        placesPrises: occupation?.places_prises ?? 0,
      }
    }),
  }
}

export async function creerActivite(champs: ChampsEcriture): Promise<string> {
  const { data, error } = await supabase
    .from('activite')
    .insert({
      professionnel_id: champs.professionnelId,
      titre: champs.titre,
      description: champs.description,
      jour: champs.jour,
      heure: champs.heure,
      duree_minutes: champs.dureeMinutes,
      lieu_id: champs.lieuId,
      categorie: champs.categorie,
      prix_centimes: champs.prixCentimes,
      places_par_defaut: champs.placesParDefaut,
      responsable_id: champs.responsableId ?? null,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  // Les séances sont produites par la base, pas ici : même chemin qu'une
  // tâche planifiée, et le calcul des dates reste au même endroit.
  const { error: eGen } = await supabase.rpc('generer_seances', {
    p_activite_id: data.id,
    p_semaines: 6,
  })
  if (eGen) throw new Error(eGen.message)

  return data.id
}

export async function modifierActivite(
  id: string,
  champs: ChampsEcriture,
): Promise<void> {
  const { error } = await supabase
    .from('activite')
    .update({
      titre: champs.titre,
      description: champs.description,
      jour: champs.jour,
      heure: champs.heure,
      duree_minutes: champs.dureeMinutes,
      lieu_id: champs.lieuId,
      categorie: champs.categorie,
      prix_centimes: champs.prixCentimes,
      places_par_defaut: champs.placesParDefaut,
      responsable_id: champs.responsableId ?? null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  // Changer de jour déplace les occurrences : on régénère.
  const { error: eGen } = await supabase.rpc('generer_seances', {
    p_activite_id: id,
    p_semaines: 6,
  })
  if (eGen) throw new Error(eGen.message)
}

export async function supprimerActivite(id: string): Promise<void> {
  const { error } = await supabase.from('activite').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/* --- Inscriptions ----------------------------------------------------------- */

/** Identifiants des séances auxquelles l'utilisateur courant est inscrit. */
export async function chargerMesInscriptions(): Promise<string[]> {
  const { data, error } = await supabase
    .from('reservation')
    .select('seance_id')
    .neq('statut', 'annulee')
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => r.seance_id)
}

/** Erreur métier reconnaissable, par opposition à une panne. */
export class SeanceComplete extends Error {
  constructor() {
    super('Séance complète')
    this.name = 'SeanceComplete'
  }
}

export async function sInscrire(seanceId: string, membreId: string): Promise<void> {
  const { error } = await supabase
    .from('reservation')
    .insert({ seance_id: seanceId, membre_id: membreId })
  if (!error) return
  // VD001 vient du déclencheur de capacité : c'est un refus, pas une panne.
  if (error.code === 'VD001') throw new SeanceComplete()
  throw new Error(error.message)
}

export async function seDesinscrire(seanceId: string, membreId: string): Promise<void> {
  const { error } = await supabase
    .from('reservation')
    .delete()
    .eq('seance_id', seanceId)
    .eq('membre_id', membreId)
  if (error) throw new Error(error.message)
}

/* --- Membres ---------------------------------------------------------------- */

/** Les membres qu'on croise : la vue ne renvoie que ceux-là. */
export async function chargerMembresVisibles(): Promise<Membre[]> {
  const { data, error } = await supabase.from('membre_visible').select('*').order('prenom')
  if (error) throw new Error(error.message)
  return (data ?? []).map(versMembre)
}

/** Participants d'une séance. Vide tant qu'on n'y est pas soi-même inscrit. */
export async function chargerParticipants(): Promise<Map<string, Membre[]>> {
  const { data, error } = await supabase.from('seance_participant').select('*')
  if (error) throw new Error(error.message)

  const parSeance = new Map<string, Membre[]>()
  for (const l of data ?? []) {
    const liste = parSeance.get(l.seance_id) ?? []
    liste.push(versMembre({ ...l, user_id: l.membre_id }))
    parSeance.set(l.seance_id, liste)
  }
  return parSeance
}

/* --- Espace professionnel ---------------------------------------------------- */

export async function chargerReservations(): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from('reservation')
    .select('*, facture(*)')
    .order('reservee_le', { ascending: false })
  if (error) throw new Error(error.message)

  return (data ?? []).map((l) => {
    const f = (Array.isArray(l.facture) ? l.facture[0] : l.facture) as
      | { numero: string; montant_centimes: number; statut: StatutFacture; emise_le: string | null; payee_le: string | null }
      | null
    return {
      id: l.id,
      seanceId: l.seance_id,
      membreId: l.membre_id,
      personnes: l.personnes,
      statut: l.statut as StatutReservation,
      reserveeLe: l.reservee_le.slice(0, 10),
      facture: f
        ? {
            numero: f.numero,
            montantCentimes: f.montant_centimes,
            statut: f.statut,
            emiseLe: f.emise_le ?? undefined,
            payeeLe: f.payee_le ?? undefined,
          }
        : undefined,
    }
  })
}

export async function changerStatutReservation(
  id: string,
  statut: StatutReservation,
): Promise<void> {
  const { error } = await supabase.from('reservation').update({ statut }).eq('id', id)
  if (error) throw new Error(error.message)
}

/** Émet la facture et lui attribue son numéro, côté base. */
export async function emettreFacture(reservationId: string): Promise<void> {
  const { error } = await supabase.rpc('emettre_facture', { p_reservation_id: reservationId })
  if (error) throw new Error(error.message)
}

export async function marquerFacturePayee(reservationId: string): Promise<void> {
  const { error } = await supabase
    .from('facture')
    .update({ statut: 'payee', payee_le: new Date().toISOString().slice(0, 10) })
    .eq('reservation_id', reservationId)
  if (error) throw new Error(error.message)
}

/* --- Lieux ------------------------------------------------------------------ */

export async function chargerLieux(): Promise<Lieu[]> {
  const { data, error } = await supabase.from('lieu').select('*').order('nom')
  if (error) throw new Error(error.message)
  return (data ?? []).map((l) => ({
    id: l.id,
    nom: l.nom,
    adresse: l.adresse,
    latitude: l.latitude,
    longitude: l.longitude,
  }))
}

/** Crée le lieu, ou renvoie celui qui porte déjà ce nom à cette adresse. */
export async function creerLieu(champs: Omit<Lieu, 'id'>): Promise<string> {
  const { data: existant } = await supabase
    .from('lieu')
    .select('id')
    .eq('nom', champs.nom)
    .eq('adresse', champs.adresse)
    .maybeSingle()
  if (existant) return existant.id

  const { data, error } = await supabase
    .from('lieu')
    .insert({
      nom: champs.nom,
      adresse: champs.adresse,
      latitude: champs.latitude,
      longitude: champs.longitude,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id
}

/* --- Profil du membre -------------------------------------------------------
   Le RLS restreint l'écriture à sa propre ligne : `eq('user_id', …)` est là
   pour viser la bonne ligne, pas pour protéger. Même sans ce filtre, la base
   n'en laisserait modifier aucune autre. */

export async function enregistrerProfilMembre(profil: Membre): Promise<void> {
  const { error } = await supabase
    .from('membre')
    .update({
      prenom: profil.prenom,
      nom: profil.nom,
      initiales: profil.initiales,
      couleur_avatar: profil.couleur,
      telephone: profil.telephone ?? '',
      adresse: profil.adresse ?? null,
      latitude: profil.latitude ?? null,
      longitude: profil.longitude ?? null,
    })
    .eq('user_id', profil.id)
  if (error) throw new Error(error.message)
}

/**
 * Change l'adresse de connexion.
 *
 * Supabase envoie un courriel de confirmation : l'adresse ne change qu'une
 * fois le lien suivi. C'est voulu — sans vérification, n'importe qui pourrait
 * inscrire une adresse qui ne lui appartient pas. Tant qu'aucun SMTP
 * applicatif n'est configuré, l'envoi bute sur la limite de débit du service
 * intégré et l'appel échoue.
 */
export async function changerEmail(nouveau: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ email: nouveau.trim().toLowerCase() })
  if (error) throw new Error(error.message)
}

/** Change le mot de passe du compte connecté. Aucun courriel envoyé. */
export async function changerMotDePasse(nouveau: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: nouveau })
  if (error) throw new Error(error.message)
}

export async function enregistrerProfilPro(profil: Professionnel): Promise<void> {
  const { error } = await supabase
    .from('professionnel')
    .update({
      prenom: profil.prenom,
      nom: profil.nom,
      initiales: profil.initiales,
      structure: profil.structure,
      telephone: profil.telephone,
      siret: profil.siret,
      presentation: profil.presentation,
    })
    .eq('user_id', profil.id)
  if (error) throw new Error(error.message)
}
