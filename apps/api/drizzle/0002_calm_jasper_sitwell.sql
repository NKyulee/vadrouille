CREATE TYPE "public"."categorie" AS ENUM('atelier', 'sortie', 'jeu', 'sport', 'partage');--> statement-breakpoint
CREATE TYPE "public"."jour" AS ENUM('lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche');--> statement-breakpoint
CREATE TYPE "public"."statut_facture" AS ENUM('a-emettre', 'emise', 'payee');--> statement-breakpoint
CREATE TYPE "public"."statut_reservation" AS ENUM('en-attente', 'confirmee', 'annulee');--> statement-breakpoint
CREATE TABLE "activite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professionnel_id" uuid NOT NULL,
	"titre" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"jour" "jour" NOT NULL,
	"heure" time NOT NULL,
	"duree_minutes" integer NOT NULL,
	"lieu" text NOT NULL,
	"categorie" "categorie" NOT NULL,
	"prix_centimes" integer DEFAULT 0 NOT NULL,
	"places_par_defaut" integer NOT NULL,
	"responsable_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prix_positif" CHECK ("activite"."prix_centimes" >= 0),
	CONSTRAINT "places_positives" CHECK ("activite"."places_par_defaut" > 0),
	CONSTRAINT "duree_positive" CHECK ("activite"."duree_minutes" > 0)
);
--> statement-breakpoint
ALTER TABLE "activite" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "compteur_facture" (
	"professionnel_id" uuid NOT NULL,
	"annee" integer NOT NULL,
	"dernier" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "compteur_par_pro_et_annee" UNIQUE("professionnel_id","annee")
);
--> statement-breakpoint
CREATE TABLE "facture" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservation_id" uuid NOT NULL,
	"professionnel_id" uuid NOT NULL,
	"annee" integer NOT NULL,
	"sequence" integer NOT NULL,
	"numero" text NOT NULL,
	"montant_centimes" integer NOT NULL,
	"statut" "statut_facture" DEFAULT 'a-emettre' NOT NULL,
	"emise_le" date,
	"payee_le" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "facture_reservation_id_unique" UNIQUE("reservation_id"),
	CONSTRAINT "numero_unique_par_pro" UNIQUE("professionnel_id","annee","sequence"),
	CONSTRAINT "montant_positif" CHECK ("facture"."montant_centimes" >= 0)
);
--> statement-breakpoint
ALTER TABLE "facture" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reservation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seance_id" uuid NOT NULL,
	"membre_id" uuid NOT NULL,
	"personnes" integer DEFAULT 1 NOT NULL,
	"statut" "statut_reservation" DEFAULT 'confirmee' NOT NULL,
	"reservee_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "une_reservation_par_membre_et_seance" UNIQUE("seance_id","membre_id"),
	CONSTRAINT "personnes_positives" CHECK ("reservation"."personnes" > 0)
);
--> statement-breakpoint
ALTER TABLE "reservation" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "seance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activite_id" uuid NOT NULL,
	"date" date NOT NULL,
	"places_total" integer NOT NULL,
	"annulee" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seance_unique_par_date" UNIQUE("activite_id","date"),
	CONSTRAINT "places_seance_positives" CHECK ("seance"."places_total" > 0)
);
--> statement-breakpoint
ALTER TABLE "seance" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "activite" ADD CONSTRAINT "activite_professionnel_id_professionnel_user_id_fk" FOREIGN KEY ("professionnel_id") REFERENCES "public"."professionnel"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activite" ADD CONSTRAINT "activite_responsable_id_membre_user_id_fk" FOREIGN KEY ("responsable_id") REFERENCES "public"."membre"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compteur_facture" ADD CONSTRAINT "compteur_facture_professionnel_id_professionnel_user_id_fk" FOREIGN KEY ("professionnel_id") REFERENCES "public"."professionnel"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facture" ADD CONSTRAINT "facture_reservation_id_reservation_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservation"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facture" ADD CONSTRAINT "facture_professionnel_id_professionnel_user_id_fk" FOREIGN KEY ("professionnel_id") REFERENCES "public"."professionnel"("user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_seance_id_seance_id_fk" FOREIGN KEY ("seance_id") REFERENCES "public"."seance"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_membre_id_membre_user_id_fk" FOREIGN KEY ("membre_id") REFERENCES "public"."membre"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seance" ADD CONSTRAINT "seance_activite_id_activite_id_fk" FOREIGN KEY ("activite_id") REFERENCES "public"."activite"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE VIEW "public"."membre_visible" AS (select "user_id", "prenom", "nom", "initiales", "couleur_avatar" from "membre");--> statement-breakpoint
CREATE POLICY "activite_lecture" ON "activite" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "activite_ecriture_proprietaire" ON "activite" AS PERMISSIVE FOR ALL TO "authenticated" USING ("activite"."professionnel_id" = (select auth.uid())) WITH CHECK ("activite"."professionnel_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "facture_professionnel" ON "facture" AS PERMISSIVE FOR ALL TO "authenticated" USING ("facture"."professionnel_id" = (select auth.uid())) WITH CHECK ("facture"."professionnel_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "facture_lecture_membre" ON "facture" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM reservation r
        WHERE r.id = "facture"."reservation_id" AND r.membre_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "reservation_membre" ON "reservation" AS PERMISSIVE FOR ALL TO "authenticated" USING ("reservation"."membre_id" = (select auth.uid())) WITH CHECK ("reservation"."membre_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "reservation_professionnel" ON "reservation" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (
        SELECT 1 FROM seance s JOIN activite a ON a.id = s.activite_id
        WHERE s.id = "reservation"."seance_id" AND a.professionnel_id = (select auth.uid()))) WITH CHECK (EXISTS (
        SELECT 1 FROM seance s JOIN activite a ON a.id = s.activite_id
        WHERE s.id = "reservation"."seance_id" AND a.professionnel_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "seance_lecture" ON "seance" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "seance_ecriture_proprietaire" ON "seance" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (SELECT 1 FROM activite a WHERE a.id = "seance"."activite_id" AND a.professionnel_id = (select auth.uid()))) WITH CHECK (EXISTS (SELECT 1 FROM activite a WHERE a.id = "seance"."activite_id" AND a.professionnel_id = (select auth.uid())));