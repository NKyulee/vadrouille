-- `seance_occupation` était pensée comme une jointure depuis `seance`.
-- PostgREST ne sait pas embarquer une vue : il lui faut une clé étrangère
-- détectable, et une vue n'en a pas. La requête échouait sur
-- « Could not find a relationship between 'seance' and 'seance_occupation' ».
--
-- La vue porte donc désormais tout ce qu'il faut pour être interrogée seule.
-- Un aller-retour de moins, et plus de jointure impossible à faire.
DROP VIEW IF EXISTS public.seance_occupation;
--> statement-breakpoint

CREATE VIEW public.seance_occupation AS
  SELECT s.id AS seance_id,
         s.activite_id,
         s.date,
         s.places_total,
         s.annulee,
         COALESCE(SUM(r.personnes) FILTER (WHERE r.statut = 'confirmee'), 0)::integer AS places_prises
  FROM seance s
  LEFT JOIN reservation r ON r.seance_id = s.id
  GROUP BY s.id, s.activite_id, s.date, s.places_total, s.annulee;
--> statement-breakpoint

-- `security_invoker = false` : la vue s'exécute avec les droits de son
-- propriétaire, donc sans le RLS de `reservation`. C'est ce qui permet de
-- compter les inscrits des autres sans jamais révéler qui ils sont.
ALTER VIEW public.seance_occupation SET (security_invoker = false);
--> statement-breakpoint

GRANT SELECT ON public.seance_occupation TO authenticated;
