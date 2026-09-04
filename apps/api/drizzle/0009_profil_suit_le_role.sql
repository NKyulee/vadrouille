-- Le déclencheur précédent ne voyait jamais « professionnel ».
--
-- GoTrue insère d'abord la ligne, puis fusionne `app_metadata` par un UPDATE
-- séparé. À l'INSERT, `raw_app_meta_data ->> 'role'` est donc encore nul, et
-- tout le monde recevait un profil membre — y compris les professionnels.
--
-- On garde le déclencheur d'insertion (il couvre les comptes créés sans rôle)
-- et on en ajoute un second, sur la mise à jour du rôle, qui met le profil en
-- accord.

CREATE OR REPLACE FUNCTION public.profil_suit_le_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := NEW.raw_app_meta_data ->> 'role';
  v_prenom text;
  v_nom text;
BEGIN
  IF v_role IS NULL OR v_role = COALESCE(OLD.raw_app_meta_data ->> 'role', '') THEN
    RETURN NEW;
  END IF;

  IF v_role = 'professionnel' THEN
    SELECT m.prenom, m.nom INTO v_prenom, v_nom FROM membre m WHERE m.user_id = NEW.id;

    INSERT INTO professionnel (user_id, prenom, nom, initiales, structure, telephone, siret)
    VALUES (NEW.id,
            COALESCE(v_prenom, INITCAP(SPLIT_PART(COALESCE(NEW.email, 'Pro'), '@', 1))),
            COALESCE(v_nom, ''),
            UPPER(LEFT(COALESCE(v_prenom, 'P'), 1) || LEFT(COALESCE(NULLIF(v_nom, ''), v_prenom, 'R'), 1)),
            '', '', '')
    ON CONFLICT (user_id) DO NOTHING;

    /* Le profil membre créé par défaut à l'insertion n'a plus lieu d'être.
       On ne le retire que s'il est resté vierge : une personne peut être
       adhérente *et* intervenante, et on ne supprime pas des inscriptions
       au passage. */
    DELETE FROM membre m
     WHERE m.user_id = NEW.id
       AND NOT EXISTS (SELECT 1 FROM reservation r WHERE r.membre_id = m.user_id);
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS profil_suit_le_role ON auth.users;
--> statement-breakpoint

CREATE TRIGGER profil_suit_le_role
AFTER UPDATE OF raw_app_meta_data ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.profil_suit_le_role();
