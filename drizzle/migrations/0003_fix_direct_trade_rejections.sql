DO $fix$
DECLARE
  v_definition text;
BEGIN
  v_definition := pg_get_functiondef('public.trade_action(text,text,integer,uuid,integer)'::regprocedure);
  v_definition := replace(v_definition,
    $$UPDATE public.direct_trades SET status = 'rejected', resolved_at = now() WHERE id = v_trade.id;
    PERFORM public.change_inventory(v_uid, v_trade.item_key, v_trade.quantity);$$,
    $$UPDATE public.direct_trades SET status = 'rejected', resolved_at = now() WHERE id = v_trade.id;
    PERFORM public.change_inventory(v_trade.sender_id, v_trade.item_key, v_trade.quantity);$$);
  IF v_definition NOT LIKE '%PERFORM public.change_inventory(v_trade.sender_id, v_trade.item_key, v_trade.quantity);%' THEN RAISE EXCEPTION 'Could not repair rejected direct offers'; END IF;
  EXECUTE v_definition;
END;
$fix$;