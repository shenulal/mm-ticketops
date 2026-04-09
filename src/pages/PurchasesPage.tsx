import { useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAppContext } from '@/context/AppContext';
import { useEvent } from '@/context/EventContext';
import RoleGuard from '@/components/RoleGuard';
import {
  MOCK_PURCHASES, MOCK_UNITS, MOCK_PURCHASE_LINE_ITEMS, MOCK_MATCHES, MOCK_SUBGAMES,
  hasMultipleSubGames, getSubGamesForMatch,
  type PurchaseLineItem,
} from '@/data/mockData';
import { useContextHelpers } from '@/hooks/useContextHelpers';
import { ChevronRight, X, Lock, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function lineUnitStats(lineItemId: string) {
  const units = MOCK_UNITS.filter(u => u.lineItemId === lineItemId);
  const allocated = units.filter(u => u.status === 'ALLOCATED').length;
  const available = units.filter(u => u.status === 'AVAILABLE').length;
  return { total: units.length, allocated, available };
}

/* ── Unit Drawer ── */
type DrawerMode =
  | { type: 'line'; purchaseId: string; lineItem: PurchaseLineItem }
  | { type: 'purchase'; purchaseId: string };

function UnitLineGroup({ li, isLineMode, isGroupCollapsed, onToggle }: {
  li: PurchaseLineItem; isLineMode: boolean; isGroupCollapsed: boolean; onToggle: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const units = MOCK_UNITS.filter(u => u.lineItemId === li.id);
  const displayed = showAll ? units : units.slice(0, 24);

  return (
    <div className="mb-6">
      {!isLineMode && (
        <button onClick={onToggle} className="flex items-center gap-2 mb-3 w-full text-left">
          <ChevronRight size={14} className={`text-muted-foreground transition-transform ${!isGroupCollapsed ? 'rotate-90' : ''}`} />
          <span className="font-body text-sm font-semibold text-foreground">
            Line {li.id.split('-').pop()} — {li.categoryLabel} ({units.length} units)
          </span>
        </button>
      )}
      {(isLineMode || !isGroupCollapsed) && (
        <>
          <div className="grid grid-cols-6 gap-2">
            {displayed.map(u => {
              const isAlloc = u.status === 'ALLOCATED';
              return (
                <div key={u.id} className="rounded-lg p-1.5 flex flex-col items-center justify-center text-center"
                  style={{
                    width: 72, height: 60,
                    backgroundColor: isAlloc ? 'hsl(var(--success-bg))' : 'hsl(var(--warning-bg))',
                    border: `1.5px solid ${isAlloc ? 'hsl(var(--success))' : 'hsl(var(--warning))'}`,
                    color: isAlloc ? '#065F46' : '#92400E',
                  }}>
                  <span className="font-mono text-[10px] font-bold">{u.id}</span>
                  <span className="font-body text-[9px] mt-0.5">{isAlloc ? 'ALLOC' : `AVAIL · Pos ${u.setPos}`}</span>
                </div>
              );
            })}
          </div>
          {!showAll && units.length > 24 && (
            <button onClick={() => setShowAll(true)} className="mt-3 font-body text-xs font-medium hover:underline text-accent">
              Show all {units.length} →
            </button>
          )}
        </>
      )}
    </div>
  );
}

function UnitDrawer({ mode, onClose }: { mode: DrawerMode; onClose: () => void }) {
  const purchase = MOCK_PURCHASES.find(p => p.id === mode.purchaseId);
  const isLineMode = mode.type === 'line';
  const lineItems = isLineMode ? [mode.lineItem] : (purchase?.lines ?? []);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggleGroup = (id: string) => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  const title = isLineMode
    ? `Units — PUR-${String(MOCK_PURCHASES.indexOf(purchase!) + 1).padStart(3, '0')} / Line ${lineItems[0].id.split('-').pop()} / ${lineItems[0].categoryLabel}`
    : `Units — PUR-${String(MOCK_PURCHASES.indexOf(purchase!) + 1).padStart(3, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-foreground/30" onClick={onClose} />
      <motion.div initial={{ x: 420, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 420, opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-[480px] max-w-full h-full bg-card shadow-xl flex flex-col z-10">
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-xl text-primary">{title}</h3>
              {isLineMode && <p className="font-body text-xs text-muted-foreground mt-1">Sub-Game: {getSubGameName(lineItems[0].subGameId)}</p>}
            </div>
            <button onClick={onClose} className="p-1 rounded-md hover:bg-muted"><X size={18} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {lineItems.map(li => (
            <UnitLineGroup key={li.id} li={li} isLineMode={isLineMode} isGroupCollapsed={!!collapsed[li.id]} onToggle={() => toggleGroup(li.id)} />
          ))}
        </div>
        <div className="px-6 py-3 border-t border-border font-body text-xs text-muted-foreground">
          Purchase: {purchase?.id} &nbsp;|&nbsp; Vendor: {purchase?.vendor} &nbsp;|&nbsp; Contract: {purchase?.contract}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Purchase Cancel Modal ── */
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
                    <td className="px-3 py-2.5 font-body text-[11px]">{fullyAllocated ? <span className="text-muted-foreground italic">Fully allocated — cannot cancel</span> : stats.allocated > 0 ? <span className="text-warning">PARTIAL — {stats.available} available only</span> : <span className="text-success">FULL — all {stats.available} units</span>}</td>
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

/* ── Purchase Edit Modal ── */
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

function getMatchLabel(matchId: string) { const m = MOCK_MATCHES.find(x => x.id === matchId); return m ? `${m.code} ${m.teams}` : matchId; }
function getSubGameName(sgId: string) { return MOCK_SUBGAMES.find(sg => sg.id === sgId)?.name ?? '—'; }

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

        {/* Tabs */}
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
                  {hasAnyAllocated && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1" title="Vendor locked — units allocated">
                      <Lock size={14} className="text-muted-foreground" />
                    </div>
                  )}
                </div>
                {hasAnyAllocated && <p className="font-body text-[11px] text-muted-foreground mt-1 italic">Vendor cannot be changed after units are allocated</p>}
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
                    {/* Line header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-primary/10 text-primary">L{idx + 1}</span>
                        <span className="font-body text-sm font-medium text-foreground">{line.categoryLabel || 'New Line'}</span>
                        {line.hasUnits && <span className="px-1.5 py-0.5 rounded font-body text-[9px] bg-success/10 text-success">Units exist</span>}
                        {line.allocatedCount > 0 && <span className="px-1.5 py-0.5 rounded font-body text-[9px] bg-warning/10 text-warning">{line.allocatedCount} allocated</span>}
                      </div>
                      {canRemove ? (
                        removeConfirm === line.id ? (
                          <div className="flex items-center gap-2">
                            <span className="font-body text-[11px] text-destructive">Remove {line.categoryLabel} × {line.qty - line.allocatedCount} units?</span>
                            <button onClick={() => removeLine(line.id)} className="px-2 py-1 rounded font-body text-[11px] font-medium bg-destructive text-destructive-foreground">Yes</button>
                            <button onClick={() => setRemoveConfirm(null)} className="font-body text-[11px] text-muted-foreground hover:underline">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setRemoveConfirm(line.id)} className="flex items-center gap-1 font-body text-[11px] text-destructive hover:underline">
                            <Trash2 size={12} /> Remove Line
                          </button>
                        )
                      ) : (
                        <div className="flex items-center gap-1 font-body text-[11px] text-muted-foreground cursor-not-allowed" title={`Cannot remove — ${line.allocatedCount} units allocated`}>
                          <Lock size={12} /> Cannot remove
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Sub-Game */}
                      <div>
                        <label className="font-body text-[11px] font-medium text-muted-foreground block mb-1">Sub-Game</label>
                        <div className="relative">
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
                          {line.hasUnits && <Lock size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />}
                        </div>
                        {line.hasUnits && <p className="font-body text-[10px] text-muted-foreground mt-0.5 italic">Sub-game cannot be changed after units are generated</p>}
                      </div>

                      {/* Category */}
                      <div>
                        <label className="font-body text-[11px] font-medium text-muted-foreground block mb-1">Category</label>
                        <div className="relative">
                          <select value={line.categoryId} disabled={line.hasUnits}
                            onChange={e => {
                              const cat = cats.find(c => c.id === e.target.value);
                              updateLine(line.id, 'categoryId', e.target.value);
                              if (cat) updateLine(line.id, 'categoryLabel', cat.label);
                            }}
                            className={`${inputCls} ${line.hasUnits ? 'opacity-60 cursor-not-allowed' : ''}`}>
                            {cats.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                          </select>
                          {line.hasUnits && <Lock size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />}
                        </div>
                        {line.hasUnits && <p className="font-body text-[10px] text-muted-foreground mt-0.5 italic">Category locked — {lineUnitStats(line.id).total} units serialised</p>}
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="font-body text-[11px] font-medium text-muted-foreground block mb-1">Quantity</label>
                        <input type="number" value={line.qty} min={line.allocatedCount || 1}
                          onChange={e => updateLine(line.id, 'qty', Math.max(line.allocatedCount || 1, parseInt(e.target.value) || 1))}
                          className={inputCls} />
                        {line.allocatedCount > 0 && <p className="font-body text-[10px] text-muted-foreground mt-0.5">Min: {line.allocatedCount} (allocated for this line)</p>}
                      </div>

                      {/* Price */}
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

/* ── Main Page ── */
export default function PurchasesPage() {
  const navigate = useNavigate();
  const [matchFilter, setMatchFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [cancelPurchaseId, setCancelPurchaseId] = useState<string | null>(null);
  const [editPurchaseId, setEditPurchaseId] = useState<string | null>(null);
  const [cancelledPurchases, setCancelledPurchases] = useState<Set<string>>(new Set());
  const [cancelledLines, setCancelledLines] = useState<Set<string>>(new Set());

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
        <select className={selectClass} disabled><option>FIFA WC 2026</option></select>
        <select className={selectClass} value={matchFilter} onChange={e => setMatchFilter(e.target.value)}>
          <option value="all">All Matches</option>
          {MOCK_MATCHES.map(m => <option key={m.id} value={m.code}>{m.code} — {m.teams}</option>)}
        </select>
        <select className={selectClass} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">All Categories</option>
          <option>Top Cat 1</option><option>Cat 2</option><option>Cat 3</option><option>Cat 4</option>
          <option>Grandstand A</option><option>Paddock Club</option>
        </select>
        <select className={selectClass} value={vendorFilter} onChange={e => setVendorFilter(e.target.value)}>
          <option value="all">All Vendors</option><option>poxami</option><option>viagogo</option>
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
        {drawerMode && <UnitDrawer mode={drawerMode} onClose={() => setDrawerMode(null)} />}
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
