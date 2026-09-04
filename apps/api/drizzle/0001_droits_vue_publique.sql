-- Droits sur la vue des intervenants.
-- Drizzle ne génère ni GRANT ni options de vue : cette migration les pose.

-- `security_invoker = false` est le comportement par défaut de Postgres, mais
-- on l'écrit : c'est **volontaire**, pas un oubli. La vue s'exécute avec les
-- droits de son propriétaire, donc sans le RLS de `professionnel` — c'est
-- précisément ce qui permet à un membre de lire le nom d'un intervenant sans
-- pouvoir lire son SIRET ni son téléphone, absents de la vue.
ALTER VIEW "public"."professionnel_public" SET (security_invoker = false);
--> statement-breakpoint

-- Lecture seule, et seulement pour les personnes connectées.
GRANT SELECT ON "public"."professionnel_public" TO "authenticated";
--> statement-breakpoint

-- Les tables de profil ne sont jamais accessibles en direct au rôle anonyme :
-- le RLS le couvre déjà, mais retirer le droit rend l'intention explicite.
REVOKE ALL ON "public"."membre" FROM "anon";
--> statement-breakpoint
REVOKE ALL ON "public"."professionnel" FROM "anon";
