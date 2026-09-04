-- Le RLS dit quelles **lignes** on peut écrire, jamais quelles **colonnes**.
-- Un membre pouvait donc réécrire `membre_depuis`, sa date d'arrivée — une
-- donnée administrative, posée par le lieu, pas par l'adhérent. Vérifié :
-- l'écriture passait.
--
-- Postgres sait restreindre par colonne. C'est le bon outil, et le seul :
-- ajouter une condition dans la politique n'y donnerait pas accès.

REVOKE UPDATE ON public.membre FROM authenticated;
--> statement-breakpoint

GRANT UPDATE (prenom, nom, initiales, couleur_avatar) ON public.membre TO authenticated;
--> statement-breakpoint

-- Même raisonnement côté professionnel : `created_at` et `user_id` ne sont
-- pas à lui. Le reste — dont le SIRET et la raison sociale — l'est.
REVOKE UPDATE ON public.professionnel FROM authenticated;
--> statement-breakpoint

GRANT UPDATE (prenom, nom, initiales, couleur_avatar, structure, telephone, siret, presentation)
  ON public.professionnel TO authenticated;
--> statement-breakpoint

-- Une facture n'évolue que par son statut et ses dates. Le déclencheur
-- `facture_immuable` refuse déjà de changer numéro, montant, séquence et
-- année ; le droit par colonne rend l'intention lisible dès le schéma.
REVOKE UPDATE ON public.facture FROM authenticated;
--> statement-breakpoint

GRANT UPDATE (statut, emise_le, payee_le) ON public.facture TO authenticated;
