export type CropKey = 'wheat' | 'carrot' | 'potato' | 'corn' | 'sunflower';
export type AnimalKey = 'chicken' | 'cow' | 'sheep';
export type BuildingKey = 'mill' | 'feed_mill' | 'bakery' | 'workshop';

export const crops: Record<CropKey, { name: string; seedPrice: number; growSeconds: number; yield: number; salePrice: number; level: number; xp: number }> = {
  wheat: { name: 'القمح', seedPrice: 6, growSeconds: 45, yield: 3, salePrice: 4, level: 1, xp: 12 },
  carrot: { name: 'الجزر', seedPrice: 10, growSeconds: 60, yield: 2, salePrice: 9, level: 1, xp: 16 },
  potato: { name: 'البطاطا', seedPrice: 16, growSeconds: 90, yield: 2, salePrice: 15, level: 2, xp: 24 },
  corn: { name: 'الذرة', seedPrice: 24, growSeconds: 120, yield: 2, salePrice: 23, level: 3, xp: 32 },
  sunflower: { name: 'عباد الشمس', seedPrice: 35, growSeconds: 150, yield: 2, salePrice: 34, level: 4, xp: 40 },
};

export const animals: Record<AnimalKey, { name: string; price: number; level: number; seconds: number; product: string; productName: string; yield: number }> = {
  chicken: { name: 'دجاجة', price: 70, level: 2, seconds: 45, product: 'egg', productName: 'بيضتان', yield: 2 },
  cow: { name: 'بقرة', price: 180, level: 4, seconds: 90, product: 'milk', productName: 'حليب', yield: 1 },
  sheep: { name: 'نعجة', price: 240, level: 5, seconds: 120, product: 'wool', productName: 'صوف', yield: 1 },
};

export const buildings: Record<BuildingKey, { name: string; price: number; level: number; description: string }> = {
  mill: { name: 'مطحنة الوادي', price: 140, level: 2, description: 'تحوّل القمح إلى دقيق.' },
  feed_mill: { name: 'مكبس الأعلاف', price: 160, level: 2, description: 'يحوّل القمح إلى علف للحيوانات.' },
  bakery: { name: 'مخبز البيت', price: 220, level: 3, description: 'يخبز الدقيق والبيض.' },
  workshop: { name: 'ورشة الخشب', price: 320, level: 5, description: 'تصنع ألواحاً من الخشب والحجر.' },
};

export const recipes: Record<BuildingKey, { key: string; name: string; seconds: number; ingredients: { item: string; quantity: number }[]; output: string; quantity: number }> = {
  mill: { key: 'flour', name: 'طحن الدقيق', seconds: 20, ingredients: [{ item: 'wheat', quantity: 2 }], output: 'flour', quantity: 1 },
  feed_mill: { key: 'feed', name: 'كبس العلف', seconds: 20, ingredients: [{ item: 'wheat', quantity: 3 }], output: 'feed', quantity: 2 },
  bakery: { key: 'bread', name: 'خبز ريفي', seconds: 30, ingredients: [{ item: 'flour', quantity: 2 }, { item: 'egg', quantity: 1 }], output: 'bread', quantity: 1 },
  workshop: { key: 'plank', name: 'لوح مصقول', seconds: 35, ingredients: [{ item: 'wood', quantity: 3 }, { item: 'stone', quantity: 2 }], output: 'plank', quantity: 1 },
};

export const itemNames: Record<string, string> = {
  wheat: 'قمح', carrot: 'جزر', potato: 'بطاطا', corn: 'ذرة', sunflower: 'عباد شمس',
  wheat_seed: 'بذور قمح', carrot_seed: 'بذور جزر', potato_seed: 'بذور بطاطا', corn_seed: 'بذور ذرة', sunflower_seed: 'بذور عباد شمس',
  egg: 'بيض', milk: 'حليب', wool: 'صوف', flour: 'دقيق', feed: 'علف', bread: 'خبز', plank: 'ألواح',
  wood: 'خشب', stone: 'حجر', herb: 'أعشاب', fibre: 'ألياف', iron: 'حديد خام',
};

export const salePrices: Record<string, number> = {
  wheat: 4, carrot: 9, potato: 15, corn: 23, sunflower: 34,
  egg: 8, milk: 45, wool: 60, flour: 18, feed: 14, bread: 85, plank: 70,
  wood: 5, stone: 6, herb: 7, fibre: 5, iron: 22,
};

export const itemSources: Record<string, string> = {
  wheat: 'حصاد حقل القمح', carrot: 'حصاد حقل الجزر', potato: 'حصاد حقل البطاطا', corn: 'حصاد حقل الذرة', sunflower: 'حصاد حقل عباد الشمس',
  egg: 'جمع من الدجاج', milk: 'جمع من الأبقار', wool: 'جمع من الأغنام', flour: 'مطحنة الوادي', feed: 'مكبس الأعلاف', bread: 'مخبز البيت', plank: 'ورشة الخشب',
  wood: 'قطع الأشجار', stone: 'تكسير الصخور', herb: 'جمع الأعشاب', fibre: 'جمع النباتات', iron: 'مناجم الجزيرة',
};

export const regionRules: Record<string, { price: number; level: number; requirements: { item: string; quantity: number }[] }> = {
  forest: { price: 100, level: 2, requirements: [] },
  mines: { price: 150, level: 3, requirements: [{ item: 'wood', quantity: 8 }, { item: 'stone', quantity: 6 }] },
  pasture: { price: 220, level: 4, requirements: [{ item: 'feed', quantity: 2 }] },
  workshops: { price: 300, level: 5, requirements: [{ item: 'wood', quantity: 12 }, { item: 'stone', quantity: 10 }] },
};

export const quests = [
  { id: 'first_seed', name: 'أول بذرة', description: 'ازرع محصولاً واحداً', stat: 'planted', goal: 1, coins: 30, xp: 20 },
  { id: 'harvest_3', name: 'سلة الموسم', description: 'احصد ثلاثة محاصيل', stat: 'harvested', goal: 3, coins: 60, xp: 40 },
  { id: 'gather_3', name: 'يد المزارع', description: 'اجمع الموارد ثلاث مرات', stat: 'gathered', goal: 3, coins: 45, xp: 30 },
  { id: 'animal_1', name: 'رعاية الحظيرة', description: 'اجمع أول منتج حيواني', stat: 'animal_products', goal: 1, coins: 70, xp: 40 },
  { id: 'craft_1', name: 'صنع في الوادي', description: 'أكمل وصفة إنتاج', stat: 'crafted', goal: 1, coins: 80, xp: 50 },
  { id: 'trade_1', name: 'سوق الجيران', description: 'أكمل صفقة مع لاعب', stat: 'trades', goal: 1, coins: 100, xp: 60 },
] as const;

export function itemName(key: string) { return itemNames[key] ?? key; }
export function formatSeconds(seconds: number) {
  const safe = Math.max(0, Math.ceil(seconds));
  return safe >= 60 ? `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}` : `${safe} ث`;
}
export function xpForLevel(level: number) { return 50 * (level - 1) ** 2; }
export function xpForNextLevel(level: number) { return 50 * level ** 2; }

export type FarmState = {
  profile: { id: string; farmer_name: string };
  farm: { coins: number; xp: number; level: number };
  inventory: { item_key: string; quantity: number }[];
  crops: { field_id: number; crop_key: string; planted_at: string; ready_at: string }[];
  animals: { id: string; animal_key: string; ready_at: string | null }[];
  buildings: { building_key: string; active_recipe: string | null; started_at: string | null; ready_at: string | null }[];
  resources: { node_key: string; ready_at: string }[];
  regions: { region_id: string }[];
  stats: { planted: number; harvested: number; gathered: number; animal_products: number; crafted: number; trades: number };
  claims: { quest_id: string }[];
  ledger: { id: number; action_key: string; item_key: string | null; quantity: number; coins: number; description: string; created_at: string }[];
  now: string;
};

export type TradeState = {
  listings: { id: string; seller_id: string; buyer_id: string | null; item_key: string; quantity: number; unit_price: number; status: string; created_at: string }[];
  trades: { id: string; sender_id: string; recipient_id: string; item_key: string; quantity: number; price: number; status: string; created_at: string }[];
  directory: { id: string; farmer_name: string }[];
  now: string;
};
