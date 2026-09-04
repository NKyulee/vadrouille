-- Un compte peut naître par plusieurs chemins : le tableau de bord Supabase,
-- l'API d'administration, une inscription applicative. Seul le script de
-- peuplement créait le profil métier qui va avec — d'où un 404 sur /api/moi
-- pour tout compte créé autrement.
--
-- Le profil est donc posé par la base, à l'insertion du compte. C'est le seul
-- endroit que tous les chemins traversent.

CREATE OR REPLACE FUNCTION public.creer_profil_a_l_inscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := COALESCE(NEW.raw_app_meta_data ->> 'role', 'membre');
  v_nom_complet text := COALESCE(NEW.raw_user_meta_data ->> 'name', '');
  v_prenom text;
  v_nom text;
BEGIN
  -- À défaut de nom, on part de l'adresse : « yunguyen94@gmail.com » donne
  -- « Yunguyen94 ». Approximatif, mais préférable à un profil vide — et
  -- l'intéressé pourra le corriger.
  IF v_nom_complet = '' THEN
    v_nom_complet := INITCAP(SPLIT_PART(COALESCE(NEW.email, NEW.phone, 'Membre'), '@', 1));
  END IF;

  v_prenom := SPLIT_PART(v_nom_complet, ' ', 1);
  v_nom := NULLIF(TRIM(SUBSTRING(v_nom_complet FROM POSITION(' ' IN v_nom_complet))), '');

  -- Le rôle doit se retrouver dans le jeton : c'est lui que lisent les
  -- politiques RLS. Absent, on le pose explicitement plutôt que de compter
  -- sur une valeur par défaut côté application.
  IF NEW.raw_app_meta_data ->> 'role' IS NULL THEN
    UPDATE auth.users
       SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', v_role)
     WHERE id = NEW.id;
  END IF;

  IF v_role = 'professionnel' THEN
    INSERT INTO professionnel (user_id, prenom, nom, initiales, structure, telephone, siret)
    VALUES (NEW.id, v_prenom, COALESCE(v_nom, ''),
            UPPER(LEFT(v_prenom, 1) || LEFT(COALESCE(v_nom, v_prenom), 1)),
            v_nom_complet, '', '')
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO membre (user_id, prenom, nom, initiales)
    VALUES (NEW.id, v_prenom, COALESCE(v_nom, ''),
            UPPER(LEFT(v_prenom, 1) || LEFT(COALESCE(v_nom, v_prenom), 1)))
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS profil_a_l_inscription ON auth.users;
--> statement-breakpoint

CREATE TRIGGER profil_a_l_inscription
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.creer_profil_a_l_inscription();
--> statement-breakpoint

-- Rattrapage des comptes déjà créés sans profil.
INSERT INTO membre (user_id, prenom, nom, initiales)
SELECT u.id,
       INITCAP(SPLIT_PART(COALESCE(u.email, u.phone, 'Membre'), '@', 1)),
       '',
       UPPER(LEFT(INITCAP(SPLIT_PART(COALESCE(u.email, u.phone, 'M'), '@', 1)), 2))
FROM auth.users u
WHERE COALESCE(u.raw_app_meta_data ->> 'role', 'membre') = 'membre'
  AND NOT EXISTS (SELECT 1 FROM membre m WHERE m.user_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM professionnel p WHERE p.user_id = u.id);
--> statement-breakpoint

UPDATE auth.users
   SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"membre"}'::jsonb
 WHERE raw_app_meta_data ->> 'role' IS NULL;
