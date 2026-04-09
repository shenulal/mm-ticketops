import { useNavigate } from 'react-router-dom';
import { MOCK_EVENTS, MOCK_MATCHES, getInventorySummary, getRevenueSummary } from '@/data/mockData';
import { ChevronRight } from 'lucide-react';
import { CHART_COLORS, AED } from './chartHelpers';

const LIFECYCLE_STEPS = ['SETUP', 'SELLING', 'ALLOCATING', 'DISPATCHING', 'SETTLED'];

function statusToStep(status: string): number {
  const idx = LIFECYCLE_STEPS.indexOf(status);
  return idx >= 0 ? idx : 1;
}

const NEXT_ACTIONS: Record<string, string> = {
  SETUP: 'Add first purchase',
  SELLING: 'Continue selling — review unallocated',
  ALLOCATING: 'Run allocation preview',
  DISPATCHING: 'Complete dispatch queue',
  SETTLED: 'Event complete',
};

export default function EventSnapshot() {
  const navigate = useNavigate();

  return (
    <div className="px-6 pb-6">
      <h2 className="font-display text-[18px] mb-3" style={{ color: CHART_COLORS.navy }}>Event Snapshot</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {MOCK_EVENTS.map(ev => {
          const step = statusToStep(ev.status);
          const matches = MOCK_MATCHES.filter(m => m.eventId === ev.id);
          const inv = getInventorySummary();
          const rev = getRevenueSummary(ev.id);
          const nextAction = NEXT_ACTIONS[ev.status] ?? 'Review event';

          return (
            <div key={ev.id} className="min-w-[320px] bg-card rounded-2xl border border-border p-5 shrink-0 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-[15px]" style={{ color: CHART_COLORS.navy }}>{ev.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{ev.code}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full font-body text-[10px] font-medium bg-success/15 text-success">{ev.status}</span>
              </div>

              {/* Lifecycle stepper */}
              <div className="flex items-center gap-1">
                {LIFECYCLE_STEPS.map((s, i) => (
                  <div key={s} className="flex items-center gap-1 flex-1">
                    <div
                      className="w-full h-1.5 rounded-full transition-colors"
                      style={{
                        backgroundColor: i <= step ? CHART_COLORS.navy : '#E5E7EB',
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                {LIFECYCLE_STEPS.map((s, i) => (
                  <span
                    key={s}
                    className="font-body text-[8px] uppercase tracking-wide"
                    style={{ color: i <= step ? CHART_COLORS.navy : '#9CA3AF' }}
                  >
                    {s.slice(0, 4)}
                  </span>
                ))}
              </div>

              {/* Mini stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="font-body text-[9px] uppercase text-muted-foreground">Matches</p>
                  <p className="font-mono text-[14px] font-semibold text-foreground">{matches.length}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="font-body text-[9px] uppercase text-muted-foreground">Revenue</p>
                  <p className="font-mono text-[12px] font-semibold text-foreground">{AED(rev.totalSaleRevenue)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="font-body text-[9px] uppercase text-muted-foreground">Margin</p>
                  <p className="font-mono text-[12px] font-semibold" style={{ color: Number(rev.marginPct) >= 0 ? CHART_COLORS.green : '#DC2626' }}>{rev.marginPct}%</p>
                </div>
              </div>

              {/* Next action */}
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1">
                  <p className="font-body text-[10px] uppercase text-muted-foreground">Next action</p>
                  <p className="font-body text-[12px] font-medium text-foreground">{nextAction}</p>
                </div>
                <button
                  onClick={() => navigate(`/events/${ev.id}`)}
                  className="shrink-0 px-3 py-1.5 rounded-lg font-body text-[11px] font-medium text-accent hover:opacity-90 flex items-center gap-1"
                  style={{ backgroundColor: CHART_COLORS.navy }}
                >
                  View <ChevronRight size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
