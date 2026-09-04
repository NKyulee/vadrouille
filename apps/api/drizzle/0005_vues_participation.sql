-- Deux vues, parce que « combien » et « qui » n'ont pas la même sensibilité.

-- =====================================================================
-- Combien : une statistique, visible de tous
-- =====================================================================

-- Le nombre de places prises n'est pas une donnée personnelle. Sans cette
-- vue, un membre ne pourrait pas savoir s'il reste de la place sur une
-- séance qu'il n'a pas encore rejointe — le RLS lui cache les réservations
-- des autres.
CREATE OR REPLACE VIEW public.seance_occupation AS
  SELECT s.id AS seance_id,
         s.places_total,
         COALESCE(SUM(r.personnes) FILTER (WHERE r.statut = 'confirmee'), 0)::integer AS places_prises
  FROM seance s
  LEFT JOIN reservation r ON r.seance_id = s.id
  GROUP BY s.id, s.places_total;
--> statement-breakpoint

ALTER VIEW public.seance_occupation SET (security_invoker = false);
--> statement-breakpoint

GRANT SELECT ON public.seance_occupation TO authenticated;
--> statement-breakpoint

-- =====================================================================
-- Qui : seulement là où l'on est soi-même
-- =====================================================================

-- Prolonge « on ne voit que les gens qu'on croise » : on ne découvre les
-- participants d'une séance qu'une fois inscrit soi-même. Le professionnel,
-- lui, voit ceux de ses propres séances — il les accueille.
CREATE OR REPLACE VIEW public.seance_participant AS
  SELECT r.seance_id, r.membre_id, m.prenom, m.nom, m.initiales, m.couleur_avatar
  FROM reservation r
  JOIN membre m ON m.user_id = r.membre_id
  WHERE r.statut = 'confirmee'
    AND (
      -- inscrit à la même séance
      EXISTS (SELECT 1 FROM reservation moi
              WHERE moi.seance_id = r.seance_id
                AND moi.membre_id = (SELECT auth.uid())
                AND moi.statut <> 'annulee')
      -- ou professionnel de la séance
      OR EXISTS (SELECT 1 FROM seance s
                 JOIN activite a ON a.id = s.activite_id
                 WHERE s.id = r.seance_id AND a.professionnel_id = (SELECT auth.uid()))
    );
--> statement-breakpoint

ALTER VIEW public.seance_participant SET (security_invoker = false);
--> statement-breakpoint

GRANT SELECT ON public.seance_participant TO authenticated;
