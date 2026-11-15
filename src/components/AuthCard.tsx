import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, LockKeyhole, Mail, Sprout, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import '@lovable.dev/cloud-auth-js/styles.css';

type Mode = 'signin' | 'signup' | 'forgot';

export default function AuthCard() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { farmer_name: name.trim() }, emailRedirectTo: window.location.origin } });
        if (error) throw error;
        if (!data.session) setMessage('أرسلنا رابط التأكيد إلى بريدك. افتحه ثم عد لتسجيل الدخول.');
        else await navigate({ to: '/' });
      } else if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await navigate({ to: '/' });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setMessage('أرسلنا رابط تعيين كلمة مرور جديدة إلى بريدك.');
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'تعذر إكمال الطلب'); }
    finally { setBusy(false); }
  }

  async function social(provider: 'google' | 'lovable') {
    setBusy(true); setMessage('');
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (result.error) { setMessage(result.error.message); setBusy(false); }
    else if (result.redirected) return;
    else { await navigate({ to: '/' }); setBusy(false); }
  }

  return <section className="auth-card" dir="rtl" aria-label="الدخول إلى مزرعة الوادي">
    <div className="auth-brand"><span className="brand-mark"><Sprout size={28} /></span><div><strong>LITTLE ACRE</strong><span>مزرعة الوادي</span></div></div>
    <div className="auth-copy"><h1>{mode === 'signup' ? 'ابدأ حكايتك' : mode === 'forgot' ? 'استعادة الحساب' : 'عد إلى مزرعتك'}</h1><p>{mode === 'signup' ? 'أنشئ حساباً ليُحفظ عالمك وتتاجر مع اللاعبين.' : 'محاصيلك ومنشآتك ورصيدك تنتظرك.'}</p></div>
    <form onSubmit={submit} className="auth-form">
      {mode === 'signup' && <label>اسم المزارع<div className="auth-input"><UserRound /><input required minLength={2} maxLength={24} value={name} onChange={e => setName(e.target.value)} placeholder="مثال: مزارع الوادي" /></div></label>}
      <label>البريد الإلكتروني<div className="auth-input"><Mail /><input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" dir="ltr" /></div></label>
      {mode !== 'forgot' && <label>كلمة المرور<div className="auth-input"><LockKeyhole /><input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" dir="ltr" /></div></label>}
      <Button className="auth-submit" disabled={busy}>{busy ? 'لحظة…' : mode === 'signup' ? 'إنشاء المزرعة' : mode === 'forgot' ? 'إرسال رابط الاستعادة' : 'دخول المزرعة'}<ArrowLeft /></Button>
    </form>
    {mode !== 'forgot' && <>
      <div className="auth-divider"><span>أو تابع باستخدام</span></div>
      <div className="social-auth">
        <button type="button" className="google-auth-button" disabled={busy} onClick={() => social('google')}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.23 6.86 8.87 4.75 12 4.75z"/></svg>
          المتابعة باستخدام Google
        </button>
        <button type="button" className="lovable-auth-button" disabled={busy} onClick={() => social('lovable')}>المتابعة باستخدام Lovable</button>
      </div>
    </>}
    {message && <p className="auth-message" role="status">{message}</p>}
    <div className="auth-links">
      {mode === 'signin' && <><button onClick={() => { setMode('signup'); setMessage(''); }}>مزرعة جديدة</button><button onClick={() => { setMode('forgot'); setMessage(''); }}>نسيت كلمة المرور؟</button></>}
      {mode === 'signup' && <button onClick={() => { setMode('signin'); setMessage(''); }}>لدي حساب بالفعل</button>}
      {mode === 'forgot' && <button onClick={() => { setMode('signin'); setMessage(''); }}>العودة للدخول</button>}
    </div>
    <Link to="/" className="auth-back">معاينة العالم دون حساب</Link>
  </section>;
}
