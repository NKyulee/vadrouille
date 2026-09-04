-- Supabase accorde par défaut TOUS les droits à `anon` et `authenticated` sur
-- le schéma public, en comptant sur le RLS. Deux trous en découlent :
--
-- 1. `professionnel_public` est une vue simple sur une seule table, donc
--    automatiquement modifiable par Postgres. Avec `security_invoker = false`
--    elle s'exécute en tant que propriétaire — donc sans RLS. N'importe quel
--    membre connecté pouvait ainsi réécrire la fiche de n'importe quel
--    professionnel. Vérifié : l'écriture passait, sans même une erreur.
--    (`membre_visible` y échappait par accident : son WHERE appelle une
--    fonction, ce qui la rend non modifiable.)
--
-- 2. TRUNCATE **n'est pas soumis au RLS**. Le droit accordé permettait de
--    vider une table entière quelles que soient les politiques.
--
-- On repart donc de zéro : tout révoquer, puis n'accorder que le nécessaire.

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
--> statement-breakpoint

-- Les vues sont en lecture seule. Une vue qui expose moins de colonnes ne
-- doit jamais servir de porte d'entrée en écriture.
GRANT SELECT ON public.membre_visible, public.professionnel_public,
                public.seance_occupation, public.seance_participant
  TO authenticated;
--> statement-breakpoint

-- Profils : lecture et modification de soi. Le RLS restreint à sa propre
-- ligne ; ni INSERT (les profils naissent par déclencheur) ni DELETE.
GRANT SELECT, UPDATE ON public.membre, public.professionnel TO authenticated;
--> statement-breakpoint

-- Catalogue : lecture pour tous, écriture filtrée par le RLS au propriétaire.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activite, public.seance TO authenticated;
--> statement-breakpoint

-- Réservations : le membre crée et retire les siennes, le pro gère celles de
-- ses séances. Le RLS tranche.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservation TO authenticated;
--> statement-breakpoint

-- Factures : jamais de DELETE. Une pièce comptable ne s'efface pas, elle
-- s'annule par un avoir. L'INSERT passe par `emettre_facture()`.
GRANT SELECT, UPDATE ON public.facture TO authenticated;
--> statement-breakpoint

-- `compteur_facture` reste hors de portée : seule `emettre_facture()` y
-- touche, en SECURITY DEFINER.

-- Le rôle anonyme n'accède à rien : on ne consulte pas le programme sans
-- être connecté.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
--> statement-breakpoint

-- Les objets créés plus tard hériteraient à nouveau des droits par défaut.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
