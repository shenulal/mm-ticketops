import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import RoleGuard from '@/components/RoleGuard';
import { MOCK_PURCHASES, MOCK_MATCHES, MOCK_UNITS, MOCK_PURCHASE_LINE_ITEMS } from '@/data/mockData';
import { X } from 'lucide-react';

interface PurchaseRow {
  id: string;
  date: string;
  match: string;
  vendor: string;
  category: string;
  qty: number;
  unitPriceAed: string;
  totalAed: string;
  available: number;
  allocated: number;
  lineItemId: string;
  purchaseId: string;
}

function buildRows(): PurchaseRow[] {
  return MOCK_PURCHASE_LINE_ITEMS.map((li, i) => {
    const purchase = MOCK_PURCHASES.find(p => p.id === li.purchaseId);
    const match = MOCK_MATCHES.find(m => m.id === purchase?.matchId);
    const units = MOCK_UNITS.filter(u => u.lineItemId === li.id);
    const allocated = units.filter(u => u.status === 'ALLOCATED').length;
    const available = units.length > 0 ? units.filter(u => u.status === 'AVAILABLE').length : li.qty;
    return {
      id: `PUR-${String(i + 1).padStart(3, '0')}`,
      date: purchase?.date ?? '',
      match: match ? `${match.code} ${match.teams}` : purchase?.matchId ?? '',
      vendor: purchase?.vendor ?? '',
      category: li.categoryLabel,
      qty: li.qty,
      unitPriceAed: `AED ${li.unitPrice.toLocaleString()}`,
      totalAed: `AED ${li.lineTotal.toLocaleString()}`,
      available: units.length > 0 ? available : li.qty,
      allocated: units.length > 0 ? allocated : 0,
      lineItemId: li.id,
      purchaseId: li.purchaseId,
    };
  });
}

function UnitDrawer({ purchase, onClose }: { purchase: PurchaseRow; onClose: () => void }) {
  const [showAll, setShowAll] = useState(false);
  const units = MOCK_UNITS.filter(u => u.lineItemId === purchase.lineItemId);
  const fallbackUnits = units.length > 0 ? units : Array.from({ length: purchase.qty }, (_, i) => ({
    id: `P${String(i + 1).padStart(5, '0')}`,
    setId: 'PR0002-S01', setSize: purchase.qty, setPos: i + 1,
    vendor: purchase.vendor, contract: '2025-100129', matchId: 'm01',
    status: 'AVAILABLE' as const, allocatedToLineItemId: null,
    purchaseId: purchase.purchaseId, lineItemId: purchase.lineItemId,
    subGameId: '', categoryId: '', categoryLabel: purchase.category,
  }));

  const allocated = fallbackUnits.filter(u => u.status === 'ALLOCATED').length;
  const available = fallbackUnits.length - allocated;
  const displayed = showAll ? fallbackUnits : fallbackUnits.slice(0, 24);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-foreground/30" onClick={onClose} />
      <div className="relative w-[480px] max-w-full h-full bg-bg-card shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="px-6 py-5 border-b" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-xl" style={{ color: '#0B2D5E' }}>Purchase Units — {purchase.id}</h3>
              <p className="font-body text-sm mt-1" style={{ color: '#6B7280' }}>{purchase.category} · {purchase.vendor}</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-md hover:bg-muted"><X size={18} /></button>
          </div>
          <div className="flex gap-4 mt-3 font-body text-xs" style={{ color: '#6B7280' }}>
            <span><strong className="text-foreground">{fallbackUnits.length}</strong> total</span>
            <span><strong style={{ color: '#065F46' }}>{allocated}</strong> allocated</span>
            <span><strong style={{ color: '#92400E' }}>{available}</strong> available</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-6 gap-2">
            {displayed.map(u => {
              const isAlloc = u.status === 'ALLOCATED';
              return (
                <div key={u.id} className="rounded-lg p-1.5 flex flex-col items-center justify-center text-center"
                  style={{ width: 72, height: 60, backgroundColor: isAlloc ? '#D1FAE5' : '#FEF3C7',
                    border: `1.5px solid ${isAlloc ? '#1A7A4A' : '#D97706'}`, color: isAlloc ? '#065F46' : '#92400E' }}>
                  <span className="font-mono text-[10px] font-bold">{u.id}</span>
                  <span className="font-body text-[9px] mt-0.5">
                    {isAlloc ? `ALLOC · ${u.allocatedToLineItemId}` : `AVAIL · Pos ${u.setPos}`}
                  </span>
                </div>
              );
            })}
          </div>
          {!showAll && fallbackUnits.length > 24 && (
            <button onClick={() => setShowAll(true)} className="mt-3 font-body text-xs font-medium hover:underline" style={{ color: '#C9A84C' }}>
              Show all {fallbackUnits.length} →
            </button>
          )}
        </div>

        <div className="px-6 py-3 border-t font-body text-xs" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
          SetID: {fallbackUnits[0]?.setId} &nbsp;|&nbsp; SetSize: {fallbackUnits.length} &nbsp;|&nbsp; Contract: {fallbackUnits[0]?.contract}
        </div>
      </div>
    </div>
  );
}

export default function PurchasesPage() {
  const navigate = useNavigate();
  const [matchFilter, setMatchFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [drawerPurchase, setDrawerPurchase] = useState<PurchaseRow | null>(null);

  const rows = buildRows().filter(r => {
    if (matchFilter !== 'all' && !r.match.startsWith(matchFilter)) return false;
    if (catFilter !== 'all' && r.category !== catFilter) return false;
    if (vendorFilter !== 'all' && r.vendor !== vendorFilter) return false;
    return true;
  });

  const selectClass = "h-[38px] px-3 rounded-lg font-body text-sm bg-bg-card outline-none border border-border focus:ring-1 focus:ring-gold";

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-[26px]" style={{ color: '#0B2D5E' }}>Purchases</h1>
        <RoleGuard roles={['super_admin', 'ops_manager', 'sr_operator', 'operator']}>
          <button onClick={() => navigate('/purchases/new')} className="px-4 py-2 rounded-lg font-body text-sm font-medium transition-opacity hover:opacity-90" style={{ backgroundColor: '#0B2D5E', color: '#C9A84C' }}>
            New Purchase +
          </button>
        </RoleGuard>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <select className={selectClass} disabled><option>FIFA WC 2026</option></select>
        <select className={selectClass} value={matchFilter} onChange={e => setMatchFilter(e.target.value)}>
          <option value="all">All Matches</option>
          {MOCK_MATCHES.map(m => <option key={m.id} value={m.code}>{m.code} — {m.teams}</option>)}
        </select>
        <select className={selectClass} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">All Categories</option>
          <option>Top Cat 1</option><option>Cat 2</option><option>Cat 3</option><option>Cat 4</option>
        </select>
        <select className={selectClass} value={vendorFilter} onChange={e => setVendorFilter(e.target.value)}>
          <option value="all">All Vendors</option>
          <option>poxami</option><option>viagogo</option>
        </select>
      </div>

      <div className="bg-bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr style={{ backgroundColor: '#0B2D5E', height: 44 }}>
                {['Purchase ID', 'Date', 'Match', 'Vendor', 'Category', 'Qty', 'Unit Price', 'Total Value', 'Unit Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-2.5 font-body text-[13px] font-bold" style={{ color: 'white' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const total = r.available + r.allocated;
                const allocPct = total > 0 ? (r.allocated / total) * 100 : 0;
                return (
                  <tr key={r.id} className="transition-colors cursor-default"
                    style={{ backgroundColor: i % 2 === 1 ? '#F8F9FC' : 'white' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#EEF3FF')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 1 ? '#F8F9FC' : 'white')}>
                    <td className="px-4 py-3 font-mono text-xs font-bold" style={{ color: '#0B2D5E' }}>{r.id}</td>
                    <td className="px-4 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>{r.date}</td>
                    <td className="px-4 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>{r.match}</td>
                    <td className="px-4 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>{r.vendor}</td>
                    <td className="px-4 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>{r.category}</td>
                    <td className="px-4 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>{r.qty}</td>
                    <td className="px-4 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>{r.unitPriceAed}</td>
                    <td className="px-4 py-3 font-mono text-[13px] font-medium" style={{ color: '#1A1A2E' }}>{r.totalAed}</td>
                    <td className="px-4 py-3">
                      <div className="font-body text-[11px] mb-1" style={{ color: '#6B7280' }}>{r.available} Avail / {r.allocated} Alloc</div>
                      <div className="w-full h-1.5 rounded-full flex overflow-hidden" style={{ backgroundColor: '#E5E7EB' }}>
                        <div className="h-full" style={{ width: `${100 - allocPct}%`, backgroundColor: '#D97706' }} />
                        <div className="h-full" style={{ width: `${allocPct}%`, backgroundColor: '#1A7A4A' }} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDrawerPurchase(r)} className="px-3 py-1.5 rounded-lg font-body text-xs font-medium transition-opacity hover:opacity-90" style={{ backgroundColor: '#0B2D5E', color: 'white' }}>
                        View Units
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {drawerPurchase && <UnitDrawer purchase={drawerPurchase} onClose={() => setDrawerPurchase(null)} />}
    </div>
  );
}
