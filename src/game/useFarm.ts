import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { getFarmState, getTradeState, runFarmAction, runTradeAction, type FarmAction, type TradeAction } from './farm.functions';

export function useFarm(userId?: string) {
  const queryClient = useQueryClient();
  const fetchFarm = useServerFn(getFarmState);
  const fetchTrade = useServerFn(getTradeState);
  const farmAction = useServerFn(runFarmAction);
  const tradeAction = useServerFn(runTradeAction);
  const farm = useQuery({ queryKey: ['farm', userId], queryFn: () => fetchFarm(), enabled: !!userId, refetchInterval: 30000 });
  const trade = useQuery({ queryKey: ['trade', userId], queryFn: () => fetchTrade(), enabled: !!userId, refetchInterval: 12000 });
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['farm', userId] }),
      queryClient.invalidateQueries({ queryKey: ['trade', userId] }),
    ]);
  };
  const farmMutation = useMutation({
    mutationFn: (data: FarmAction) => farmAction({ data }),
    onSuccess: async ({ message }) => { toast.success(message); await refresh(); },
    onError: (error) => toast.error(error.message),
  });
  const tradeMutation = useMutation({
    mutationFn: (data: TradeAction) => tradeAction({ data }),
    onSuccess: async ({ message }) => { toast.success(message); await refresh(); },
    onError: (error) => toast.error(error.message),
  });
  const act = async (data: FarmAction) => farmMutation.mutateAsync(data);
  const actTrade = async (data: TradeAction) => tradeMutation.mutateAsync(data);
  return {
    state: farm.data ?? null, trade: trade.data ?? null,
    loading: !!userId && farm.isLoading, error: farm.error,
    act, actTrade, pending: farmMutation.isPending || tradeMutation.isPending, refresh,
  };
}
