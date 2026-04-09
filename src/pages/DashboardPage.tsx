import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  MOCK_SALES, MOCK_SALE_LINE_ITEMS, MOCK_MATCHES, MOCK_SUBGAMES,
  MOCK_PURCHASE_LINE_ITEMS, MOCK_UNITS,
  getSubGamesForMatch, hasMultipleSubGames,
} from '@/data/mockData';
import { ShoppingCart, TrendingUp, CheckCircle, Send, AlertTriangle, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

const STAT_CARDS = [
  { label: 'Total Purchased', value: '203', sub: 'M01 — MEX v RSA', borderColor: '#0B2D5E', icon: ShoppingCart, iconColor: '#0B2D5E' },
  { label: 'Total Sold', value: '38', sub: '18.7% sell-through', borderColor: '#1A7A4A', icon: TrendingUp, iconColor: '#1A7A4A' },
  { label: 'Allocated', value: '12', sub: '31.6% of sold', borderColor: '#D97706', icon: CheckCircle, iconColor: '#D97706' },
  { label: 'Dispatched', value: '1', sub: '1 ticket sent today', borderColor: '#6B7280', icon: Send, iconColor: '#6B7280' },
];

const ACTIVITY_ITEMS = [
  { time: '14:32', text: 'James Patel allocated 12 units to Roadtrips (SLI-1-1)', dotColor: '#1A7A4A' },
  { time: '13:15', text: 'Priya Nair entered sale line SLI-1-2 — Roadtrips Cat 2 x6 [PENDING]', dotColor: '#D97706' },
  { time: '12:48', text: 'James Patel created purchase PUR-001 — poxami 3 lines, 203 units', dotColor: '#3B82F6' },
  { time: '11:30', text: 'Sara Al Mansoori activated FIFA WC 2026 event', dotColor: '#0B2D5E' },
];

function StatCard({ label, value, sub, borderColor, icon: Icon, iconColor }: typeof STAT_CARDS[0]) {
  return (
    <div className="bg-bg-card rounded-xl p-5 shadow-sm" style={{ borderLeft: `4px solid ${borderColor}` }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-body text-xs uppercase tracking-wide" style={{ color: '#6B7280' }}>{label}</p>
          <p className="font-display text-4xl mt-1" style={{ color: '#0B2D5E' }}>{value}</p>
          <p className="font-body text-xs mt-1" style={{ color: '#6B7280' }}>{sub}</p>
        </div>
        <Icon size={22} style={{ color: iconColor }} />
      </div>
    </div>
  );
}

function OversellBanner() {
  const navigate = useNavigate();
  const oversellLines = MOCK_SALE_LINE_ITEMS.filter(l => l.oversellFlag);
  if (oversellLines.length === 0) return null;
  const li = oversellLines[0];
  const sale = MOCK_SALES.find(s => s.id === li.saleId);
  const sg = MOCK_SUBGAMES.find(sg => sg.id === li.subGameId);
  const lineIdx = sale ? sale.lines.findIndex(l => l.id === li.id) + 1 : 0;
  const otherLines = sale ? sale.lines.filter(l => l.id !== li.id) : [];

  return (
    <div className="rounded-xl p-4 flex items-center justify-between gap-4" style={{ backgroundColor: '#FEF3C7', borderLeft: '4px solid #D97706' }}>
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} style={{ color: '#D97706', marginTop: 2, flexShrink: 0 }} />
        <div>
          <p className="font-body text-sm font-bold" style={{ color: '#1A1A2E' }}>Oversell Detected — Approval Required</p>
          <p className="font-body text-sm" style={{ color: '#6B7280' }}>
            {sale?.id.toUpperCase().replace('SALE', 'SALE-')} / Line {lineIdx} ({sg?.name} · {li.categoryLabel} × {li.qty}) exceeds available inventory.
          </p>
          {otherLines.length > 0 && (
            <p className="font-body text-xs mt-1" style={{ color: '#92400E' }}>
              Lines {otherLines.map((_, i) => i + 1 === lineIdx ? null : i + 1).filter(Boolean).join(' and ')} of this sale are unaffected.
            </p>
          )}
        </div>
      </div>
      <button onClick={() => navigate('/sales')}
        className="px-4 py-2 rounded-lg font-body text-sm font-medium shrink-0 transition-opacity hover:opacity-90"
        style={{ backgroundColor: '#D97706', color: 'white' }}>
        Review Line {lineIdx} →
      </button>
    </div>
  );
}

function InventoryHealthCard() {
  const [selectedMatch, setSelectedMatch] = useState('m01');
  const match = MOCK_MATCHES.find(m => m.id === selectedMatch) || MOCK_MATCHES.find(m => m.id === 'sg-weekend');
  const isMulti = selectedMatch ? hasMultipleSubGames(selectedMatch) : false;
  const sgs = selectedMatch ? getSubGamesForMatch(selectedMatch) : [];

  // Build rows
  type InvRow = { subGame?: string; category: string; purchased: number; sold: number; remaining: number; status: string; warn?: boolean };
  const rows: InvRow[] = [];

  sgs.forEach(sg => {
    sg.categories.forEach(cat => {
      const purchased = MOCK_PURCHASE_LINE_ITEMS.filter(l => l.subGameId === sg.id && l.categoryId === cat.id).reduce((s, l) => s + l.qty, 0);
      const sold = MOCK_SALE_LINE_ITEMS.filter(l => l.subGameId === sg.id && l.categoryId === cat.id).reduce((s, l) => s + l.qty, 0);
      const remaining = MOCK_UNITS.filter(u => u.subGameId === sg.id && u.categoryId === cat.id && u.status === 'AVAILABLE').length;
      const hasOversell = MOCK_SALE_LINE_ITEMS.some(l => l.subGameId === sg.id && l.categoryId === cat.id && l.oversellFlag);
      rows.push({
        subGame: isMulti ? sg.name : undefined,
        category: cat.label,
        purchased,
        sold,
        remaining,
        status: purchased === 0 ? 'NO STOCK' : hasOversell ? 'Low: Oversell Pending' : 'AVAILABLE',
        warn: hasOversell,
      });
    });
  });

  const columns = isMulti
    ? ['Sub-Game', 'Category', 'Purchased', 'Sold', 'Remaining', 'Status']
    : ['Category', 'Purchased', 'Sold', 'Remaining', 'Status'];

  // Match options for dropdown
  const matchOptions = MOCK_MATCHES.map(m => ({ id: m.id, label: `${m.code} ${m.teams}` }));

  return (
    <div className="bg-bg-card rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E5E7EB' }}>
        <h3 className="font-display text-lg" style={{ color: '#0B2D5E' }}>
          Inventory Health · {match?.code} {match?.teams}
        </h3>
        <div className="relative">
          <select value={selectedMatch} onChange={e => setSelectedMatch(e.target.value)}
            className="appearance-none font-body text-xs pl-3 pr-7 py-1.5 rounded-lg border cursor-pointer"
            style={{ borderColor: '#D1D5DB', color: '#1A1A2E', backgroundColor: 'white' }}>
            {matchOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#6B7280' }} />
        </div>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr style={{ backgroundColor: '#0B2D5E' }}>
            {columns.map(h => (
              <th key={h} className="px-5 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-white">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.subGame}-${row.category}`} style={{ backgroundColor: i % 2 === 1 ? '#F9FAFB' : 'white' }}>
              {isMulti && <td className="px-5 py-3 font-body text-[13px] font-medium" style={{ color: '#0B2D5E' }}>{row.subGame}</td>}
              <td className="px-5 py-3 font-body text-[13px] font-medium" style={{ color: '#1A1A2E' }}>{row.category}</td>
              <td className="px-5 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>{row.purchased}</td>
              <td className="px-5 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>{row.sold}</td>
              <td className="px-5 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>{row.remaining}</td>
              <td className="px-5 py-3">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-body text-[11px] font-medium ${
                  row.status === 'AVAILABLE' ? 'badge-allocated' : row.status === 'NO STOCK' ? 'badge-not-sent' : 'badge-available'
                }`}>
                  {row.warn && <AlertTriangle size={12} />}
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="px-5 py-8 text-center font-body text-sm" style={{ color: '#6B7280' }}>No inventory data for this match</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ActivityFeed() {
  return (
    <div className="bg-bg-card rounded-xl shadow-sm">
      <div className="px-5 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
        <h3 className="font-display text-lg" style={{ color: '#0B2D5E' }}>Activity Feed</h3>
      </div>
      <div className="p-5 space-y-0">
        {ACTIVITY_ITEMS.map((item, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: item.dotColor }} />
              {i < ACTIVITY_ITEMS.length - 1 && <div className="w-px flex-1 my-1" style={{ backgroundColor: '#E5E7EB' }} />}
            </div>
            <div className="pb-4">
              <span className="font-mono text-[11px]" style={{ color: '#6B7280' }}>{item.time}</span>
              <p className="font-body text-[13px] mt-0.5" style={{ color: '#1A1A2E' }}>{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UnallocatedSalesCard() {
  const navigate = useNavigate();

  const salesWithLines = MOCK_SALES.map(sale => {
    const lines = sale.lines;
    return { sale, lines };
  }).filter(s => s.lines.some(l => l.status !== 'FULFILLED'));

  const statusIcon = (status: string) => {
    if (status === 'ALLOCATED') return <span style={{ color: '#1A7A4A' }}>✓</span>;
    if (status === 'PENDING_APPROVAL') return <span style={{ color: '#D97706' }}>⚠</span>;
    return <span style={{ color: '#6B7280' }}>→</span>;
  };
  const statusLabel = (status: string) => {
    if (status === 'ALLOCATED') return 'ALLOC';
    if (status === 'PENDING_APPROVAL') return 'PENDING';
    return 'UNALLOC';
  };

  const hasAnyPending = (lines: typeof MOCK_SALE_LINE_ITEMS) => lines.some(l => l.status === 'PENDING_APPROVAL');
  const allUnalloc = (lines: typeof MOCK_SALE_LINE_ITEMS) => lines.every(l => l.status === 'UNALLOCATED');

  return (
    <div className="bg-bg-card rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
        <h3 className="font-display text-lg" style={{ color: '#0B2D5E' }}>Unallocated Sales</h3>
      </div>
      <div className="divide-y" style={{ borderColor: '#F3F4F6' }}>
        {salesWithLines.map(({ sale, lines }) => (
          <div key={sale.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[13px] font-bold" style={{ color: '#0B2D5E' }}>
                  {sale.id.toUpperCase().replace('SALE', 'SALE-')}
                </span>
                <span className="font-body text-[13px]" style={{ color: '#1A1A2E' }}>{sale.client}</span>
                <span className="font-body text-[11px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
                  {lines.length} lines
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {lines.map((l, i) => (
                  <span key={l.id} className="inline-flex items-center gap-1 font-body text-[11px]" style={{ color: '#6B7280' }}>
                    {statusIcon(l.status)} L{i + 1} {statusLabel(l.status)}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={() => navigate('/distribution')}
              className="px-3 py-1.5 rounded-lg font-body text-xs font-medium shrink-0 transition-opacity hover:opacity-90"
              style={{
                backgroundColor: allUnalloc(lines) ? '#0B2D5E' : hasAnyPending(lines) ? '#D97706' : '#0B2D5E',
                color: 'white',
              }}>
              {allUnalloc(lines) ? 'Allocate All' : 'Manage Lines'}
            </button>
          </div>
        ))}
        {salesWithLines.length === 0 && (
          <div className="px-5 py-8 text-center font-body text-sm" style={{ color: '#6B7280' }}>All sales fully allocated</div>
        )}
      </div>
    </div>
  );
}

function DispatchDeadlinesCard() {
  return (
    <div className="bg-bg-card rounded-xl shadow-sm">
      <div className="px-5 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
        <h3 className="font-display text-lg" style={{ color: '#0B2D5E' }}>Dispatch Deadlines</h3>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-sm font-medium" style={{ color: '#1A1A2E' }}>M01 — MEX v RSA</p>
            <p className="font-body text-xs" style={{ color: '#6B7280' }}>21 Jun 2026</p>
          </div>
          <span className="font-mono text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>47 days remaining</span>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="font-body text-xs" style={{ color: '#6B7280' }}>1 of 12 dispatched</span>
            <span className="font-mono text-xs" style={{ color: '#6B7280' }}>8.3%</span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#E5E7EB' }}>
            <div className="h-2 rounded-full" style={{ width: '8.3%', backgroundColor: '#0B2D5E' }} />
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#FEF3C7' }}>
          <AlertTriangle size={14} style={{ color: '#D97706' }} />
          <p className="font-body text-xs" style={{ color: '#92400E' }}>Dispatch not started — 11 tickets pending</p>
        </div>
      </div>
    </div>
  );
}

function OperatorView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="My Purchases" value="2" sub="Entered this week" borderColor="#0B2D5E" icon={ShoppingCart} iconColor="#0B2D5E" />
        <StatCard label="My Sales" value="1" sub="Entered this week" borderColor="#1A7A4A" icon={TrendingUp} iconColor="#1A7A4A" />
      </div>
      <div className="bg-bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
          <h3 className="font-display text-lg" style={{ color: '#0B2D5E' }}>My Recent Entries</h3>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
              {['Type', 'ID', 'Details', 'Date'].map(h => (
                <th key={h} className="px-5 py-2.5 font-body text-[11px] font-medium uppercase tracking-wide" style={{ color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b" style={{ borderColor: '#F3F4F6' }}>
              <td className="px-5 py-3"><span className="badge-sent px-2 py-0.5 rounded-full font-body text-[11px]">Purchase</span></td>
              <td className="px-5 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>PUR-001</td>
              <td className="px-5 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>poxami — 3 lines, 203 units</td>
              <td className="px-5 py-3 font-mono text-[11px]" style={{ color: '#6B7280' }}>16 Apr 2026</td>
            </tr>
            <tr>
              <td className="px-5 py-3"><span className="badge-available px-2 py-0.5 rounded-full font-body text-[11px]">Sale</span></td>
              <td className="px-5 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>SALE-001</td>
              <td className="px-5 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>Roadtrips — 3 lines, 38 units</td>
              <td className="px-5 py-3 font-mono text-[11px]" style={{ color: '#6B7280' }}>16 Apr 2026</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const isOperator = currentUser?.role === 'operator';

  if (isOperator) return <OperatorView />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CARDS.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.3 }}>
            <StatCard {...card} />
          </motion.div>
        ))}
      </div>
      <OversellBanner />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3"><InventoryHealthCard /></div>
        <div className="lg:col-span-2"><ActivityFeed /></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3"><UnallocatedSalesCard /></div>
        <div className="lg:col-span-2"><DispatchDeadlinesCard /></div>
      </div>
    </div>
  );
}
