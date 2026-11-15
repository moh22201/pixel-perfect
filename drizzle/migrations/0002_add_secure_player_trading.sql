DO $fix$
DECLARE
  v_definition text;
BEGIN
  v_definition := pg_get_functiondef('public.farm_action(text,text,integer,integer,text,uuid)'::regprocedure);
  v_definition := replace(v_definition, $$v_price := CASE v_cost WHEN 1 THEN 'wood'::integer WHEN 2 THEN 2 WHEN 3 THEN 3 WHEN 4 THEN 4 ELSE 5 END;$$, 'v_price := 0;');
  IF v_definition NOT LIKE '%v_price := 0;%' THEN RAISE EXCEPTION 'Could not repair resource gathering branch'; END IF;
  EXECUTE v_definition;
END;
$fix$;

CREATE OR REPLACE FUNCTION public.trade_action(
  p_action text,
  p_item text DEFAULT '',
  p_quantity integer DEFAULT 1,
  p_target uuid DEFAULT NULL,
  p_price integer DEFAULT 0
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_listing public.market_listings%ROWTYPE;
  v_trade public.direct_trades%ROWTYPE;
  v_buyer public.farm_state%ROWTYPE;
  v_recipient public.farm_state%ROWTYPE;
  v_total integer;
  v_sale integer;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'سجّل الدخول أولاً'; END IF;

  IF p_action = 'list_item' THEN
    IF p_quantity < 1 OR p_quantity > 9999 OR p_price < 1 OR p_price > 1000000 THEN RAISE EXCEPTION 'الكمية أو السعر غير صالح'; END IF;
    v_sale := public.catalog_sale_price(p_item);
    IF v_sale IS NULL THEN RAISE EXCEPTION 'هذا العنصر لا يمكن عرضه في السوق'; END IF;
    PERFORM public.change_inventory(v_uid, p_item, -p_quantity);
    INSERT INTO public.market_listings (seller_id, item_key, quantity, unit_price) VALUES (v_uid, p_item, p_quantity, p_price);
    RETURN 'حُجزت الكمية من مخزونك وظهر عرضك في السوق';

  ELSIF p_action = 'cancel_listing' THEN
    SELECT * INTO v_listing FROM public.market_listings WHERE id = p_target AND seller_id = v_uid FOR UPDATE;
    IF NOT FOUND OR v_listing.status <> 'open' THEN RAISE EXCEPTION 'العرض غير متاح للإلغاء'; END IF;
    UPDATE public.market_listings SET status = 'cancelled', filled_at = now() WHERE id = v_listing.id;
    PERFORM public.change_inventory(v_uid, v_listing.item_key, v_listing.quantity);
    RETURN 'أُلغي العرض وعادت الكمية إلى مخزونك';

  ELSIF p_action = 'buy_listing' THEN
    SELECT * INTO v_listing FROM public.market_listings WHERE id = p_target FOR UPDATE;
    IF NOT FOUND OR v_listing.status <> 'open' THEN RAISE EXCEPTION 'تم بيع هذا العرض أو إلغاؤه'; END IF;
    IF v_listing.seller_id = v_uid THEN RAISE EXCEPTION 'يمكنك إلغاء عرضك، لا شراؤه'; END IF;
    v_total := v_listing.quantity * v_listing.unit_price;
    PERFORM user_id FROM public.farm_state WHERE user_id IN (v_uid, v_listing.seller_id) ORDER BY user_id FOR UPDATE;
    SELECT * INTO v_buyer FROM public.farm_state WHERE user_id = v_uid;
    IF v_buyer.coins < v_total THEN RAISE EXCEPTION 'الرصيد لا يكفي لإتمام الصفقة'; END IF;
    UPDATE public.farm_state SET coins = coins - v_total, updated_at = now() WHERE user_id = v_uid;
    UPDATE public.farm_state SET coins = coins + v_total, updated_at = now() WHERE user_id = v_listing.seller_id;
    PERFORM public.change_inventory(v_uid, v_listing.item_key, v_listing.quantity);
    UPDATE public.market_listings SET status = 'filled', buyer_id = v_uid, filled_at = now() WHERE id = v_listing.id;
    UPDATE public.farm_stats SET trades = trades + 1 WHERE user_id IN (v_uid, v_listing.seller_id);
    INSERT INTO public.ledger (user_id, action_key, item_key, quantity, coins, description)
      VALUES (v_uid, 'market_buy', v_listing.item_key, v_listing.quantity, -v_total, 'شراء من السوق العالمي'),
             (v_listing.seller_id, 'market_sell', v_listing.item_key, v_listing.quantity, v_total, 'بيع في السوق العالمي');
    RETURN 'تمت الصفقة وانتقل المنتج والرصيد بين اللاعبين';

  ELSIF p_action = 'direct_offer' THEN
    IF p_target IS NULL OR p_target = v_uid THEN RAISE EXCEPTION 'اختر لاعباً آخر للتجارة'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_target) THEN RAISE EXCEPTION 'اللاعب غير موجود'; END IF;
    IF p_quantity < 1 OR p_quantity > 9999 OR p_price < 1 OR p_price > 1000000 THEN RAISE EXCEPTION 'الكمية أو السعر غير صالح'; END IF;
    v_sale := public.catalog_sale_price(p_item);
    IF v_sale IS NULL THEN RAISE EXCEPTION 'هذا العنصر لا يمكن تقديمه للتجارة'; END IF;
    PERFORM public.change_inventory(v_uid, p_item, -p_quantity);
    INSERT INTO public.direct_trades (sender_id, recipient_id, item_key, quantity, price) VALUES (v_uid, p_target, p_item, p_quantity, p_price);
    RETURN 'أُرسل العرض وحُجزت المنتجات حتى رد اللاعب الآخر';

  ELSIF p_action = 'direct_cancel' THEN
    SELECT * INTO v_trade FROM public.direct_trades WHERE id = p_target AND sender_id = v_uid FOR UPDATE;
    IF NOT FOUND OR v_trade.status <> 'pending' THEN RAISE EXCEPTION 'العرض غير متاح للإلغاء'; END IF;
    UPDATE public.direct_trades SET status = 'cancelled', resolved_at = now() WHERE id = v_trade.id;
    PERFORM public.change_inventory(v_uid, v_trade.item_key, v_trade.quantity);
    RETURN 'أُلغي العرض وعادت المنتجات إليك';

  ELSIF p_action = 'direct_reject' THEN
    SELECT * INTO v_trade FROM public.direct_trades WHERE id = p_target AND recipient_id = v_uid FOR UPDATE;
    IF NOT FOUND OR v_trade.status <> 'pending' THEN RAISE EXCEPTION 'العرض غير متاح للرفض'; END IF;
    UPDATE public.direct_trades SET status = 'rejected', resolved_at = now() WHERE id = v_trade.id;
    PERFORM public.change_inventory(v_uid, v_trade.item_key, v_trade.quantity);
    RETURN 'رُفض العرض وعادت المنتجات إلى صاحبها';

  ELSIF p_action = 'direct_accept' THEN
    SELECT * INTO v_trade FROM public.direct_trades WHERE id = p_target AND recipient_id = v_uid FOR UPDATE;
    IF NOT FOUND OR v_trade.status <> 'pending' THEN RAISE EXCEPTION 'تمت معالجة هذا العرض مسبقاً'; END IF;
    PERFORM user_id FROM public.farm_state WHERE user_id IN (v_uid, v_trade.sender_id) ORDER BY user_id FOR UPDATE;
    SELECT * INTO v_recipient FROM public.farm_state WHERE user_id = v_uid;
    IF v_recipient.coins < v_trade.price THEN RAISE EXCEPTION 'رصيدك لا يكفي لقبول هذا العرض'; END IF;
    UPDATE public.farm_state SET coins = coins - v_trade.price, updated_at = now() WHERE user_id = v_uid;
    UPDATE public.farm_state SET coins = coins + v_trade.price, updated_at = now() WHERE user_id = v_trade.sender_id;
    PERFORM public.change_inventory(v_uid, v_trade.item_key, v_trade.quantity);
    UPDATE public.direct_trades SET status = 'accepted', resolved_at = now() WHERE id = v_trade.id;
    UPDATE public.farm_stats SET trades = trades + 1 WHERE user_id IN (v_uid, v_trade.sender_id);
    INSERT INTO public.ledger (user_id, action_key, item_key, quantity, coins, description)
      VALUES (v_uid, 'direct_buy', v_trade.item_key, v_trade.quantity, -v_trade.price, 'قبول عرض تجاري مباشر'),
             (v_trade.sender_id, 'direct_sell', v_trade.item_key, v_trade.quantity, v_trade.price, 'قبول اللاعب الآخر للعرض المباشر');
    RETURN 'تمت التجارة المباشرة وتحدّث الرصيد والمخزون';

  ELSE
    RAISE EXCEPTION 'إجراء التجارة غير معروف';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.trade_action(text, text, integer, uuid, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.trade_action(text, text, integer, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.trade_action(text, text, integer, uuid, integer) TO service_role;
