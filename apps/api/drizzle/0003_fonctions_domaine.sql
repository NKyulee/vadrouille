-- Fonctions, déclencheurs et droits. Drizzle ne les génère pas.

-- =====================================================================
-- Qui croise qui
-- =====================================================================

-- Membres partageant au moins une séance avec l'appelant.
--
-- SECURITY DEFINER : cette fonction lit `reservation`, qui est elle-même sous
-- RLS. Sans cela, la vue qui l'utilise ne verrait que les réservations de
-- l'appelant et ne pourrait jamais trouver ses co-participants.
-- `search_path` figé : sans lui, un schéma temporaire malveillant pourrait
-- détourner les noms de tables dans une fonction qui s'exécute en tant que
-- propriétaire.
CREATE OR REPLACE FUNCTION public.membres_croises()
RETURNS TABLE (membre_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT DISTINCT r2.membre_id
  FROM reservation r1
  JOIN reservation r2 ON r2.seance_id = r1.seance_id
  WHERE r1.membre_id = (SELECT auth.uid())
    AND r1.statut <> 'annulee'
    AND r2.statut <> 'annulee'
$$;
--> statement-breakpoint

-- La vue s'exécute avec les droits de son propriétaire, donc sans le RLS de
-- `membre` — c'est ce qui lui permet de montrer autre chose que soi-même.
-- Le filtrage, lui, est explicite ci-dessous.
ALTER VIEW public.membre_visible SET (security_invoker = false);
--> statement-breakpoint

CREATE OR REPLACE VIEW public.membre_visible AS
  SELECT m.user_id, m.prenom, m.nom, m.initiales, m.couleur_avatar
  FROM membre m
  WHERE m.user_id = (SELECT auth.uid())
     OR m.user_id IN (SELECT membre_id FROM public.membres_croises());
--> statement-breakpoint

ALTER VIEW public.professionnel_public SET (security_invoker = false);
--> statement-breakpoint

GRANT SELECT ON public.membre_visible TO authenticated;
--> statement-breakpoint

-- =====================================================================
-- Capacité d'une séance
-- =====================================================================

-- Deux personnes peuvent viser la dernière place au même instant. Un `if`
-- applicatif ne le voit pas : entre la lecture et l'écriture, l'autre est
-- passée. Le verrou sur la ligne de séance sérialise les candidats.
CREATE OR REPLACE FUNCTION public.verifier_capacite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  places integer;
  occupees integer;
BEGIN
  IF NEW.statut <> 'confirmee' THEN
    RETURN NEW;
  END IF;

  -- FOR UPDATE : les inscriptions concurrentes sur la même séance attendent.
  SELECT s.places_total INTO places FROM seance s WHERE s.id = NEW.seance_id FOR UPDATE;

  SELECT COALESCE(SUM(r.personnes), 0) INTO occupees
  FROM reservation r
  WHERE r.seance_id = NEW.seance_id
    AND r.statut = 'confirmee'
    AND r.id <> NEW.id;

  IF occupees + NEW.personnes > places THEN
    -- SQLSTATE dédié : l'application distingue « complet » d'une vraie panne
    -- et peut proposer la liste d'attente plutôt qu'un message d'erreur.
    RAISE EXCEPTION 'Séance complète : % place(s) sur %', occupees, places
      USING ERRCODE = 'VD001';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint

CREATE TRIGGER capacite_seance
BEFORE INSERT OR UPDATE OF statut, personnes, seance_id ON public.reservation
FOR EACH ROW EXECUTE FUNCTION public.verifier_capacite();
--> statement-breakpoint

-- =====================================================================
-- Numérotation des factures
-- =====================================================================

-- Une SEQUENCE Postgres ne convient pas : elle n'est pas transactionnelle.
-- Un rollback consomme le numéro et laisse un trou, ce que l'article
-- 242 nonies A du CGI interdit. Une ligne verrouillée ne saute rien.
CREATE OR REPLACE FUNCTION public.emettre_facture(p_reservation_id uuid)
RETURNS public.facture
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pro uuid;
  v_montant integer;
  v_annee integer := EXTRACT(YEAR FROM CURRENT_DATE);
  v_sequence integer;
  v_facture facture;
BEGIN
  SELECT a.professionnel_id, a.prix_centimes * r.personnes
    INTO v_pro, v_montant
  FROM reservation r
  JOIN seance s ON s.id = r.seance_id
  JOIN activite a ON a.id = s.activite_id
  WHERE r.id = p_reservation_id;

  IF v_pro IS NULL THEN
    RAISE EXCEPTION 'Réservation introuvable' USING ERRCODE = 'VD002';
  END IF;

  -- Seul le professionnel concerné émet ses factures. La fonction étant
  -- SECURITY DEFINER, elle contourne le RLS : le contrôle est donc ici.
  IF v_pro <> (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Facturation réservée au professionnel de la séance'
      USING ERRCODE = 'VD003';
  END IF;

  -- Une séance gratuite ne produit pas de facture à 0 €, elle n'en produit
  -- aucune : il n'y a rien à facturer, donc rien à numéroter.
  IF v_montant = 0 THEN
    RAISE EXCEPTION 'Séance gratuite : rien à facturer' USING ERRCODE = 'VD004';
  END IF;

  INSERT INTO compteur_facture (professionnel_id, annee, dernier)
  VALUES (v_pro, v_annee, 0)
  ON CONFLICT (professionnel_id, annee) DO NOTHING;

  UPDATE compteur_facture
     SET dernier = dernier + 1
   WHERE professionnel_id = v_pro AND annee = v_annee
  RETURNING dernier INTO v_sequence;

  INSERT INTO facture (reservation_id, professionnel_id, annee, sequence, numero,
                       montant_centimes, statut, emise_le)
  VALUES (p_reservation_id, v_pro, v_annee, v_sequence,
          'F-' || v_annee || '-' || LPAD(v_sequence::text, 4, '0'),
          v_montant, 'emise', CURRENT_DATE)
  RETURNING * INTO v_facture;

  RETURN v_facture;
END;
$$;
--> statement-breakpoint

-- Une facture émise est une pièce comptable : ni son numéro, ni son montant,
-- ni son année ne bougent. Seul le statut évolue, et jamais vers l'arrière.
CREATE OR REPLACE FUNCTION public.facture_immuable()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.numero <> OLD.numero
     OR NEW.montant_centimes <> OLD.montant_centimes
     OR NEW.sequence <> OLD.sequence
     OR NEW.annee <> OLD.annee THEN
    RAISE EXCEPTION 'Une facture émise ne se modifie pas : passer par un avoir'
      USING ERRCODE = 'VD005';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint

CREATE TRIGGER facture_non_reecrite
BEFORE UPDATE ON public.facture
FOR EACH ROW EXECUTE FUNCTION public.facture_immuable();
--> statement-breakpoint

-- =====================================================================
-- Génération des séances
-- =====================================================================

-- Les séances dérivent du créneau : on ne les saisit pas. Appelée à la
-- création et à la modification d'une activité, et par une tâche planifiée
-- pour faire glisser la fenêtre.
CREATE OR REPLACE FUNCTION public.generer_seances(p_activite_id uuid, p_semaines integer DEFAULT 6)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jour text;
  v_places integer;
  v_pro uuid;
  v_premiere date;
  v_creees integer := 0;
  v_index integer;
BEGIN
  SELECT a.jour::text, a.places_par_defaut, a.professionnel_id
    INTO v_jour, v_places, v_pro
  FROM activite a WHERE a.id = p_activite_id;

  IF v_pro IS NULL THEN
    RAISE EXCEPTION 'Activité introuvable' USING ERRCODE = 'VD002';
  END IF;
  IF v_pro <> (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Seul le professionnel propriétaire génère ses séances'
      USING ERRCODE = 'VD003';
  END IF;

  -- Prochaine occurrence du jour voulu, aujourd'hui compris.
  -- isodow : 1 = lundi … 7 = dimanche.
  v_premiere := CURRENT_DATE + (
    (ARRAY_POSITION(ARRAY['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'], v_jour)
     - EXTRACT(ISODOW FROM CURRENT_DATE)::integer + 7) % 7
  );

  FOR v_index IN 0 .. p_semaines - 1 LOOP
    -- Les séances déjà là gardent leurs inscrits et leur capacité propre.
    INSERT INTO seance (activite_id, date, places_total)
    VALUES (p_activite_id, v_premiere + (v_index * 7), v_places)
    ON CONFLICT (activite_id, date) DO NOTHING;
    v_creees := v_creees + 1;
  END LOOP;

  RETURN v_creees;
END;
$$;
--> statement-breakpoint

-- =====================================================================
-- Droits
-- =====================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activite, public.seance, public.reservation TO authenticated;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON public.facture TO authenticated;
--> statement-breakpoint
-- Le compteur n'est jamais touché directement : seule `emettre_facture()`
-- l'incrémente, sous verrou.
REVOKE ALL ON public.compteur_facture FROM authenticated, anon;
--> statement-breakpoint
REVOKE ALL ON public.activite, public.seance, public.reservation, public.facture FROM anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.emettre_facture(uuid) TO authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.generer_seances(uuid, integer) TO authenticated;
