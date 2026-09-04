CREATE TABLE "membre" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"prenom" text NOT NULL,
	"nom" text NOT NULL,
	"initiales" text NOT NULL,
	"couleur_avatar" text DEFAULT 'foret' NOT NULL,
	"membre_depuis" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "membre" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "professionnel" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"prenom" text NOT NULL,
	"nom" text NOT NULL,
	"initiales" text NOT NULL,
	"couleur_avatar" text DEFAULT 'prune' NOT NULL,
	"structure" text NOT NULL,
	"telephone" text NOT NULL,
	"siret" text NOT NULL,
	"presentation" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "professionnel" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "membre" ADD CONSTRAINT "membre_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professionnel" ADD CONSTRAINT "professionnel_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE VIEW "public"."professionnel_public" AS (select "user_id", "prenom", "nom", "initiales", "couleur_avatar", "structure", "presentation" from "professionnel");--> statement-breakpoint
CREATE POLICY "membre_lit_son_profil" ON "membre" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("membre"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "membre_modifie_son_profil" ON "membre" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("membre"."user_id" = (select auth.uid())) WITH CHECK ("membre"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "pro_lit_son_profil" ON "professionnel" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("professionnel"."user_id" = (select auth.uid()) AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'professionnel');--> statement-breakpoint
CREATE POLICY "pro_modifie_son_profil" ON "professionnel" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("professionnel"."user_id" = (select auth.uid()) AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'professionnel') WITH CHECK ("professionnel"."user_id" = (select auth.uid()) AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'professionnel');--> statement-breakpoint
CREATE POLICY "service_gere_les_pros" ON "professionnel" AS PERMISSIVE FOR ALL TO "service_role" USING (true) WITH CHECK (true);