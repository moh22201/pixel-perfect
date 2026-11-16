import { animals, buildings, crops, quests, recipes, regionRules, salePrices, xpForLevel, type AnimalKey, type BuildingKey, type CropKey } from './catalog';

export const DEMO_STORAGE_KEY = 'little-acre-local-demo-v1';

export type DemoField = { id: number; crop: CropKey | null; plantedAt: number | null; readyAt: number | null };
export type DemoAnimal = { id: number; kind: AnimalKey; readyAt: number | null };
export type DemoBuilding = { kind: BuildingKey; owned: boolean; recipe: string | null; readyAt: number | null };
export type DemoListing = { id: number; item: string; quantity: number; unitPrice: number; createdAt: number };
export type DemoState = {
  coins: number; xp: number; level: number;
  inventory: Record<string, number>;
  fields: DemoField[];
  animals: DemoAnimal[];
  buildings: Record<BuildingKey, DemoBuilding>;
  resources: Record<string, number>;
  regions: string[];
  stats: { planted: number; harvested: number; gathered: number; animal_products: number; crafted: number; trades: number };
  claims: string[];
  listings: DemoListing[];
  nextId: number;
};

export const createDemoState = (): DemoState => ({
  coins: 500, xp: 0, level: 1,
  inventory: { wheat_seed: 12, carrot_seed: 6, potato_seed: 2, wood: 8, stone: 6, feed: 4 },
  fields: Array.from({ length: 9 }, (_, i) => ({ id: i + 1, crop: null, plantedAt: null, readyAt: null })),
  animals: [],
  buildings: {
    mill: { kind: 'mill', owned: false, recipe: null, readyAt: null },
    feed_mill: { kind: 'feed_mill', owned: false, recipe: null, readyAt: null },
    bakery: { kind: 'bakery', owned: false, recipe: null, readyAt: null },
    workshop: { kind: 'workshop', owned: false, recipe: null, readyAt: null },
  },
  resources: { wood: 0, stone: 0, herb: 0, fibre: 0, iron: 0 },
  regions: [],
  stats: { planted: 0, harvested: 0, gathered: 0, animal_products: 0, crafted: 0, trades: 0 },
  claims: [], listings: [], nextId: 1,
});

export type DemoAction =
  | { type: 'buy-seed'; crop: CropKey; quantity: number }
  | { type: 'plant'; field: number; crop: CropKey }
  | { type: 'harvest'; field: number }
  | { type: 'buy-animal'; animal: AnimalKey }
  | { type: 'feed-animal'; id: number }
  | { type: 'collect-animal'; id: number }
  | { type: 'buy-building'; building: BuildingKey }
  | { type: 'start-recipe'; building: BuildingKey }
  | { type: 'collect-recipe'; building: BuildingKey }
  | { type: 'gather'; resource: string }
  | { type: 'unlock-region'; region: string }
  | { type: 'claim-quest'; quest: string }
  | { type: 'list-item'; item: string; quantity: number }
  | { type: 'complete-listing'; id: number }
  | { type: 'cancel-listing'; id: number };

const seedKey = (crop: CropKey) => `${crop}_seed`;
const copy = (state: DemoState): DemoState => structuredClone(state);
const ready = (at: number | null) => at !== null && at <= Date.now();

export function applyDemoAction(current: DemoState, action: DemoAction): { state: DemoState; message: string; ok: boolean } {
  const state = copy(current);
  const reject = (message: string) => ({ state: current, message, ok: false });
  const accept = (message: string) => ({ state, message, ok: true });
  const pay = (amount: number) => {
    if (state.coins < amount) return false;
    state.coins -= amount;
    return true;
  };

  switch (action.type) {
    case 'buy-seed': {
      if (!Number.isInteger(action.quantity) || action.quantity < 1 || action.quantity > 99) return reject('الكمية غير صالحة');
      const crop = crops[action.crop], cost = crop.seedPrice * action.quantity;
      if (!pay(cost)) return reject('الرصيد لا يكفي لشراء البذور');
      state.inventory[seedKey(action.crop)] = (state.inventory[seedKey(action.crop)] ?? 0) + action.quantity;
      return accept(`تم شراء ${action.quantity} من بذور ${crop.name}`);
    }
    case 'plant': {
      const field = state.fields.find(f => f.id === action.field), crop = crops[action.crop];
      if (!field) return reject('الحقل غير موجود');
      if (field.crop) return reject('هذا الحقل مزروع بالفعل');
      if (state.level < crop.level) return reject(`تحتاج إلى المستوى ${crop.level}`);
      const key = seedKey(action.crop);
      if ((state.inventory[key] ?? 0) < 1) return reject('لا تملك بذوراً كافية');
      state.inventory[key] = (state.inventory[key] ?? 0) - 1;
      const now = Date.now();
      field.crop = action.crop; field.plantedAt = now; field.readyAt = now + crop.growSeconds * 1000;
      state.stats.planted += 1; state.xp += crop.xp; state.level = Math.max(state.level, xpForLevel(state.level + 1) <= state.xp ? state.level + 1 : state.level);
      return accept(`زُرع ${crop.name} في الحقل ${field.id}`);
    }
    case 'harvest': {
      const field = state.fields.find(f => f.id === action.field);
      if (!field?.crop || !ready(field.readyAt)) return reject('المحصول لم ينضج بعد');
      const crop = crops[field.crop];
      state.inventory[field.crop] = (state.inventory[field.crop] ?? 0) + crop.yield;
      state.xp += crop.xp; state.stats.harvested += 1;
      field.crop = null; field.plantedAt = null; field.readyAt = null;
      while (state.xp >= xpForLevel(state.level + 1)) state.level += 1;
      return accept(`حصدت ${crop.yield} من ${crop.name}`);
    }
    case 'buy-animal': {
      const animal = animals[action.animal];
      if (state.level < animal.level) return reject(`تحتاج إلى المستوى ${animal.level}`);
      if (!pay(animal.price)) return reject('الرصيد لا يكفي لشراء الحيوان');
      state.animals.push({ id: state.nextId++, kind: action.animal, readyAt: null });
      return accept(`تم شراء ${animal.name}. أطعمها لبدء دورة الإنتاج`);
    }
    case 'feed-animal': {
      const animal = state.animals.find(a => a.id === action.id);
      if (!animal) return reject('الحيوان غير موجود');
      if (animal.readyAt && !ready(animal.readyAt)) return reject('الحيوان في دورة إنتاج حالياً');
      if ((state.inventory.feed ?? 0) < 1) return reject('تحتاج إلى علف');
      state.inventory.feed -= 1;
      animal.readyAt = Date.now() + animals[animal.kind].seconds * 1000;
      return accept('تم تقديم العلف وبدأت دورة الإنتاج');
    }
    case 'collect-animal': {
      const animal = state.animals.find(a => a.id === action.id);
      if (!animal || !ready(animal.readyAt)) return reject('المنتج الحيواني غير جاهز');
      const spec = animals[animal.kind];
      state.inventory[spec.product] = (state.inventory[spec.product] ?? 0) + spec.yield;
      animal.readyAt = null; state.stats.animal_products += 1;
      return accept(`تم جمع ${spec.productName}`);
    }
    case 'buy-building': {
      const building = state.buildings[action.building], spec = buildings[action.building];
      if (building.owned) return reject('المنشأة مملوكة بالفعل');
      if (state.level < spec.level) return reject(`تحتاج إلى المستوى ${spec.level}`);
      if (!pay(spec.price)) return reject('الرصيد لا يكفي لشراء المنشأة');
      building.owned = true;
      return accept(`تم شراء ${spec.name}`);
    }
    case 'start-recipe': {
      const building = state.buildings[action.building], recipe = recipes[action.building];
      if (!building.owned) return reject('اشترِ المنشأة أولاً');
      if (building.recipe) return reject('هناك وصفة قيد التنفيذ');
      for (const ingredient of recipe.ingredients) if ((state.inventory[ingredient.item] ?? 0) < ingredient.quantity) return reject(`المكونات غير كافية: ${ingredient.item}`);
      for (const ingredient of recipe.ingredients) state.inventory[ingredient.item] -= ingredient.quantity;
      building.recipe = recipe.key; building.readyAt = Date.now() + recipe.seconds * 1000;
      return accept(`بدأت وصفة ${recipe.name}`);
    }
    case 'collect-recipe': {
      const building = state.buildings[action.building], recipe = recipes[action.building];
      if (!building.recipe || !ready(building.readyAt)) return reject('الإنتاج لم يكتمل بعد');
      state.inventory[recipe.output] = (state.inventory[recipe.output] ?? 0) + recipe.quantity;
      building.recipe = null; building.readyAt = null; state.stats.crafted += 1;
      return accept(`اكتمل إنتاج ${recipe.name}`);
    }
    case 'gather': {
      if (action.resource === 'iron' && !state.regions.includes('mines')) return reject('افتح جزيرة المناجم أولاً');
      if (['wood', 'herb', 'fibre'].includes(action.resource) && !state.regions.includes('forest')) return reject('افتح جزيرة الغابة أولاً');
      const cooldown = state.resources[action.resource] ?? 0;
      if (cooldown > Date.now()) return reject('مورد المنطقة يحتاج وقتاً للتجدد');
      state.inventory[action.resource] = (state.inventory[action.resource] ?? 0) + 1;
      state.resources[action.resource] = Date.now() + 15000;
      state.stats.gathered += 1;
      return accept(`تم جمع وحدة من ${action.resource}`);
    }
    case 'unlock-region': {
      const rule = regionRules[action.region];
      if (!rule || state.regions.includes(action.region)) return reject('المنطقة غير متاحة');
      if (state.level < rule.level) return reject(`تحتاج إلى المستوى ${rule.level}`);
      if (!pay(rule.price)) return reject('الرصيد لا يكفي لفتح المنطقة');
      for (const item of rule.requirements) if ((state.inventory[item.item] ?? 0) < item.quantity) return reject(`تحتاج إلى ${item.quantity} من ${item.item}`);
      for (const item of rule.requirements) state.inventory[item.item] -= item.quantity;
      state.regions.push(action.region);
      return accept('تم فتح المنطقة الجديدة');
    }
    case 'claim-quest': {
      const quest = quests.find(q => q.id === action.quest);
      if (!quest || state.claims.includes(action.quest)) return reject('المهمة غير متاحة');
      if (state.stats[quest.stat] < quest.goal) return reject('لم تحقق هدف المهمة بعد');
      state.claims.push(action.quest); state.coins += quest.coins; state.xp += quest.xp;
      while (state.xp >= xpForLevel(state.level + 1)) state.level += 1;
      return accept(`أُنجزت المهمة وحصلت على ${quest.coins} عملة`);
    }
    case 'list-item': {
      if (!Number.isInteger(action.quantity) || action.quantity < 1 || (state.inventory[action.item] ?? 0) < action.quantity) return reject('الكمية غير متاحة في المخزون');
      state.inventory[action.item] -= action.quantity;
      state.listings.push({ id: state.nextId++, item: action.item, quantity: action.quantity, unitPrice: salePrices[action.item] ?? 1, createdAt: Date.now() });
      return accept('أُدرج المنتج في سوق التجربة المحلي');
    }
    case 'complete-listing': {
      const listing = state.listings.find(l => l.id === action.id);
      if (!listing) return reject('العرض غير موجود');
      state.coins += listing.quantity * listing.unitPrice;
      state.listings = state.listings.filter(l => l.id !== action.id);
      state.stats.trades += 1;
      return accept('اكتملت محاكاة البيع وأضيف المبلغ إلى رصيد التجربة');
    }
    case 'cancel-listing': {
      const listing = state.listings.find(l => l.id === action.id);
      if (!listing) return reject('العرض غير موجود');
      state.inventory[listing.item] = (state.inventory[listing.item] ?? 0) + listing.quantity;
      state.listings = state.listings.filter(l => l.id !== action.id);
      return accept('أُلغي العرض وأُعيد المنتج إلى المخزون');
    }
  }
}
