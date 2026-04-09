import { useNavigate } from 'react-router-dom';
import { MOCK_MATCHES } from '@/data/mockData';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const INVENTORY: Record<string, { category: string; sold: number; total: number }[]> = {
  m01: [
    { category: 'Top Cat 1', sold: 12, total: 43 },
    { category: 'Cat 2', sold: 6, total: 100 },
    { category: 'Cat 3', sold: 20, total: 60 },
  ],
};

export default function EventDetailPage() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 font-body text-sm" style={{ color: '#6B7280' }}>
        <Link to="/events" className="hover:underline" style={{ color: '#C9A84C' }}>Events</Link>
        <ChevronRight size={14} />
        <span>FIFA World Cup 2026</span>
      </div>

      {/* Event header */}
      <div className="rounded-xl p-6 mb-6 flex items-start justify-between" style={{ backgroundColor: '#0B2D5E' }}>
        <div>
          <h1 className="font-display text-[28px]" style={{ color: 'white' }}>FIFA World Cup 2026</h1>
          <p className="font-mono text-xs mt-1" style={{ color: '#C9A84C' }}>FIFA-WC-2026</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <span className="px-3 py-1 rounded-full font-body text-xs font-medium" style={{ backgroundColor: 'rgba(201,168,76,0.2)', color: '#C9A84C' }}>SELLING</span>
            <span className="px-3 py-1 rounded-full font-body text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>64 Matches</span>
            <span className="px-3 py-1 rounded-full font-body text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>AED 3.6M invested</span>
          </div>
          <p className="font-body text-sm mt-3" style={{ color: 'rgba(255,255,255,0.7)' }}>Event Owner: Sara Al Mansoori</p>
        </div>
        <span className="px-3 py-1.5 rounded-full font-body text-xs font-medium shrink-0" style={{ backgroundColor: 'rgba(201,168,76,0.2)', color: '#C9A84C' }}>
          47 days to first match
        </span>
      </div>

      {/* Match grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_MATCHES.map(m => {
          const inv = INVENTORY[m.id];
          const hasData = !!inv;
          return (
            <div key={m.id} className="bg-bg-card rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold" style={{ backgroundColor: '#0B2D5E', color: 'white' }}>{m.code}</span>
                  <span className="font-body text-[13px]" style={{ color: '#6B7280' }}>{m.date}</span>
                </div>
                <h3 className="font-display text-xl mb-1" style={{ color: '#0B2D5E' }}>{m.teams}</h3>
                <p className="font-body text-[13px] mb-4" style={{ color: '#6B7280' }}>{m.venue}, {m.city}</p>

                {hasData ? (
                  <div className="space-y-2.5">
                    {inv.map(cat => {
                      const pct = (cat.sold / cat.total) * 100;
                      const remaining = cat.total - cat.sold;
                      return (
                        <div key={cat.category}>
                          <div className="flex justify-between mb-1">
                            <span className="font-body text-xs" style={{ color: '#1A1A2E' }}>{cat.category}</span>
                            <span className="font-body text-xs" style={{ color: '#1A7A4A' }}>{remaining} available</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: '#E5E7EB' }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: '#0B2D5E' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-6">
                    <p className="font-body text-sm mb-3" style={{ color: '#9CA3AF' }}>No inventory yet</p>
                    <button onClick={() => navigate('/purchases/new')}
                      className="px-4 py-2 rounded-lg font-body text-sm font-medium transition-opacity hover:opacity-90"
                      style={{ backgroundColor: '#C9A84C', color: '#0B2D5E' }}>
                      + Add Purchase
                    </button>
                  </div>
                )}
              </div>

              {hasData && (
                <div className="border-t px-5 py-3" style={{ borderColor: '#E5E7EB' }}>
                  <button className="font-body text-sm font-medium hover:underline" style={{ color: '#0B2D5E' }}>
                    View Full Detail →
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button className="mt-4 font-body text-sm font-medium hover:underline" style={{ color: '#C9A84C' }}>
        Show all 64 matches →
      </button>
    </div>
  );
}
