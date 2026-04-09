import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import RoleGuard from '@/components/RoleGuard';
import {
  MOCK_PURCHASES, MOCK_MATCHES, MOCK_UNITS, MOCK_PURCHASE_LINE_ITEMS,
  MOCK_SUBGAMES, hasMultipleSubGames, type PurchaseLineItem,
} from '@/data/mockData';
import { ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── helpers ── */
function getMatchLabel(matchId: string) {
  const m = MOCK_MATCHES.find(x => x.id === matchId);
  return m ? `${m.code} ${m.teams}` : matchId;
}

function getSubGameName(subGameId: string) {
  return MOCK_SUBGAMES.find(sg => sg.id === subGameId)?.name ?? '—';
}

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

function UnitDrawer({ mode, onClose }: { mode: DrawerMode; onClose: () => void }) {
  const purchase = MOCK_PURCHASES.find(p => p.id === mode.purchaseId);
  const isLineMode = mode.type === 'line';
  const lineItems = isLineMode ? [mode.lineItem] : (purchase?.lines ?? []);

  // For grouped view, track collapsed state
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggleGroup = (id: string) => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

  const title = isLineMode
    ? `Units — PUR-${String(MOCK_PURCHASES.indexOf(purchase!) + 1).padStart(3, '0')} / Line ${lineItems[0].id.split('-').pop()} / ${lineItems[0].categoryLabel}`
    : `Units — PUR-${String(MOCK_PURCHASES.indexOf(purchase!) + 1).padStart(3, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-foreground/30" onClick={onClose} />
      <motion.div
        initial={{ x: 420, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 420, opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-[480px] max-w-full h-full bg-card shadow-xl flex flex-col z-10"
      >
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-xl text-primary">{title}</h3>
              {isLineMode && (
                <p className="font-body text-xs text-muted-foreground mt-1">
                  Sub-Game: {getSubGameName(lineItems[0].subGameId)}
                </p>
              )}
            </div>
            <button onClick={onClose} className="p-1 rounded-md hover:bg-muted"><X size={18} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {lineItems.map(li => (
            <UnitLineGroup
              key={li.id}
              li={li}
              isLineMode={isLineMode}
              isGroupCollapsed={!!collapsed[li.id]}
              onToggle={() => toggleGroup(li.id)}
            />
          ))}
        </div>

        <div className="px-6 py-3 border-t border-border font-body text-xs text-muted-foreground">
          Purchase: {purchase?.id} &nbsp;|&nbsp; Vendor: {purchase?.vendor} &nbsp;|&nbsp; Contract: {purchase?.contract}
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

  const toggleExpand = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  // Filter purchases
  const purchases = MOCK_PURCHASES.filter(p => {
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

  const selectClass = "h-[38px] px-3 rounded-lg font-body text-sm bg-card outline-none border border-border focus:ring-1 focus:ring-accent";

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-[26px] text-primary">Purchases</h1>
        <RoleGuard roles={['super_admin', 'ops_manager', 'sr_operator', 'operator']}>
          <button onClick={() => navigate('/purchases/new')} className="px-4 py-2 rounded-lg font-body text-sm font-medium transition-opacity hover:opacity-90 bg-primary text-accent">
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
          <option>Grandstand A</option><option>Paddock Club</option>
        </select>
        <select className={selectClass} value={vendorFilter} onChange={e => setVendorFilter(e.target.value)}>
          <option value="all">All Vendors</option>
          <option>poxami</option><option>viagogo</option>
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

                return (
                  <Fragment key={p.id}>
                    {/* Parent row */}
                    <tr
                      className="transition-colors cursor-pointer border-b border-border"
                      style={{ backgroundColor: pi % 2 === 1 ? 'hsl(var(--muted))' : 'hsl(var(--card))' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#EEF3FF')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = pi % 2 === 1 ? 'hsl(220 14% 96%)' : 'white')}
                      onClick={() => toggleExpand(p.id)}
                    >
                      <td className="px-4 py-3 w-8">
                        <ChevronRight
                          size={16}
                          className={`text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{purLabel}</td>
                      <td className="px-4 py-3 font-body text-[13px] text-foreground">{p.date}</td>
                      <td className="px-4 py-3 font-body text-[13px] text-foreground">{matchLabel}</td>
                      <td className="px-4 py-3 font-body text-[13px] text-foreground">{p.vendor}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{p.contract}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-muted font-body text-[11px] font-medium text-foreground">
                          {p.lines.length} lines
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] text-foreground">{p.totalQty}</td>
                      <td className="px-4 py-3 font-mono text-[13px] font-medium text-foreground">AED {p.totalValue.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-success/10 text-success">{p.status}</span>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <button className="font-body text-xs text-primary hover:underline">Edit</button>
                          <button
                            onClick={() => setDrawerMode({ type: 'purchase', purchaseId: p.id })}
                            className="font-body text-xs text-primary hover:underline"
                          >
                            View Units
                          </button>
                          <button className="font-body text-xs text-destructive hover:underline">Cancel</button>
                        </div>
                      </td>
                    </tr>

                    {/* Line item sub-rows */}
                    {isExpanded && p.lines.map((li, liIdx) => {
                      const stats = lineUnitStats(li.id);
                      const allocPct = stats.total > 0 ? (stats.allocated / stats.total) * 100 : 0;
                      const sgName = isMultiSg ? getSubGameName(li.subGameId) : '—';

                      return (
                        <tr
                          key={li.id}
                          className="bg-muted/50 border-b border-border/50"
                        >
                          <td className="px-4 py-2.5">
                            {/* connecting line */}
                            <div className="flex items-center justify-center">
                              <div className="w-px h-full bg-border" />
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-primary/10 text-primary">
                              L{liIdx + 1}
                            </span>
                          </td>
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
                              <span className="font-body text-[11px] text-muted-foreground whitespace-nowrap">
                                {stats.allocated}/{stats.total} — {stats.total > 0 ? Math.round(allocPct) : 0}% allocated
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5" colSpan={2}>
                            <button
                              onClick={() => setDrawerMode({ type: 'line', purchaseId: p.id, lineItem: li })}
                              className="px-3 py-1 rounded-lg font-body text-[11px] font-medium bg-primary text-primary-foreground hover:opacity-90"
                            >
                              View L{liIdx + 1} Units
                            </button>
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
    </div>
  );
}

// Need Fragment import
import { Fragment } from 'react';
