import { createFileRoute } from '@tanstack/react-router';
import AuthCard from '@/components/AuthCard';
import worldImage from '@/assets/world-minimap.jpg';

export const Route = createFileRoute('/auth')({
  head: () => ({ meta: [
    { title: 'الدخول — Little Acre' },
    { name: 'description', content: 'أنشئ مزرعتك المحفوظة أو سجّل الدخول للتجارة واللعب.' },
    { property: 'og:title', content: 'الدخول إلى مزرعة الوادي' },
    { property: 'og:description', content: 'حساب واحد لحفظ مزرعتك والتجارة مع اللاعبين.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  return <main className="auth-page"><div className="auth-world"><img src={worldImage} alt="جزر مزرعة الوادي" /><div><span>عالمك لا يتوقف</span><h2>ازرع، أنتج، وتاجر مع الجيران.</h2></div></div><AuthCard /></main>;
}
