import { supabase } from '../auth/supabase.ts'
import type {
  Activite,
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
  lieu: string
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
    lieu: l.lieu,
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
    supabase.from('activite').select('*, professionnel_public(structure)').order('heure'),
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

export async function creerActivite(champs: Omit<Activite, 'id' | 'proposePar'>): Promise<string> {
  const { data, error } = await supabase
    .from('activite')
    .insert({
      professionnel_id: champs.professionnelId,
      titre: champs.titre,
      description: champs.description,
      jour: champs.jour,
      heure: champs.heure,
      duree_minutes: champs.dureeMinutes,
      lieu: champs.lieu,
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
  champs: Omit<Activite, 'id' | 'proposePar'>,
): Promise<void> {
  const { error } = await supabase
    .from('activite')
    .update({
      titre: champs.titre,
      description: champs.description,
      jour: champs.jour,
      heure: champs.heure,
      duree_minutes: champs.dureeMinutes,
      lieu: champs.lieu,
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
