import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useDemoFarm } from '@/game/useDemoFarm';
import { crops, formatSeconds, type CropKey } from '@/game/catalog';
import type { FarmScene } from '@/game/FarmScene';
import { Compass, Footprints, Home, LocateFixed, Map, Minus, Plus, Sprout, Sun, UserRound, Warehouse, Wheat, X, ArrowLeft, LockKeyhole, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import worldImage from '@/assets/world-minimap.jpg';
import { regions, ARCHIPELAGO_SIZE, WORLD_OFFSET } from '@/game/regions';
import type { WorldObject } from '@/game/world';
import type { GameCommand } from '@/game/events';
import { SystemsPanel, type Tab } from '@/game/SystemsPanel';

const GameCanvas = lazy(() => import('@/game/GameCanvas'));

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'Little Acre — مزرعة الوادي' },
    { name: 'description', content: 'استكشف مزرعة الوادي، عالماً أصلياً بأسلوب Pixel Art مع مزارع يتحرك بين الحقول والمباني.' },
    { property: 'og:title', content: 'Little Acre — مزرعة الوادي' },
    { property: 'og:description', content: 'عالم زراعي قابل للاستكشاف بالنقر واللمس، مع حقول وبركة وبيت للمزارع.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
});

const details = {
  home: { description: 'بيتك الصغير عند نهاية الممر. من هنا تبدأ حكاية مزرعة الوادي.', label: 'الموقع', value: 'شمال المزرعة', action: 'العودة إلى المزرعة' },
  field: { description: 'تربة خصبة قابلة للزراعة والحصاد. افتح لوحة الأنظمة لاختيار البذور ومتابعة نمو المحصول.', label: 'حالة الأرض', value: 'جاهز للزراعة', action: 'فتح أنظمة الزراعة' },
  storage: { description: 'مخزن المنتجات والموارد. راجع كميات المحاصيل والمواد في لوحة الأنظمة.', label: 'حالة المخزن', value: 'مخزون التجربة المحلية', action: 'العودة إلى المزرعة' },
  barn: { description: 'اشترِ الدجاج والأبقار والأغنام، وقدّم لها العلف واجمع منتجاتها بعد اكتمال دورة الإنتاج.', label: 'حالة الحظيرة', value: 'إدارة الحيوانات', action: 'فتح أنظمة الحيوانات' },
  region: { description: '', label: 'الحالة', value: 'مغلقة', action: 'متابعة الاستكشاف' },
};

function Index() {
  const commands = useRef<((command: GameCommand) => void) | null>(null);
  const sceneRef = useRef<FarmScene | null>(null);
  const farm = useDemoFarm();
  const [seed, setSeed] = useState<CropKey>('wheat');
  const [ready, setReady] = useState(false);
  useEffect(() => { sceneRef.current?.setFields(farm.state.fields); }, [farm.state.fields, ready]);
  const workField = (id: number) => {
    const field = farm.state.fields.find(f => f.id === id); if (!field) return;
    const pop = (t: string) => sceneRef.current?.popText(id, t);
    if (!field.crop) {
      const r = farm.act({ type: 'plant', field: id, crop: seed });
      if (r.ok) pop(`🌱 ${crops[seed].name}`); else toast.error(r.message);
    } else if (field.readyAt && field.readyAt <= Date.now()) {
      const name = crops[field.crop].name, amount = crops[field.crop].yield;
      const r = farm.act({ type: 'harvest', field: id });
      if (r.ok) pop(`+${amount} ${name}`); else toast.error(r.message);
    } else pop(`⏳ ${formatSeconds(((field.readyAt ?? 0) - Date.now()) / 1000)}`);
  };
  const [moving, setMoving] = useState(false);
  const [object, setObject] = useState<WorldObject | null>(null);
  const [regionMenu, setRegionMenu] = useState(false);
  const [systemsOpen, setSystemsOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<Tab | undefined>();
  const [selectedField, setSelectedField] = useState<number | undefined>();
  const [position, setPosition] = useState({ x: 936, y: 632 });
  const command = (value: GameCommand) => { setObject(null); commands.current?.(value); };
  const detail = object ? details[object.kind] : null;
  const selectedRegion = regions.find(r => r.id === object?.id);
  return <main className="farm-app">
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><Sprout size={25} strokeWidth={1.8} /></span><div><h1>LITTLE ACRE</h1><p dir="rtl">حكاية صغيرة، تنمو كل يوم</p></div></div>
      <nav className="topbar-nav" aria-label="المزرعة" dir="rtl">
        <Button variant="ghost" data-active="true" onClick={() => command('center')}><Sprout />المزرعة</Button>
        <Button variant="ghost" onClick={() => command('home')}><Home />المنزل</Button>
        <Button variant="ghost" onClick={() => command('fields')}><Wheat />الحقول</Button>
        <Button variant="ghost" data-active={systemsOpen} onClick={() => setSystemsOpen(v => !v)}><Store />الأنظمة</Button>
      </nav>
      <div className="profile"><span className="profile-label" dir="rtl">المزارع</span><span className="profile-icon"><UserRound size={18} /></span></div>
    </header>
    <section className="world-stage" aria-label="مزرعة الوادي">
      <Suspense fallback={null}><GameCanvas commandRef={commands} sceneRef={sceneRef} callbacks={{ ready: () => setReady(true), arrived: o => { const tab: Record<string, Tab> = { field: 'farm', barn: 'animals', storage: 'market', home: 'quests' }; if (o.kind === 'region') { setObject(o); return; } setObject(null); if (o.kind === 'field') { workField(Number(o.id.replace('field-', ''))); return; } setPanelTab(tab[o.kind]); setSystemsOpen(true); }, moving: setMoving, position: (x, y) => setPosition({ x, y }) }} /></Suspense>
      {!ready && <div className="loading-world" dir="rtl"><Sprout size={34} /><span>نفتح بوابة المزرعة…</span></div>}
      {systemsOpen && <SystemsPanel farm={farm} onClose={() => setSystemsOpen(false)} {...(panelTab ? { initialTab: panelTab } : {})} {...(selectedField !== undefined ? { selectedField } : {})} />}
      <div className="world-top">
        <div className="farm-plaque" dir="rtl"><h2>مزرعة الوادي</h2><div className="plaque-sub"><span className="status-dot" />بداية الحكاية <span>·</span> الربيع</div></div>
        <div className="day-plaque" dir="rtl"><Sun size={25} /><div>نهار مشمس<small>نسيم الربيع</small></div></div>
      </div>
      <div className="map-preview" aria-label="خريطة مصغرة"><img src={worldImage} width={128} height={128} alt="خريطة جزر الوادي" /><svg viewBox={`0 0 ${ARCHIPELAGO_SIZE} ${ARCHIPELAGO_SIZE}`}><circle cx={position.x + WORLD_OFFSET} cy={position.y + WORLD_OFFSET} r="42" fill="currentColor" /><circle cx={position.x + WORLD_OFFSET} cy={position.y + WORLD_OFFSET} r="64" fill="none" stroke="currentColor" strokeWidth="14" /></svg></div>
      <div className="movement-state" dir="rtl"><Footprints size={15} /><span>{moving ? 'في الطريق…' : 'في المزرعة'}</span><span className="status-dot" /></div>
      <div className="seed-bar" dir="rtl" aria-label="البذور">{(Object.keys(crops) as CropKey[]).filter(k => (farm.state.inventory[`${k}_seed`] ?? 0) > 0 || k === seed).map(k => <button key={k} className="seed-chip" data-active={seed === k} onClick={() => setSeed(k)}><Sprout size={14} />{crops[k].name}<b>{farm.state.inventory[`${k}_seed`] ?? 0}</b></button>)}<span className="seed-coins">🪙 {farm.state.coins}</span></div>
      <div className="bottom-dock" dir="rtl">
        <Button variant="ghost" className="dock-button" onClick={() => { command('overview'); setRegionMenu(false); }} title="خريطة الجزر"><Map /><span>الجزر</span></Button>
        <span className="dock-divider" />
        <Button variant="ghost" className="dock-button" onClick={() => command('home')} title="الذهاب إلى المنزل"><Home /><span>المنزل</span></Button>
        <Button variant="ghost" className="dock-button" onClick={() => command('fields')} title="الذهاب إلى الحقول"><Wheat /><span>الحقول</span></Button>
        <Button variant="ghost" className="dock-button" onClick={() => { command('overview'); setRegionMenu(v => !v); }} title="مناطق الاستكشاف"><Compass /><span>استكشاف</span></Button>
        <Button variant="ghost" className="dock-button" data-active={systemsOpen} onClick={() => setSystemsOpen(v => !v)} title="أنظمة المزرعة"><Store /><span>الأنظمة</span></Button>
      </div>
      {regionMenu && !object && <aside className="interaction region-menu" dir="rtl" aria-label="مناطق الاستكشاف"><div className="interaction-header"><h3>جزر الوادي</h3><Button variant="ghost" size="icon" aria-label="إغلاق المناطق" onClick={() => setRegionMenu(false)}><X /></Button></div><div className="object-detail"><span>الجزيرة الرئيسية</span><strong>متاحة</strong></div>{regions.map(r => <Button key={r.id} variant="ghost" className="region-option" onClick={() => { setRegionMenu(false); command(r.id as GameCommand); }}><LockKeyhole /><span>{r.name}</span><ArrowLeft /></Button>)}</aside>}
      <div className="zoom-controls">
        <Button variant="ghost" size="icon" aria-label="تكبير" title="تكبير" onClick={() => command('zoom-in')}><Plus /></Button>
        <Button variant="ghost" size="icon" aria-label="تصغير" title="تصغير" onClick={() => command('zoom-out')}><Minus /></Button>
        <Button variant="ghost" size="icon" aria-label="إعادة ضبط الكاميرا" title="إعادة ضبط الكاميرا" onClick={() => command('center')}><LocateFixed /></Button>
      </div>
      {object && detail && <aside className="interaction" dir="rtl" role="dialog" aria-label={object.name}>
        <div className="interaction-header"><h3>{object.name}</h3><Button variant="ghost" size="icon" aria-label="إغلاق" onClick={() => setObject(null)}><X /></Button></div>
        <div className="object-portrait">{object.kind === 'region' ? <LockKeyhole size={50} className="text-primary" /> : object.kind === 'field' ? <Wheat size={50} className="text-primary" /> : object.kind === 'home' ? <Home size={50} className="text-primary" /> : <Warehouse size={50} className="text-primary" />}</div>
        <p>{selectedRegion?.description ?? detail.description}</p><div className="object-detail"><span>{detail.label}</span><strong>{detail.value}</strong></div>
        {selectedRegion && <div className="region-condition"><strong>شرط الفتح</strong><p>{selectedRegion.condition}</p></div>}
        <Button className="interaction-action" onClick={() => setObject(null)}>{detail.action}<ArrowLeft /></Button>
      </aside>}
    </section>
    <footer className="footer-bar"><span>LITTLE ACRE <span> / </span> WORLD 01</span><span dir="rtl">المرحلة الأولى · عالم المزرعة</span></footer>
  </main>;
}
