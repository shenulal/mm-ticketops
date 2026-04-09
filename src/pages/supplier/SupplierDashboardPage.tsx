import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAppContext } from '@/context/AppContext';
import { MOCK_UNITS, MOCK_DIST_ROWS, MOCK_MATCHES } from '@/data/mockData';
import { Package, Truck, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';

const COMPANY_REDACTED = 'MIRRA';

type DeliveryStatus = 'NOT_SENT' | 'SENT' | 'PENDING' | 'ACCEPTED' | 'ISSUE' | 'UPLOADED';

interface SupplierUnit {
  unitId: string; matchId: string; matchLabel: string; category: string;
  setId: string; setPos: number; deliveryStatus: DeliveryStatus;
  block: string; row: string; seat: string; notes: string; proof: string | null;
}

function useSupplierUnits() {
  const { currentUser } = useAuth();
  const ctx = useAppContext();
  const vendorGroups = currentUser?.vendorGroups ?? [];

  return useMemo(() => {
    // Get all units belonging to this supplier's vendor groups
    const myUnits = MOCK_UNITS.filter(u => vendorGroups.includes(u.vendor.toLowerCase()));
    
    return myUnits.map((u, i): SupplierUnit => {
      const match = MOCK_MATCHES.find(m => m.id === u.matchId);
      const distRow = MOCK_DIST_ROWS.find(d => d.unitId === u.id);
      return {
        unitId: u.id,
        matchId: u.matchId,
        matchLabel: match ? `${match.code} — ${match.teams}` : u.matchId,
        category: u.categoryLabel,
        setId: u.setId,
        setPos: u.setPos,
        deliveryStatus: (distRow?.dispatchStatus as DeliveryStatus) ?? (u.status === 'ALLOCATED' ? 'NOT_SENT' : 'PENDING'),
        block: i < 12 ? 'C' : '',
        row: i < 12 ? String(Math.floor(i / 4) + 1) : '',
        seat: i < 12 ? String((i % 4) + 1) : '',
        notes: '',
        proof: null,
      };
    });
  }, [vendorGroups]);
}

export default function SupplierDashboardPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const ctx = useAppContext();
  const allUnits = useSupplierUnits();

  const [eventFilter, setEventFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const kpis = useMemo(() => ({
    allocated: allUnits.length,
    toDeliver: allUnits.filter(u => u.deliveryStatus === 'NOT_SENT' || u.deliveryStatus === 'PENDING').length,
    delivered: allUnits.filter(u => u.deliveryStatus === 'SENT' || u.deliveryStatus === 'ACCEPTED' || u.deliveryStatus === 'UPLOADED').length,
    issues: allUnits.filter(u => u.deliveryStatus === 'ISSUE').length,
  }), [allUnits]);

  // Group by match
  const matchGroups = useMemo(() => {
    const groups: Record<string, { matchId: string; label: string; eventId: string; units: SupplierUnit[] }> = {};
    for (const u of allUnits) {
      if (statusFilter && u.deliveryStatus !== statusFilter) continue;
      const match = MOCK_MATCHES.find(m => m.id === u.matchId);
      if (eventFilter && match?.eventId !== eventFilter) continue;
      if (!groups[u.matchId]) {
        groups[u.matchId] = { matchId: u.matchId, label: u.matchLabel, eventId: match?.eventId ?? '', units: [] };
      }
      groups[u.matchId].units.push(u);
    }
    return Object.values(groups);
  }, [allUnits, eventFilter, statusFilter]);

  const statusColors: Record<string, string> = {
    NOT_SENT: 'bg-muted text-muted-foreground',
    SENT: 'bg-primary/15 text-primary',
    PENDING: 'bg-warning/15 text-warning',
    ACCEPTED: 'bg-success/15 text-success',
    ISSUE: 'bg-destructive/15 text-destructive',
    UPLOADED: 'bg-accent/15 text-accent-foreground',
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="font-heading text-[26px] text-foreground">Welcome, {currentUser?.name}</h1>
        <p className="text-[13px] font-body text-muted-foreground">
          Supplier: <span className="font-medium text-foreground">{currentUser?.vendorGroups?.join(', ').toUpperCase()}</span>
          {' · '}Company: <span className="font-medium text-foreground">{COMPANY_REDACTED}</span>
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tickets Allocated', value: kpis.allocated, icon: Package, color: 'text-primary' },
          { label: 'To Deliver', value: kpis.toDeliver, icon: Truck, color: 'text-warning' },
          { label: 'Delivered', value: kpis.delivered, icon: CheckCircle2, color: 'text-success' },
          { label: 'Issues', value: kpis.issues, icon: AlertTriangle, color: kpis.issues > 0 ? 'text-destructive' : 'text-muted-foreground' },
        ].map(k => (
          <div key={k.label} className="bg-card border border-border rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-body text-muted-foreground">{k.label}</span>
              <k.icon size={16} className={k.color} />
            </div>
            <p className={`font-heading text-[28px] ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select className="px-3 py-2 rounded-xl border border-border bg-background text-[13px] font-body w-48"
          value={eventFilter} onChange={e => setEventFilter(e.target.value)}>
          <option value="">All Events</option>
          {ctx.events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
        <select className="px-3 py-2 rounded-xl border border-border bg-background text-[13px] font-body w-40"
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="NOT_SENT">Not Sent</option>
          <option value="SENT">Sent</option>
          <option value="PENDING">Pending</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="ISSUE">Issue</option>
          <option value="UPLOADED">Uploaded</option>
        </select>
      </div>

      {/* Match Groups */}
      <div className="space-y-4">
        {matchGroups.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <p className="font-body text-[14px] text-muted-foreground">No tickets match your filters.</p>
          </div>
        )}
        {matchGroups.map(g => {
          const catGroups: Record<string, SupplierUnit[]> = {};
          g.units.forEach(u => { catGroups[u.category] = catGroups[u.category] || []; catGroups[u.category].push(u); });
          const delivered = g.units.filter(u => u.deliveryStatus === 'SENT' || u.deliveryStatus === 'ACCEPTED' || u.deliveryStatus === 'UPLOADED').length;
          const pct = g.units.length > 0 ? Math.round(delivered / g.units.length * 100) : 0;

          return (
            <div key={g.matchId} className="bg-card border border-border rounded-2xl overflow-hidden">
              <button onClick={() => navigate(`/supplier/match/${g.matchId}`)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors text-left">
                <div>
                  <p className="font-body text-[14px] font-medium text-foreground">{g.label}</p>
                  <p className="text-[12px] font-body text-muted-foreground">{g.units.length} tickets · {Object.keys(catGroups).length} categories</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[12px] font-body text-muted-foreground">Delivery</p>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-success transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[11px] font-mono text-foreground">{pct}%</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </div>
              </button>
              {/* Category summary row */}
              <div className="px-5 pb-3 flex gap-2 flex-wrap">
                {Object.entries(catGroups).map(([cat, units]) => (
                  <span key={cat} className="px-2.5 py-1 rounded-lg bg-muted text-[11px] font-body text-muted-foreground">
                    {cat}: <span className="font-medium text-foreground">{units.length}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { useSupplierUnits };
export type { SupplierUnit, DeliveryStatus };
