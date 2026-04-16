import React, { useState, useMemo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { useEvent } from '@/context/EventContext';
import {
  MOCK_SALES, MOCK_MATCHES, MOCK_DIST_ROWS, MOCK_UNITS, MOCK_SUBGAMES,
  getSubGamesForMatch, hasMultipleSubGames, getInventoryAvailable,
  getInventoryByVendor, getAllocatedUnitsForSaleLine, getAvailableUnitsFromSet,
  type SaleLineItem, type DistRow,
} from '@/data/mockData';
import { useContextHelpers } from '@/hooks/useContextHelpers';
import { ChevronRight, X, Check, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UpgradeModal from '@/components/UpgradeModal';
import OversellResolutionDrawer from '@/components/OversellResolutionDrawer';

type Tab = 'all' | 'unallocated' | 'allocated' | 'fulfilled';

const STATUS_CLS: Record<string, { label: string; cls: string }> = {
  ALLOCATED:        { label: 'ALLOCATED',   cls: 'bg-success/15 text-success' },
  SENT:             { label: 'SENT',        cls: 'bg-success text-primary-foreground' },
  PENDING_APPROVAL: { label: 'PENDING ⚠',  cls: 'bg-warning/15 text-warning' },
  UNALLOCATED:      { label: 'UNALLOCATED', cls: 'bg-muted text-muted-foreground' },
  NOT_SENT:         { label: 'NOT SENT',    cls: 'bg-muted text-muted-foreground' },
  FULFILLED:        { label: 'FULFILLED',   cls: 'bg-success text-primary-foreground' },
  PARTIAL:          { label: 'PARTIAL',     cls: 'bg-warning/15 text-warning' },
  PARTIAL_PENDING:  { label: 'PARTIAL PENDING', cls: 'bg-warning/15 text-warning' },
};

function getMatchLabel(matchId: string) { const m = MOCK_MATCHES.find(x => x.id === matchId); return m ? `${m.code} ${m.teams}` : matchId; }
function getSubGameName(sgId: string) { return MOCK_SUBGAMES.find(sg => sg.id === sgId)?.name ?? '—'; }

function deriveSaleStatus(lines: SaleLineItem[]): string {
  if (lines.every(l => l.status === 'FULFILLED')) return 'FULFILLED';
  if (lines.some(l => l.oversellFlag || l.status === 'PENDING_APPROVAL')) return 'PARTIAL_PENDING';
  if (lines.every(l => l.status === 'ALLOCATED')) return 'ALLOCATED';
  if (lines.some(l => l.status === 'ALLOCATED')) return 'PARTIAL';
  return 'UNALLOCATED';
}

function getDistRowsForLine(lineItemId: string): DistRow[] {
  return MOCK_DIST_ROWS.filter(r => r.lineItemId === lineItemId);
}

/* ── Allocate All Modal ── */
function AllocateAllModal({ saleId, onClose, onConfirm }: { saleId: string; onClose: () => void; onConfirm: () => void }) {
  const sale = MOCK_SALES.find(s => s.id === saleId);
  if (!sale) return null;

  const linePreview = sale.lines.map(li => {
    const available = getInventoryAvailable(li.subGameId, li.categoryId);
    const isPending = li.oversellFlag || li.status === 'PENDING_APPROVAL';
    const isReady = !isPending && li.status !== 'ALLOCATED' && li.status !== 'FULFILLED';
    const vendor = MOCK_UNITS.find(u => u.subGameId === li.subGameId && u.categoryId === li.categoryId)?.vendor ?? '—';
    return { ...li, available, isPending, isReady, vendor };
  });
  const readyCount = linePreview.filter(l => l.isReady).length;
  const pendingCount = linePreview.filter(l => l.isPending).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative bg-card rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6 z-10">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded hover:bg-muted"><X size={18} /></button>
        <h2 className="font-display text-xl text-primary mb-4">Allocate All — {saleId.toUpperCase()}</h2>

        <div className="space-y-2 mb-4">
          {linePreview.map((lp, i) => (
            <div key={lp.id} className={`rounded-lg p-3 border ${lp.isPending ? 'border-warning bg-warning/5' : lp.isReady ? 'border-success bg-success/5' : 'border-border bg-muted/50'}`}>
              <div className="flex items-center justify-between">
                <span className="font-body text-sm text-foreground">
                  Line {i + 1}: {lp.categoryLabel} × {lp.qty}
                </span>
                {lp.isPending ? (
                  <span className="font-body text-xs text-warning font-medium">PENDING APPROVAL — skip</span>
                ) : lp.isReady ? (
                  <span className="font-body text-xs text-success font-medium">→ {lp.vendor} ({lp.available} available) ✓ Ready</span>
                ) : (
                  <span className="font-body text-xs text-muted-foreground">Already {lp.status.toLowerCase()}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {pendingCount > 0 && (
          <p className="font-body text-xs text-warning mb-4">
            Will allocate {readyCount} of {sale.lines.length} lines. {pendingCount} line{pendingCount > 1 ? 's' : ''} requires manager approval first.
          </p>
        )}

        <button onClick={onConfirm}
          className="w-full h-10 rounded-lg font-body text-sm font-bold bg-primary text-primary-foreground hover:opacity-90">
          Allocate {readyCount} Ready Line{readyCount !== 1 ? 's' : ''}
        </button>
        <div className="text-center mt-2">
          <button onClick={onClose} className="font-body text-sm hover:underline text-muted-foreground">Cancel</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Main Page ── */
export default function DistributionPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('all');
  const [catFilter, setCatFilter] = useState('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [expandedLines, setExpandedLines] = useState<Record<string, boolean>>({});
  const [allocatorCtx, setAllocatorCtx] = useState<{ saleId: string; lineItem: SaleLineItem; lineIdx: number } | null>(null);
  const [blockSelected, setBlockSelected] = useState(false);
  const [allocating, setAllocating] = useState(false);
  const [allocated, setAllocated] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualSelected, setManualSelected] = useState<Set<string>>(new Set());
  const [allocatedLineIds, setAllocatedLineIds] = useState<Set<string>>(new Set());
  const [allocateAllSale, setAllocateAllSale] = useState<string | null>(null);
  const [upgradeCtx, setUpgradeCtx] = useState<{ saleId: string; lineItem: SaleLineItem; lineIdx: number } | null>(null);
  const [oversellCtx, setOversellCtx] = useState<{ saleId: string; lineItem: SaleLineItem; lineIdx: number } | null>(null);

  const toggleExpand = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleLine = (id: string) => setExpandedLines(prev => ({ ...prev, [id]: !prev[id] }));

  // Tab counts at sale level
  const saleCounts = useMemo(() => {
    const c = { unallocated: 0, allocated: 0, fulfilled: 0 };
    MOCK_SALES.forEach(s => {
      const lines = s.lines.map(l => allocatedLineIds.has(l.id) ? { ...l, status: 'ALLOCATED' as const } : l);
      const st = deriveSaleStatus(lines);
      if (st === 'UNALLOCATED' || st === 'PARTIAL' || st === 'PARTIAL_PENDING') c.unallocated++;
      else if (st === 'ALLOCATED') c.allocated++;
      else if (st === 'FULFILLED') c.fulfilled++;
    });
    return c;
  }, [allocatedLineIds]);

  const filteredSales = MOCK_SALES.filter(s => {
    const lines = s.lines.map(l => allocatedLineIds.has(l.id) ? { ...l, status: 'ALLOCATED' as const } : l);
    const st = deriveSaleStatus(lines);
    if (tab === 'unallocated' && st !== 'UNALLOCATED' && st !== 'PARTIAL' && st !== 'PARTIAL_PENDING') return false;
    if (tab === 'allocated' && st !== 'ALLOCATED') return false;
    if (tab === 'fulfilled' && st !== 'FULFILLED') return false;
    if (catFilter !== 'all' && !s.lines.some(l => l.categoryLabel === catFilter)) return false;
    return true;
  });

  const closePanel = () => {
    setAllocatorCtx(null); setBlockSelected(false); setAllocating(false);
    setAllocated(false); setManualMode(false); setManualSelected(new Set());
  };

  const handleConfirm = async () => {
    if (!allocatorCtx) return;
    setAllocating(true);
    await new Promise(r => setTimeout(r, 1500));
    setAllocating(false);
    setAllocated(true);
    setAllocatedLineIds(prev => new Set(prev).add(allocatorCtx.lineItem.id));
  };

  const toggleManualUnit = (id: string, max: number) => {
    setManualSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else if (next.size < max) next.add(id);
      return next;
    });
  };

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'all', label: 'All Sales' },
    { key: 'unallocated', label: 'Unallocated', count: saleCounts.unallocated },
    { key: 'allocated', label: 'Allocated', count: saleCounts.allocated },
    { key: 'fulfilled', label: 'Fulfilled', count: saleCounts.fulfilled },
  ];

  const selectClass = "h-[38px] px-3 rounded-lg font-body text-sm bg-card border border-border outline-none focus:ring-1 focus:ring-accent";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-[26px] text-primary">Distribution &amp; Allocation</h1>
        <button
          onClick={() => navigate('/distribution/auto-allocate')}
          className="h-10 px-5 rounded-lg font-body text-sm font-bold bg-gradient-to-r from-accent to-[#E8C56A] text-primary hover:shadow-lg flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          Auto-Allocate Engine
        </button>
      </div>

      <div className="flex gap-6 border-b border-border mb-4">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`pb-2.5 font-body text-sm font-medium transition-colors relative ${tab === t.key ? 'text-primary' : 'text-muted-foreground'}`}>
            {t.label}{t.count !== undefined && ` (${t.count})`}
            {tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        <select className={selectClass} disabled><option>All Matches</option></select>
        <select className={selectClass} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">All Categories</option>
          <option>Top Cat 1</option><option>Cat 2</option><option>Cat 3</option>
          <option>Grandstand A</option><option>Paddock Club</option>
        </select>
      </div>

      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="bg-primary h-[44px]">
                {['', 'Sale ID', 'Client', 'Match', 'Total Tickets', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-2.5 font-body text-[13px] font-bold text-primary-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((s, si) => {
                const effectiveLines = s.lines.map(l => allocatedLineIds.has(l.id)
                  ? { ...l, status: 'ALLOCATED' as const, oversellFlag: false } : l);
                const isExpanded = expanded[s.id];
                const saleLabel = s.id.toUpperCase().replace('SALE', 'SALE-');
                const overallStatus = deriveSaleStatus(effectiveLines);
                const st = STATUS_CLS[overallStatus] || STATUS_CLS['UNALLOCATED'];
                const totalQty = effectiveLines.reduce((sum, l) => sum + l.qty, 0);
                const isMultiSg = hasMultipleSubGames(s.matchId);

                return (
                  <Fragment key={s.id}>
                    {/* Sale parent row */}
                    <tr
                      className="transition-colors cursor-pointer border-b border-border"
                      style={{ backgroundColor: si % 2 === 1 ? 'hsl(var(--muted))' : 'hsl(var(--card))' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#EEF3FF')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = si % 2 === 1 ? 'hsl(220 14% 96%)' : 'white')}
                      onClick={() => toggleExpand(s.id)}
                    >
                      <td className="px-4 py-3 w-8">
                        <ChevronRight size={16} className={`text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{saleLabel}</td>
                      <td className="px-4 py-3 font-body text-[13px] font-medium text-foreground">{s.client}</td>
                      <td className="px-4 py-3 font-body text-[13px] text-foreground">{getMatchLabel(s.matchId)}</td>
                      <td className="px-4 py-3 font-mono text-[13px] text-foreground">{totalQty} tickets</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-body text-[11px] font-medium ${st.cls}`}>
                          {overallStatus.includes('PENDING') && <AlertTriangle size={11} />}
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <button onClick={() => navigate(`/distribution/${s.id}/preview`)}
                            className="px-3 py-1.5 rounded-lg font-body text-xs font-medium bg-accent text-accent-foreground hover:opacity-90">
                            Allocate
                          </button>
                          <button className="font-body text-xs text-primary hover:underline">Upgrade</button>
                          <button className="font-body text-xs text-destructive hover:underline">Cancel</button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded: line groups + child rows */}
                    {isExpanded && effectiveLines.map((li, liIdx) => {
                      const lineSt = STATUS_CLS[li.status] || STATUS_CLS['UNALLOCATED'];
                      const sgName = getSubGameName(li.subGameId);
                      const isPending = li.oversellFlag || li.status === 'PENDING_APPROVAL';
                      const isLineExpanded = expandedLines[li.id];
                      const distRows = getDistRowsForLine(li.id);

                      return (
                        <Fragment key={li.id}>
                          {/* Line group header */}
                          <tr
                            className="bg-muted/70 border-b border-border cursor-pointer"
                            onClick={() => toggleLine(li.id)}
                          >
                            <td className="px-4 py-2.5">
                              <ChevronRight size={13} className={`text-muted-foreground transition-transform duration-200 ${isLineExpanded ? 'rotate-90' : ''}`} />
                            </td>
                            <td colSpan={4} className="px-4 py-2.5">
                              <div className="flex items-center gap-3">
                                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-primary/10 text-primary">L{liIdx + 1}</span>
                                <span className="font-body text-[13px] text-foreground">
                                  {sgName} · {li.categoryLabel} · {li.qty} tickets
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-body text-[10px] font-medium ${lineSt.cls}`}>
                                {isPending && <AlertTriangle size={10} />}
                                {lineSt.label}
                              </span>
                            </td>
                            <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}>
                              <div className="flex gap-2">
                                {isPending ? (
                                  <button onClick={() => setOversellCtx({ saleId: s.id, lineItem: li, lineIdx: liIdx })} className="px-3 py-1 rounded-lg font-body text-[11px] font-medium bg-warning text-primary-foreground hover:opacity-90">Review</button>
                                ) : li.status === 'ALLOCATED' ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        setAllocatedLineIds(prev => { const next = new Set(prev); next.delete(li.id); return next; });
                                      }}
                                      className="px-3 py-1 rounded-lg font-body text-[11px] font-medium bg-destructive/10 text-destructive hover:bg-destructive/20">
                                      Unallocate
                                    </button>
                                    <button
                                      onClick={() => {
                                        setAllocatedLineIds(prev => { const next = new Set(prev); next.delete(li.id); return next; });
                                        setAllocatorCtx({ saleId: s.id, lineItem: li, lineIdx: liIdx });
                                      }}
                                      className="px-3 py-1 rounded-lg font-body text-[11px] font-medium bg-warning/10 text-warning hover:bg-warning/20">
                                      Reallocate
                                    </button>
                                  </>
                                ) : li.status !== 'FULFILLED' ? (
                                  <button
                                    onClick={() => navigate(`/distribution/${s.id}/preview`)}
                                    className="px-3 py-1 rounded-lg font-body text-[11px] font-medium bg-accent text-accent-foreground hover:opacity-90">
                                    Allocate
                                  </button>
                                ) : null}
                                <button onClick={() => setUpgradeCtx({ saleId: s.id, lineItem: li, lineIdx: liIdx })} className="font-body text-[11px] hover:underline" style={{ color: '#0D9488' }}>Change Category</button>
                              </div>
                            </td>
                          </tr>

                          {/* Session context row */}
                          {isLineExpanded && (
                            <tr className="border-b border-border/30 bg-accent/5">
                              <td />
                              <td colSpan={6} className="px-4 py-1.5" style={{ paddingLeft: 28 }}>
                                <span className="font-body text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Session: {sgName}</span>
                              </td>
                            </tr>
                          )}

                          {/* Child distribution rows */}
                          {isLineExpanded && distRows.map(dr => {
                            const drSt = STATUS_CLS[dr.status] || STATUS_CLS['UNALLOCATED'];
                            const dispSt = STATUS_CLS[dr.dispatchStatus] || STATUS_CLS['NOT_SENT'];
                            return (
                              <tr key={dr.id} className={`border-b border-border/30 ${isPending ? 'bg-warning/5' : 'bg-muted/30'}`}>
                                <td />
                                <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground" style={{ paddingLeft: 28, borderLeft: '2px solid hsl(var(--border))' }}>
                                  {dr.id}
                                </td>
                                <td className="px-4 py-2 font-body text-[11px] text-muted-foreground">{sgName}</td>
                                <td className="px-4 py-2">
                                  <span className={`px-1.5 py-0.5 rounded-full font-body text-[9px] font-medium ${drSt.cls}`}>{drSt.label}</span>
                                </td>
                                <td className="px-4 py-2 font-mono text-[11px] text-foreground">{dr.unitId || '—'}</td>
                                <td className="px-4 py-2">
                                  <span className={`px-1.5 py-0.5 rounded-full font-body text-[9px] font-medium ${dispSt.cls}`}>{dispSt.label}</span>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="font-body text-[11px] text-muted-foreground">
                                    {dr.clientFirstName ? `${dr.clientFirstName} ${dr.clientLastName}` : '—'}
                                    {dr.clientEmail && <span className="ml-2 text-[10px]">{dr.clientEmail}</span>}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}

                          {/* If no dist rows, generate placeholder */}
                          {isLineExpanded && distRows.length === 0 && Array.from({ length: li.qty }, (_, i) => (
                            <tr key={`${li.id}-ph-${i}`} className="border-b border-border/30 bg-muted/30">
                              <td />
                              <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground" style={{ paddingLeft: 28, borderLeft: '2px solid hsl(var(--border))' }}>
                                {li.id.toUpperCase()}-{i + 1}
                              </td>
                              <td className="px-4 py-2 font-body text-[11px] text-muted-foreground">{sgName}</td>
                              <td className="px-4 py-2"><span className="px-1.5 py-0.5 rounded-full font-body text-[9px] font-medium bg-muted text-muted-foreground">UNALLOCATED</span></td>
                              <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground">—</td>
                              <td className="px-4 py-2"><span className="px-1.5 py-0.5 rounded-full font-body text-[9px] font-medium bg-muted text-muted-foreground">NOT SENT</span></td>
                              <td className="px-4 py-2 font-body text-[11px] text-muted-foreground">—</td>
                            </tr>
                          ))}
                        </Fragment>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allocate All Modal */}
      <AnimatePresence>
        {allocateAllSale && (
          <AllocateAllModal
            saleId={allocateAllSale}
            onClose={() => setAllocateAllSale(null)}
            onConfirm={() => {
              const sale = MOCK_SALES.find(s => s.id === allocateAllSale);
              if (sale) {
                const readyIds = sale.lines
                  .filter(l => !l.oversellFlag && l.status !== 'PENDING_APPROVAL' && l.status !== 'ALLOCATED' && l.status !== 'FULFILLED')
                  .map(l => l.id);
                setAllocatedLineIds(prev => { const next = new Set(prev); readyIds.forEach(id => next.add(id)); return next; });
              }
              setAllocateAllSale(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Allocator Panel */}
      <AnimatePresence>
        {allocatorCtx && (() => {
          const { saleId, lineItem, lineIdx } = allocatorCtx;
          const sale = MOCK_SALES.find(s => s.id === saleId);
          const sgName = getSubGameName(lineItem.subGameId);
          const vendorInventory = getInventoryByVendor(lineItem.subGameId, lineItem.categoryId);
          const availableUnits = MOCK_UNITS.filter(u => u.subGameId === lineItem.subGameId && u.categoryId === lineItem.categoryId && u.status === 'AVAILABLE');
          const vendorBlocks = Object.entries(
            availableUnits.reduce<Record<string, typeof availableUnits>>((acc, u) => {
              const key = `${u.vendor}::${u.setId}`;
              (acc[key] = acc[key] || []).push(u);
              return acc;
            }, {})
          );
          const allocatedUnits = getAllocatedUnitsForSaleLine(lineItem.id);

          return (
            <div className="fixed inset-0 z-50 flex justify-end">
              <div className="absolute inset-0 bg-foreground/30" onClick={closePanel} />
              <motion.div initial={{ x: 420, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 420, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="relative w-[440px] max-w-full h-full bg-card shadow-2xl flex flex-col z-10 border-l border-border">

                <div className="px-6 py-5 border-b border-border flex items-start justify-between">
                  <div>
                    <h2 className="font-display text-lg text-primary">Allocator — {saleId.toUpperCase()} / Line {lineIdx + 1} / {lineItem.categoryLabel}</h2>
                  </div>
                  <button onClick={closePanel} className="p-1 rounded hover:bg-muted"><X size={18} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {!allocated ? (
                    <>
                      {/* Section A: Selected Line */}
                      <div className="rounded-lg p-4 bg-muted/50 space-y-1.5">
                        <p className="font-body text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Selected Sale Line</p>
                        {[
                          ['Sale', saleId.toUpperCase()],
                          ['Client', sale?.client ?? '—'],
                          ['Line', String(lineIdx + 1)],
                          ['Sub-Game', `${sgName} (${lineItem.subGameId})`],
                          ['Category', lineItem.categoryLabel],
                          ['Qty Required', `${lineItem.qty} tickets`],
                        ].map(([label, val]) => (
                          <div key={label} className="flex justify-between">
                            <span className="font-body text-[13px] text-muted-foreground">{label}</span>
                            <span className="font-body text-[13px] font-medium text-foreground">{val}</span>
                          </div>
                        ))}
                      </div>

                      {/* Section B: Vendor Blocks */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <p className="font-body text-sm font-bold text-primary">Available Vendor Blocks</p>
                          <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-success/15 text-success">{vendorBlocks.length}</span>
                        </div>

                        {vendorBlocks.length === 0 ? (
                          <div className="rounded-lg p-4 border border-border bg-muted">
                            <p className="font-body text-sm text-muted-foreground">No exact match. No units available for this sub-game + category combination.</p>
                            <p className="font-body text-xs text-muted-foreground mt-1">Cross-sub-game allocation is not allowed — different session = different ticket.</p>
                          </div>
                        ) : vendorBlocks.map(([key, units]) => {
                          const first = units[0];
                          return (
                            <div key={key} className="rounded-xl p-4 mb-3 transition-all" style={{ border: `1.5px solid ${blockSelected ? 'hsl(var(--accent))' : 'hsl(var(--border))'}` }}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-body text-sm font-bold text-foreground">{first.vendor}</span>
                                <div className="flex gap-1.5">
                                  <span className="px-2 py-0.5 rounded-full font-body text-[10px] font-medium bg-success/15 text-success">Sub-Game Match ✓</span>
                                  <span className="px-2 py-0.5 rounded-full font-body text-[10px] font-medium bg-success/15 text-success">Category Match ✓</span>
                                </div>
                              </div>
                              <div className="space-y-0.5 mb-3">
                                <p className="font-mono text-xs text-muted-foreground">SetID: {first.setId} | Sub-Game: {sgName}</p>
                                <p className="font-body text-xs text-success">Available: {units.length} units</p>
                              </div>

                              {!blockSelected ? (
                                <button onClick={() => setBlockSelected(true)}
                                  className="w-full h-10 rounded-lg font-body text-sm font-bold bg-primary text-primary-foreground hover:opacity-90">
                                  SELECT THIS BLOCK
                                </button>
                              ) : (
                                <button className="w-full h-10 rounded-lg font-body text-sm font-bold flex items-center justify-center gap-2 bg-warning text-primary-foreground">
                                  <Check size={14} /> Block Selected ✓
                                </button>
                              )}
                            </div>
                          );
                        })}

                        {/* Section C: Allocation Preview */}
                        {blockSelected && vendorBlocks.length > 0 && (() => {
                          const allUnits = vendorBlocks[0][1];
                          const startUnit = allUnits[0];
                          const endUnit = allUnits[Math.min(lineItem.qty - 1, allUnits.length - 1)];
                          return (
                            <div className="mt-4 space-y-3">
                              <p className="font-body text-sm font-bold text-primary">Allocation Preview</p>
                              <div className="rounded-lg p-3 bg-muted/50 space-y-1">
                                <p className="font-body text-[13px] text-foreground">
                                  Allocating <strong>{lineItem.qty}</strong> units: <span className="font-mono">{startUnit.id} – {endUnit.id}</span>
                                </p>
                                <p className="font-body text-xs text-muted-foreground">Sub-Game: {sgName} | Category: {lineItem.categoryLabel} | Vendor: {startUnit.vendor}</p>
                                <p className="font-mono text-xs text-muted-foreground">AllocNote: FIFA26-{MOCK_MATCHES.find(m => m.id === startUnit.matchId)?.code ?? 'XX'}-SG{lineIdx + 1}-L{lineIdx + 1}-ALLOC-0417-001</p>
                              </div>
                              <button onClick={handleConfirm} disabled={allocating}
                                className="w-full h-10 rounded-lg font-body text-sm font-bold flex items-center justify-center gap-2 bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-70">
                                {allocating ? <><Loader2 size={14} className="animate-spin" /> Allocating...</> : 'CONFIRM ALLOCATION'}
                              </button>
                            </div>
                          );
                        })()}

                        {/* Manual selection */}
                        {!manualMode && !blockSelected && vendorBlocks.length > 0 && (
                          <button onClick={() => setManualMode(true)} className="mt-4 font-body text-xs hover:underline text-accent">
                            Or manually select individual units →
                          </button>
                        )}

                        {manualMode && vendorBlocks.length > 0 && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-body text-xs font-bold text-primary">Manual Unit Selection</p>
                              <span className="font-mono text-xs text-muted-foreground">{manualSelected.size} of {lineItem.qty} selected</span>
                            </div>
                            <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto">
                              {vendorBlocks[0][1].map(u => {
                                const sel = manualSelected.has(u.id);
                                return (
                                  <button key={u.id} onClick={() => toggleManualUnit(u.id, lineItem.qty)}
                                    className="rounded-md p-1 text-center transition-all"
                                    style={{
                                      border: `1.5px solid ${sel ? 'hsl(var(--success))' : 'hsl(var(--warning))'}`,
                                      backgroundColor: sel ? 'hsl(var(--success-bg))' : 'hsl(var(--warning-bg))',
                                      color: sel ? '#065F46' : '#92400E',
                                    }}>
                                    <span className="font-mono text-[9px] font-bold block">{u.id}</span>
                                    {sel && <Check size={10} className="mx-auto" />}
                                  </button>
                                );
                              })}
                            </div>
                            <button disabled={manualSelected.size !== lineItem.qty} onClick={handleConfirm}
                              className="w-full mt-3 h-9 rounded-lg font-body text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40">
                              Apply Manual Selection
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-center py-8 space-y-4">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center bg-success/15">
                        <CheckCircle size={40} className="text-success" />
                      </div>
                      <h3 className="font-display text-[22px] text-success">Allocation Complete!</h3>
                      <p className="font-body text-sm text-foreground">
                        <strong>{lineItem.qty}</strong> units allocated to <strong>{sale?.client}</strong>
                      </p>
                      <div className="rounded-lg p-3 w-full bg-muted/50 space-y-1">
                        <p className="font-body text-xs text-muted-foreground">Sub-Game: {sgName}</p>
                        <p className="font-mono text-xs text-muted-foreground">AllocNote: FIFA26-{MOCK_MATCHES.find(m => m.id === sale?.matchId)?.code ?? 'XX'}-L{lineIdx + 1}-ALLOC-0417-001</p>
                      </div>
                      <button className="w-full h-10 rounded-lg font-body text-sm font-bold bg-primary text-primary-foreground hover:opacity-90">
                        Generate Client Portal →
                      </button>
                      <button onClick={closePanel} className="font-body text-sm hover:underline text-muted-foreground">Close</button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
      <AnimatePresence>
        {upgradeCtx && <UpgradeModal saleId={upgradeCtx.saleId} line={upgradeCtx.lineItem} lineIdx={upgradeCtx.lineIdx}
          onClose={() => setUpgradeCtx(null)} onConfirm={() => setUpgradeCtx(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {oversellCtx && <OversellResolutionDrawer
          saleId={oversellCtx.saleId} lineItem={oversellCtx.lineItem} lineIdx={oversellCtx.lineIdx}
          onClose={() => setOversellCtx(null)}
          onResolved={() => { setAllocatedLineIds(prev => new Set(prev).add(oversellCtx.lineItem.id)); setOversellCtx(null); }}
        />}
      </AnimatePresence>
    </div>
  );
}
