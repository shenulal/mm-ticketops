import React, { useState, useMemo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleGuard from '@/components/RoleGuard';
import {
  MOCK_SALES, MOCK_SALE_LINE_ITEMS, MOCK_MATCHES, MOCK_SUBGAMES,
  getSubGamesForMatch, hasMultipleSubGames, getInventoryAvailable,
  type SaleLineItem,
} from '@/data/mockData';
import { AlertTriangle, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  FULFILLED:        { label: 'FULFILLED',       cls: 'bg-success text-primary-foreground' },
  ALLOCATED:        { label: 'ALLOCATED',        cls: 'bg-success/15 text-success' },
  PARTIAL_ALLOCATED:{ label: 'PARTIAL',          cls: 'bg-warning/15 text-warning' },
  PARTIAL_PENDING:  { label: 'PARTIAL PENDING',  cls: 'bg-warning/15 text-warning' },
  PENDING_APPROVAL: { label: 'PENDING ⚠',       cls: 'bg-warning/15 text-warning' },
  UNALLOCATED:      { label: 'UNALLOCATED',      cls: 'bg-muted text-muted-foreground' },
};

function getMatchLabel(matchId: string) {
  const m = MOCK_MATCHES.find(x => x.id === matchId);
  return m ? `${m.code} ${m.teams}` : matchId;
}
function getMatchCode(matchId: string) {
  return MOCK_MATCHES.find(x => x.id === matchId)?.code ?? matchId;
}
function getSubGameName(subGameId: string) {
  return MOCK_SUBGAMES.find(sg => sg.id === subGameId)?.name ?? '—';
}

function deriveOverallStatus(lines: SaleLineItem[]): string {
  if (lines.every(l => l.status === 'FULFILLED')) return 'FULFILLED';
  if (lines.some(l => l.oversellFlag || l.status === 'PENDING_APPROVAL')) return 'PARTIAL_PENDING';
  if (lines.every(l => l.status === 'ALLOCATED')) return 'ALLOCATED';
  if (lines.some(l => l.status === 'ALLOCATED')) return 'PARTIAL_ALLOCATED';
  return 'UNALLOCATED';
}

/* ── Approval Modal ── */
function ApprovalModal({ saleId, line, lineIdx, onApprove, onReject, onUpgrade, onCancel }: {
  saleId: string; line: SaleLineItem; lineIdx: number;
  onApprove: () => void; onReject: () => void; onUpgrade: () => void; onCancel: () => void;
}) {
  const sale = MOCK_SALES.find(s => s.id === saleId);
  const available = getInventoryAvailable(line.subGameId, line.categoryId);
  const otherLines = (sale?.lines ?? []).filter(l => l.id !== line.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative bg-card rounded-2xl shadow-xl max-w-lg w-full mx-4 p-8 z-10"
      >
        <button onClick={onCancel} className="absolute top-4 right-4 p-1 rounded hover:bg-muted"><X size={18} /></button>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={22} className="text-warning" />
          <h2 className="font-display text-xl text-primary">
            Approval Required — {saleId.toUpperCase()} / Line {lineIdx + 1} / {line.categoryLabel}
          </h2>
        </div>

        <div className="rounded-lg border border-border overflow-hidden mb-4">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted">
                {['Line', 'Category', 'Requested', 'Available'].map(h => (
                  <th key={h} className="px-4 py-2 font-body text-[11px] font-medium uppercase text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-3 font-body text-sm text-foreground">Line {lineIdx + 1}</td>
                <td className="px-4 py-3 font-body text-sm text-foreground">{line.categoryLabel}</td>
                <td className="px-4 py-3 font-mono text-sm text-foreground">{line.qty}</td>
                <td className="px-4 py-3 font-mono text-sm font-bold text-destructive">{available} (OVERSOLD)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {otherLines.length > 0 && (
          <p className="font-body text-sm text-muted-foreground mb-4">
            Lines {otherLines.map((_, i) => i + 1).join(' and ')} are unaffected and already active.
          </p>
        )}

        <div className="flex gap-3">
          <button onClick={onApprove} className="flex-1 py-2.5 rounded-lg font-body text-sm font-bold hover:opacity-90 bg-warning text-primary-foreground">
            Approve Override
          </button>
          <button onClick={onReject} className="flex-1 py-2.5 rounded-lg font-body text-sm font-bold hover:opacity-90 bg-destructive text-destructive-foreground">
            Reject This Line
          </button>
          <button onClick={onUpgrade} className="flex-1 py-2.5 rounded-lg font-body text-sm font-bold hover:opacity-90" style={{ backgroundColor: '#0D9488', color: 'white' }}>
            Upgrade This Line ↑
          </button>
        </div>
        <div className="text-center mt-3">
          <button onClick={onCancel} className="font-body text-sm hover:underline text-muted-foreground">Cancel</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Main Page ── */
export default function SalesPage() {
  const navigate = useNavigate();
  const [matchFilter, setMatchFilter] = useState('all');
  const [subGameFilter, setSubGameFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [approvedLines, setApprovedLines] = useState<Set<string>>(new Set());
  const [rejectedLines, setRejectedLines] = useState<Set<string>>(new Set());
  const [modalCtx, setModalCtx] = useState<{ saleId: string; line: SaleLineItem; lineIdx: number } | null>(null);

  const toggleExpand = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  // Sub-games for selected match filter
  const filteredSubGames = useMemo(() => {
    if (matchFilter === 'all') return [];
    const match = MOCK_MATCHES.find(m => m.code === matchFilter);
    return match ? getSubGamesForMatch(match.id) : [];
  }, [matchFilter]);

  // Categories for selected sub-game
  const filteredCategories = useMemo(() => {
    if (subGameFilter !== 'all') {
      return MOCK_SUBGAMES.find(sg => sg.id === subGameFilter)?.categories ?? [];
    }
    return [];
  }, [subGameFilter]);

  // Filter sales
  const sales = MOCK_SALES.filter(s => {
    if (matchFilter !== 'all' && getMatchCode(s.matchId) !== matchFilter) return false;
    const lines = s.lines.filter(l => !rejectedLines.has(l.id));
    if (subGameFilter !== 'all' && !lines.some(l => l.subGameId === subGameFilter)) return false;
    if (catFilter !== 'all' && !lines.some(l => l.categoryId === catFilter)) return false;
    if (statusFilter === 'pending' && !lines.some(l => l.oversellFlag || l.status === 'PENDING_APPROVAL')) return false;
    if (statusFilter === 'allocated' && !lines.every(l => l.status === 'ALLOCATED')) return false;
    if (statusFilter === 'oversell' && !lines.some(l => l.oversellFlag)) return false;
    return true;
  });

  const selectClass = "h-[38px] px-3 rounded-lg font-body text-sm bg-card border border-border outline-none focus:ring-1 focus:ring-accent";

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-[26px] text-primary">Sales</h1>
        <RoleGuard roles={['super_admin', 'ops_manager', 'sr_operator', 'operator']}>
          <button onClick={() => navigate('/sales/new')} className="px-4 py-2 rounded-lg font-body text-sm font-medium hover:opacity-90 bg-primary text-accent">
            New Sale +
          </button>
        </RoleGuard>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <select className={selectClass} disabled><option>FIFA WC 2026</option></select>
        <select className={selectClass} value={matchFilter} onChange={e => { setMatchFilter(e.target.value); setSubGameFilter('all'); setCatFilter('all'); }}>
          <option value="all">All Matches</option>
          {MOCK_MATCHES.map(m => <option key={m.id} value={m.code}>{m.code} — {m.teams}</option>)}
        </select>
        {filteredSubGames.length > 1 && (
          <select className={selectClass} value={subGameFilter} onChange={e => { setSubGameFilter(e.target.value); setCatFilter('all'); }}>
            <option value="all">All Sessions</option>
            {filteredSubGames.map(sg => <option key={sg.id} value={sg.id}>{sg.name}</option>)}
          </select>
        )}
        <select className={selectClass} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {filteredCategories.length > 0
            ? filteredCategories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)
            : <>
                <option value="topcat1">Top Cat 1</option><option value="cat2">Cat 2</option>
                <option value="cat3">Cat 3</option><option value="cat4">Cat 4</option>
              </>
          }
        </select>
        <select className={selectClass} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="pending">Any Pending</option>
          <option value="allocated">Fully Allocated</option>
          <option value="oversell">Has Oversell</option>
        </select>
      </div>

      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1050px]">
            <thead>
              <tr className="bg-primary h-[44px]">
                {['', 'Sale ID', 'Date', 'Match', 'Client', 'Contract', 'Lines', 'Total Qty', 'Total Value', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-2.5 font-body text-[13px] font-bold text-primary-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sales.map((s, si) => {
                const activeLines = s.lines.filter(l => !rejectedLines.has(l.id));
                const effectiveLines = activeLines.map(l => approvedLines.has(l.id) ? { ...l, status: 'ALLOCATED' as const, oversellFlag: false } : l);
                const isExpanded = expanded[s.id];
                const saleLabel = s.id.toUpperCase().replace('SALE', 'SALE-');
                const overallStatus = deriveOverallStatus(effectiveLines);
                const st = STATUS_STYLE[overallStatus] || STATUS_STYLE['UNALLOCATED'];
                const totalQty = effectiveLines.reduce((sum, l) => sum + l.qty, 0);
                const totalValue = effectiveLines.reduce((sum, l) => sum + l.lineTotal, 0);
                const isMultiSg = hasMultipleSubGames(s.matchId);

                return (
                  <Fragment key={s.id}>
                    {/* Parent row */}
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
                      <td className="px-4 py-3 font-body text-[13px] text-foreground">{s.date}</td>
                      <td className="px-4 py-3 font-body text-[13px] text-foreground">{getMatchLabel(s.matchId)}</td>
                      <td className="px-4 py-3 font-body text-[13px] font-medium text-foreground">{s.client}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{s.contract}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-muted font-body text-[11px] font-medium text-foreground">
                          {effectiveLines.length} lines
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] text-foreground">{totalQty}</td>
                      <td className="px-4 py-3 font-mono text-[13px] font-medium text-foreground">AED {totalValue.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-body text-[11px] font-medium ${st.cls}`}>
                          {overallStatus.includes('PENDING') && <AlertTriangle size={11} />}
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <button className="font-body text-xs text-primary hover:underline">Edit</button>
                          <button className="font-body text-xs text-primary hover:underline">Allocate</button>
                          <button className="font-body text-xs text-destructive hover:underline">Cancel</button>
                        </div>
                      </td>
                    </tr>

                    {/* Line sub-rows */}
                    {isExpanded && effectiveLines.map((li, liIdx) => {
                      const lineSt = STATUS_STYLE[li.status] || STATUS_STYLE['UNALLOCATED'];
                      const sgName = isMultiSg ? getSubGameName(li.subGameId) : '—';
                      const isOversell = li.oversellFlag && !approvedLines.has(li.id);

                      return (
                        <tr key={li.id} className={`border-b border-border/50 ${isOversell ? 'bg-warning/5' : 'bg-muted/50'}`}>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center justify-center"><div className="w-px h-full bg-border" /></div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-primary/10 text-primary">L{liIdx + 1}</span>
                          </td>
                          <td className="px-4 py-2.5 font-body text-[12px] text-muted-foreground">{sgName}</td>
                          <td className="px-4 py-2.5 font-body text-[13px] text-foreground">{li.categoryLabel}</td>
                          <td className="px-4 py-2.5 font-mono text-[12px] text-foreground">{li.qty}</td>
                          <td className="px-4 py-2.5 font-mono text-[12px] text-foreground">AED {li.unitPrice.toLocaleString()}</td>
                          <td className="px-4 py-2.5 font-mono text-[12px] font-medium text-foreground">AED {li.lineTotal.toLocaleString()}</td>
                          <td className="px-4 py-2.5" colSpan={2}>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-body text-[10px] font-medium ${lineSt.cls}`}>
                                {isOversell && <AlertTriangle size={10} />}
                                {lineSt.label}
                              </span>
                              {isOversell && (
                                <span className="font-body text-[10px] text-warning italic">
                                  ⚠ Oversell — {li.categoryLabel} × {li.qty} exceeds available
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5" colSpan={2} onClick={e => e.stopPropagation()}>
                            <div className="flex gap-2">
                              {li.status === 'PENDING_APPROVAL' && isOversell ? (
                                <>
                                  <button onClick={() => setModalCtx({ saleId: s.id, line: li, lineIdx: liIdx })}
                                    className="px-3 py-1 rounded-lg font-body text-[11px] font-medium bg-warning text-primary-foreground hover:opacity-90">
                                    Review
                                  </button>
                                  <button className="font-body text-[11px] hover:underline" style={{ color: '#0D9488' }}>Upgrade</button>
                                </>
                              ) : (
                                <>
                                  <button className="px-3 py-1 rounded-lg font-body text-[11px] font-medium bg-primary text-primary-foreground hover:opacity-90">
                                    Allocate
                                  </button>
                                  {li.status === 'ALLOCATED' && (
                                    <button className="font-body text-[11px] hover:underline" style={{ color: '#0D9488' }}>Upgrade</button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {modalCtx && (
          <ApprovalModal
            saleId={modalCtx.saleId}
            line={modalCtx.line}
            lineIdx={modalCtx.lineIdx}
            onApprove={() => { setApprovedLines(prev => new Set(prev).add(modalCtx.line.id)); setModalCtx(null); }}
            onReject={() => { setRejectedLines(prev => new Set(prev).add(modalCtx.line.id)); setModalCtx(null); }}
            onUpgrade={() => setModalCtx(null)}
            onCancel={() => setModalCtx(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
