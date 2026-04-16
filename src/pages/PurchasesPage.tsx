/* @refresh reset */
import { useState, Fragment, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAppContext } from '@/context/AppContext';
import { useEvent } from '@/context/EventContext';
import RoleGuard from '@/components/RoleGuard';
import {
  MOCK_PURCHASES, MOCK_UNITS, MOCK_PURCHASE_LINE_ITEMS, MOCK_MATCHES, MOCK_SUBGAMES,
  MOCK_SALES, MOCK_SALE_LINE_ITEMS, MOCK_DIST_ROWS, MOCK_STAFF_TASKS,
  hasMultipleSubGames, getSubGamesForMatch,
  type PurchaseLineItem, type PurchaseUnit,
} from '@/data/mockData';
import { addAuditEntry } from '@/data/auditData';
import { useContextHelpers } from '@/hooks/useContextHelpers';
import {
  ChevronRight, X, Lock, AlertTriangle, Plus, Trash2, Search,
  Eye, EyeOff, ArrowLeftRight, Ban, Clock, CheckCircle, Send,
  User, Shield, FileText, KeyRound, Package, MapPin, History,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Helpers ── */
function lineUnitStats(lineItemId: string) {
  const units = MOCK_UNITS.filter(u => u.lineItemId === lineItemId);
  const allocated = units.filter(u => u.status === 'ALLOCATED').length;
  const available = units.filter(u => u.status === 'AVAILABLE').length;
  return { total: units.length, allocated, available };
}
function getMatchLabel(matchId: string) { const m = MOCK_MATCHES.find(x => x.id === matchId); return m ? `${m.code} ${m.teams}` : matchId; }
function getSubGameName(sgId: string) { return MOCK_SUBGAMES.find(sg => sg.id === sgId)?.name ?? '—'; }

const FX_RATE = 3.67; // AED per USD — simplified mock

function getUnitHistory(unitId: string) {
  const events: { action: string; detail: string; actor: string; at: string }[] = [];
  events.push({ action: 'CREATED', detail: 'Unit generated from purchase', actor: 'System', at: '2026-04-08T09:12:00Z' });
  const unit = MOCK_UNITS.find(u => u.id === unitId);
  if (unit?.status === 'ALLOCATED') {
    events.push({ action: 'ALLOCATED', detail: `Allocated to ${unit.allocatedToLineItemId}`, actor: 'James Patel', at: '2026-04-08T11:00:00Z' });
  }
  const dist = MOCK_DIST_ROWS.find(r => r.unitId === unitId);
  if (dist?.dispatchStatus === 'SENT') {
    events.push({ action: 'DISPATCHED', detail: `Sent to ${dist.clientFirstName} ${dist.clientLastName}`, actor: 'Mohammed Hassan', at: '2026-04-17T14:32:00Z' });
  }
  return events.reverse();
}

/* ═══════════════════════════════════════════════════════
   UNIT DETAIL DRAWER
   ═══════════════════════════════════════════════════════ */

function UnitDetailDrawer({ unit, onClose, onReplace }: {
  unit: PurchaseUnit;
  onClose: () => void;
  onReplace: (unit: PurchaseUnit) => void;
}) {
  const { currentUser } = useAuth();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const role = currentUser?.role ?? 'operator';
  const canUnallocate = ['super_admin', 'ops_manager', 'sr_operator'].includes(role);
  const canViewCreds = ['super_admin', 'ops_manager', 'sr_operator'].includes(role);

  const purchase = MOCK_PURCHASES.find(p => p.id === unit.purchaseId);
  const purchaseLine = MOCK_PURCHASE_LINE_ITEMS.find(l => l.id === unit.lineItemId);
  const match = MOCK_MATCHES.find(m => m.id === unit.matchId);
  const allocSaleLine = unit.allocatedToLineItemId ? MOCK_SALE_LINE_ITEMS.find(l => l.id === unit.allocatedToLineItemId) : null;
  const sale = allocSaleLine ? MOCK_SALES.find(s => s.id === allocSaleLine.saleId) : null;
  const dist = MOCK_DIST_ROWS.find(r => r.unitId === unit.id);
  const task = MOCK_STAFF_TASKS.find(t => t.unitId === unit.id);
  const history = getUnitHistory(unit.id);

  const unitCostAED = purchaseLine?.unitPrice ?? 0;
  const unitCostUSD = Math.round(unitCostAED / FX_RATE);
  const pctOfPurchase = purchaseLine && purchaseLine.lineTotal > 0
    ? ((unitCostAED / purchaseLine.lineTotal) * 100).toFixed(2) : '0';

  const isAlloc = unit.status === 'ALLOCATED';

  const handleUnallocate = () => {
    addAuditEntry({
      when: new Date().toISOString(),
      actor: currentUser?.name ?? 'Unknown',
      actorRole: role,
      entity: 'unit',
      entityId: unit.id,
      action: 'unit.unallocated',
      before: { status: 'ALLOCATED', allocatedTo: unit.allocatedToLineItemId },
      after: { status: 'AVAILABLE', allocatedTo: null },
      ip: '10.0.1.12',
      eventId: 'evt1',
      eventName: 'FIFA World Cup 2026',
    });
    onClose();
  };

  const handleRevealPassword = () => {
    setPasswordVisible(true);
    addAuditEntry({
      when: new Date().toISOString(),
      actor: currentUser?.name ?? 'Unknown',
      actorRole: role,
      entity: 'credential',
      entityId: unit.id,
      action: 'credential.view',
      before: null,
      after: { unitId: unit.id, vendor: unit.vendor },
      ip: '10.0.1.12',
      eventId: 'evt1',
      eventName: 'FIFA World Cup 2026',
    });
    setTimeout(() => setPasswordVisible(false), 15000);
  };

  const cardCls = "rounded-xl border border-border p-4 space-y-2";
  const labelCls = "font-body text-[10px] uppercase tracking-wide text-muted-foreground";
  const valCls = "font-body text-[13px] text-foreground";
  const monoCls = "font-mono text-[12px] text-primary font-bold";

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-foreground/30" onClick={onClose} />
      <motion.div
        initial={{ x: 520, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 520, opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-[520px] max-w-full h-full bg-card shadow-xl flex flex-col z-10"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-mono text-xl font-bold text-primary">{unit.id}</h3>
                <span className={`px-2.5 py-1 rounded-full font-body text-[11px] font-medium ${
                  isAlloc ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                }`}>{unit.status}</span>
              </div>
              <p className="font-body text-sm text-muted-foreground mt-1">
                {unit.categoryLabel} · {match?.code} {match?.teams}
              </p>
            </div>
            <button onClick={onClose} className="p-1 rounded-md hover:bg-muted"><X size={18} /></button>
          </div>
        </div>

        {/* Scrollable cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* 1. Source Card */}
          <div className={cardCls}>
            <div className="flex items-center gap-2 mb-1">
              <Package size={14} className="text-primary" />
              <span className="font-body text-[13px] font-bold text-foreground">Source</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div><p className={labelCls}>Purchase</p><p className={monoCls}>PUR-{String(MOCK_PURCHASES.indexOf(purchase!) + 1).padStart(3, '0')}</p></div>
              <div><p className={labelCls}>Purchase Line</p><p className={monoCls}>{unit.lineItemId}</p></div>
              <div><p className={labelCls}>Vendor</p><p className={valCls}>{unit.vendor}</p></div>
              <div><p className={labelCls}>Contract</p><p className="font-mono text-[12px] text-muted-foreground">{unit.contract}</p></div>
              <div><p className={labelCls}>Set ID</p><p className={monoCls}>{unit.setId}</p></div>
              <div><p className={labelCls}>Set Size / Pos</p><p className={valCls}>{unit.setSize} / #{unit.setPos}</p></div>
            </div>
          </div>

          {/* 2. Cost Card */}
          <div className={cardCls}>
            <div className="flex items-center gap-2 mb-1">
              <FileText size={14} className="text-primary" />
              <span className="font-body text-[13px] font-bold text-foreground">Cost</span>
            </div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
              <div><p className={labelCls}>AED</p><p className={monoCls}>AED {unitCostAED.toLocaleString()}</p></div>
              <div><p className={labelCls}>USD</p><p className="font-mono text-[12px] text-muted-foreground">USD {unitCostUSD.toLocaleString()}</p></div>
              <div><p className={labelCls}>% of Purchase</p><p className={valCls}>{pctOfPurchase}%</p></div>
            </div>
          </div>

          {/* 3. Allocation Card */}
          {isAlloc && allocSaleLine && (
            <div className={cardCls}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-success" />
                  <span className="font-body text-[13px] font-bold text-foreground">Allocation</span>
                </div>
                {canUnallocate && (
                  <button onClick={handleUnallocate} className="px-2.5 py-1 rounded-lg font-body text-[11px] font-medium bg-destructive/10 text-destructive hover:bg-destructive/20">
                    Unallocate
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <div><p className={labelCls}>Sale</p><Link to={`/sales`} className={`${monoCls} hover:underline`}>{sale?.id.toUpperCase()}</Link></div>
                <div><p className={labelCls}>Sale Line</p><p className={monoCls}>{allocSaleLine.id}</p></div>
                <div><p className={labelCls}>Client</p><p className={valCls}>{sale?.client ?? '—'}</p></div>
                <div><p className={labelCls}>Allocated At</p><p className={valCls}>08 Apr 2026 11:00</p></div>
                <div><p className={labelCls}>Allocator</p><p className={valCls}>James Patel</p></div>
                <div><p className={labelCls}>Run ID</p><p className="font-mono text-[11px] text-muted-foreground">run-001</p></div>
              </div>
            </div>
          )}

          {/* 4. Delivery Card */}
          <div className={cardCls}>
            <div className="flex items-center gap-2 mb-1">
              <Send size={14} className="text-primary" />
              <span className="font-body text-[13px] font-bold text-foreground">Delivery</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div><p className={labelCls}>Block</p><p className={valCls}>{unit.block || '—'}</p></div>
              <div><p className={labelCls}>Row / Seat</p><p className={valCls}>{unit.row || '—'} / {unit.seat || '—'}</p></div>
              <div><p className={labelCls}>Dispatch Status</p><p className={valCls}>{dist?.dispatchStatus ?? 'NOT_SENT'}</p></div>
              <div><p className={labelCls}>Dispatched At</p><p className={valCls}>{task?.dispatchedAt ?? '—'}</p></div>
              <div><p className={labelCls}>Assigned Staff</p><p className={valCls}>{task ? 'Mohammed Hassan' : '—'}</p></div>
              <div><p className={labelCls}>Proof</p>{task?.proofUrl ? <a href="#" className="font-body text-[12px] text-primary hover:underline">View proof</a> : <p className={valCls}>—</p>}</div>
            </div>
          </div>

          {/* 5. Passenger Card */}
          {dist && (dist.clientFirstName || dist.clientLastName) && (
            <div className={cardCls}>
              <div className="flex items-center gap-2 mb-1">
                <User size={14} className="text-primary" />
                <span className="font-body text-[13px] font-bold text-foreground">Passenger</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <div><p className={labelCls}>First Name</p><p className={valCls}>{dist.clientFirstName || '—'}</p></div>
                <div><p className={labelCls}>Last Name</p><p className={valCls}>{dist.clientLastName || '—'}</p></div>
                <div><p className={labelCls}>Email</p><p className={valCls}>{dist.clientEmail || '—'}</p></div>
                <div><p className={labelCls}>Passport</p><p className={valCls}>—</p></div>
              </div>
            </div>
          )}

          {/* 6. Credentials Card (access-gated) */}
          {canViewCreds && task && (
            <div className={cardCls}>
              <div className="flex items-center gap-2 mb-1">
                <KeyRound size={14} className="text-primary" />
                <span className="font-body text-[13px] font-bold text-foreground">Credentials</span>
                <Shield size={12} className="text-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <div><p className={labelCls}>Login ID</p><p className="font-mono text-[12px] text-foreground">{task.vendorLogin}</p></div>
                <div><p className={labelCls}>Email</p><p className={valCls}>{task.vendorEmail}</p></div>
                <div className="col-span-2">
                  <p className={labelCls}>Password</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="font-mono text-[12px] text-foreground">{passwordVisible ? task.vendorPassword : '•'.repeat(10)}</p>
                    <button onClick={handleRevealPassword} className="p-1 rounded hover:bg-muted" title={passwordVisible ? 'Visible (auto-redacts in 15s)' : 'Reveal password (logged)'}>
                      {passwordVisible ? <EyeOff size={14} className="text-muted-foreground" /> : <Eye size={14} className="text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7. History Timeline */}
          <div className={cardCls}>
            <div className="flex items-center gap-2 mb-2">
              <History size={14} className="text-primary" />
              <span className="font-body text-[13px] font-bold text-foreground">History</span>
            </div>
            <div className="space-y-0">
              {history.map((ev, i) => (
                <div key={i} className="flex gap-3 relative">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    {i < history.length - 1 && <div className="w-px flex-1 bg-border" />}
                  </div>
                  <div className="pb-3">
                    <p className="font-body text-[12px] font-medium text-foreground">{ev.action}</p>
                    <p className="font-body text-[11px] text-muted-foreground">{ev.detail}</p>
                    <p className="font-body text-[10px] text-muted-foreground">{ev.actor} · {new Date(ev.at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {!isAlloc && (
              <button onClick={() => onReplace(unit)} className="flex-1 px-3 py-2 rounded-lg font-body text-[12px] font-medium bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center gap-1.5">
                <ArrowLeftRight size={14} /> Replace Unit
              </button>
            )}
            {isAlloc && (
              <button onClick={() => onReplace(unit)} className="flex-1 px-3 py-2 rounded-lg font-body text-[12px] font-medium bg-warning/10 text-warning hover:bg-warning/20 flex items-center justify-center gap-1.5">
                <ArrowLeftRight size={14} /> Replace Unit
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   REPLACE UNIT DRAWER
   ═══════════════════════════════════════════════════════ */

function ReplaceUnitDrawer({ unit, onClose }: { unit: PurchaseUnit; onClose: () => void }) {
  const { currentUser } = useAuth();
  const [allowCrossSet, setAllowCrossSet] = useState(false);
  const [crossSetReason, setCrossSetReason] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const candidates = MOCK_UNITS.filter(u =>
    u.id !== unit.id &&
    u.status === 'AVAILABLE' &&
    u.matchId === unit.matchId &&
    u.categoryId === unit.categoryId &&
    (allowCrossSet || u.setId === unit.setId)
  );

  const handleReplace = () => {
    if (!selectedId) return;
    addAuditEntry({
      when: new Date().toISOString(),
      actor: currentUser?.name ?? 'Unknown',
      actorRole: currentUser?.role ?? 'operator',
      entity: 'unit',
      entityId: unit.id,
      action: 'unit.replaced',
      before: { unitId: unit.id, status: unit.status, allocatedTo: unit.allocatedToLineItemId },
      after: { replacementUnitId: selectedId, oldStatus: 'REPLACED', crossSetSwap: allowCrossSet, crossSetReason: crossSetReason || null },
      ip: '10.0.1.12',
      eventId: 'evt1',
      eventName: 'FIFA World Cup 2026',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative bg-card rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col z-10">
        <div className="px-6 py-5 border-b border-border">
          <h3 className="font-display text-lg text-primary">Replace Unit — {unit.id}</h3>
          <p className="font-body text-xs text-muted-foreground mt-1">
            {unit.categoryLabel} · {unit.matchId} · Set: {unit.setId}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Cross-set toggle */}
          <div className="rounded-lg border border-border p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={allowCrossSet} onChange={e => setAllowCrossSet(e.target.checked)} className="w-4 h-4 rounded accent-primary" />
              <span className="font-body text-sm text-foreground">Allow cross-set swap</span>
            </label>
            {allowCrossSet && (
              <div className="mt-2">
                <label className="font-body text-[11px] text-muted-foreground block mb-1">Reason for cross-set swap *</label>
                <input value={crossSetReason} onChange={e => setCrossSetReason(e.target.value)}
                  className="w-full h-[36px] px-3 rounded-lg border border-border font-body text-sm text-foreground bg-card outline-none focus:ring-1 focus:ring-accent"
                  placeholder="e.g. Original set sold out" />
              </div>
            )}
          </div>

          {/* Candidate units */}
          <p className="font-body text-xs text-muted-foreground">{candidates.length} available replacement{candidates.length !== 1 ? 's' : ''}</p>
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {candidates.map(c => (
              <label key={c.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${selectedId === c.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                <input type="radio" name="replacement" checked={selectedId === c.id} onChange={() => setSelectedId(c.id)} className="w-4 h-4 accent-primary" />
                <span className="font-mono text-[12px] font-bold text-primary">{c.id}</span>
                <span className="font-body text-[11px] text-muted-foreground">Set {c.setId} · Pos {c.setPos}</span>
                {c.setId !== unit.setId && <span className="px-1.5 py-0.5 rounded font-body text-[9px] bg-warning/15 text-warning">Cross-set</span>}
              </label>
            ))}
            {candidates.length === 0 && (
              <div className="text-center py-6">
                <p className="font-body text-sm text-muted-foreground">No available units in same match + category{allowCrossSet ? '' : ' + set'}</p>
                {!allowCrossSet && <p className="font-body text-xs text-muted-foreground mt-1">Try enabling "Allow cross-set swap"</p>}
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <button onClick={onClose} className="font-body text-sm text-muted-foreground hover:underline">Cancel</button>
          <button onClick={handleReplace} disabled={!selectedId || (allowCrossSet && !crossSetReason.trim())}
            className="px-5 py-2.5 rounded-lg font-body text-sm font-bold bg-primary text-accent hover:opacity-90 disabled:opacity-40">
            Confirm Replace
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   BULK CANCEL MODAL
   ═══════════════════════════════════════════════════════ */

function BulkCancelModal({ lineItem, onClose }: { lineItem: PurchaseLineItem; onClose: () => void }) {
  const { currentUser } = useAuth();
  const [reason, setReason] = useState('');

  const units = MOCK_UNITS.filter(u => u.lineItemId === lineItem.id && u.status === 'AVAILABLE');

  const handleConfirm = () => {
    if (!reason.trim()) return;
    addAuditEntry({
      when: new Date().toISOString(),
      actor: currentUser?.name ?? 'Unknown',
      actorRole: currentUser?.role ?? 'super_admin',
      entity: 'unit',
      entityId: lineItem.id,
      action: 'unit.bulk_cancelled',
      before: { availableCount: units.length, lineItemId: lineItem.id },
      after: { cancelledCount: units.length, reason, unitIds: units.map(u => u.id) },
      ip: '10.0.1.12',
      eventId: 'evt1',
      eventName: 'FIFA World Cup 2026',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative bg-card rounded-2xl shadow-xl max-w-md w-full mx-4 z-10">
        <div className="px-6 py-5 border-b border-border">
          <h3 className="font-display text-lg text-primary flex items-center gap-2">
            <Ban size={18} className="text-destructive" /> Bulk Cancel Units
          </h3>
          <p className="font-body text-xs text-muted-foreground mt-1">
            {lineItem.categoryLabel} · {units.length} available units will be marked CANCELLED
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="rounded-lg p-3 bg-destructive/5 border-l-4 border-destructive">
            <p className="font-body text-sm text-foreground">
              <strong>{units.length}</strong> available units on line <strong className="font-mono">{lineItem.id}</strong> will be cancelled. Allocated units are not affected.
            </p>
          </div>
          <div>
            <label className="font-body text-sm font-medium text-foreground block mb-1">Reason *</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)}
              className="w-full h-20 rounded-lg border border-border px-3 py-2 font-body text-sm text-foreground bg-card resize-none focus:ring-1 focus:ring-accent outline-none"
              placeholder="Enter cancellation reason..." />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <button onClick={onClose} className="font-body text-sm text-muted-foreground hover:underline">Keep Units</button>
          <button onClick={handleConfirm} disabled={!reason.trim()}
            className="px-5 py-2.5 rounded-lg font-body text-sm font-bold bg-destructive text-destructive-foreground hover:opacity-90 disabled:opacity-40">
            Cancel {units.length} Units
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   UNIT DRAWER (list view with filters + search)
   ═══════════════════════════════════════════════════════ */

type DrawerMode =
  | { type: 'line'; purchaseId: string; lineItem: PurchaseLineItem }
  | { type: 'purchase'; purchaseId: string };

type UnitStatusFilter = 'ALL' | 'AVAILABLE' | 'ALLOCATED' | 'CANCELLED' | 'REPLACED';

function UnitDrawer({ mode, onClose, onUnitClick, onBulkCancel }: {
  mode: DrawerMode; onClose: () => void;
  onUnitClick: (unit: PurchaseUnit) => void;
  onBulkCancel: (li: PurchaseLineItem) => void;
}) {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'super_admin';
  const purchase = MOCK_PURCHASES.find(p => p.id === mode.purchaseId);
  const isLineMode = mode.type === 'line';
  const lineItems = isLineMode ? [mode.lineItem] : (purchase?.lines ?? []);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<UnitStatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleGroup = (id: string) => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

  const title = isLineMode
    ? `Units — PUR-${String(MOCK_PURCHASES.indexOf(purchase!) + 1).padStart(3, '0')} / Line ${lineItems[0].id.split('-').pop()} / ${lineItems[0].categoryLabel}`
    : `Units — PUR-${String(MOCK_PURCHASES.indexOf(purchase!) + 1).padStart(3, '0')}`;

  const filterUnits = (units: PurchaseUnit[]) => {
    let filtered = units;
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(u => u.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toUpperCase();
      filtered = filtered.filter(u => u.id.toUpperCase().includes(q));
    }
    return filtered;
  };

  const statusOpts: UnitStatusFilter[] = ['ALL', 'AVAILABLE', 'ALLOCATED', 'CANCELLED', 'REPLACED'];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-foreground/30" onClick={onClose} />
      <motion.div initial={{ x: 420, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 420, opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-[520px] max-w-full h-full bg-card shadow-xl flex flex-col z-10">
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-xl text-primary">{title}</h3>
              {isLineMode && <p className="font-body text-xs text-muted-foreground mt-1">Sub-Game: {getSubGameName(lineItems[0].subGameId)}</p>}
            </div>
            <button onClick={onClose} className="p-1 rounded-md hover:bg-muted"><X size={18} /></button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mt-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by Unit ID..."
                className="w-full h-[34px] pl-8 pr-3 rounded-lg border border-border font-mono text-[12px] text-foreground bg-card outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="flex rounded-lg border border-border overflow-hidden">
              {statusOpts.map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-2 py-1.5 font-body text-[10px] font-medium transition-colors ${statusFilter === s ? 'bg-primary text-accent' : 'bg-card text-muted-foreground hover:bg-muted'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {lineItems.map(li => {
            const allUnits = MOCK_UNITS.filter(u => u.lineItemId === li.id);
            const units = filterUnits(allUnits);
            const isGroupCollapsed = !!collapsed[li.id];
            const stats = lineUnitStats(li.id);

            return (
              <div key={li.id} className="mb-6">
                {!isLineMode && (
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => toggleGroup(li.id)} className="flex items-center gap-2 text-left">
                      <ChevronRight size={14} className={`text-muted-foreground transition-transform ${!isGroupCollapsed ? 'rotate-90' : ''}`} />
                      <span className="font-body text-sm font-semibold text-foreground">
                        Line {li.id.split('-').pop()} — {li.categoryLabel} ({units.length}/{allUnits.length})
                      </span>
                    </button>
                    {isAdmin && stats.available > 0 && (
                      <button onClick={() => onBulkCancel(li)}
                        className="px-2 py-1 rounded-lg font-body text-[10px] font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center gap-1">
                        <Ban size={10} /> Bulk Cancel ({stats.available})
                      </button>
                    )}
                  </div>
                )}
                {isLineMode && isAdmin && stats.available > 0 && (
                  <div className="flex justify-end mb-2">
                    <button onClick={() => onBulkCancel(li)}
                      className="px-2 py-1 rounded-lg font-body text-[10px] font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center gap-1">
                      <Ban size={10} /> Bulk Cancel ({stats.available})
                    </button>
                  </div>
                )}
                {(isLineMode || !isGroupCollapsed) && (
                  <div className="grid grid-cols-6 gap-2">
                    {units.map(u => {
                      const isAlloc = u.status === 'ALLOCATED';
                      return (
                        <button key={u.id} onClick={() => onUnitClick(u)}
                          className="rounded-lg p-1.5 flex flex-col items-center justify-center text-center cursor-pointer transition-shadow hover:shadow-md hover:ring-1 hover:ring-accent"
                          style={{
                            width: 80, height: 68,
                            backgroundColor: u.status === 'CANCELLED' ? 'hsl(var(--destructive) / 0.08)' : u.status === 'REPLACED' ? 'hsl(var(--muted))' : isAlloc ? 'hsl(var(--success-bg))' : 'hsl(var(--warning-bg))',
                            border: `1.5px solid ${u.status === 'CANCELLED' || u.status === 'REPLACED' ? 'hsl(var(--destructive) / 0.3)' : isAlloc ? 'hsl(var(--success))' : 'hsl(var(--warning))'}`,
                            color: u.status === 'CANCELLED' || u.status === 'REPLACED' ? 'hsl(var(--destructive))' : isAlloc ? '#065F46' : '#92400E',
                          }}>
                          <span className="font-mono text-[10px] font-bold">{u.id}</span>
                          <span className="font-body text-[8px] mt-0.5">{u.block && u.seat ? `${u.block}-${u.row}-${u.seat}` : `Pos ${u.setPos}`}</span>
                          <span className="font-body text-[8px]">{u.status === 'CANCELLED' ? 'CNCL' : u.status === 'REPLACED' ? 'REPL' : isAlloc ? 'ALLOC' : 'AVAIL'}</span>
                        </button>
                      );
                    })}
                    {units.length === 0 && (
                      <div className="col-span-6 py-4 text-center">
                        <p className="font-body text-sm text-muted-foreground">No units match filter</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="px-6 py-3 border-t border-border font-body text-xs text-muted-foreground">
          Purchase: {purchase?.id} &nbsp;|&nbsp; Vendor: {purchase?.vendor} &nbsp;|&nbsp; Contract: {purchase?.contract}
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PURCHASE CANCEL MODAL (kept from original)
   ═══════════════════════════════════════════════════════ */

type CancelScope = 'all' | 'specific' | 'available-only';

function PurchaseCancelModal({ purchaseId, onClose, onConfirm }: {
  purchaseId: string; onClose: () => void; onConfirm: (cancelledLineIds: string[]) => void;
}) {
  const [scope, setScope] = useState<CancelScope>('all');
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState('');

  const purchase = MOCK_PURCHASES.find(p => p.id === purchaseId);
  if (!purchase) return null;
  const purIdx = MOCK_PURCHASES.indexOf(purchase) + 1;
  const purLabel = `PUR-${String(purIdx).padStart(3, '0')}`;

  const lineData = purchase.lines.map((li, i) => {
    const stats = lineUnitStats(li.id);
    const fullyAllocated = stats.available === 0 && stats.allocated > 0;
    return { li, idx: i, stats, fullyAllocated };
  });

  const toggleLine = (id: string) => setSelectedLines(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const affectedLines = scope === 'all' ? lineData : scope === 'specific' ? lineData.filter(l => selectedLines.has(l.li.id)) : lineData;
  const totalCancellable = affectedLines.reduce((s, l) => s + l.stats.available, 0);

  const inputCls = "h-[38px] w-full px-3 rounded-lg border border-border font-body text-sm text-foreground bg-card outline-none focus:ring-1 focus:ring-accent";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative bg-card rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto z-10">
        <div className="px-8 py-6 border-b border-border flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl text-primary">Cancel Purchase — {purLabel}</h2>
            <p className="font-body text-sm text-muted-foreground mt-1">{purchase.vendor} · {purchase.contract} · {getMatchLabel(purchase.matchId)}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X size={18} /></button>
        </div>
        <div className="px-8 py-6 space-y-5">
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-left">
              <thead><tr className="bg-muted">
                {scope === 'specific' && <th className="px-3 py-2 w-8"></th>}
                {['Line', 'Sub-Game', 'Category', 'Qty', 'Available', 'Allocated', 'Can Cancel?'].map(h => (
                  <th key={h} className="px-3 py-2 font-body text-[11px] font-medium uppercase text-muted-foreground">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {lineData.map(({ li, idx, stats, fullyAllocated }) => (
                  <tr key={li.id} className={fullyAllocated ? 'opacity-50' : ''}>
                    {scope === 'specific' && <td className="px-3 py-2.5">{fullyAllocated ? <Lock size={14} className="text-muted-foreground" /> : <input type="checkbox" checked={selectedLines.has(li.id)} onChange={() => toggleLine(li.id)} className="w-4 h-4 rounded border-border accent-primary" />}</td>}
                    <td className="px-3 py-2.5 font-mono text-xs font-bold text-primary">L{idx + 1}</td>
                    <td className="px-3 py-2.5 font-body text-[12px] text-foreground">{getSubGameName(li.subGameId)}</td>
                    <td className="px-3 py-2.5 font-body text-[13px] text-foreground">{li.categoryLabel}</td>
                    <td className="px-3 py-2.5 font-mono text-[12px]">{li.qty}</td>
                    <td className="px-3 py-2.5 font-mono text-[12px] text-success">{stats.available}</td>
                    <td className="px-3 py-2.5 font-mono text-[12px] text-warning">{stats.allocated}</td>
                    <td className="px-3 py-2.5 font-body text-[11px]">{fullyAllocated ? <span className="text-muted-foreground italic">Fully allocated</span> : stats.allocated > 0 ? <span className="text-warning">PARTIAL — {stats.available} only</span> : <span className="text-success">FULL — {stats.available} units</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-2">
            <h3 className="font-body text-sm font-bold text-foreground">Cancel Scope</h3>
            {([['all', 'Cancel entire purchase (all available units)'], ['specific', 'Cancel specific lines only'], ['available-only', 'Cancel available units on all lines (keep structure)']] as [CancelScope, string][]).map(([v, l]) => (
              <label key={v} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors" style={{ borderColor: scope === v ? '#C9A84C' : 'hsl(var(--border))', backgroundColor: scope === v ? 'hsl(var(--accent) / 0.08)' : 'transparent' }}>
                <input type="radio" name="scope" checked={scope === v} onChange={() => setScope(v)} className="w-4 h-4 accent-primary" />
                <span className="font-body text-sm text-foreground">{l}</span>
              </label>
            ))}
          </div>
          <div className="rounded-lg p-3 border-l-4 border-destructive bg-destructive/5">
            <p className="font-body text-sm font-medium text-foreground">Total units to be cancelled: <span className="font-mono font-bold">{totalCancellable}</span></p>
          </div>
          <div>
            <label className="font-body text-sm font-medium text-foreground block mb-1">Reason *</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} className="w-full h-20 rounded-lg border border-border px-3 py-2 font-body text-sm text-foreground bg-card resize-none focus:ring-1 focus:ring-accent outline-none" placeholder="Enter cancellation reason..." />
          </div>
        </div>
        <div className="px-8 py-4 border-t border-border flex items-center justify-between">
          <button onClick={onClose} className="font-body text-sm text-muted-foreground hover:underline">Keep Purchase</button>
          <button onClick={() => onConfirm(affectedLines.map(l => l.li.id))} disabled={!reason.trim() || totalCancellable === 0}
            className="px-5 py-2.5 rounded-lg font-body text-sm font-bold bg-destructive text-destructive-foreground hover:opacity-90 disabled:opacity-40">Confirm Cancellation</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PURCHASE EDIT MODAL (kept from original)
   ═══════════════════════════════════════════════════════ */

interface EditLineState {
  id: string;
  subGameId: string;
  categoryId: string;
  categoryLabel: string;
  qty: number;
  unitPrice: number;
  hasUnits: boolean;
  allocatedCount: number;
  isNew?: boolean;
}

function PurchaseEditModal({ purchaseId, onClose, onSave }: {
  purchaseId: string; onClose: () => void; onSave: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'header' | 'lines'>('header');
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);
  const [vendor, setVendor] = useState('');
  const [contract, setContract] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<EditLineState[]>([]);
  const [initialized, setInitialized] = useState(false);

  const purchase = MOCK_PURCHASES.find(p => p.id === purchaseId);
  if (!purchase) return null;

  if (!initialized) {
    setVendor(purchase.vendor); setContract(purchase.contract); setDate(purchase.date); setNotes(purchase.notes);
    setLines(purchase.lines.map(l => { const stats = lineUnitStats(l.id); return { id: l.id, subGameId: l.subGameId, categoryId: l.categoryId, categoryLabel: l.categoryLabel, qty: l.qty, unitPrice: l.unitPrice, hasUnits: stats.total > 0, allocatedCount: stats.allocated }; }));
    setInitialized(true);
  }

  const purIdx = MOCK_PURCHASES.indexOf(purchase) + 1;
  const purLabel = `PUR-${String(purIdx).padStart(3, '0')}`;
  const matchSubGames = getSubGamesForMatch(purchase.matchId);
  const hasAnyAllocated = purchase.lines.some(l => lineUnitStats(l.id).allocated > 0);

  const updateLine = (id: string, field: keyof EditLineState, value: any) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const addNewLine = () => {
    const sg = matchSubGames[0];
    const cat = sg?.categories[0];
    setLines(prev => [...prev, {
      id: `new-${Date.now()}`, subGameId: sg?.id ?? '', categoryId: cat?.id ?? '', categoryLabel: cat?.label ?? '',
      qty: 1, unitPrice: 0, hasUnits: false, allocatedCount: 0, isNew: true,
    }]);
  };

  const removeLine = (id: string) => {
    setLines(prev => prev.filter(l => l.id !== id));
    setRemoveConfirm(null);
  };

  const tabCls = (t: string) => `pb-2.5 font-body text-sm font-medium relative ${activeTab === t ? 'text-primary' : 'text-muted-foreground'}`;
  const inputCls = "h-[38px] w-full px-3 rounded-lg border border-border font-body text-sm text-foreground bg-card outline-none focus:ring-1 focus:ring-accent";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative bg-card rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col z-10">
        <div className="px-8 py-6 border-b border-border flex items-start justify-between shrink-0">
          <div>
            <h2 className="font-display text-xl text-primary">Edit Purchase — {purLabel}</h2>
            <p className="font-body text-sm text-muted-foreground mt-1">{getMatchLabel(purchase.matchId)}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X size={18} /></button>
        </div>
        <div className="px-8 flex gap-6 border-b border-border shrink-0">
          {(['header', 'lines'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={tabCls(t)}>
              {t === 'header' ? 'Header Details' : 'Category Lines'}
              {activeTab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {activeTab === 'header' && (
            <div className="space-y-4">
              <div>
                <label className="font-body text-sm font-medium text-foreground block mb-1">Vendor</label>
                <div className="relative">
                  <input value={vendor} onChange={e => setVendor(e.target.value)} disabled={hasAnyAllocated}
                    className={`${inputCls} ${hasAnyAllocated ? 'opacity-60 cursor-not-allowed' : ''}`} />
                  {hasAnyAllocated && <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />}
                </div>
              </div>
              <div>
                <label className="font-body text-sm font-medium text-foreground block mb-1">Contract</label>
                <input value={contract} onChange={e => setContract(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-foreground block mb-1">Date</label>
                <input type="text" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-foreground block mb-1">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full h-20 rounded-lg border border-border px-3 py-2 font-body text-sm text-foreground bg-card resize-none focus:ring-1 focus:ring-accent outline-none" />
              </div>
            </div>
          )}

          {activeTab === 'lines' && (
            <div className="space-y-4">
              {lines.map((line, idx) => {
                const sg = MOCK_SUBGAMES.find(s => s.id === line.subGameId);
                const cats = sg?.categories ?? [];
                const canRemove = line.allocatedCount === 0;

                return (
                  <div key={line.id} className="rounded-xl border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-primary/10 text-primary">L{idx + 1}</span>
                        <span className="font-body text-sm font-medium text-foreground">{line.categoryLabel || 'New Line'}</span>
                      </div>
                      {canRemove ? (
                        removeConfirm === line.id ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => removeLine(line.id)} className="px-2 py-1 rounded font-body text-[11px] font-medium bg-destructive text-destructive-foreground">Yes</button>
                            <button onClick={() => setRemoveConfirm(null)} className="font-body text-[11px] text-muted-foreground hover:underline">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setRemoveConfirm(line.id)} className="flex items-center gap-1 font-body text-[11px] text-destructive hover:underline">
                            <Trash2 size={12} /> Remove
                          </button>
                        )
                      ) : (
                        <div className="flex items-center gap-1 font-body text-[11px] text-muted-foreground"><Lock size={12} /> Locked</div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-body text-[11px] font-medium text-muted-foreground block mb-1">Sub-Game</label>
                        <select value={line.subGameId} disabled={line.hasUnits}
                          onChange={e => {
                            const newSg = MOCK_SUBGAMES.find(s => s.id === e.target.value);
                            const newCat = newSg?.categories[0];
                            updateLine(line.id, 'subGameId', e.target.value);
                            if (newCat) { updateLine(line.id, 'categoryId', newCat.id); updateLine(line.id, 'categoryLabel', newCat.label); }
                          }}
                          className={`${inputCls} ${line.hasUnits ? 'opacity-60 cursor-not-allowed' : ''}`}>
                          {matchSubGames.map(sg => <option key={sg.id} value={sg.id}>{sg.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="font-body text-[11px] font-medium text-muted-foreground block mb-1">Category</label>
                        <select value={line.categoryId} disabled={line.hasUnits}
                          onChange={e => {
                            const cat = cats.find(c => c.id === e.target.value);
                            updateLine(line.id, 'categoryId', e.target.value);
                            if (cat) updateLine(line.id, 'categoryLabel', cat.label);
                          }}
                          className={`${inputCls} ${line.hasUnits ? 'opacity-60 cursor-not-allowed' : ''}`}>
                          {cats.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="font-body text-[11px] font-medium text-muted-foreground block mb-1">Quantity</label>
                        <input type="number" value={line.qty} min={line.allocatedCount || 1}
                          onChange={e => updateLine(line.id, 'qty', Math.max(line.allocatedCount || 1, parseInt(e.target.value) || 1))}
                          className={inputCls} />
                      </div>
                      <div>
                        <label className="font-body text-[11px] font-medium text-muted-foreground block mb-1">Unit Price (AED)</label>
                        <input type="number" value={line.unitPrice} onChange={e => updateLine(line.id, 'unitPrice', parseInt(e.target.value) || 0)} className={inputCls} />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs text-muted-foreground">Line total: AED {(line.qty * line.unitPrice).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
              <button onClick={addNewLine}
                className="w-full py-3 rounded-xl border-2 border-dashed border-border flex items-center justify-center gap-2 font-body text-sm text-muted-foreground hover:border-accent hover:text-accent transition-colors">
                <Plus size={16} /> Add New Line
              </button>
            </div>
          )}
        </div>
        <div className="px-8 py-4 border-t border-border flex items-center justify-between shrink-0">
          <button onClick={onClose} className="font-body text-sm text-muted-foreground hover:underline">Cancel</button>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground">
              {lines.length} lines · AED {lines.reduce((s, l) => s + l.qty * l.unitPrice, 0).toLocaleString()}
            </span>
            <button onClick={() => { onSave(); onClose(); }}
              className="px-5 py-2.5 rounded-lg font-body text-sm font-bold bg-primary text-accent hover:opacity-90">
              Save Changes
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */

export default function PurchasesPage() {
  const navigate = useNavigate();
  const { eventMatches, eventVendors, activeEvent, ctx } = useContextHelpers();
  const [matchFilter, setMatchFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [cancelPurchaseId, setCancelPurchaseId] = useState<string | null>(null);
  const [editPurchaseId, setEditPurchaseId] = useState<string | null>(null);
  const [cancelledPurchases, setCancelledPurchases] = useState<Set<string>>(new Set());
  const [cancelledLines, setCancelledLines] = useState<Set<string>>(new Set());
  const [selectedUnit, setSelectedUnit] = useState<PurchaseUnit | null>(null);
  const [replaceUnit, setReplaceUnit] = useState<PurchaseUnit | null>(null);
  const [bulkCancelLine, setBulkCancelLine] = useState<PurchaseLineItem | null>(null);

  const toggleExpand = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const purchases = MOCK_PURCHASES.filter(p => {
    if (cancelledPurchases.has(p.id)) return false;
    if (vendorFilter !== 'all' && p.vendor !== vendorFilter) return false;
    if (matchFilter !== 'all') {
      const m = MOCK_MATCHES.find(x => x.id === p.matchId);
      if (m && m.code !== matchFilter) return false;
    }
    if (catFilter !== 'all') {
      if (!p.lines.some(l => l.categoryLabel === catFilter)) return false;
    }
    return true;
  });

  const handleCancelConfirm = (lineIds: string[]) => {
    const purchase = MOCK_PURCHASES.find(p => p.id === cancelPurchaseId);
    if (!purchase) return;
    lineIds.forEach(id => setCancelledLines(prev => new Set(prev).add(id)));
    const allLines = purchase.lines.every(l => lineIds.includes(l.id) || cancelledLines.has(l.id));
    if (allLines) setCancelledPurchases(prev => new Set(prev).add(purchase.id));
    setCancelPurchaseId(null);
  };

  const selectClass = "h-[38px] px-3 rounded-lg font-body text-sm bg-card outline-none border border-border focus:ring-1 focus:ring-accent";

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-[26px] text-primary">Purchases</h1>
        <RoleGuard roles={['super_admin', 'ops_manager', 'sr_operator', 'operator']}>
          <button onClick={() => navigate('/purchases/new')} className="px-4 py-2 rounded-lg font-body text-sm font-medium transition-opacity hover:opacity-90 bg-primary text-accent">New Purchase +</button>
        </RoleGuard>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <select className={selectClass} disabled><option>{activeEvent.name}</option></select>
        <select className={selectClass} value={matchFilter} onChange={e => setMatchFilter(e.target.value)}>
          <option value="all">All Matches</option>
          {eventMatches.map(m => <option key={m.id} value={m.code}>{m.code} — {m.teamsOrDescription}</option>)}
        </select>
        <select className={selectClass} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {ctx.subGames.flatMap(sg => sg.categories).filter((c, i, a) => a.findIndex(x => x.displayName === c.displayName) === i).map(c => <option key={c.id} value={c.displayName}>{c.displayName}</option>)}
        </select>
        <select className={selectClass} value={vendorFilter} onChange={e => setVendorFilter(e.target.value)}>
          <option value="all">All Vendors</option>
          {eventVendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
        </select>
      </div>

      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="bg-primary h-[44px]">
                {['', 'Purchase ID', 'Date', 'Match', 'Vendor', 'Contract', 'Lines', 'Total Qty', 'Total Value', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-2.5 font-body text-[13px] font-bold text-primary-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {purchases.map((p, pi) => {
                const isExpanded = expanded[p.id];
                const purIdx = MOCK_PURCHASES.indexOf(p) + 1;
                const purLabel = `PUR-${String(purIdx).padStart(3, '0')}`;
                const matchLabel = getMatchLabel(p.matchId);
                const isMultiSg = hasMultipleSubGames(p.matchId);
                const activeLines = p.lines.filter(l => !cancelledLines.has(l.id));

                return (
                  <Fragment key={p.id}>
                    <tr className="transition-colors cursor-pointer border-b border-border"
                      style={{ backgroundColor: pi % 2 === 1 ? 'hsl(var(--muted))' : 'hsl(var(--card))' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#EEF3FF')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = pi % 2 === 1 ? 'hsl(220 14% 96%)' : 'white')}
                      onClick={() => toggleExpand(p.id)}>
                      <td className="px-4 py-3 w-8"><ChevronRight size={16} className={`text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} /></td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{purLabel}</td>
                      <td className="px-4 py-3 font-body text-[13px] text-foreground">{p.date}</td>
                      <td className="px-4 py-3 font-body text-[13px] text-foreground">{matchLabel}</td>
                      <td className="px-4 py-3 font-body text-[13px] text-foreground">{p.vendor}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{p.contract}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-muted font-body text-[11px] font-medium text-foreground">{activeLines.length} lines</span></td>
                      <td className="px-4 py-3 font-mono text-[13px] text-foreground">{activeLines.reduce((s, l) => s + l.qty, 0)}</td>
                      <td className="px-4 py-3 font-mono text-[13px] font-medium text-foreground">AED {activeLines.reduce((s, l) => s + l.lineTotal, 0).toLocaleString()}</td>
                      <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-success/10 text-success">{p.status}</span></td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <button onClick={() => setEditPurchaseId(p.id)} className="font-body text-xs text-primary hover:underline">Edit</button>
                          <button onClick={() => setDrawerMode({ type: 'purchase', purchaseId: p.id })} className="font-body text-xs text-primary hover:underline">View Units</button>
                          <button onClick={() => setCancelPurchaseId(p.id)} className="font-body text-xs text-destructive hover:underline">Cancel</button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && activeLines.map((li, liIdx) => {
                      const stats = lineUnitStats(li.id);
                      const allocPct = stats.total > 0 ? (stats.allocated / stats.total) * 100 : 0;
                      const sgName = isMultiSg ? getSubGameName(li.subGameId) : '—';
                      return (
                        <tr key={li.id} className="bg-muted/50 border-b border-border/50">
                          <td className="px-4 py-2.5"><div className="flex items-center justify-center"><div className="w-px h-full bg-border" /></div></td>
                          <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-primary/10 text-primary">L{liIdx + 1}</span></td>
                          <td className="px-4 py-2.5 font-body text-[12px] text-muted-foreground">{sgName}</td>
                          <td className="px-4 py-2.5 font-body text-[13px] text-foreground">{li.categoryLabel}</td>
                          <td className="px-4 py-2.5 font-mono text-[12px] text-foreground">{li.qty}</td>
                          <td className="px-4 py-2.5 font-mono text-[12px] text-foreground">AED {li.unitPrice.toLocaleString()}</td>
                          <td className="px-4 py-2.5 font-mono text-[12px] font-medium text-foreground">AED {li.lineTotal.toLocaleString()}</td>
                          <td colSpan={2} className="px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-1.5 rounded-full flex overflow-hidden bg-border">
                                <div className="h-full bg-success" style={{ width: `${allocPct}%` }} />
                                <div className="h-full bg-warning" style={{ width: `${100 - allocPct}%` }} />
                              </div>
                              <span className="font-body text-[11px] text-muted-foreground whitespace-nowrap">{stats.allocated}/{stats.total} — {stats.total > 0 ? Math.round(allocPct) : 0}% allocated</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5" colSpan={2} onClick={e => e.stopPropagation()}>
                            <div className="flex gap-2">
                              <button onClick={() => setDrawerMode({ type: 'line', purchaseId: p.id, lineItem: li })}
                                className="px-3 py-1 rounded-lg font-body text-[11px] font-medium bg-primary text-primary-foreground hover:opacity-90">View L{liIdx + 1} Units</button>
                              {stats.available > 0 && (
                                <button onClick={() => setCancelPurchaseId(p.id)}
                                  className="px-3 py-1 rounded-lg font-body text-[11px] font-medium bg-destructive/10 text-destructive hover:bg-destructive/20">Cancel Line</button>
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
        {drawerMode && <UnitDrawer mode={drawerMode} onClose={() => setDrawerMode(null)} onUnitClick={u => { setSelectedUnit(u); }} onBulkCancel={li => { setBulkCancelLine(li); }} />}
      </AnimatePresence>
      <AnimatePresence>
        {selectedUnit && <UnitDetailDrawer unit={selectedUnit} onClose={() => setSelectedUnit(null)} onReplace={u => { setSelectedUnit(null); setReplaceUnit(u); }} />}
      </AnimatePresence>
      <AnimatePresence>
        {replaceUnit && <ReplaceUnitDrawer unit={replaceUnit} onClose={() => setReplaceUnit(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {bulkCancelLine && <BulkCancelModal lineItem={bulkCancelLine} onClose={() => setBulkCancelLine(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {cancelPurchaseId && <PurchaseCancelModal purchaseId={cancelPurchaseId} onClose={() => setCancelPurchaseId(null)} onConfirm={handleCancelConfirm} />}
      </AnimatePresence>
      <AnimatePresence>
        {editPurchaseId && <PurchaseEditModal purchaseId={editPurchaseId} onClose={() => setEditPurchaseId(null)} onSave={() => {}} />}
      </AnimatePresence>
    </div>
  );
}
