import { useState, useMemo } from 'react';
import { MOCK_SALES, MOCK_MATCHES } from '@/data/mockData';
import { ChevronRight, X, Check, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'all' | 'unallocated' | 'allocated' | 'fulfilled';

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  ALLOCATED: { label: 'ALLOCATED', bg: '#D1FAE5', text: '#065F46' },
  PENDING_APPROVAL: { label: 'PENDING', bg: '#FEF3C7', text: '#92400E' },
  UNALLOCATED: { label: 'UNALLOCATED', bg: '#F3F4F6', text: '#374151' },
  FULFILLED: { label: 'FULFILLED', bg: '#064E3B', text: '#FFFFFF' },
};

interface ChildRow {
  id: string;
  unitId: string | null;
  status: string;
}

export default function DistributionPage() {
  const [tab, setTab] = useState<Tab>('unallocated');
  const [catFilter, setCatFilter] = useState('all');
  const [expandedSale, setExpandedSale] = useState<string | null>('s250156');
  const [allocatorSaleId, setAllocatorSaleId] = useState<string | null>(null);
  const [blockSelected, setBlockSelected] = useState(false);
  const [allocating, setAllocating] = useState(false);
  const [allocated, setAllocated] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualSelected, setManualSelected] = useState<Set<string>>(new Set());
  const [allocatedSales, setAllocatedSales] = useState<Set<string>>(new Set());

  const sales = MOCK_SALES.map(s => {
    const m = MOCK_MATCHES.find(m => m.id === s.matchId);
    const isNowAllocated = allocatedSales.has(s.id);
    return {
      ...s,
      matchLabel: m ? `${m.code} ${m.teams}` : s.matchId,
      displayStatus: isNowAllocated ? 'ALLOCATED' : s.status === 'PENDING_APPROVAL' ? 'UNALLOCATED' : s.status,
    };
  });

  const counts = useMemo(() => ({
    unallocated: sales.filter(s => s.displayStatus === 'UNALLOCATED').length,
    allocated: sales.filter(s => s.displayStatus === 'ALLOCATED').length,
    fulfilled: sales.filter(s => s.displayStatus === 'FULFILLED').length,
  }), [sales]);

  const filtered = sales.filter(s => {
    if (tab === 'unallocated' && s.displayStatus !== 'UNALLOCATED') return false;
    if (tab === 'allocated' && s.displayStatus !== 'ALLOCATED') return false;
    if (tab === 'fulfilled' && s.displayStatus !== 'FULFILLED') return false;
    if (catFilter !== 'all' && s.category !== catFilter) return false;
    return true;
  });

  const generateChildren = (saleId: string, qty: number, isAllocated: boolean): ChildRow[] =>
    Array.from({ length: qty }, (_, i) => ({
      id: `${saleId.toUpperCase()}-${i + 1}`,
      unitId: isAllocated ? `P${String(87 + i).padStart(5, '0')}` : null,
      status: isAllocated ? 'ALLOCATED' : 'UNALLOCATED',
    }));

  const activeSale = allocatorSaleId ? sales.find(s => s.id === allocatorSaleId) : null;

  const handleConfirm = async () => {
    setAllocating(true);
    await new Promise(r => setTimeout(r, 1500));
    setAllocating(false);
    setAllocated(true);
    if (allocatorSaleId) setAllocatedSales(prev => new Set(prev).add(allocatorSaleId));
  };

  const closePanel = () => {
    setAllocatorSaleId(null);
    setBlockSelected(false);
    setAllocating(false);
    setAllocated(false);
    setManualMode(false);
    setManualSelected(new Set());
  };

  const toggleManual = (id: string, qty: number) => {
    setManualSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < qty) next.add(id);
      return next;
    });
  };

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'all', label: 'All Sales' },
    { key: 'unallocated', label: 'Unallocated', count: counts.unallocated },
    { key: 'allocated', label: 'Allocated', count: counts.allocated },
    { key: 'fulfilled', label: 'Fulfilled', count: counts.fulfilled },
  ];

  const selectClass = "h-[38px] px-3 rounded-lg font-body text-sm bg-bg-card border border-border outline-none focus:ring-1 focus:ring-gold";

  return (
    <div>
      <h1 className="font-display text-[26px] mb-4" style={{ color: '#0B2D5E' }}>Distribution &amp; Allocation</h1>

      {/* Tabs */}
      <div className="flex gap-6 border-b mb-4" style={{ borderColor: '#E5E7EB' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="pb-2.5 font-body text-sm font-medium transition-colors relative"
            style={{ color: tab === t.key ? '#0B2D5E' : '#6B7280' }}
          >
            {t.label}{t.count !== undefined && ` (${t.count})`}
            {tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: '#0B2D5E' }} />}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select className={selectClass} disabled><option>M01 — MEX v RSA</option></select>
        <select className={selectClass} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">All Categories</option>
          <option>Top Cat 1</option><option>Cat 2</option><option>Cat 3</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[850px]">
            <thead>
              <tr style={{ backgroundColor: '#0B2D5E', height: 44 }}>
                {['', 'Sale ID', 'Client', 'Category', 'Qty', 'Allocated', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-2.5 font-body text-[13px] font-bold" style={{ color: 'white' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const isExpanded = expandedSale === s.id;
                const st = STATUS_MAP[s.displayStatus] || STATUS_MAP['UNALLOCATED'];
                const isAllocNow = allocatedSales.has(s.id);
                const allocCount = isAllocNow ? s.qty : (s.displayStatus === 'ALLOCATED' ? s.qty : 0);
                const children = generateChildren(s.id, s.qty, isAllocNow || s.displayStatus === 'ALLOCATED');

                return (
                  <>
                    <tr
                      key={s.id}
                      className="transition-colors"
                      style={{ backgroundColor: i % 2 === 1 ? '#F8F9FC' : 'white' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#EEF3FF')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 1 ? '#F8F9FC' : 'white')}
                    >
                      <td className="px-4 py-3 w-10">
                        <button onClick={() => setExpandedSale(isExpanded ? null : s.id)}>
                          <ChevronRight
                            size={16}
                            className="transition-transform"
                            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', color: '#6B7280' }}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold" style={{ color: '#0B2D5E' }}>{s.id.toUpperCase()}</td>
                      <td className="px-4 py-3 font-body text-[13px] font-medium" style={{ color: '#1A1A2E' }}>{s.client}</td>
                      <td className="px-4 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>{s.category}</td>
                      <td className="px-4 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>{s.qty}</td>
                      <td className="px-4 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>{allocCount}/{s.qty}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full font-body text-[11px] font-medium" style={{ backgroundColor: st.bg, color: st.text }}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        {s.displayStatus === 'UNALLOCATED' && (
                          <button
                            onClick={() => { setAllocatorSaleId(s.id); setBlockSelected(false); setAllocated(false); setManualMode(false); setManualSelected(new Set()); }}
                            className="px-3 py-1.5 rounded-lg font-body text-xs font-bold transition-opacity hover:opacity-90"
                            style={{ backgroundColor: '#C9A84C', color: '#0B2D5E' }}
                          >
                            Allocate Now
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && children.map(c => {
                      const cSt = STATUS_MAP[c.status] || STATUS_MAP['UNALLOCATED'];
                      return (
                        <tr key={c.id} style={{ backgroundColor: '#FAFBFD' }}>
                          <td className="px-4 py-2" />
                          <td className="px-4 py-2 font-mono text-[11px]" style={{ color: '#6B7280', borderLeft: '2px solid #E5E7EB', paddingLeft: 20 }}>{c.id}</td>
                          <td className="px-4 py-2 font-body text-xs" style={{ color: '#6B7280' }}>{s.client}</td>
                          <td className="px-4 py-2 font-body text-xs" style={{ color: '#6B7280' }}>{s.category}</td>
                          <td className="px-4 py-2 font-mono text-xs" style={{ color: '#6B7280' }}>1</td>
                          <td className="px-4 py-2 font-mono text-xs" style={{ color: '#6B7280' }}>{c.unitId || '—'}</td>
                          <td className="px-4 py-2">
                            <span className="px-2 py-0.5 rounded-full font-body text-[10px] font-medium" style={{ backgroundColor: cSt.bg, color: cSt.text }}>{cSt.label}</span>
                          </td>
                          <td />
                        </tr>
                      );
                    })}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allocator Panel */}
      <AnimatePresence>
        {allocatorSaleId && activeSale && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={closePanel} />
            <motion.div
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-[420px] max-w-full h-full bg-bg-card shadow-2xl flex flex-col"
              style={{ borderLeft: '1px solid #E5E7EB' }}
            >
              {/* Panel header */}
              <div className="px-6 py-5 border-b flex items-start justify-between" style={{ borderColor: '#E5E7EB' }}>
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-xl" style={{ color: '#0B2D5E' }}>Allocator</h2>
                  <span className="px-2 py-0.5 rounded-full font-mono text-[11px] font-bold" style={{ backgroundColor: '#0B2D5E', color: 'white' }}>
                    {activeSale.id.toUpperCase()}
                  </span>
                </div>
                <button onClick={closePanel} className="p-1 rounded hover:bg-muted"><X size={18} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {!allocated ? (
                  <>
                    {/* Section A: Selected Sale */}
                    <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: '#F8F9FC' }}>
                      <p className="font-body text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>Selected Sale</p>
                      {[
                        ['SalesID', activeSale.id.toUpperCase(), true],
                        ['Client', activeSale.client, false],
                        ['Match', activeSale.matchLabel, false],
                        ['Category', activeSale.category, false],
                        ['Qty Required', `${activeSale.qty} tickets`, false],
                        ['Effective Category', activeSale.category, false],
                      ].map(([label, val, mono]) => (
                        <div key={label as string} className="flex justify-between">
                          <span className="font-body text-[13px]" style={{ color: '#6B7280' }}>{label as string}</span>
                          <span className={`text-[13px] font-medium ${mono ? 'font-mono' : 'font-body'}`} style={{ color: '#1A1A2E' }}>{val as string}</span>
                        </div>
                      ))}
                    </div>

                    {/* Section B: Vendor Blocks */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <p className="font-body text-sm font-bold" style={{ color: '#0B2D5E' }}>Available Vendor Blocks</p>
                        <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>1</span>
                      </div>

                      <div
                        className="rounded-xl p-4 transition-all"
                        style={{ border: `1.5px solid ${blockSelected ? '#C9A84C' : '#E5E7EB'}` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-body text-sm font-bold" style={{ color: '#1A1A2E' }}>poxami</span>
                          <div className="flex gap-1.5">
                            <span className="px-2 py-0.5 rounded-full font-body text-[10px] font-medium" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>Match ✓</span>
                            <span className="px-2 py-0.5 rounded-full font-body text-[10px] font-medium" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>Cat ✓</span>
                          </div>
                        </div>
                        <div className="space-y-0.5 mb-3">
                          <p className="font-mono text-xs" style={{ color: '#6B7280' }}>SetID: PR0003-S01 | SetSize: 60</p>
                          <p className="font-body text-xs" style={{ color: '#1A7A4A' }}>Available: 60 units</p>
                        </div>

                        {!blockSelected ? (
                          <button
                            onClick={() => setBlockSelected(true)}
                            className="w-full h-10 rounded-lg font-body text-sm font-bold transition-opacity hover:opacity-90"
                            style={{ backgroundColor: '#0B2D5E', color: 'white' }}
                          >
                            SELECT THIS BLOCK
                          </button>
                        ) : (
                          <button className="w-full h-10 rounded-lg font-body text-sm font-bold flex items-center justify-center gap-2" style={{ backgroundColor: '#D97706', color: 'white' }}>
                            <Check size={14} /> Block Selected ✓
                          </button>
                        )}
                      </div>

                      {/* Allocation preview */}
                      {blockSelected && (
                        <div className="mt-4 space-y-3">
                          <p className="font-body text-sm font-bold" style={{ color: '#0B2D5E' }}>Allocation Preview</p>
                          <div className="rounded-lg p-3 space-y-1" style={{ backgroundColor: '#F8F9FC' }}>
                            <p className="font-body text-[13px]" style={{ color: '#1A1A2E' }}>
                              Allocating <strong>{activeSale.qty}</strong> consecutive units: <span className="font-mono">P00087 – P{String(86 + activeSale.qty).padStart(5, '0')}</span>
                            </p>
                            <p className="font-body text-xs" style={{ color: '#6B7280' }}>Starting SetPos: 1 | Ending SetPos: {activeSale.qty}</p>
                            <p className="font-mono text-xs" style={{ color: '#6B7280' }}>AllocNote: FIFA26-ALLOC-0417-00001</p>
                          </div>
                          <button
                            onClick={handleConfirm}
                            disabled={allocating}
                            className="w-full h-10 rounded-lg font-body text-sm font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-70"
                            style={{ backgroundColor: '#C9A84C', color: '#0B2D5E' }}
                          >
                            {allocating ? <><Loader2 size={14} className="animate-spin" /> Allocating...</> : 'CONFIRM ALLOCATION'}
                          </button>
                        </div>
                      )}

                      {/* Manual link */}
                      {!manualMode ? (
                        <button onClick={() => setManualMode(true)} className="mt-4 font-body text-xs hover:underline" style={{ color: '#C9A84C' }}>
                          Or manually select individual units →
                        </button>
                      ) : (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-body text-xs font-bold" style={{ color: '#0B2D5E' }}>Manual Unit Selection</p>
                            <span className="font-mono text-xs" style={{ color: '#6B7280' }}>{manualSelected.size} of {activeSale.qty} selected</span>
                          </div>
                          <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto">
                            {Array.from({ length: 60 }, (_, i) => {
                              const uid = `P${String(87 + i).padStart(5, '0')}`;
                              const selected = manualSelected.has(uid);
                              return (
                                <button
                                  key={uid}
                                  onClick={() => toggleManual(uid, activeSale.qty)}
                                  className="rounded-md p-1 text-center transition-all"
                                  style={{
                                    border: `1.5px solid ${selected ? '#1A7A4A' : '#D97706'}`,
                                    backgroundColor: selected ? '#D1FAE5' : '#FEF3C7',
                                    color: selected ? '#065F46' : '#92400E',
                                  }}
                                >
                                  <span className="font-mono text-[9px] font-bold block">{uid}</span>
                                  {selected && <Check size={10} className="mx-auto" />}
                                </button>
                              );
                            })}
                          </div>
                          <button
                            disabled={manualSelected.size !== activeSale.qty}
                            className="w-full mt-3 h-9 rounded-lg font-body text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-40"
                            style={{ backgroundColor: '#0B2D5E', color: 'white' }}
                          >
                            Apply Manual Selection
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* SUCCESS STATE */
                  <div className="flex flex-col items-center text-center py-8 space-y-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#D1FAE5' }}>
                      <CheckCircle size={40} style={{ color: '#1A7A4A' }} />
                    </div>
                    <h3 className="font-display text-[22px]" style={{ color: '#1A7A4A' }}>Allocation Complete!</h3>
                    <p className="font-body text-sm" style={{ color: '#1A1A2E' }}>
                      <strong>{activeSale.qty}</strong> units allocated to <strong>{activeSale.client}</strong>
                    </p>
                    <div className="rounded-lg p-3 w-full space-y-1" style={{ backgroundColor: '#F8F9FC' }}>
                      <p className="font-mono text-xs" style={{ color: '#6B7280' }}>Units: P00087 – P{String(86 + activeSale.qty).padStart(5, '0')}</p>
                      <p className="font-mono text-xs" style={{ color: '#6B7280' }}>AllocNote: FIFA26-ALLOC-0417-00001</p>
                    </div>
                    <button className="w-full h-10 rounded-lg font-body text-sm font-bold transition-opacity hover:opacity-90" style={{ backgroundColor: '#0B2D5E', color: 'white' }}>
                      Generate Client Portal →
                    </button>
                    <button onClick={closePanel} className="font-body text-sm hover:underline" style={{ color: '#6B7280' }}>Close</button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
