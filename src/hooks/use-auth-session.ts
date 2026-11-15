import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAuthSession() {
  const query = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => (await supabase.auth.getSession()).data.session,
    staleTime: Infinity,
  });
  return { session: query.data ?? null, loading: query.isLoading };
}
