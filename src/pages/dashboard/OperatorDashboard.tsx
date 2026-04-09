import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ShoppingCart, TrendingUp, Activity } from 'lucide-react';
import { CHART_COLORS } from './chartHelpers';

export default function OperatorDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const name = currentUser?.name?.split(' ')[0] ?? 'Operator';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-[700px] mx-auto py-8 px-4">
      {/* Greeting */}
      <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: CHART_COLORS.navy }}>
        <p className="font-display text-[22px] text-primary-foreground">{greeting}, {name}</p>
        <p className="font-body text-[14px] mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>FIFA World Cup 2026 — Your entries today:</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'My Purchases Today', value: '0', sub: 'No purchases entered today', border: CHART_COLORS.navy, icon: ShoppingCart },
          { label: 'My Sales Today', value: '0', sub: 'No sales entered today', border: CHART_COLORS.green, icon: TrendingUp },
          { label: 'Entries This Week', value: '3', sub: '2 purchases + 1 sale', border: CHART_COLORS.gold, icon: Activity },
        ].map(c => (
          <div key={c.label} className="bg-card rounded-xl p-4 shadow-sm" style={{ borderLeft: `4px solid ${c.border}` }}>
            <p className="font-body text-[11px] uppercase tracking-wide text-muted-foreground">{c.label}</p>
            <p className="font-display text-[28px] mt-1" style={{ color: CHART_COLORS.navy }}>{c.value}</p>
            <p className="font-body text-[11px] mt-1 text-muted-foreground">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button onClick={() => navigate('/purchases/new')}
          className="rounded-2xl p-6 flex items-center gap-4 transition-opacity hover:opacity-90"
          style={{ backgroundColor: CHART_COLORS.navy }}>
          <ShoppingCart size={28} style={{ color: CHART_COLORS.gold }} />
          <span className="font-body text-lg font-bold" style={{ color: CHART_COLORS.gold }}>+ New Purchase</span>
        </button>
        <button onClick={() => navigate('/sales/new')}
          className="rounded-2xl p-6 flex items-center gap-4 transition-opacity hover:opacity-90"
          style={{ backgroundColor: CHART_COLORS.gold }}>
          <TrendingUp size={28} style={{ color: CHART_COLORS.navy }} />
          <span className="font-body text-lg font-bold" style={{ color: CHART_COLORS.navy }}>+ New Sale</span>
        </button>
      </div>

      {/* Recent Entries */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-5 mb-4">
        <h3 className="font-body text-[15px] font-semibold mb-3" style={{ color: CHART_COLORS.navy }}>My Recent Entries</h3>
        <div className="space-y-2">
          {[
            { type: 'Purchase', id: 'PUR-001', match: 'M01', cat: 'Top Cat 1', qty: 43, status: 'ACTIVE', time: '12:48' },
            { type: 'Sale', id: 'SALE-001', match: 'M01', cat: 'Top Cat 1', qty: 12, status: 'ALLOCATED', time: '13:15' },
            { type: 'Sale', id: 'SALE-001', match: 'M01', cat: 'Cat 2', qty: 6, status: 'PENDING', time: '13:15' },
          ].map((e, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
              <span className={`px-2 py-0.5 rounded font-body text-[10px] font-medium ${e.type === 'Purchase' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}`}>{e.type}</span>
              <span className="font-mono text-[12px] text-primary font-bold">{e.id}</span>
              <span className="font-body text-[12px] text-foreground">{e.match} · {e.cat} · ×{e.qty}</span>
              <span className={`px-2 py-0.5 rounded-full font-body text-[10px] font-medium ${
                e.status === 'ACTIVE' ? 'bg-success/15 text-success' : e.status === 'ALLOCATED' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
              }`}>{e.status}</span>
              <span className="ml-auto font-body text-[11px] text-muted-foreground">{e.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-3 bg-success/10 border border-success/30 flex items-center gap-2">
        <span className="font-body text-sm text-success font-medium">✓ No validation errors</span>
      </div>
    </div>
  );
}
