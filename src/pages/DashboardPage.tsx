import { useAuth } from '@/context/AuthContext';
import { MOCK_SALES } from '@/data/mockData';
import { ShoppingCart, TrendingUp, CheckCircle, Send, AlertTriangle } from 'lucide-react';

const STAT_CARDS = [
  { label: 'Total Purchased', value: '203', sub: 'M01 — MEX v RSA', borderColor: '#0B2D5E', icon: ShoppingCart, iconColor: '#0B2D5E' },
  { label: 'Total Sold', value: '38', sub: '18.7% sell-through', borderColor: '#1A7A4A', icon: TrendingUp, iconColor: '#1A7A4A' },
  { label: 'Allocated', value: '12', sub: '31.6% of sold', borderColor: '#D97706', icon: CheckCircle, iconColor: '#D97706' },
  { label: 'Dispatched', value: '1', sub: '1 ticket sent today', borderColor: '#6B7280', icon: Send, iconColor: '#6B7280' },
];

const INVENTORY_ROWS = [
  { category: 'Top Cat 1', purchased: 43, sold: 12, remaining: 31, status: 'AVAILABLE', statusClass: 'badge-allocated' },
  { category: 'Cat 2', purchased: 100, sold: 6, remaining: 94, status: 'Low: Oversell Pending', statusClass: 'badge-available', warn: true },
  { category: 'Cat 3', purchased: 60, sold: 20, remaining: 40, status: 'AVAILABLE', statusClass: 'badge-allocated' },
  { category: 'Cat 4', purchased: 0, sold: 0, remaining: 0, status: 'No Stock', statusClass: 'badge-not-sent' },
];

const ACTIVITY_ITEMS = [
  { time: '14:32', text: 'James Patel allocated 12 units to Roadtrips (S250132)', dotColor: '#1A7A4A' },
  { time: '13:15', text: 'Priya Nair entered sale S250145 — Blend Group Cat 2 x6 [PENDING]', dotColor: '#D97706' },
  { time: '12:48', text: 'James Patel created purchase PUR-002 — viagogo Cat 2 x100', dotColor: '#3B82F6' },
  { time: '11:30', text: 'Sara Al Mansoori activated FIFA WC 2026 event', dotColor: '#0B2D5E' },
];

const UNALLOCATED_SALES = [
  { id: 'S250145', client: 'Blend Group', category: 'Cat 2', qty: 6, action: 'Review', actionBg: '#D97706', pending: true },
  { id: 'S250156', client: 'One2Travel', category: 'Cat 3', qty: 20, action: 'Allocate', actionBg: '#0B2D5E', pending: false },
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
  const oversellSales = MOCK_SALES.filter(s => 'oversell' in s && s.oversell);
  if (oversellSales.length === 0) return null;

  return (
    <div className="rounded-xl p-4 flex items-center justify-between gap-4" style={{ backgroundColor: '#FEF3C7', borderLeft: '4px solid #D97706' }}>
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} style={{ color: '#D97706', marginTop: 2, flexShrink: 0 }} />
        <div>
          <p className="font-body text-sm font-bold" style={{ color: '#1A1A2E' }}>Oversell Detected — Approval Required</p>
          <p className="font-body text-sm" style={{ color: '#6B7280' }}>
            Sale S250145 (Blend Group, Cat 2, 6 tickets) exceeds available inventory by 6 units.
          </p>
        </div>
      </div>
      <button className="px-4 py-2 rounded-lg font-body text-sm font-medium shrink-0 transition-opacity hover:opacity-90" style={{ backgroundColor: '#D97706', color: 'white' }}>
        Review &amp; Approve →
      </button>
    </div>
  );
}

function InventoryHealthCard() {
  return (
    <div className="bg-bg-card rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
        <h3 className="font-display text-lg" style={{ color: '#0B2D5E' }}>Inventory Health · M01 MEX v RSA</h3>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr style={{ backgroundColor: '#0B2D5E' }}>
            {['Category', 'Purchased', 'Sold', 'Remaining', 'Status'].map(h => (
              <th key={h} className="px-5 py-2.5 font-body text-xs font-medium uppercase tracking-wide" style={{ color: 'white' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {INVENTORY_ROWS.map((row, i) => (
            <tr key={row.category} style={{ backgroundColor: i % 2 === 1 ? '#F9FAFB' : 'white' }}>
              <td className="px-5 py-3 font-body text-[13px] font-medium" style={{ color: '#1A1A2E' }}>{row.category}</td>
              <td className="px-5 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>{row.purchased}</td>
              <td className="px-5 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>{row.sold}</td>
              <td className="px-5 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>{row.remaining}</td>
              <td className="px-5 py-3">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-body text-[11px] font-medium ${row.statusClass}`}>
                  {row.warn && <AlertTriangle size={12} />}
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
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
            {/* Timeline */}
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
  return (
    <div className="bg-bg-card rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
        <h3 className="font-display text-lg" style={{ color: '#0B2D5E' }}>Unallocated Sales</h3>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
            {['Sale ID', 'Client', 'Category', 'Qty', 'Action'].map(h => (
              <th key={h} className="px-5 py-2.5 font-body text-[11px] font-medium uppercase tracking-wide" style={{ color: '#6B7280' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {UNALLOCATED_SALES.map(row => (
            <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: '#F3F4F6' }}>
              <td className="px-5 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>{row.id}</td>
              <td className="px-5 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>{row.client}</td>
              <td className="px-5 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>{row.category}</td>
              <td className="px-5 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>{row.qty}</td>
              <td className="px-5 py-3">
                <button className="px-3 py-1.5 rounded-lg font-body text-xs font-medium transition-opacity hover:opacity-90" style={{ backgroundColor: row.actionBg, color: 'white' }}>
                  {row.action}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
              <td className="px-5 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>PUR-002</td>
              <td className="px-5 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>viagogo Cat 2 x100</td>
              <td className="px-5 py-3 font-mono text-[11px]" style={{ color: '#6B7280' }}>15 Apr 2026</td>
            </tr>
            <tr>
              <td className="px-5 py-3"><span className="badge-available px-2 py-0.5 rounded-full font-body text-[11px]">Sale</span></td>
              <td className="px-5 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>S250145</td>
              <td className="px-5 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>Blend Group Cat 2 x6</td>
              <td className="px-5 py-3 font-mono text-[11px]" style={{ color: '#6B7280' }}>15 Apr 2026</td>
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
      {/* ROW 1: Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CARDS.map(card => <StatCard key={card.label} {...card} />)}
      </div>

      {/* ROW 2: Oversell banner */}
      <OversellBanner />

      {/* ROW 3: Inventory + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3"><InventoryHealthCard /></div>
        <div className="lg:col-span-2"><ActivityFeed /></div>
      </div>

      {/* ROW 4: Unallocated + Dispatch */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3"><UnallocatedSalesCard /></div>
        <div className="lg:col-span-2"><DispatchDeadlinesCard /></div>
      </div>
    </div>
  );
}
