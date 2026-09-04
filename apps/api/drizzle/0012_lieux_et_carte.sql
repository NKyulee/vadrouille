-- Le lieu était une chaîne de caractères recopiée dans chaque activité :
-- « Salle Jaurès » apparaissait quatre fois, à l'identique. C'est une entité,
-- pas un attribut — et une carte a besoin de coordonnées, qu'une chaîne ne
-- peut pas porter.
--
-- Les coordonnées viennent de l'API Adresse (adresse.data.gouv.fr) : gratuite,
-- sans clé, et faisant autorité en France. Elles sont figées ici plutôt que
-- calculées à la migration : une migration ne doit pas dépendre du réseau.

CREATE TABLE public.lieu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  -- Adresse normalisée telle que renvoyée par le géocodeur, pas la saisie.
  adresse text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- La France métropolitaine tient largement dedans ; la contrainte attrape
  -- surtout l'inversion latitude/longitude, l'erreur classique.
  CONSTRAINT latitude_plausible CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT longitude_plausible CHECK (longitude BETWEEN -180 AND 180)
);
--> statement-breakpoint

ALTER TABLE public.lieu ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

-- Un lieu est public pour qui est connecté : c'est l'adresse d'une salle
-- associative, pas une donnée personnelle.
CREATE POLICY lieu_lecture ON public.lieu FOR SELECT TO authenticated USING (true);
--> statement-breakpoint

-- Seuls les professionnels en créent. On ne restreint pas au propriétaire :
-- deux intervenants peuvent proposer des activités dans la même salle.
CREATE POLICY lieu_ecriture ON public.lieu FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'professionnel');
--> statement-breakpoint

CREATE POLICY lieu_maj ON public.lieu FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'professionnel')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'professionnel');
--> statement-breakpoint

GRANT SELECT, INSERT ON public.lieu TO authenticated;
--> statement-breakpoint
GRANT UPDATE (nom, adresse, latitude, longitude) ON public.lieu TO authenticated;
--> statement-breakpoint

INSERT INTO public.lieu (nom, adresse, latitude, longitude) VALUES
  ('Salle Jaurès', '6 Rue du Jourdain 75020 Paris', 48.874798, 2.389571),
  ('La vadrouille — accueil', '20 Rue des Cascades 75020 Paris', 48.870086, 2.390875),
  ('Cuisine de La vadrouille', '20 Rue des Cascades 75020 Paris', 48.870086, 2.390875),
  ('Rendez-vous à l’accueil', '20 Rue des Cascades 75020 Paris', 48.870086, 2.390875),
  ('Salle informatique', '20 Rue des Cascades 75020 Paris', 48.870086, 2.390875),
  ('Gymnase Colette', '5 Rue Henri Chevreau 75020 Paris', 48.869056, 2.389466),
  ('Jardin, rue des Cascades', '41 Rue des Cascades 75020 Paris', 48.870747, 2.390918);
--> statement-breakpoint

ALTER TABLE public.activite ADD COLUMN lieu_id uuid REFERENCES public.lieu(id) ON DELETE RESTRICT;
--> statement-breakpoint

UPDATE public.activite a SET lieu_id = l.id FROM public.lieu l WHERE l.nom = a.lieu;
--> statement-breakpoint

-- La reprise doit être complète avant de rendre la colonne obligatoire.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.activite WHERE lieu_id IS NULL) THEN
    RAISE EXCEPTION 'Des activités n''ont pas trouvé leur lieu : reprise incomplète';
  END IF;
END $$;
--> statement-breakpoint

ALTER TABLE public.activite ALTER COLUMN lieu_id SET NOT NULL;
--> statement-breakpoint

-- L'ancienne colonne texte disparaît : deux sources pour la même information
-- finiraient par diverger.
ALTER TABLE public.activite DROP COLUMN lieu;
--> statement-breakpoint

-- Adresse du membre, pour « près de chez moi ». Facultative : personne n'est
-- obligé de dire où il habite pour consulter le programme.
ALTER TABLE public.membre
  ADD COLUMN adresse text,
  ADD COLUMN latitude double precision,
  ADD COLUMN longitude double precision;
--> statement-breakpoint

GRANT UPDATE (prenom, nom, initiales, couleur_avatar, adresse, latitude, longitude)
  ON public.membre TO authenticated;
