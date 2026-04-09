import { useMemo } from 'react';
import { MOCK_EVENTS, MOCK_MATCHES, getSubGamesForMatch, hasMultipleSubGames } from '@/data/mockData';
import { LayoutGrid, Table2 } from 'lucide-react';

export interface DashboardFilters {
  eventId: string;
  matchId: string;
  subGameId: string;
  dateRange: 'last7' | 'last30' | 'alltime' | 'this_event' | 'custom';
  viewMode: 'overview' | 'deepdive';
  currency: 'AED' | 'USD';
}

interface Props {
  filters: DashboardFilters;
  onChange: (f: Partial<DashboardFilters>) => void;
  showEventSelector?: boolean;
  showAllEvents?: boolean;
  showDateRange?: boolean;
  showViewMode?: boolean;
  showCurrency?: boolean;
}

const sel = "h-[36px] px-3 rounded-lg font-body text-sm bg-card border border-border outline-none focus:ring-1 focus:ring-accent";

export default function DashboardControlBar({ filters, onChange, showEventSelector = true, showAllEvents = false, showDateRange = false, showViewMode = false, showCurrency = false }: Props) {
  const matches = useMemo(() => {
    if (filters.eventId === 'all') return [];
    return MOCK_MATCHES.filter(m => m.eventId === filters.eventId);
  }, [filters.eventId]);

  const subGames = useMemo(() => {
    if (!filters.matchId || filters.matchId === 'all') return [];
    return getSubGamesForMatch(filters.matchId);
  }, [filters.matchId]);

  const showSubGame = filters.matchId !== 'all' && subGames.length > 1;

  const dateOptions: { key: DashboardFilters['dateRange']; label: string }[] = [
    { key: 'last7', label: 'Last 7d' },
    { key: 'last30', label: '30d' },
    { key: 'alltime', label: 'All time' },
    { key: 'this_event', label: 'This event' },
  ];

  return (
    <div className="sticky top-0 z-30 bg-card border-b border-border py-3 px-6 flex items-center gap-4 flex-wrap">
      {showEventSelector && (
        <div className="flex items-center gap-2">
          <span className="font-body text-[12px] text-muted-foreground">Viewing:</span>
          <select value={filters.eventId} onChange={e => onChange({ eventId: e.target.value, matchId: 'all', subGameId: 'all' })} className={`${sel} w-[200px]`}>
            {showAllEvents && <option value="all">All Events</option>}
            {MOCK_EVENTS.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
        </div>
      )}

      {filters.eventId !== 'all' && (
        <select value={filters.matchId} onChange={e => onChange({ matchId: e.target.value, subGameId: 'all' })} className={`${sel} w-[200px]`}>
          <option value="all">All Matches</option>
          {matches.map(m => <option key={m.id} value={m.id}>{m.code} — {m.teams}</option>)}
        </select>
      )}

      {showSubGame && (
        <select value={filters.subGameId} onChange={e => onChange({ subGameId: e.target.value })} className={`${sel} w-[180px]`}>
          <option value="all">All Sessions</option>
          {subGames.map(sg => <option key={sg.id} value={sg.id}>{sg.name}</option>)}
        </select>
      )}

      <div className="flex-1" />

      {showDateRange && (
        <div className="flex rounded-lg border border-border overflow-hidden">
          {dateOptions.map(d => (
            <button key={d.key} onClick={() => onChange({ dateRange: d.key })}
              className={`px-3 py-1.5 font-body text-[12px] font-medium transition-colors ${filters.dateRange === d.key ? 'bg-primary text-accent' : 'bg-card text-muted-foreground hover:bg-muted'}`}>
              {d.label}
            </button>
          ))}
        </div>
      )}

      {showViewMode && (
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button onClick={() => onChange({ viewMode: 'overview' })}
            className={`p-2 transition-colors ${filters.viewMode === 'overview' ? 'bg-primary text-accent' : 'bg-card text-muted-foreground hover:bg-muted'}`}>
            <LayoutGrid size={16} />
          </button>
          <button onClick={() => onChange({ viewMode: 'deepdive' })}
            className={`p-2 transition-colors ${filters.viewMode === 'deepdive' ? 'bg-primary text-accent' : 'bg-card text-muted-foreground hover:bg-muted'}`}>
            <Table2 size={16} />
          </button>
        </div>
      )}

      {showCurrency && (
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['AED', 'USD'] as const).map(c => (
              <button key={c} onClick={() => onChange({ currency: c })}
                className={`px-3 py-1.5 font-body text-[12px] font-medium transition-colors ${filters.currency === c ? 'bg-primary text-accent' : 'bg-card text-muted-foreground hover:bg-muted'}`}>
                {c}
              </button>
            ))}
          </div>
          {filters.currency === 'USD' && <span className="font-body text-[11px] text-muted-foreground">1 USD = 3.67 AED</span>}
        </div>
      )}
    </div>
  );
}
