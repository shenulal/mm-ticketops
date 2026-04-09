import { useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useEvent } from '@/context/EventContext';

/**
 * Returns helper functions that replace the old hardcoded MOCK_MATCHES / MOCK_SUBGAMES lookups.
 * Use in any component that needs match/subgame/category label resolution.
 */
export function useContextHelpers() {
  const ctx = useAppContext();
  const { activeEvent } = useEvent();

  const getMatchLabel = useCallback((matchId: string) => {
    const m = ctx.getMatch(matchId);
    return m ? `${m.code} ${m.teamsOrDescription}` : matchId;
  }, [ctx]);

  const getMatchCode = useCallback((matchId: string) => {
    return ctx.getMatch(matchId)?.code ?? matchId;
  }, [ctx]);

  const getSubGameName = useCallback((sgId: string) => {
    return ctx.getSubGame(sgId)?.name ?? '—';
  }, [ctx]);

  const getSubGamesForMatch = useCallback((matchId: string) => {
    return ctx.getSubGamesForMatch(matchId);
  }, [ctx]);

  const hasMultipleSubGames = useCallback((matchId: string) => {
    return ctx.hasMultipleSubGames(matchId);
  }, [ctx]);

  const getCategoriesForSubGame = useCallback((sgId: string) => {
    return ctx.getCategoriesForSubGame(sgId);
  }, [ctx]);

  const getHierarchyForSubGame = useCallback((sgId: string) => {
    return ctx.getHierarchyForSubGame(sgId);
  }, [ctx]);

  const eventMatches = ctx.getEvent(activeEvent.id)?.matches ?? [];

  const eventVendors = ctx.vendors.filter(v => v.isActive &&
    ctx.vendorEventBridges.some(b => b.vendorId === v.id && b.eventId === activeEvent.id));

  const eventClients = ctx.clients.filter(c => c.isActive &&
    ctx.contracts.some(ctr => ctr.partyId === c.id && ctr.eventId === activeEvent.id
      && ctr.contractType === 'SALE' && ctr.status === 'ACTIVE'));

  return {
    ctx,
    activeEvent,
    getMatchLabel,
    getMatchCode,
    getSubGameName,
    getSubGamesForMatch,
    hasMultipleSubGames,
    getCategoriesForSubGame,
    getHierarchyForSubGame,
    eventMatches,
    eventVendors,
    eventClients,
    formatCurrency: ctx.formatCurrency,
    matches: ctx.matches,
  };
}
