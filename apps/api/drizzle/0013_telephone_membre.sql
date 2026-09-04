-- Le téléphone de contact n'est pas le téléphone d'authentification.
--
-- `auth.users.phone` est un facteur de connexion : le changer exige un SMS de
-- vérification, impossible sans fournisseur. Ce dont l'association a besoin
-- est autre chose — un numéro pour rappeler quelqu'un. Il vit donc sur le
-- profil, librement modifiable, et sera promu facteur d'authentification le
-- jour où le SMS sera branché.

ALTER TABLE public.membre ADD COLUMN telephone text NOT NULL DEFAULT '';
--> statement-breakpoint

-- Reprise depuis auth.users pour les comptes qui en avaient déjà un.
UPDATE public.membre m
   SET telephone = '+' || u.phone
  FROM auth.users u
 WHERE u.id = m.user_id AND u.phone IS NOT NULL AND u.phone <> '';
--> statement-breakpoint

/* Le numéro est exigé à l'inscription, mais pas imposé rétroactivement : les
   comptes existants n'en ont pas, et les effacer ou inventer une valeur
   serait pire. La chaîne vide signifie « à renseigner » — l'application le
   demande à la prochaine visite du profil. */

GRANT UPDATE (prenom, nom, initiales, couleur_avatar, adresse, latitude, longitude, telephone)
  ON public.membre TO authenticated;
--> statement-breakpoint

-- Le déclencheur d'inscription reporte le numéro fourni au moment de la
-- création. Sans cela, un compte créé avec un téléphone perdrait l'information
-- entre auth.users et le profil.
CREATE OR REPLACE FUNCTION public.creer_profil_a_l_inscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := COALESCE(NEW.raw_app_meta_data ->> 'role', 'membre');
  v_nom_complet text := COALESCE(NEW.raw_user_meta_data ->> 'name', '');
  v_telephone text := COALESCE(NEW.raw_user_meta_data ->> 'telephone', '');
  v_prenom text;
  v_nom text;
BEGIN
  IF v_nom_complet = '' THEN
    v_nom_complet := INITCAP(SPLIT_PART(COALESCE(NEW.email, NEW.phone, 'Membre'), '@', 1));
  END IF;

  v_prenom := SPLIT_PART(v_nom_complet, ' ', 1);
  v_nom := NULLIF(TRIM(SUBSTRING(v_nom_complet FROM POSITION(' ' IN v_nom_complet))), '');

  IF NEW.raw_app_meta_data ->> 'role' IS NULL THEN
    UPDATE auth.users
       SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', v_role)
     WHERE id = NEW.id;
  END IF;

  IF v_role = 'professionnel' THEN
    INSERT INTO professionnel (user_id, prenom, nom, initiales, structure, telephone, siret)
    VALUES (NEW.id, v_prenom, COALESCE(v_nom, ''),
            UPPER(LEFT(v_prenom, 1) || LEFT(COALESCE(v_nom, v_prenom), 1)),
            v_nom_complet, v_telephone, '')
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO membre (user_id, prenom, nom, initiales, telephone)
    VALUES (NEW.id, v_prenom, COALESCE(v_nom, ''),
            UPPER(LEFT(v_prenom, 1) || LEFT(COALESCE(v_nom, v_prenom), 1)),
            v_telephone)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
