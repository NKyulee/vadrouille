-- Le compteur de facturation n'a aucune politique, donc Drizzle n'avait pas
-- activé le RLS dessus. Les droits sont révoqués — personne ne peut le lire —
-- mais sans RLS, un GRANT ajouté par mégarde plus tard ouvrirait la table
-- d'un coup. RLS activé sans aucune politique = personne ne passe, y compris
-- si les droits changent. Seule `emettre_facture()`, en SECURITY DEFINER,
-- continue d'y accéder.
ALTER TABLE public.compteur_facture ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.compteur_facture FORCE ROW LEVEL SECURITY;
