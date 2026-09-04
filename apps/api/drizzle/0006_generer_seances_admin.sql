-- Variante d'administration de `generer_seances`, sans le contrôle de
-- propriétaire : le peuplement s'exécute avec la clé de service, hors de
-- toute session utilisateur, donc `auth.uid()` y est nul.
-- Réservée au rôle de service ; les utilisateurs gardent `generer_seances`.
CREATE OR REPLACE FUNCTION public.generer_seances_admin(p_activite_id uuid, p_semaines integer DEFAULT 6)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jour text; v_places integer; v_premiere date; v_index integer; v_creees integer := 0;
BEGIN
  SELECT a.jour::text, a.places_par_defaut INTO v_jour, v_places
  FROM activite a WHERE a.id = p_activite_id;

  IF v_jour IS NULL THEN
    RAISE EXCEPTION 'Activité introuvable' USING ERRCODE = 'VD002';
  END IF;

  v_premiere := CURRENT_DATE + (
    (ARRAY_POSITION(ARRAY['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'], v_jour)
     - EXTRACT(ISODOW FROM CURRENT_DATE)::integer + 7) % 7);

  FOR v_index IN 0 .. p_semaines - 1 LOOP
    INSERT INTO seance (activite_id, date, places_total)
    VALUES (p_activite_id, v_premiere + (v_index * 7), v_places)
    ON CONFLICT (activite_id, date) DO NOTHING;
    v_creees := v_creees + 1;
  END LOOP;

  RETURN v_creees;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.generer_seances_admin(uuid, integer) FROM authenticated, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.generer_seances_admin(uuid, integer) TO service_role;
