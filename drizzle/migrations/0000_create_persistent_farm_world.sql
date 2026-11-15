CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  farmer_name text NOT NULL CHECK (char_length(farmer_name) BETWEEN 2 AND 24),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in players can read farmer names" ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE TABLE public.farm_state (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  coins integer NOT NULL DEFAULT 180 CHECK (coins >= 0),
  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level integer NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 20),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.farm_state TO authenticated;
GRANT ALL ON public.farm_state TO service_role;
ALTER TABLE public.farm_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farmers read their own balance" ON public.farm_state FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.inventory (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_key text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (user_id, item_key)
);
GRANT SELECT ON public.inventory TO authenticated;
GRANT ALL ON public.inventory TO service_role;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farmers read their own inventory" ON public.inventory FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.crops (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  field_id integer NOT NULL CHECK (field_id BETWEEN 1 AND 9),
  crop_key text NOT NULL,
  planted_at timestamptz NOT NULL DEFAULT now(),
  ready_at timestamptz NOT NULL,
  PRIMARY KEY (user_id, field_id)
);
GRANT SELECT ON public.crops TO authenticated;
GRANT ALL ON public.crops TO service_role;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farmers read their own crops" ON public.crops FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.animals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  animal_key text NOT NULL,
  ready_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.animals TO authenticated;
GRANT ALL ON public.animals TO service_role;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farmers read their own animals" ON public.animals FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.buildings (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  building_key text NOT NULL,
  active_recipe text,
  started_at timestamptz,
  ready_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, building_key)
);
GRANT SELECT ON public.buildings TO authenticated;
GRANT ALL ON public.buildings TO service_role;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farmers read their own buildings" ON public.buildings FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.resource_nodes (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  node_key text NOT NULL,
  ready_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, node_key)
);
GRANT SELECT ON public.resource_nodes TO authenticated;
GRANT ALL ON public.resource_nodes TO service_role;
ALTER TABLE public.resource_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farmers read their own resource timers" ON public.resource_nodes FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.player_regions (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  region_id text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, region_id)
);
GRANT SELECT ON public.player_regions TO authenticated;
GRANT ALL ON public.player_regions TO service_role;
ALTER TABLE public.player_regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farmers read their own regions" ON public.player_regions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.farm_stats (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  planted integer NOT NULL DEFAULT 0,
  harvested integer NOT NULL DEFAULT 0,
  gathered integer NOT NULL DEFAULT 0,
  animal_products integer NOT NULL DEFAULT 0,
  crafted integer NOT NULL DEFAULT 0,
  trades integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.farm_stats TO authenticated;
GRANT ALL ON public.farm_stats TO service_role;
ALTER TABLE public.farm_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farmers read their own statistics" ON public.farm_stats FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.quest_claims (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quest_id text NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, quest_id)
);
GRANT SELECT ON public.quest_claims TO authenticated;
GRANT ALL ON public.quest_claims TO service_role;
ALTER TABLE public.quest_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farmers read their own quest claims" ON public.quest_claims FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.ledger (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_key text NOT NULL,
  item_key text,
  quantity integer NOT NULL DEFAULT 0,
  coins integer NOT NULL DEFAULT 0,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ledger TO authenticated;
GRANT ALL ON public.ledger TO service_role;
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farmers read their own ledger" ON public.ledger FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.market_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  buyer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  item_key text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price integer NOT NULL CHECK (unit_price > 0),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','filled','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  filled_at timestamptz
);
GRANT SELECT ON public.market_listings TO authenticated;
GRANT ALL ON public.market_listings TO service_role;
ALTER TABLE public.market_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can browse real market listings" ON public.market_listings FOR SELECT TO authenticated USING (true);

CREATE TABLE public.direct_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_key text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price integer NOT NULL CHECK (price > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CHECK (sender_id <> recipient_id)
);
GRANT SELECT ON public.direct_trades TO authenticated;
GRANT ALL ON public.direct_trades TO service_role;
ALTER TABLE public.direct_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players read trades they participate in" ON public.direct_trades FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE OR REPLACE FUNCTION public.handle_new_farm_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
BEGIN
  v_name := left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'farmer_name'), ''), 'مزارع-' || substr(new.id::text, 1, 6)), 24);
  INSERT INTO public.profiles (id, farmer_name) VALUES (new.id, v_name);
  INSERT INTO public.farm_state (user_id, coins) VALUES (new.id, 180);
  INSERT INTO public.farm_stats (user_id) VALUES (new.id);
  INSERT INTO public.ledger (user_id, action_key, coins, description) VALUES (new.id, 'starting_grant', 180, 'منحة تأسيس المزرعة');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created_farm
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_farm_user();

CREATE OR REPLACE FUNCTION public.change_inventory(p_user uuid, p_item text, p_delta integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current integer;
BEGIN
  SELECT quantity INTO v_current FROM public.inventory WHERE user_id = p_user AND item_key = p_item FOR UPDATE;
  v_current := coalesce(v_current, 0);
  IF v_current + p_delta < 0 THEN
    RAISE EXCEPTION 'الكمية غير متوفرة في المخزون';
  END IF;
  IF v_current + p_delta = 0 THEN
    DELETE FROM public.inventory WHERE user_id = p_user AND item_key = p_item;
  ELSE
    INSERT INTO public.inventory (user_id, item_key, quantity) VALUES (p_user, p_item, v_current + p_delta)
    ON CONFLICT (user_id, item_key) DO UPDATE SET quantity = excluded.quantity;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.change_inventory(uuid, text, integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.change_inventory(uuid, text, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.add_farm_experience(p_user uuid, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.farm_state
  SET xp = xp + p_amount,
      level = greatest(level, least(20, 1 + floor(sqrt((xp + p_amount) / 50.0))::integer)),
      updated_at = now()
  WHERE user_id = p_user;
END;
$$;
REVOKE ALL ON FUNCTION public.add_farm_experience(uuid, integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_farm_experience(uuid, integer) TO service_role;
