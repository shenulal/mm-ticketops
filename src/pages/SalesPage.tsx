import React, { useState, useMemo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleGuard from '@/components/RoleGuard';
import {
  MOCK_SALES, MOCK_SALE_LINE_ITEMS, MOCK_MATCHES, MOCK_SUBGAMES, MOCK_UNITS, MOCK_DIST_ROWS,
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
  CANCELLED:        { label: 'CANCELLED',        cls: 'bg-destructive/10 text-destructive' },
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
  if (lines.length === 0) return 'CANCELLED';
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
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative bg-card rounded-2xl shadow-xl max-w-lg w-full mx-4 p-8 z-10">
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
          <button onClick={onApprove} className="flex-1 py-2.5 rounded-lg font-body text-sm font-bold hover:opacity-90 bg-warning text-primary-foreground">Approve Override</button>
          <button onClick={onReject} className="flex-1 py-2.5 rounded-lg font-body text-sm font-bold hover:opacity-90 bg-destructive text-destructive-foreground">Reject This Line</button>
          <button onClick={onUpgrade} className="flex-1 py-2.5 rounded-lg font-body text-sm font-bold hover:opacity-90" style={{ backgroundColor: '#0D9488', color: 'white' }}>Upgrade This Line ↑</button>
        </div>
        <div className="text-center mt-3">
          <button onClick={onCancel} className="font-body text-sm hover:underline text-muted-foreground">Cancel</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Sale Cancel Modal (multi-line) ── */
type SaleCancelScope = 'all' | 'specific';

function SaleCancelModal({ saleId, onClose, onConfirm }: {
  saleId: string; onClose: () => void; onConfirm: (cancelledLineIds: string[]) => void;
}) {
  const [scope, setScope] = useState<SaleCancelScope>('all');
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState('');

  const sale = MOCK_SALES.find(s => s.id === saleId);
  if (!sale) return null;
  const saleLabel = sale.id.toUpperCase().replace('SALE', 'SALE-');

  const lineData = sale.lines.map((li, i) => {
    const distRows = MOCK_DIST_ROWS.filter(dr => dr.lineItemId === li.id);
    const dispatched = distRows.filter(dr => dr.dispatchStatus === 'SENT').length;
    const allocatedUnits = MOCK_UNITS.filter(u => u.allocatedToLineItemId === li.id);
    const canCancelFull = dispatched === 0;
    const cancellableRows = distRows.filter(dr => dr.dispatchStatus !== 'SENT').length;
    return { li, idx: i, distRows, dispatched, allocatedUnits, canCancelFull, cancellableRows };
  });

  const toggleLine = (id: string) => setSelectedLines(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const affectedLines = scope === 'all' ? lineData : lineData.filter(l => selectedLines.has(l.li.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative bg-card rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto z-10">
        <div className="px-8 py-6 border-b border-border flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl text-primary">Cancel Sale — {saleLabel}</h2>
            <p className="font-body text-sm text-muted-foreground mt-1">
              {sale.client} · {sale.contract} · {getMatchLabel(sale.matchId)} · AED {sale.totalValue.toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X size={18} /></button>
        </div>

        <div className="px-8 py-6 space-y-5">
          {/* Line status table */}
          <div>
            <h3 className="font-body text-sm font-bold text-foreground mb-2">Line Status</h3>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted">
                    {scope === 'specific' && <th className="px-3 py-2 w-8"></th>}
                    {['Line', 'Sub-Game', 'Category', 'Qty', 'Status', 'Dispatched', 'Can Cancel?'].map(h => (
                      <th key={h} className="px-3 py-2 font-body text-[11px] font-medium uppercase text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lineData.map(({ li, idx, dispatched, canCancelFull, cancellableRows }) => {
                    const st = STATUS_STYLE[li.status] || STATUS_STYLE['UNALLOCATED'];
                    return (
                      <tr key={li.id}>
                        {scope === 'specific' && (
                          <td className="px-3 py-2.5">
                            <input type="checkbox" checked={selectedLines.has(li.id)} onChange={() => toggleLine(li.id)}
                              className="w-4 h-4 rounded border-border accent-primary" />
                          </td>
                        )}
                        <td className="px-3 py-2.5 font-mono text-xs font-bold text-primary">L{idx + 1}</td>
                        <td className="px-3 py-2.5 font-body text-[12px] text-foreground">{getSubGameName(li.subGameId)}</td>
                        <td className="px-3 py-2.5 font-body text-[13px] text-foreground">{li.categoryLabel}</td>
                        <td className="px-3 py-2.5 font-mono text-[12px]">{li.qty}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full font-body text-[10px] font-medium ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[12px]">{dispatched} sent</td>
                        <td className="px-3 py-2.5 font-body text-[11px]">
                          {canCancelFull ? (
                            <span className="text-success">FULL — clean cancel</span>
                          ) : (
                            <span className="text-warning">PARTIAL — {cancellableRows} unsent rows can be cancelled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Scope selector */}
          <div className="space-y-2">
            <h3 className="font-body text-sm font-bold text-foreground">Cancel Scope</h3>
            {[
              { value: 'all' as const, label: 'Cancel entire sale' },
              { value: 'specific' as const, label: 'Cancel specific lines' },
            ].map(opt => (
              <label key={opt.value} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors"
                style={{ borderColor: scope === opt.value ? '#C9A84C' : 'hsl(var(--border))', backgroundColor: scope === opt.value ? 'hsl(var(--accent) / 0.08)' : 'transparent' }}>
                <input type="radio" name="scope" checked={scope === opt.value} onChange={() => setScope(opt.value)}
                  className="w-4 h-4 accent-primary" />
                <span className="font-body text-sm text-foreground">{opt.label}</span>
              </label>
            ))}
          </div>

          {/* Reversal preview */}
          {affectedLines.length > 0 && (
            <div className="rounded-lg border border-border p-4 space-y-3">
              <h3 className="font-body text-sm font-bold text-foreground">Reversal Preview</h3>
              {affectedLines.map(({ li, idx, distRows, dispatched, allocatedUnits }) => {
                const isPending = li.status === 'PENDING_APPROVAL';
                const removableRows = distRows.filter(dr => dr.dispatchStatus !== 'SENT').length;
                const firstUnit = allocatedUnits[0]?.id ?? '';
                const lastUnit = allocatedUnits[allocatedUnits.length - 1]?.id ?? '';
                return (
                  <div key={li.id} className="rounded-lg bg-muted/50 p-3">
                    <p className="font-body text-sm font-bold text-foreground mb-1">
                      Line {idx + 1} — {li.categoryLabel} × {li.qty} ({STATUS_STYLE[li.status]?.label ?? li.status}):
                    </p>
                    <ul className="space-y-0.5 ml-4">
                      <li className="font-body text-[12px] text-foreground">• {removableRows} distribution rows removed</li>
                      {isPending ? (
                        <li className="font-body text-[12px] text-muted-foreground">• 0 units freed (no units allocated — was pending)</li>
                      ) : allocatedUnits.length > 0 ? (
                        <li className="font-body text-[12px] text-foreground">• {allocatedUnits.length} units returned to AVAILABLE ({firstUnit}–{lastUnit})</li>
                      ) : null}
                      {dispatched > 0 && (
                        <li className="font-body text-[12px] text-warning">• {dispatched} already dispatched — remain active</li>
                      )}
                      {li.status === 'ALLOCATED' && (
                        <li className="font-body text-[12px] text-foreground">• Client portal rows for {li.categoryLabel} invalidated</li>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          {/* Client portal impact */}
          {affectedLines.length > 0 && (
            <div className="rounded-lg p-3 border-l-4 bg-muted/30" style={{ borderColor: '#C9A84C' }}>
              <p className="font-body text-sm text-foreground">
                <span className="font-bold">Client Portal Impact:</span> The client portal for {sale.client} will be updated.
              </p>
              <p className="font-body text-xs text-muted-foreground mt-1">
                {affectedLines.map(l => `${l.li.categoryLabel} section will be removed`).join('. ')}.
                {sale.lines.filter(l => !affectedLines.find(a => a.li.id === l.id)).length > 0 && (
                  <> {sale.lines.filter(l => !affectedLines.find(a => a.li.id === l.id)).map(l => `${l.categoryLabel} section remains active`).join('. ')}.</>
                )}
              </p>
            </div>
          )}

          {/* Reason + notes */}
          <div>
            <label className="font-body text-sm font-medium text-foreground block mb-1">Reason *</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)}
              className="w-full h-20 rounded-lg border border-border px-3 py-2 font-body text-sm text-foreground bg-card resize-none focus:ring-1 focus:ring-accent outline-none"
              placeholder="Enter cancellation reason..." />
          </div>
        </div>

        <div className="px-8 py-4 border-t border-border flex items-center justify-between">
          <button onClick={onClose} className="font-body text-sm text-muted-foreground hover:underline">Keep Sale</button>
          <button
            onClick={() => onConfirm(affectedLines.map(l => l.li.id))}
            disabled={!reason.trim()}
            className="px-5 py-2.5 rounded-lg font-body text-sm font-bold bg-destructive text-destructive-foreground hover:opacity-90 disabled:opacity-40">
            Confirm Cancellation
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Line-specific Cancel Modal ── */
function LineCancelModal({ saleId, line, lineIdx, onClose, onConfirm }: {
  saleId: string; line: SaleLineItem; lineIdx: number; onClose: () => void; onConfirm: () => void;
}) {
  const sale = MOCK_SALES.find(s => s.id === saleId);
  const saleLabel = sale?.id.toUpperCase().replace('SALE', 'SALE-') ?? saleId;
  const distRows = MOCK_DIST_ROWS.filter(dr => dr.lineItemId === line.id);
  const dispatched = distRows.filter(dr => dr.dispatchStatus === 'SENT').length;
  const allocatedUnits = MOCK_UNITS.filter(u => u.allocatedToLineItemId === line.id);
  const removableRows = distRows.filter(dr => dr.dispatchStatus !== 'SENT').length;
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative bg-card rounded-2xl shadow-xl max-w-md w-full mx-4 p-8 z-10">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded hover:bg-muted"><X size={18} /></button>
        <h2 className="font-display text-lg text-primary mb-1">
          Cancel Line {lineIdx + 1} — {saleLabel} / {line.categoryLabel} / {line.qty} tickets?
        </h2>
        <p className="font-body text-xs text-muted-foreground mb-4">{getSubGameName(line.subGameId)}</p>

        <div className="rounded-lg bg-muted/50 p-3 mb-4 space-y-1">
          <p className="font-body text-[12px] text-foreground">• {removableRows} distribution rows removed</p>
          {allocatedUnits.length > 0 && (
            <p className="font-body text-[12px] text-foreground">
              • {allocatedUnits.length} units returned to AVAILABLE ({allocatedUnits[0]?.id}–{allocatedUnits[allocatedUnits.length - 1]?.id})
            </p>
          )}
          {dispatched > 0 && (
            <p className="font-body text-[12px] text-warning">• {dispatched} dispatched tickets remain active</p>
          )}
        </div>

        <div className="mb-4">
          <label className="font-body text-sm font-medium text-foreground block mb-1">Reason *</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)}
            className="w-full h-16 rounded-lg border border-border px-3 py-2 font-body text-sm text-foreground bg-card resize-none focus:ring-1 focus:ring-accent outline-none"
            placeholder="Reason for cancellation..." />
        </div>

        <div className="flex gap-3">
          <button onClick={onConfirm} disabled={!reason.trim()}
            className="flex-1 py-2.5 rounded-lg font-body text-sm font-bold bg-destructive text-destructive-foreground hover:opacity-90 disabled:opacity-40">
            Confirm Cancel Line
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg font-body text-sm font-bold border border-border text-foreground hover:bg-muted">
            Keep Line
          </button>
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
  const [cancelledLines, setCancelledLines] = useState<Set<string>>(new Set());
  const [modalCtx, setModalCtx] = useState<{ saleId: string; line: SaleLineItem; lineIdx: number } | null>(null);
  const [cancelSaleId, setCancelSaleId] = useState<string | null>(null);
  const [lineCancelCtx, setLineCancelCtx] = useState<{ saleId: string; line: SaleLineItem; lineIdx: number } | null>(null);

  const toggleExpand = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const filteredSubGames = useMemo(() => {
    if (matchFilter === 'all') return [];
    const match = MOCK_MATCHES.find(m => m.code === matchFilter);
    return match ? getSubGamesForMatch(match.id) : [];
  }, [matchFilter]);

  const filteredCategories = useMemo(() => {
    if (subGameFilter !== 'all') {
      return MOCK_SUBGAMES.find(sg => sg.id === subGameFilter)?.categories ?? [];
    }
    return [];
  }, [subGameFilter]);

  const sales = MOCK_SALES.filter(s => {
    if (matchFilter !== 'all' && getMatchCode(s.matchId) !== matchFilter) return false;
    const lines = s.lines.filter(l => !rejectedLines.has(l.id) && !cancelledLines.has(l.id));
    if (lines.length === 0) return false;
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
            : <><option value="topcat1">Top Cat 1</option><option value="cat2">Cat 2</option><option value="cat3">Cat 3</option><option value="cat4">Cat 4</option></>
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
                const activeLines = s.lines.filter(l => !rejectedLines.has(l.id) && !cancelledLines.has(l.id));
                const effectiveLines = activeLines.map(l => approvedLines.has(l.id) ? { ...l, status: 'ALLOCATED' as const, oversellFlag: false } : l);
                const isExpanded = expanded[s.id];
                const saleLabel = s.id.toUpperCase().replace('SALE', 'SALE-');
                const overallStatus = deriveOverallStatus(effectiveLines);
                const st = STATUS_STYLE[overallStatus] || STATUS_STYLE['UNALLOCATED'];
                const totalQty = effectiveLines.reduce((sum, l) => sum + l.qty, 0);
                const totalValue = effectiveLines.reduce((sum, l) => sum + l.lineTotal, 0);
                const isMultiSg = hasMultipleSubGames(s.matchId);
                const hasCancelledLines = s.lines.some(l => cancelledLines.has(l.id));

                return (
                  <Fragment key={s.id}>
                    <tr className="transition-colors cursor-pointer border-b border-border"
                      style={{ backgroundColor: si % 2 === 1 ? 'hsl(var(--muted))' : 'hsl(var(--card))' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#EEF3FF')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = si % 2 === 1 ? 'hsl(220 14% 96%)' : 'white')}
                      onClick={() => toggleExpand(s.id)}>
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
                          {hasCancelledLines && <span className="text-destructive ml-1">({s.lines.filter(l => cancelledLines.has(l.id)).length} cancelled)</span>}
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
                          <button onClick={() => setCancelSaleId(s.id)} className="font-body text-xs text-destructive hover:underline">Cancel</button>
                        </div>
                      </td>
                    </tr>

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
                          <td colSpan={2} className="px-4 py-2.5">
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
                                    className="px-3 py-1 rounded-lg font-body text-[11px] font-medium bg-warning text-primary-foreground hover:opacity-90">Review</button>
                                  <button className="font-body text-[11px] hover:underline" style={{ color: '#0D9488' }}>Upgrade</button>
                                </>
                              ) : (
                                <>
                                  <button className="px-3 py-1 rounded-lg font-body text-[11px] font-medium bg-primary text-primary-foreground hover:opacity-90">Allocate</button>
                                  {li.status === 'ALLOCATED' && (
                                    <button className="font-body text-[11px] hover:underline" style={{ color: '#0D9488' }}>Upgrade</button>
                                  )}
                                </>
                              )}
                              <button onClick={() => setLineCancelCtx({ saleId: s.id, line: li, lineIdx: liIdx })}
                                className="font-body text-[11px] text-destructive hover:underline">Cancel Line</button>
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
          <ApprovalModal saleId={modalCtx.saleId} line={modalCtx.line} lineIdx={modalCtx.lineIdx}
            onApprove={() => { setApprovedLines(prev => new Set(prev).add(modalCtx.line.id)); setModalCtx(null); }}
            onReject={() => { setRejectedLines(prev => new Set(prev).add(modalCtx.line.id)); setModalCtx(null); }}
            onUpgrade={() => setModalCtx(null)}
            onCancel={() => setModalCtx(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cancelSaleId && (
          <SaleCancelModal saleId={cancelSaleId} onClose={() => setCancelSaleId(null)}
            onConfirm={(lineIds) => { lineIds.forEach(id => setCancelledLines(prev => new Set(prev).add(id))); setCancelSaleId(null); }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lineCancelCtx && (
          <LineCancelModal saleId={lineCancelCtx.saleId} line={lineCancelCtx.line} lineIdx={lineCancelCtx.lineIdx}
            onClose={() => setLineCancelCtx(null)}
            onConfirm={() => { setCancelledLines(prev => new Set(prev).add(lineCancelCtx.line.id)); setLineCancelCtx(null); }} />
        )}
      </AnimatePresence>
    </div>
  );
}
