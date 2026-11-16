import { useEffect, useState } from 'react';
import { Wheat, PawPrint, Factory, Trees, Store, ScrollText, LockKeyhole, Package, Coins, Clock3, Sprout, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { animals, buildings, crops, itemName, quests, recipes, regionRules, formatSeconds, type AnimalKey, type BuildingKey, type CropKey } from './catalog';
import { useDemoFarm } from './useDemoFarm';

type Tab = 'farm' | 'animals' | 'production' | 'resources' | 'market' | 'quests';
const tabs: { id: Tab; label: string; icon: typeof Wheat }[] = [
  { id: 'farm', label: 'الزراعة', icon: Wheat },
  { id: 'animals', label: 'الحيوانات', icon: PawPrint },
  { id: 'production', label: 'الصناعة', icon: Factory },
  { id: 'resources', label: 'الموارد', icon: Trees },
  { id: 'market', label: 'السوق', icon: Store },
  { id: 'quests', label: 'المهام', icon: ScrollText },
];
const remaining = (at: number | null, now: number) => at === null ? 'غير مفعّل' : at <= now ? 'جاهز' : formatSeconds((at - now) / 1000);
const regionNames: Record<string, string> = { forest: 'جزيرة الغابة', mines: 'جزيرة المناجم', pasture: 'جزيرة المراعي', workshops: 'جزيرة الصناعة' };

export function SystemsPanel({ onClose, selectedField }: { onClose?: () => void; selectedField?: number }) {
  const { state, act, reset, hydrated } = useDemoFarm();
  const [tab, setTab] = useState<Tab>('farm');
  const [crop, setCrop] = useState<CropKey>('wheat');
  const [field, setField] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [item, setItem] = useState('wheat_seed');
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (selectedField) { setField(selectedField); setTab('farm'); }
  }, [selectedField]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const run = (action: Parameters<typeof act>[0]) => {
    const result = act(action);
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  };

  const inventory = Object.entries(state.inventory).filter(([, amount]) => amount > 0);
  const ownedBuildings = Object.values(state.buildings).filter(b => b.owned).length;

  return <aside className="systems-panel" dir="rtl" aria-label="أنظمة المزرعة">
    <div className="systems-heading">
      <div><div className="systems-kicker">LOCAL PLAY MODE</div><h2>أنظمة المزرعة</h2></div>
      <div className="systems-heading-actions">
        <span className="demo-indicator">تجربة محلية</span>
        {onClose && <Button variant="ghost" size="icon" aria-label="إغلاق الأنظمة" onClick={onClose}><X size={17} /></Button>}
      </div>
    </div>
    <div className="systems-wallet">
      <div><Coins size={17} /><span>الرصيد</span><strong>{state.coins.toLocaleString('ar-DZ')}</strong></div>
      <div><Sprout size={17} /><span>المستوى</span><strong>{state.level}</strong></div>
      <div><Package size={17} /><span>المخزون</span><strong>{inventory.reduce((sum, [, amount]) => sum + amount, 0)}</strong></div>
    </div>
    <div className="systems-tabs" role="tablist" aria-label="أقسام الأنظمة">
      {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><Icon size={16} /><span>{label}</span></button>)}
    </div>
    {!hydrated ? <div className="systems-empty">جارٍ تحميل الحفظ المحلي…</div> : <>
      {tab === 'farm' && <div className="systems-content">
        <h3>الحقول التسعة</h3>
        <div className="field-grid">{state.fields.map(f => {
          const cropSpec = f.crop ? crops[f.crop] : null;
          const isReady = !!f.readyAt && f.readyAt <= now;
          return <div className={f.crop ? 'field-card planted' : 'field-card'} key={f.id}>
            <div className="field-card-title"><strong>حقل {f.id}</strong><span>{f.crop ? cropSpec?.name : 'فارغ'}</span></div>
            {f.crop ? <><div className="field-progress"><span style={{ width: `${Math.min(100, Math.max(0, 100 - ((f.readyAt ?? now) - now) / ((cropSpec?.growSeconds ?? 1) * 10)))}%` }} /></div><small><Clock3 size={12} /> {remaining(f.readyAt, now)}</small>
              <Button size="sm" className="w-full mt-2" disabled={!isReady} onClick={() => run({ type: 'harvest', field: f.id })}>حصاد</Button></> :
              <><small>جاهز للزراعة</small><Button size="sm" variant="outline" className="w-full mt-2" onClick={() => { setField(f.id); setTab('farm'); document.getElementById('plant-controls')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }}>اختيار</Button></>}
          </div>;
        })}</div>
        <div id="plant-controls" className="systems-box"><h3>زراعة حقل</h3>
          <label>الحقل<select value={field} onChange={e => setField(Number(e.target.value))}>{state.fields.map(f => <option key={f.id} value={f.id}>الحقل {f.id}{f.crop ? ' — مزروع' : ''}</option>)}</select></label>
          <label>المحصول<select value={crop} onChange={e => setCrop(e.target.value as CropKey)}>{(Object.keys(crops) as CropKey[]).map(key => <option key={key} value={key}>{crops[key].name} · {crops[key].growSeconds} ث</option>)}</select></label>
          <div className="systems-inline"><span>البذور: {state.inventory[`${crop}_seed`] ?? 0}</span><span>السعر: {crops[crop].seedPrice} عملة</span></div>
          <Button className="w-full" onClick={() => run({ type: 'plant', field, crop })}><Sprout size={15} /> ازرع الآن</Button>
          <div className="systems-inline"><label>شراء بذور<select value={crop} onChange={e => setCrop(e.target.value as CropKey)}>{(Object.keys(crops) as CropKey[]).map(key => <option key={key} value={key}>{crops[key].name}</option>)}</select></label><label>الكمية<input type="number" min="1" max="99" value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))} /></label></div>
          <Button variant="outline" className="w-full" onClick={() => run({ type: 'buy-seed', crop, quantity })}>شراء البذور</Button>
        </div>
      </div>}

      {tab === 'animals' && <div className="systems-content">
        <h3>الحظيرة والإنتاج الحيواني</h3>
        <p className="systems-muted">اشترِ الحيوان، وقدّم له العلف، ثم اجمع المنتج عند اكتمال الدورة.</p>
        <div className="systems-list">{state.animals.map(a => <div className="systems-row" key={a.id}><div><strong>{animals[a.kind].name}</strong><small>{animals[a.kind].productName} · {remaining(a.readyAt, now)}</small></div><div className="systems-row-actions">{a.readyAt === null ? <Button size="sm" variant="outline" onClick={() => run({ type: 'feed-animal', id: a.id })}>إطعام</Button> : null}{a.readyAt !== null && a.readyAt <= now ? <Button size="sm" onClick={() => run({ type: 'collect-animal', id: a.id })}>جمع</Button> : null}</div></div>)}</div>
        <h3 className="systems-subheading">شراء الحيوانات</h3>
        {(Object.keys(animals) as AnimalKey[]).map(key => <div className="systems-row" key={key}><div><strong>{animals[key].name}</strong><small>المستوى {animals[key].level} · {animals[key].price} عملة</small></div><Button size="sm" variant="outline" onClick={() => run({ type: 'buy-animal', animal: key })}>شراء</Button></div>)}
      </div>}

      {tab === 'production' && <div className="systems-content"><h3>المباني وخطوط الإنتاج</h3>
        {(Object.keys(buildings) as BuildingKey[]).map(key => { const b = state.buildings[key], spec = buildings[key], recipe = recipes[key]; return <div className="production-card" key={key}><div className="production-card-head"><div><strong>{spec.name}</strong><small>{spec.description}</small></div><span>{b.owned ? 'مملوكة' : `${spec.price} عملة`}</span></div>
          <div className="systems-muted">الوصفة: {recipe.name} · {recipe.ingredients.map(i => `${i.quantity} ${itemName(i.item)}`).join(' + ')} → {recipe.quantity} {itemName(recipe.output)}</div>
          {b.owned ? <div className="systems-row-actions">{b.recipe ? <><small>{remaining(b.readyAt, now)}</small><Button size="sm" disabled={!b.readyAt || b.readyAt > now} onClick={() => run({ type: 'collect-recipe', building: key })}>استلام الإنتاج</Button></> : <Button size="sm" onClick={() => run({ type: 'start-recipe', building: key })}>بدء الإنتاج</Button>}</div> : <Button size="sm" variant="outline" onClick={() => run({ type: 'buy-building', building: key })}>شراء المنشأة</Button>}
        </div>; })}
        <div className="systems-muted">المنشآت المملوكة: {ownedBuildings} / 4</div>
      </div>}

      {tab === 'resources' && <div className="systems-content"><h3>جمع الموارد</h3><p className="systems-muted">تُجمع الموارد من مناطقها، ولكل عقدة وقت تجدد قصير في وضع التجربة.</p>
        {(['wood', 'stone', 'herb', 'fibre', 'iron'] as const).map(key => { const region = ['wood', 'herb', 'fibre'].includes(key) ? 'forest' : key === 'iron' ? 'mines' : null; const unlocked = !region || state.regions.includes(region); return <div className="systems-row" key={key}><div><strong>{itemName(key)}</strong><small>المخزون: {state.inventory[key] ?? 0}{region ? ` · ${state.regions.includes(region) ? 'المنطقة مفتوحة' : 'تحتاج فتح المنطقة'}` : ''}</small></div><Button size="sm" disabled={!unlocked || (state.resources[key] ?? 0) > now} onClick={() => run({ type: 'gather', resource: key })}>جمع</Button></div>; })}
        <h3 className="systems-subheading">فتح المناطق</h3>
        {Object.entries(regionRules).map(([key, rule]) => <div className="systems-row" key={key}><div><strong>{regionNames[key] ?? key}</strong><small>المستوى {rule.level} · {rule.price} عملة{rule.requirements.length ? ` · ${rule.requirements.map(r => `${r.quantity} ${itemName(r.item)}`).join('، ')}` : ''}</small></div>{state.regions.includes(key) ? <span className="systems-success"><Check size={14} /> مفتوحة</span> : <Button size="sm" variant="outline" onClick={() => run({ type: 'unlock-region', region: key })}><LockKeyhole size={13} /> فتح</Button>}</div>)}
      </div>}

      {tab === 'market' && <div className="systems-content"><h3>السوق المحلي التجريبي</h3><p className="systems-notice">هذه محاكاة بيع داخل المتصفح فقط؛ لا يوجد لاعبون آخرون أو تداول عبر الإنترنت قبل ربط الحسابات.</p>
        <label className="systems-field-label">المنتج<select value={item} onChange={e => setItem(e.target.value)}>{inventory.map(([key]) => <option key={key} value={key}>{itemName(key)} · {state.inventory[key]}</option>)}</select></label>
        <label className="systems-field-label">الكمية<input type="number" min="1" max={state.inventory[item] ?? 1} value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))} /></label>
        <Button className="w-full" disabled={!inventory.length || (state.inventory[item] ?? 0) < quantity} onClick={() => run({ type: 'list-item', item, quantity })}>إدراج في السوق</Button>
        <h3 className="systems-subheading">عروضك</h3>
        {state.listings.length ? state.listings.map(listing => <div className="systems-row" key={listing.id}><div><strong>{itemName(listing.item)} × {listing.quantity}</strong><small>قيمة البيع: {listing.quantity * listing.unitPrice} عملة</small></div><div className="systems-row-actions"><Button size="sm" onClick={() => run({ type: 'complete-listing', id: listing.id })}>محاكاة البيع</Button><Button size="sm" variant="ghost" onClick={() => run({ type: 'cancel-listing', id: listing.id })}>إلغاء</Button></div></div>) : <div className="systems-empty">لا توجد عروض نشطة</div>}
      </div>}

      {tab === 'quests' && <div className="systems-content"><h3>مهام المزرعة</h3>
        {quests.map(q => { const progress = state.stats[q.stat], complete = progress >= q.goal, claimed = state.claims.includes(q.id); return <div className="quest-card" key={q.id}><div className="quest-head"><strong>{q.name}</strong><span>{claimed ? 'مكتملة' : `${Math.min(progress, q.goal)} / ${q.goal}`}</span></div><p>{q.description}</p><div className="systems-inline"><small>المكافأة: {q.coins} عملة + {q.xp} XP</small><Button size="sm" disabled={!complete || claimed} onClick={() => run({ type: 'claim-quest', quest: q.id })}>{claimed ? 'تم الاستلام' : 'استلام'}</Button></div></div>; })}
        <div className="systems-row"><div><strong>إعادة التجربة المحلية</strong><small>تمسح الحفظ المحلي لهذا المتصفح فقط</small></div><Button size="sm" variant="destructive" onClick={() => { if (window.confirm('هل تريد إعادة ضبط تقدم التجربة المحلية؟')) reset(); }}>إعادة ضبط</Button></div>
      </div>}
    </>}
    <div className="systems-footer">التقدم محفوظ محلياً على هذا الجهاز فقط · لا يوجد ربط حسابات</div>
  </aside>;
}
