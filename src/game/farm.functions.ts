import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { FarmState, TradeState } from './catalog';

function fail(error: { message: string } | null) { if (error) throw new Error(error.message); }
function requireRow<T>(row: T | null): T {
  if (row === null) throw new Error('تعذر تحميل المزرعة');
  return row;
}

export const getFarmState = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FarmState> => {
    const db = context.supabase;
    const [profile, farm, inventory, crops, animals, buildings, resources, regions, stats, claims, ledger] = await Promise.all([
      db.from('profiles').select('id, farmer_name').eq('id', context.userId).single(),
      db.from('farm_state').select('coins, xp, level').eq('user_id', context.userId).single(),
      db.from('inventory').select('item_key, quantity').eq('user_id', context.userId).order('item_key'),
      db.from('crops').select('field_id, crop_key, planted_at, ready_at').eq('user_id', context.userId),
      db.from('animals').select('id, animal_key, ready_at').eq('user_id', context.userId).order('created_at'),
      db.from('buildings').select('building_key, active_recipe, started_at, ready_at').eq('user_id', context.userId),
      db.from('resource_nodes').select('node_key, ready_at').eq('user_id', context.userId),
      db.from('player_regions').select('region_id').eq('user_id', context.userId),
      db.from('farm_stats').select('planted, harvested, gathered, animal_products, crafted, trades').eq('user_id', context.userId).single(),
      db.from('quest_claims').select('quest_id').eq('user_id', context.userId),
      db.from('ledger').select('id, action_key, item_key, quantity, coins, description, created_at').eq('user_id', context.userId).order('id', { ascending: false }).limit(16),
    ]);
    for (const result of [profile, farm, inventory, crops, animals, buildings, resources, regions, stats, claims, ledger]) fail(result.error);
    return {
      profile: requireRow(profile.data), farm: requireRow(farm.data), inventory: inventory.data ?? [], crops: crops.data ?? [],
      animals: animals.data ?? [], buildings: buildings.data ?? [], resources: resources.data ?? [], regions: regions.data ?? [],
      stats: requireRow(stats.data), claims: claims.data ?? [], ledger: ledger.data ?? [], now: new Date().toISOString(),
    };
  });

export const getTradeState = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TradeState> => {
    const db = context.supabase;
    const [listings, trades, directory] = await Promise.all([
      db.from('market_listings').select('id, seller_id, buyer_id, item_key, quantity, unit_price, status, created_at').order('created_at', { ascending: false }).limit(100),
      db.from('direct_trades').select('id, sender_id, recipient_id, item_key, quantity, price, status, created_at').order('created_at', { ascending: false }).limit(100),
      db.from('profiles').select('id, farmer_name').order('farmer_name').limit(200),
    ]);
    fail(listings.error); fail(trades.error); fail(directory.error);
    return { listings: listings.data ?? [], trades: trades.data ?? [], directory: directory.data ?? [], now: new Date().toISOString() };
  });

const farmInput = z.object({
  action: z.enum(['rename', 'buy_seed', 'sell_item', 'plant', 'harvest', 'buy_animal', 'feed_animal', 'collect_animal', 'gather', 'buy_building', 'start_recipe', 'collect_recipe', 'unlock_region', 'claim_quest']),
  item: z.string().max(40).optional(), quantity: z.number().int().min(1).max(9999).optional(),
  field: z.number().int().min(1).max(9).optional(), recipe: z.string().max(30).optional(), target: z.string().uuid().optional(),
});
export type FarmAction = z.infer<typeof farmInput>;

export const runFarmAction = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(farmInput)
  .handler(async ({ data, context }) => {
    const { data: message, error } = await context.supabase.rpc('farm_action', {
      p_action: data.action, p_item: data.item ?? '', p_quantity: data.quantity ?? 1,
      p_field: data.field ?? 0, p_recipe: data.recipe ?? '', ...(data.target ? { p_target: data.target } : {}),
    });
    fail(error);
    return { message };
  });

const tradeInput = z.object({
  action: z.enum(['list_item', 'cancel_listing', 'buy_listing', 'direct_offer', 'direct_cancel', 'direct_reject', 'direct_accept']),
  item: z.string().max(40).optional(), quantity: z.number().int().min(1).max(9999).optional(),
  target: z.string().uuid().optional(), price: z.number().int().min(1).max(1000000).optional(),
});
export type TradeAction = z.infer<typeof tradeInput>;

export const runTradeAction = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(tradeInput)
  .handler(async ({ data, context }) => {
    const { data: message, error } = await context.supabase.rpc('trade_action', {
      p_action: data.action, p_item: data.item ?? '', p_quantity: data.quantity ?? 1,
      ...(data.target ? { p_target: data.target } : {}), p_price: data.price ?? 0,
    });
    fail(error);
    return { message };
  });
