CREATE OR REPLACE FUNCTION public.catalog_sale_price(p_item text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_item
    WHEN 'wheat' THEN 4 WHEN 'carrot' THEN 9 WHEN 'potato' THEN 15 WHEN 'corn' THEN 23 WHEN 'sunflower' THEN 34
    WHEN 'egg' THEN 8 WHEN 'milk' THEN 45 WHEN 'wool' THEN 60
    WHEN 'flour' THEN 18 WHEN 'feed' THEN 14 WHEN 'bread' THEN 85 WHEN 'plank' THEN 70
    WHEN 'wood' THEN 5 WHEN 'stone' THEN 6 WHEN 'herb' THEN 7 WHEN 'fibre' THEN 5 WHEN 'iron' THEN 22
    ELSE NULL END;
$$;
REVOKE ALL ON FUNCTION public.catalog_sale_price(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.catalog_sale_price(text) TO service_role;

CREATE OR REPLACE FUNCTION public.farm_action(
  p_action text,
  p_item text DEFAULT '',
  p_quantity integer DEFAULT 1,
  p_field integer DEFAULT 0,
  p_recipe text DEFAULT '',
  p_target uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_state public.farm_state%ROWTYPE;
  v_crop public.crops%ROWTYPE;
  v_animal public.animals%ROWTYPE;
  v_building public.buildings%ROWTYPE;
  v_resource public.resource_nodes%ROWTYPE;
  v_stats public.farm_stats%ROWTYPE;
  v_cost integer;
  v_level integer;
  v_seconds integer;
  v_yield integer;
  v_xp integer;
  v_price integer;
  v_required_region text;
  v_count integer;
  v_reward integer;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'سجّل الدخول أولاً'; END IF;
  SELECT * INTO v_state FROM public.farm_state WHERE user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'لم يتم تجهيز المزرعة بعد'; END IF;

  IF p_action = 'rename' THEN
    IF char_length(trim(p_item)) NOT BETWEEN 2 AND 24 THEN RAISE EXCEPTION 'اسم المزارع يجب أن يكون بين حرفين و24 حرفاً'; END IF;
    UPDATE public.profiles SET farmer_name = trim(p_item) WHERE id = v_uid;
    RETURN 'تم تحديث اسم المزارع';

  ELSIF p_action = 'buy_seed' THEN
    IF p_quantity < 1 OR p_quantity > 99 THEN RAISE EXCEPTION 'الكمية يجب أن تكون بين 1 و99'; END IF;
    CASE p_item
      WHEN 'wheat' THEN v_cost := 6; v_level := 1;
      WHEN 'carrot' THEN v_cost := 10; v_level := 1;
      WHEN 'potato' THEN v_cost := 16; v_level := 2;
      WHEN 'corn' THEN v_cost := 24; v_level := 3;
      WHEN 'sunflower' THEN v_cost := 35; v_level := 4;
      ELSE RAISE EXCEPTION 'هذه البذور غير متوفرة';
    END CASE;
    IF v_state.level < v_level THEN RAISE EXCEPTION 'تفتح هذه البذور عند المستوى %', v_level; END IF;
    IF v_state.coins < v_cost * p_quantity THEN RAISE EXCEPTION 'الرصيد لا يكفي لشراء البذور'; END IF;
    UPDATE public.farm_state SET coins = coins - v_cost * p_quantity, updated_at = now() WHERE user_id = v_uid;
    PERFORM public.change_inventory(v_uid, p_item || '_seed', p_quantity);
    INSERT INTO public.ledger (user_id, action_key, item_key, quantity, coins, description)
      VALUES (v_uid, 'buy_seed', p_item || '_seed', p_quantity, -v_cost * p_quantity, 'شراء بذور من متجر المزرعة');
    RETURN 'أُضيفت البذور إلى المخزون';

  ELSIF p_action = 'sell_item' THEN
    IF p_quantity < 1 OR p_quantity > 9999 THEN RAISE EXCEPTION 'كمية غير صالحة'; END IF;
    v_price := public.catalog_sale_price(p_item);
    IF v_price IS NULL THEN RAISE EXCEPTION 'هذا العنصر غير قابل للبيع المباشر'; END IF;
    PERFORM public.change_inventory(v_uid, p_item, -p_quantity);
    UPDATE public.farm_state SET coins = coins + v_price * p_quantity, updated_at = now() WHERE user_id = v_uid;
    INSERT INTO public.ledger (user_id, action_key, item_key, quantity, coins, description)
      VALUES (v_uid, 'sell_item', p_item, p_quantity, v_price * p_quantity, 'بيع للمتجر المحلي بالسعر الثابت');
    RETURN 'تم البيع وإضافة الثمن إلى رصيدك';

  ELSIF p_action = 'plant' THEN
    IF p_field NOT BETWEEN 1 AND 9 THEN RAISE EXCEPTION 'الحقل غير معروف'; END IF;
    CASE p_item
      WHEN 'wheat' THEN v_level := 1; v_seconds := 45; v_xp := 4;
      WHEN 'carrot' THEN v_level := 1; v_seconds := 60; v_xp := 5;
      WHEN 'potato' THEN v_level := 2; v_seconds := 90; v_xp := 7;
      WHEN 'corn' THEN v_level := 3; v_seconds := 120; v_xp := 9;
      WHEN 'sunflower' THEN v_level := 4; v_seconds := 150; v_xp := 12;
      ELSE RAISE EXCEPTION 'المحصول غير معروف';
    END CASE;
    IF v_state.level < v_level THEN RAISE EXCEPTION 'هذا المحصول مغلق حتى المستوى %', v_level; END IF;
    IF EXISTS (SELECT 1 FROM public.crops WHERE user_id = v_uid AND field_id = p_field) THEN RAISE EXCEPTION 'هذا الحقل مشغول بمحصول آخر'; END IF;
    PERFORM public.change_inventory(v_uid, p_item || '_seed', -1);
    INSERT INTO public.crops (user_id, field_id, crop_key, ready_at) VALUES (v_uid, p_field, p_item, now() + make_interval(secs => v_seconds));
    UPDATE public.farm_stats SET planted = planted + 1 WHERE user_id = v_uid;
    PERFORM public.add_farm_experience(v_uid, v_xp);
    RETURN 'زرعت المحصول؛ سينمو حتى عند إغلاق اللعبة';

  ELSIF p_action = 'harvest' THEN
    SELECT * INTO v_crop FROM public.crops WHERE user_id = v_uid AND field_id = p_field FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'لا يوجد محصول في هذا الحقل'; END IF;
    IF v_crop.ready_at > now() THEN RAISE EXCEPTION 'المحصول لم يكتمل نموه بعد'; END IF;
    CASE v_crop.crop_key
      WHEN 'wheat' THEN v_yield := 3; v_xp := 12;
      WHEN 'carrot' THEN v_yield := 2; v_xp := 16;
      WHEN 'potato' THEN v_yield := 2; v_xp := 24;
      WHEN 'corn' THEN v_yield := 2; v_xp := 32;
      WHEN 'sunflower' THEN v_yield := 2; v_xp := 40;
      ELSE RAISE EXCEPTION 'المحصول غير معروف';
    END CASE;
    PERFORM public.change_inventory(v_uid, v_crop.crop_key, v_yield);
    DELETE FROM public.crops WHERE user_id = v_uid AND field_id = p_field;
    UPDATE public.farm_stats SET harvested = harvested + 1 WHERE user_id = v_uid;
    PERFORM public.add_farm_experience(v_uid, v_xp);
    RETURN 'تم الحصاد وإضافة المحصول إلى المخزون';

  ELSIF p_action = 'buy_animal' THEN
    CASE p_item
      WHEN 'chicken' THEN v_cost := 70; v_level := 2;
      WHEN 'cow' THEN v_cost := 180; v_level := 4;
      WHEN 'sheep' THEN v_cost := 240; v_level := 5;
      ELSE RAISE EXCEPTION 'هذا الحيوان غير متوفر';
    END CASE;
    IF v_state.level < v_level THEN RAISE EXCEPTION 'يفتح الحيوان عند المستوى %', v_level; END IF;
    SELECT count(*) INTO v_count FROM public.animals WHERE user_id = v_uid;
    IF v_count >= 12 THEN RAISE EXCEPTION 'الحظيرة ممتلئة؛ سعتها 12 حيواناً'; END IF;
    IF v_state.coins < v_cost THEN RAISE EXCEPTION 'الرصيد لا يكفي لشراء الحيوان'; END IF;
    UPDATE public.farm_state SET coins = coins - v_cost, updated_at = now() WHERE user_id = v_uid;
    INSERT INTO public.animals (user_id, animal_key) VALUES (v_uid, p_item);
    INSERT INTO public.ledger (user_id, action_key, item_key, quantity, coins, description)
      VALUES (v_uid, 'buy_animal', p_item, 1, -v_cost, 'شراء حيوان للحظيرة');
    RETURN 'وصل الحيوان إلى الحظيرة';

  ELSIF p_action = 'feed_animal' THEN
    SELECT * INTO v_animal FROM public.animals WHERE id = p_target AND user_id = v_uid FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'الحيوان غير موجود'; END IF;
    IF v_animal.ready_at IS NOT NULL THEN RAISE EXCEPTION 'الحيوان يُنتج بالفعل أو ينتظر الجمع'; END IF;
    CASE v_animal.animal_key
      WHEN 'chicken' THEN v_seconds := 45;
      WHEN 'cow' THEN v_seconds := 90;
      WHEN 'sheep' THEN v_seconds := 120;
      ELSE RAISE EXCEPTION 'الحيوان غير معروف';
    END CASE;
    PERFORM public.change_inventory(v_uid, 'feed', -1);
    UPDATE public.animals SET ready_at = now() + make_interval(secs => v_seconds) WHERE id = v_animal.id;
    RETURN 'أكل الحيوان وبدأ دورة الإنتاج';

  ELSIF p_action = 'collect_animal' THEN
    SELECT * INTO v_animal FROM public.animals WHERE id = p_target AND user_id = v_uid FOR UPDATE;
    IF NOT FOUND OR v_animal.ready_at IS NULL THEN RAISE EXCEPTION 'الحيوان يحتاج إلى علف أولاً'; END IF;
    IF v_animal.ready_at > now() THEN RAISE EXCEPTION 'المنتج لم يجهز بعد'; END IF;
    CASE v_animal.animal_key
      WHEN 'chicken' THEN v_yield := 2; v_xp := 15; PERFORM public.change_inventory(v_uid, 'egg', 2);
      WHEN 'cow' THEN v_yield := 1; v_xp := 30; PERFORM public.change_inventory(v_uid, 'milk', 1);
      WHEN 'sheep' THEN v_yield := 1; v_xp := 38; PERFORM public.change_inventory(v_uid, 'wool', 1);
      ELSE RAISE EXCEPTION 'الحيوان غير معروف';
    END CASE;
    UPDATE public.animals SET ready_at = NULL WHERE id = v_animal.id;
    UPDATE public.farm_stats SET animal_products = animal_products + 1 WHERE user_id = v_uid;
    PERFORM public.add_farm_experience(v_uid, v_xp);
    RETURN 'جُمع المنتج وأصبح الحيوان جاهزاً للعلف من جديد';

  ELSIF p_action = 'gather' THEN
    CASE p_item
      WHEN 'tree-1' THEN v_required_region := NULL; v_seconds := 60; v_yield := 2; v_cost := 1;
      WHEN 'tree-2' THEN v_required_region := NULL; v_seconds := 60; v_yield := 2; v_cost := 1;
      WHEN 'rock-1' THEN v_required_region := NULL; v_seconds := 75; v_yield := 2; v_cost := 2;
      WHEN 'herb-1' THEN v_required_region := NULL; v_seconds := 45; v_yield := 2; v_cost := 3;
      WHEN 'fibre-1' THEN v_required_region := NULL; v_seconds := 45; v_yield := 3; v_cost := 4;
      WHEN 'forest-tree' THEN v_required_region := 'forest'; v_seconds := 50; v_yield := 5; v_cost := 1;
      WHEN 'mine-rock' THEN v_required_region := 'mines'; v_seconds := 60; v_yield := 4; v_cost := 2;
      WHEN 'mine-iron' THEN v_required_region := 'mines'; v_seconds := 100; v_yield := 2; v_cost := 5;
      WHEN 'pasture-herb' THEN v_required_region := 'pasture'; v_seconds := 40; v_yield := 5; v_cost := 3;
      ELSE RAISE EXCEPTION 'مصدر المورد غير معروف';
    END CASE;
    IF v_required_region IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.player_regions WHERE user_id = v_uid AND region_id = v_required_region) THEN
      RAISE EXCEPTION 'افتح الجزيرة أولاً';
    END IF;
    SELECT * INTO v_resource FROM public.resource_nodes WHERE user_id = v_uid AND node_key = p_item FOR UPDATE;
    IF FOUND AND v_resource.ready_at > now() THEN RAISE EXCEPTION 'المورد يتجدد؛ عد إليه لاحقاً'; END IF;
    v_price := CASE v_cost WHEN 1 THEN 'wood'::integer WHEN 2 THEN 2 WHEN 3 THEN 3 WHEN 4 THEN 4 ELSE 5 END;
    IF v_cost = 1 THEN PERFORM public.change_inventory(v_uid, 'wood', v_yield);
    ELSIF v_cost = 2 THEN PERFORM public.change_inventory(v_uid, 'stone', v_yield);
    ELSIF v_cost = 3 THEN PERFORM public.change_inventory(v_uid, 'herb', v_yield);
    ELSIF v_cost = 4 THEN PERFORM public.change_inventory(v_uid, 'fibre', v_yield);
    ELSE PERFORM public.change_inventory(v_uid, 'iron', v_yield); END IF;
    INSERT INTO public.resource_nodes (user_id, node_key, ready_at) VALUES (v_uid, p_item, now() + make_interval(secs => v_seconds))
      ON CONFLICT (user_id, node_key) DO UPDATE SET ready_at = excluded.ready_at;
    UPDATE public.farm_stats SET gathered = gathered + 1 WHERE user_id = v_uid;
    PERFORM public.add_farm_experience(v_uid, 8 + v_yield);
    RETURN 'جُمعت الموارد وأُضيفت إلى المخزون';

  ELSIF p_action = 'buy_building' THEN
    CASE p_item
      WHEN 'mill' THEN v_cost := 140; v_level := 2;
      WHEN 'feed_mill' THEN v_cost := 160; v_level := 2;
      WHEN 'bakery' THEN v_cost := 220; v_level := 3;
      WHEN 'workshop' THEN v_cost := 320; v_level := 5;
      ELSE RAISE EXCEPTION 'المنشأة غير معروفة';
    END CASE;
    IF v_state.level < v_level THEN RAISE EXCEPTION 'تفتح المنشأة عند المستوى %', v_level; END IF;
    IF EXISTS (SELECT 1 FROM public.buildings WHERE user_id = v_uid AND building_key = p_item) THEN RAISE EXCEPTION 'تمتلك هذه المنشأة بالفعل'; END IF;
    IF v_state.coins < v_cost THEN RAISE EXCEPTION 'الرصيد لا يكفي لبناء المنشأة'; END IF;
    UPDATE public.farm_state SET coins = coins - v_cost, updated_at = now() WHERE user_id = v_uid;
    INSERT INTO public.buildings (user_id, building_key) VALUES (v_uid, p_item);
    INSERT INTO public.ledger (user_id, action_key, item_key, quantity, coins, description)
      VALUES (v_uid, 'buy_building', p_item, 1, -v_cost, 'بناء منشأة إنتاج داخل المزرعة');
    RETURN 'اكتملت المنشأة وأصبحت جاهزة للإنتاج';

  ELSIF p_action = 'start_recipe' THEN
    SELECT * INTO v_building FROM public.buildings WHERE user_id = v_uid AND building_key = p_item FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'ابنِ هذه المنشأة أولاً'; END IF;
    IF v_building.active_recipe IS NOT NULL THEN RAISE EXCEPTION 'المنشأة مشغولة؛ اجمع المنتج أولاً'; END IF;
    IF p_item = 'mill' AND p_recipe = 'flour' THEN
      PERFORM public.change_inventory(v_uid, 'wheat', -2); v_seconds := 20;
    ELSIF p_item = 'feed_mill' AND p_recipe = 'feed' THEN
      PERFORM public.change_inventory(v_uid, 'wheat', -3); v_seconds := 20;
    ELSIF p_item = 'bakery' AND p_recipe = 'bread' THEN
      PERFORM public.change_inventory(v_uid, 'flour', -2); PERFORM public.change_inventory(v_uid, 'egg', -1); v_seconds := 30;
    ELSIF p_item = 'workshop' AND p_recipe = 'plank' THEN
      PERFORM public.change_inventory(v_uid, 'wood', -3); PERFORM public.change_inventory(v_uid, 'stone', -2); v_seconds := 35;
    ELSE RAISE EXCEPTION 'الوصفة لا تنتمي إلى هذه المنشأة'; END IF;
    UPDATE public.buildings SET active_recipe = p_recipe, started_at = now(), ready_at = now() + make_interval(secs => v_seconds) WHERE user_id = v_uid AND building_key = p_item;
    RETURN 'بدأ الإنتاج بعد خصم المكونات';

  ELSIF p_action = 'collect_recipe' THEN
    SELECT * INTO v_building FROM public.buildings WHERE user_id = v_uid AND building_key = p_item FOR UPDATE;
    IF NOT FOUND OR v_building.active_recipe IS NULL THEN RAISE EXCEPTION 'لا يوجد إنتاج في هذه المنشأة'; END IF;
    IF v_building.ready_at > now() THEN RAISE EXCEPTION 'الإنتاج لم يكتمل بعد'; END IF;
    CASE v_building.active_recipe
      WHEN 'flour' THEN PERFORM public.change_inventory(v_uid, 'flour', 1); v_xp := 10;
      WHEN 'feed' THEN PERFORM public.change_inventory(v_uid, 'feed', 2); v_xp := 10;
      WHEN 'bread' THEN PERFORM public.change_inventory(v_uid, 'bread', 1); v_xp := 20;
      WHEN 'plank' THEN PERFORM public.change_inventory(v_uid, 'plank', 1); v_xp := 24;
      ELSE RAISE EXCEPTION 'الوصفة غير معروفة';
    END CASE;
    UPDATE public.buildings SET active_recipe = NULL, started_at = NULL, ready_at = NULL WHERE user_id = v_uid AND building_key = p_item;
    UPDATE public.farm_stats SET crafted = crafted + 1 WHERE user_id = v_uid;
    PERFORM public.add_farm_experience(v_uid, v_xp);
    RETURN 'اكتمل الإنتاج وأُضيف المنتج إلى المخزون';

  ELSIF p_action = 'unlock_region' THEN
    IF EXISTS (SELECT 1 FROM public.player_regions WHERE user_id = v_uid AND region_id = p_item) THEN RAISE EXCEPTION 'الجزيرة مفتوحة بالفعل'; END IF;
    CASE p_item
      WHEN 'forest' THEN v_cost := 100; v_level := 2;
      WHEN 'mines' THEN v_cost := 150; v_level := 3;
      WHEN 'pasture' THEN v_cost := 220; v_level := 4;
      WHEN 'workshops' THEN v_cost := 300; v_level := 5;
      ELSE RAISE EXCEPTION 'الجزيرة غير معروفة';
    END CASE;
    IF v_state.level < v_level THEN RAISE EXCEPTION 'تفتح الجزيرة عند المستوى %', v_level; END IF;
    IF v_state.coins < v_cost THEN RAISE EXCEPTION 'الرصيد لا يكفي لفتح الجزيرة'; END IF;
    IF p_item = 'mines' THEN PERFORM public.change_inventory(v_uid, 'wood', -8); PERFORM public.change_inventory(v_uid, 'stone', -6); END IF;
    IF p_item = 'pasture' THEN PERFORM public.change_inventory(v_uid, 'feed', -2); END IF;
    IF p_item = 'workshops' THEN PERFORM public.change_inventory(v_uid, 'wood', -12); PERFORM public.change_inventory(v_uid, 'stone', -10); END IF;
    UPDATE public.farm_state SET coins = coins - v_cost, updated_at = now() WHERE user_id = v_uid;
    INSERT INTO public.player_regions (user_id, region_id) VALUES (v_uid, p_item);
    INSERT INTO public.ledger (user_id, action_key, item_key, quantity, coins, description)
      VALUES (v_uid, 'unlock_region', p_item, 1, -v_cost, 'فتح معبر وجزيرة جديدة');
    PERFORM public.add_farm_experience(v_uid, 30);
    RETURN 'فُتح المعبر وأصبحت الجزيرة قابلة للاستكشاف';

  ELSIF p_action = 'claim_quest' THEN
    IF EXISTS (SELECT 1 FROM public.quest_claims WHERE user_id = v_uid AND quest_id = p_item) THEN RAISE EXCEPTION 'تم استلام مكافأة هذه المهمة'; END IF;
    SELECT * INTO v_stats FROM public.farm_stats WHERE user_id = v_uid;
    CASE p_item
      WHEN 'first_seed' THEN IF v_stats.planted < 1 THEN RAISE EXCEPTION 'ازرع أول محصول لإكمال المهمة'; END IF; v_reward := 30; v_xp := 20;
      WHEN 'harvest_3' THEN IF v_stats.harvested < 3 THEN RAISE EXCEPTION 'احصد ثلاثة محاصيل لإكمال المهمة'; END IF; v_reward := 60; v_xp := 40;
      WHEN 'gather_3' THEN IF v_stats.gathered < 3 THEN RAISE EXCEPTION 'اجمع الموارد ثلاث مرات لإكمال المهمة'; END IF; v_reward := 45; v_xp := 30;
      WHEN 'animal_1' THEN IF v_stats.animal_products < 1 THEN RAISE EXCEPTION 'اجمع أول منتج حيواني'; END IF; v_reward := 70; v_xp := 40;
      WHEN 'craft_1' THEN IF v_stats.crafted < 1 THEN RAISE EXCEPTION 'أكمل أول وصفة إنتاج'; END IF; v_reward := 80; v_xp := 50;
      WHEN 'trade_1' THEN IF v_stats.trades < 1 THEN RAISE EXCEPTION 'أكمل أول صفقة مع لاعب'; END IF; v_reward := 100; v_xp := 60;
      ELSE RAISE EXCEPTION 'المهمة غير معروفة';
    END CASE;
    INSERT INTO public.quest_claims (user_id, quest_id) VALUES (v_uid, p_item);
    UPDATE public.farm_state SET coins = coins + v_reward, updated_at = now() WHERE user_id = v_uid;
    INSERT INTO public.ledger (user_id, action_key, item_key, quantity, coins, description)
      VALUES (v_uid, 'quest_reward', p_item, 1, v_reward, 'مكافأة إكمال مهمة');
    PERFORM public.add_farm_experience(v_uid, v_xp);
    RETURN 'استلمت مكافأة المهمة';

  ELSE
    RAISE EXCEPTION 'الإجراء غير معروف';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.farm_action(text, text, integer, integer, text, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.farm_action(text, text, integer, integer, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.farm_action(text, text, integer, integer, text, uuid) TO service_role;
