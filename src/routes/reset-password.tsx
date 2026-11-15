import { useEffect, useState, type FormEvent } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { LockKeyhole, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/reset-password')({
  head: () => ({ meta: [
    { title: 'كلمة مرور جديدة — Little Acre' },
    { name: 'description', content: 'تعيين كلمة مرور جديدة لحساب مزرعة الوادي.' },
    { property: 'og:title', content: 'استعادة حساب مزرعة الوادي' },
    { property: 'og:description', content: 'عيّن كلمة مرور جديدة وعد إلى مزرعتك.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [valid, setValid] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { setValid(window.location.hash.includes('type=recovery')); }, []);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setMessage(error.message);
    await navigate({ to: '/' });
  }
  return <main className="reset-page"><form className="auth-card reset-card" dir="rtl" onSubmit={submit}>
    <span className="brand-mark"><Sprout /></span><h1>كلمة مرور جديدة</h1>
    {valid ? <><p>اكتب كلمة مرور من ستة أحرف على الأقل.</p><label>كلمة المرور<div className="auth-input"><LockKeyhole /><input type="password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)} dir="ltr" /></div></label><Button disabled={busy}>حفظ والدخول إلى المزرعة</Button></> : <p>افتح هذه الصفحة من رابط الاستعادة الذي وصل إلى بريدك.</p>}
    {message && <p className="auth-message" role="alert">{message}</p>}<Link to="/auth" className="auth-back">العودة لتسجيل الدخول</Link>
  </form></main>;
}
