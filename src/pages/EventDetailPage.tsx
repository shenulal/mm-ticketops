import { useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAppContext, type EventDef, type MatchDef, type SubGameDef, type SubGameCategory } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { MOCK_UNITS, MOCK_PURCHASES, MOCK_SALES, MOCK_DIST_ROWS, MOCK_SALE_LINE_ITEMS, MOCK_PURCHASE_LINE_ITEMS } from '@/data/mockData';
import RoleGuard from '@/components/RoleGuard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Settings, Plus, X, GripVertical, Calendar, MapPin,
  Users, Shield, FileText, Eye, Pencil, Trash2, ChevronDown, ArrowRight,
  Clock, TrendingUp, Package, Truck, AlertCircle, CheckCircle2, Zap,
  Building2, CreditCard, Globe2,
} from 'lucide-react';

/* ═════════════════════════════════════════════
   LIFECYCLE CONSTANTS
   ═════════════════════════════════════════════ */

const EVENT_STATES: EventDef['status'][] = ['DRAFT', 'PLANNING', 'BUYING', 'SELLING', 'ALLOCATING', 'DISPATCHING', 'CLOSED', 'ARCHIVED'];

const STATE_LABELS: Record<string, string> = {
  DRAFT: 'Draft', PLANNING: 'Planning', BUYING: 'Buying', SELLING: 'Selling',
  ALLOCATING: 'Allocating', DISPATCHING: 'Dispatching', CLOSED: 'Closed', ARCHIVED: 'Archived',
};

const STATE_COLORS: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  PLANNING: 'bg-blue-100 text-blue-700',
  BUYING: 'bg-indigo-100 text-indigo-700',
  SELLING: 'bg-accent/20 text-accent',
  ALLOCATING: 'bg-amber-100 text-amber-700',
  DISPATCHING: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-emerald-200 text-emerald-800',
  ARCHIVED: 'bg-muted text-muted-foreground',
};

interface TransitionRule {
  from: string;
  to: string;
  validate: (event: EventDef, ctx: any) => { ok: boolean; reason?: string };
  roles: string[];
}

const TRANSITION_RULES: TransitionRule[] = [
  {
    from: 'DRAFT', to: 'PLANNING',
    roles: ['super_admin', 'ops_manager'],
    validate: (e) => {
      if (!e.name || !e.startDate || !e.endDate || !e.defaultCurrency) return { ok: false, reason: 'Name, dates, and base currency are required' };
      return { ok: true };
    },
  },
  {
    from: 'PLANNING', to: 'BUYING',
    roles: ['super_admin', 'ops_manager'],
    validate: (e, ctx) => {
      const vendors = ctx.vendorEventBridges.filter((b: any) => b.eventId === e.id);
      if (vendors.length === 0) return { ok: false, reason: 'At least 1 vendor must be assigned' };
      const hasCats = e.matches.some((m: MatchDef) => m.subGames.some((sg: SubGameDef) => sg.categories.length > 0));
      if (!hasCats) return { ok: false, reason: 'At least 1 category must be defined' };
      return { ok: true };
    },
  },
  {
    from: 'BUYING', to: 'SELLING',
    roles: ['super_admin', 'ops_manager'],
    validate: (e) => {
      const purchases = MOCK_PURCHASES.filter(p => {
        const m = e.matches.find((mm: MatchDef) => mm.id === p.matchId);
        return !!m;
      });
      if (purchases.length === 0) return { ok: false, reason: 'At least 1 purchase is required' };
      return { ok: true };
    },
  },
  {
    from: 'SELLING', to: 'ALLOCATING',
    roles: ['super_admin', 'ops_manager'],
    validate: (e) => {
      const sales = MOCK_SALES.filter(s => {
        const m = e.matches.find((mm: MatchDef) => mm.id === s.matchId);
        return !!m;
      });
      if (sales.length === 0) return { ok: false, reason: 'At least 1 sale is required' };
      return { ok: true };
    },
  },
  {
    from: 'ALLOCATING', to: 'DISPATCHING',
    roles: ['super_admin', 'ops_manager'],
    validate: () => ({ ok: true }),
  },
  {
    from: 'DISPATCHING', to: 'CLOSED',
    roles: ['super_admin', 'ops_manager'],
    validate: (e) => {
      const matchIds = e.matches.map((m: MatchDef) => m.id);
      const rows = MOCK_DIST_ROWS.filter(r => {
        const sale = MOCK_SALES.find(s => s.id === r.saleId);
        return sale && matchIds.includes(sale.matchId);
      });
      const issues = rows.filter(r => r.dispatchStatus === 'ISSUE');
      if (issues.length > 0) return { ok: false, reason: `${issues.length} tickets flagged ISSUE` };
      return { ok: true };
    },
  },
  {
    from: 'CLOSED', to: 'ARCHIVED',
    roles: ['super_admin'],
    validate: () => ({ ok: true }),
  },
];

/* ═════════════════════════════════════════════
   INVENTORY HELPERS
   ═════════════════════════════════════════════ */

function getTotalPurchased(subGameId: string, categoryId: string) {
  return MOCK_UNITS.filter(u => u.subGameId === subGameId && u.categoryId === categoryId).length;
}
function getSold(subGameId: string, categoryId: string) {
  return MOCK_UNITS.filter(u => u.subGameId === subGameId && u.categoryId === categoryId && u.status === 'ALLOCATED').length;
}
function getAvailable(subGameId: string, categoryId: string) {
  return MOCK_UNITS.filter(u => u.subGameId === subGameId && u.categoryId === categoryId && u.status === 'AVAILABLE').length;
}

/* ═════════════════════════════════════════════
   LIFECYCLE STEPPER
   ═════════════════════════════════════════════ */

function LifecycleStepper({ currentStatus }: { currentStatus: EventDef['status'] }) {
  const currentIdx = EVENT_STATES.indexOf(currentStatus);
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {EVENT_STATES.map((state, i) => {
        const isPast = i < currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={state} className="flex items-center gap-1 flex-shrink-0">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-body font-medium transition-all ${
              isCurrent ? STATE_COLORS[state] + ' ring-2 ring-offset-1 ring-primary/30' :
              isPast ? 'bg-emerald-50 text-emerald-600' :
              'bg-muted/50 text-muted-foreground/50'
            }`}>
              {isPast && <CheckCircle2 size={12} />}
              {isCurrent && <Zap size={12} />}
              {STATE_LABELS[state]}
            </div>
            {i < EVENT_STATES.length - 1 && (
              <ArrowRight size={12} className={isPast ? 'text-emerald-400' : 'text-muted-foreground/30'} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═════════════════════════════════════════════
   NEXT STEP WIDGET
   ═════════════════════════════════════════════ */

function NextStepWidget({ event, ctx }: { event: EventDef; ctx: any }) {
  const vendorCount = ctx.vendorEventBridges.filter((b: any) => b.eventId === event.id).length;
  const matchIds = event.matches.map((m: MatchDef) => m.id);
  const hasCats = event.matches.some((m: MatchDef) => m.subGames.some((sg: SubGameDef) => sg.categories.length > 0));
  const purchases = MOCK_PURCHASES.filter(p => matchIds.includes(p.matchId));
  const sales = MOCK_SALES.filter(s => matchIds.includes(s.matchId));
  const distRows = MOCK_DIST_ROWS.filter(r => {
    const sale = MOCK_SALES.find(s => s.id === r.saleId);
    return sale && matchIds.includes(sale.matchId);
  });
  const issues = distRows.filter(r => r.dispatchStatus === 'ISSUE');
  const notSent = distRows.filter(r => r.dispatchStatus === 'NOT_SENT');
  const unallocated = MOCK_SALE_LINE_ITEMS.filter(l => l.status === 'UNALLOCATED');

  const hints: { icon: React.ReactNode; text: string; severity: 'info' | 'warn' | 'success' }[] = [];

  switch (event.status) {
    case 'DRAFT':
      hints.push({ icon: <FileText size={14} />, text: 'Fill in event name, dates, venue & currency to move to Planning', severity: 'info' });
      break;
    case 'PLANNING':
      if (event.matches.length === 0) hints.push({ icon: <Calendar size={14} />, text: 'Create your first match', severity: 'warn' });
      if (vendorCount === 0) hints.push({ icon: <Building2 size={14} />, text: 'Assign at least one vendor', severity: 'warn' });
      if (!hasCats) hints.push({ icon: <Package size={14} />, text: 'Define categories for your matches', severity: 'warn' });
      if (event.matches.length > 0 && vendorCount > 0 && hasCats) hints.push({ icon: <CheckCircle2 size={14} />, text: 'Ready to move to Buying', severity: 'success' });
      break;
    case 'BUYING':
      if (purchases.length === 0) hints.push({ icon: <Package size={14} />, text: 'Record your first purchase', severity: 'warn' });
      else {
        const noStock = event.matches.filter(m => !m.subGames.some(sg => sg.categories.some(c => getTotalPurchased(sg.id, c.id) > 0)));
        if (noStock.length > 0) hints.push({ icon: <AlertCircle size={14} />, text: `${noStock.length} match${noStock.length > 1 ? 'es' : ''} still have no stock`, severity: 'warn' });
      }
      break;
    case 'SELLING':
      if (unallocated.length > 0) hints.push({ icon: <AlertCircle size={14} />, text: `${unallocated.length} sale lines unallocated`, severity: 'warn' });
      break;
    case 'ALLOCATING':
      if (notSent.length > 0) hints.push({ icon: <Truck size={14} />, text: `${notSent.length} tickets awaiting dispatch`, severity: 'info' });
      break;
    case 'DISPATCHING':
      if (issues.length > 0) hints.push({ icon: <AlertCircle size={14} />, text: `${issues.length} ticket${issues.length > 1 ? 's' : ''} flagged ISSUE`, severity: 'warn' });
      else hints.push({ icon: <CheckCircle2 size={14} />, text: 'All dispatches clear — ready to close', severity: 'success' });
      break;
    case 'CLOSED':
      hints.push({ icon: <FileText size={14} />, text: 'Run reconciliation report', severity: 'info' });
      break;
    default: break;
  }

  if (hints.length === 0) return null;

  return (
    <div className="mb-5 space-y-2">
      {hints.map((h, i) => (
        <div key={i} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border font-body text-sm ${
          h.severity === 'warn' ? 'bg-amber-50 border-amber-200 text-amber-800' :
          h.severity === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          {h.icon}
          {h.text}
        </div>
      ))}
    </div>
  );
}

/* ═════════════════════════════════════════════
   OVERVIEW TAB
   ═════════════════════════════════════════════ */

function OverviewTab({ event, ctx }: { event: EventDef; ctx: any }) {
  const { currentUser } = useAuth();
  const matchIds = event.matches.map(m => m.id);

  const totalPurchased = MOCK_UNITS.filter(u => matchIds.includes(u.matchId)).length;
  const totalAllocated = MOCK_UNITS.filter(u => matchIds.includes(u.matchId) && u.status === 'ALLOCATED').length;
  const totalDispatched = MOCK_DIST_ROWS.filter(r => {
    const sale = MOCK_SALES.find(s => s.id === r.saleId);
    return sale && matchIds.includes(sale.matchId) && r.dispatchStatus === 'SENT';
  }).length;
  const purchaseCost = MOCK_PURCHASE_LINE_ITEMS.filter(l => {
    const sg = event.matches.flatMap(m => m.subGames).find(sg => sg.id === l.subGameId);
    return !!sg;
  }).reduce((s, l) => s + l.lineTotal, 0);
  const saleRevenue = MOCK_SALE_LINE_ITEMS.filter(l => {
    const sg = event.matches.flatMap(m => m.subGames).find(sg => sg.id === l.subGameId);
    return !!sg;
  }).reduce((s, l) => s + l.lineTotal, 0);
  const totalSold = MOCK_SALE_LINE_ITEMS.filter(l => {
    const sg = event.matches.flatMap(m => m.subGames).find(sg => sg.id === l.subGameId);
    return !!sg;
  }).reduce((s, l) => s + l.qty, 0);
  const pnl = saleRevenue - purchaseCost;

  // Countdown
  const daysToStart = Math.max(0, Math.ceil((new Date(event.startDate).getTime() - Date.now()) / 86400000));

  // Transition logic
  const nextRule = TRANSITION_RULES.find(r => r.from === event.status);
  const canTransition = nextRule && currentUser && nextRule.roles.includes(currentUser.role);
  const transitionResult = nextRule?.validate(event, ctx);

  const handleTransition = () => {
    if (!nextRule || !transitionResult?.ok) return;
    ctx.updateEvent(event.id, { status: nextRule.to as EventDef['status'] });
    toast.success(`Event moved to ${STATE_LABELS[nextRule.to]}`);
  };

  const kpis = [
    { label: 'Purchased', value: totalPurchased, icon: <Package size={16} className="text-primary" /> },
    { label: 'Sold', value: totalSold, icon: <TrendingUp size={16} className="text-accent" /> },
    { label: 'Allocated', value: totalAllocated, icon: <CheckCircle2 size={16} className="text-blue-600" /> },
    { label: 'Dispatched', value: totalDispatched, icon: <Truck size={16} className="text-emerald-600" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Lifecycle stepper */}
      <div className="bg-card border border-border rounded-xl p-4">
        <LifecycleStepper currentStatus={event.status} />
      </div>

      {/* Next steps */}
      <NextStepWidget event={event} ctx={ctx} />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">{k.icon}<span className="font-body text-xs text-muted-foreground">{k.label}</span></div>
            <p className="font-display text-2xl text-foreground">{k.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* P&L + Countdown row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="font-body text-xs text-muted-foreground mb-1">Purchase Cost</p>
          <p className="font-display text-lg text-foreground">{ctx.formatCurrency(purchaseCost)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="font-body text-xs text-muted-foreground mb-1">Sale Revenue</p>
          <p className="font-display text-lg text-foreground">{ctx.formatCurrency(saleRevenue)}</p>
        </div>
        <div className={`bg-card border rounded-xl p-4 ${pnl >= 0 ? 'border-emerald-200' : 'border-destructive/30'}`}>
          <p className="font-body text-xs text-muted-foreground mb-1">P&L</p>
          <p className={`font-display text-lg ${pnl >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
            {pnl >= 0 ? '+' : ''}{ctx.formatCurrency(pnl)}
          </p>
        </div>
      </div>

      {/* Countdown + Transition */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="bg-card border border-border rounded-xl px-5 py-3 flex items-center gap-3">
          <Clock size={18} className="text-accent" />
          <div>
            <p className="font-body text-xs text-muted-foreground">Countdown to start</p>
            <p className="font-display text-xl text-foreground">{daysToStart} days</p>
          </div>
        </div>

        {nextRule && canTransition && (
          <div className="bg-card border border-border rounded-xl px-5 py-3 flex items-center gap-3">
            <div className="flex-1">
              <p className="font-body text-xs text-muted-foreground mb-1">Next transition</p>
              <p className="font-body text-sm font-medium text-foreground">{STATE_LABELS[event.status]} → {STATE_LABELS[nextRule.to]}</p>
              {transitionResult && !transitionResult.ok && (
                <p className="font-body text-xs text-destructive mt-1">{transitionResult.reason}</p>
              )}
            </div>
            <Button size="sm" disabled={!transitionResult?.ok} onClick={handleTransition}>
              Move to {STATE_LABELS[nextRule.to]}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════
   MATCHES TAB (reused from before)
   ═════════════════════════════════════════════ */

function InventoryRow({ cat, subGameId }: { cat: SubGameCategory; subGameId: string }) {
  const total = getTotalPurchased(subGameId, cat.id);
  const sold = getSold(subGameId, cat.id);
  const available = getAvailable(subGameId, cat.id);
  const pct = total > 0 ? (sold / total) * 100 : 0;
  if (total === 0) return null;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="font-body text-xs text-foreground">{cat.displayName}</span>
        <span className="font-body text-xs text-emerald-600">{available} available</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-border">
        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MatchCard({ match, onManageSessions }: { match: MatchDef; onManageSessions: () => void }) {
  const ctx = useAppContext();
  const navigate = useNavigate();
  const isMulti = match.subGames.length > 1;
  const venue = ctx.getVenue(match.venueId);
  const defaultSg = match.subGames.find(sg => sg.sessionType === 'RACE') || match.subGames[match.subGames.length - 1];
  const [activeTabId, setActiveTabId] = useState(defaultSg?.id || '');
  const activeSg = match.subGames.find(sg => sg.id === activeTabId) || match.subGames[0];
  const tabLabels: Record<string, string> = { FP: 'FP', QUALIFYING: 'Qualifying', SPRINT: 'Sprint', RACE: 'Grand Prix', MATCH: 'Match', OTHER: 'Other', SHOW: 'Show', DAY: 'Day' };
  const hasInventory = (sg: SubGameDef) => sg.categories.some(c => getTotalPurchased(sg.id, c.id) > 0);

  // Sell-through bar for this match
  const allCats = match.subGames.flatMap(sg => sg.categories.map(c => ({ sg: sg.id, cat: c.id })));
  const totalPur = allCats.reduce((s, x) => s + getTotalPurchased(x.sg, x.cat), 0);
  const totalSold = allCats.reduce((s, x) => s + getSold(x.sg, x.cat), 0);
  const sellThrough = totalPur > 0 ? Math.round((totalSold / totalPur) * 100) : 0;

  return (
    <div className={`bg-card rounded-xl shadow-sm border border-border overflow-hidden ${isMulti ? 'lg:col-span-2' : ''}`}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-primary text-primary-foreground">{match.code}</span>
          <div className="flex items-center gap-2">
            {totalPur > 0 && (
              <span className="font-body text-[11px] text-muted-foreground">{sellThrough}% sold</span>
            )}
            <span className="font-body text-[13px] text-muted-foreground">{match.date}</span>
          </div>
        </div>
        <h3 className="font-display text-xl mb-1 text-primary">{match.teamsOrDescription}</h3>
        <p className="font-body text-[13px] mb-3 text-muted-foreground">
          <MapPin size={12} className="inline mr-1 -mt-0.5" />
          {venue?.name ?? 'No venue set'}{venue ? `, ${venue.city}` : ''}
        </p>

        {isMulti && activeSg && (
          <>
            <div className="flex gap-1.5 mb-4 flex-wrap">
              {match.subGames.map(sg => (
                <button key={sg.id} onClick={() => setActiveTabId(sg.id)}
                  className={`px-3 py-1.5 rounded-full font-body text-xs font-medium transition-colors ${
                    sg.id === activeTabId ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}>
                  {tabLabels[sg.sessionType] || sg.name}
                </button>
              ))}
            </div>
            <p className="font-body text-[13px] text-muted-foreground mb-3">{activeSg.name} — {activeSg.startTime}</p>
          </>
        )}

        {activeSg && hasInventory(activeSg) ? (
          <div className="space-y-2.5">
            {activeSg.categories.map(cat => <InventoryRow key={cat.id} cat={cat} subGameId={activeSg.id} />)}
          </div>
        ) : activeSg ? (
          <div className="flex flex-col items-center py-6">
            <p className="font-body text-sm mb-3 text-muted-foreground">No inventory{isMulti ? ' for this session' : ' yet'}</p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/purchases/new')}>+ Add Purchase</Button>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6">
            <p className="font-body text-sm text-muted-foreground">No sessions configured</p>
          </div>
        )}
      </div>

      <div className="border-t border-border px-5 py-3 flex items-center justify-between">
        <RoleGuard roles={['super_admin', 'ops_manager', 'sr_operator']}>
          <button onClick={onManageSessions} className="flex items-center gap-1.5 font-body text-xs text-muted-foreground hover:text-foreground">
            <Settings size={13} /> Manage Sessions
          </button>
        </RoleGuard>
        {activeSg && hasInventory(activeSg) && (
          <button onClick={() => navigate('/distribution')} className="font-body text-sm font-medium hover:underline text-primary">
            View Inventory →
          </button>
        )}
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════
   CATEGORIES TAB
   ═════════════════════════════════════════════ */

function CategoriesTab({ event }: { event: EventDef }) {
  const allCategories = useMemo(() => {
    const map = new Map<string, { cat: SubGameCategory; matches: string[]; subGames: string[] }>();
    event.matches.forEach(m => {
      m.subGames.forEach(sg => {
        sg.categories.forEach(c => {
          const existing = map.get(c.displayName);
          if (existing) {
            if (!existing.matches.includes(m.code)) existing.matches.push(m.code);
            existing.subGames.push(sg.id);
          } else {
            map.set(c.displayName, { cat: c, matches: [m.code], subGames: [sg.id] });
          }
        });
      });
    });
    return Array.from(map.values()).sort((a, b) => a.cat.level - b.cat.level);
  }, [event]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-body text-sm font-semibold text-foreground">Event Categories ({allCategories.length})</h3>
          <p className="font-body text-[12px] text-muted-foreground mt-0.5">Categories are defined per match session. This view shows all unique categories across the event.</p>
        </div>
      </div>
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-[13px] font-body">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Rank</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Category</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Used In</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Total Stock</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Sold</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Available</th>
            </tr>
          </thead>
          <tbody>
            {allCategories.map(({ cat, matches, subGames }) => {
              const stock = subGames.reduce((s, sgId) => s + getTotalPurchased(sgId, cat.id), 0);
              const sold = subGames.reduce((s, sgId) => s + getSold(sgId, cat.id), 0);
              const avail = subGames.reduce((s, sgId) => s + getAvailable(sgId, cat.id), 0);
              return (
                <tr key={cat.id + matches.join()} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3"><Badge variant="outline" className="text-[10px] font-mono">L{cat.level}</Badge></td>
                  <td className="px-4 py-3 font-medium text-foreground">{cat.displayName}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {matches.map(m => <span key={m} className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground">{m}</span>)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{stock}</td>
                  <td className="px-4 py-3 text-right font-mono">{sold}</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-600">{avail}</td>
                </tr>
              );
            })}
            {allCategories.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No categories defined yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════
   VENDORS TAB (preserved from before)
   ═════════════════════════════════════════════ */

function VendorTab({ event }: { event: EventDef }) {
  const ctx = useAppContext();
  const bridges = ctx.vendorEventBridges.filter(b => b.eventId === event.id);
  const [assigning, setAssigning] = useState(false);
  const [selVendor, setSelVendor] = useState('');
  const [platformUrl, setPlatformUrl] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [credentialHint, setCredentialHint] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const assignedIds = bridges.map(b => b.vendorId);
  const available = ctx.vendors.filter(v => v.isActive && !assignedIds.includes(v.id));

  const handleAssign = () => {
    if (!selVendor || !platformUrl.trim() || !loginEmail.trim()) { toast.error('Fill in required fields'); return; }
    ctx.setVendorEventBridge({
      id: `veb-${Date.now()}`, vendorId: selVendor, eventId: event.id,
      platformUrl, loginEmail, credentialHint,
      primaryContactForEvent: contact, notes, isActive: true,
    });
    toast.success('Vendor assigned to event');
    setAssigning(false); setSelVendor(''); setPlatformUrl(''); setLoginEmail('');
    setCredentialHint(''); setContact(''); setNotes('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-body text-sm font-semibold text-foreground">Vendors assigned to this event ({bridges.length})</h3>
          <p className="font-body text-[12px] text-muted-foreground mt-0.5">These vendors are available in purchase forms for this event. <Link to="/masters/vendors" className="text-primary underline">Manage all vendors globally →</Link></p>
        </div>
        <RoleGuard roles={['super_admin', 'ops_manager']}>
          <Button size="sm" variant="outline" onClick={() => setAssigning(!assigning)}><Plus size={14} className="mr-1" /> Assign Vendor</Button>
        </RoleGuard>
      </div>

      {assigning && (
        <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
          <p className="font-body text-[13px] font-medium text-foreground">Assign Vendor to Event</p>
          <div>
            <label className="text-[11px] font-body text-muted-foreground">Vendor *</label>
            <Select value={selVendor} onValueChange={setSelVendor}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select vendor..." /></SelectTrigger>
              <SelectContent>{available.map(v => <SelectItem key={v.id} value={v.id}>{v.name} ({v.code})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[11px] font-body text-muted-foreground">Platform URL *</label><Input className="mt-1" value={platformUrl} onChange={e => setPlatformUrl(e.target.value)} placeholder="viagogo.com" /></div>
            <div><label className="text-[11px] font-body text-muted-foreground">Login Email *</label><Input className="mt-1" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} /></div>
          </div>
          <div><label className="text-[11px] font-body text-muted-foreground">Credential Hint</label><Input className="mt-1" value={credentialHint} onChange={e => setCredentialHint(e.target.value)} placeholder="Password format hint" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[11px] font-body text-muted-foreground">Contact for Event</label><Input className="mt-1" value={contact} onChange={e => setContact(e.target.value)} /></div>
            <div><label className="text-[11px] font-body text-muted-foreground">Notes</label><Input className="mt-1" value={notes} onChange={e => setNotes(e.target.value)} /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAssign}>Assign</Button>
            <Button size="sm" variant="ghost" onClick={() => setAssigning(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {bridges.map(b => {
        const vendor = ctx.getVendor(b.vendorId);
        const creds = ctx.getCredentialsForVendor(b.vendorId).filter(c => c.active && (c.eventId === event.id || !c.eventId));
        const isEditing = editingId === b.id;
        const isRemoving = removingId === b.id;
        return (
          <div key={b.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="font-body text-sm font-medium text-foreground">{vendor?.name ?? 'Unknown'}</p>
                <span className="font-mono text-[10px] text-muted-foreground">{vendor?.code}</span>
                <Badge variant="secondary" className="text-[10px]">{creds.length} credential{creds.length !== 1 ? 's' : ''}</Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setEditingId(isEditing ? null : b.id)}><Pencil size={14} /></Button>
                <RoleGuard roles={['super_admin', 'ops_manager']}>
                  <Button variant="ghost" size="sm" onClick={() => setRemovingId(isRemoving ? null : b.id)}><Trash2 size={14} className="text-destructive" /></Button>
                </RoleGuard>
              </div>
            </div>
            <div className="text-[12px] font-body text-muted-foreground space-y-0.5">
              <p>Platform: {b.platformUrl || '—'}</p>
              <p>Login: {b.loginEmail || '—'}</p>
              {b.credentialHint && <p>Hint: {b.credentialHint}</p>}
              {b.primaryContactForEvent && <p>Contact: {b.primaryContactForEvent}</p>}
            </div>
            <p className="text-[10px] font-body text-muted-foreground italic">
              Credential vault → <Link to="/admin/vendor-credentials" className="text-primary underline">Manage credentials</Link>
            </p>

            {isRemoving && (
              <div className="p-2 rounded-lg bg-destructive/5 border border-destructive/20 space-y-2">
                <p className="text-[12px] font-body text-foreground">Remove {vendor?.name} from {event.name}?</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={() => { toast.success('Vendor removed from event'); setRemovingId(null); }}>Remove</Button>
                  <Button size="sm" variant="ghost" onClick={() => setRemovingId(null)}>Cancel</Button>
                </div>
              </div>
            )}

            {isEditing && (
              <VendorBridgeEditForm bridge={b} onDone={() => setEditingId(null)} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function VendorBridgeEditForm({ bridge, onDone }: { bridge: any; onDone: () => void }) {
  const ctx = useAppContext();
  const [form, setForm] = useState({ platformUrl: bridge.platformUrl, loginEmail: bridge.loginEmail, credentialHint: bridge.credentialHint, primaryContactForEvent: bridge.primaryContactForEvent, notes: bridge.notes });
  return (
    <div className="border-t border-border pt-2 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-[11px] font-body text-muted-foreground">Platform URL</label><Input value={form.platformUrl} onChange={e => setForm(f => ({ ...f, platformUrl: e.target.value }))} /></div>
        <div><label className="text-[11px] font-body text-muted-foreground">Login Email</label><Input value={form.loginEmail} onChange={e => setForm(f => ({ ...f, loginEmail: e.target.value }))} /></div>
      </div>
      <div><label className="text-[11px] font-body text-muted-foreground">Credential Hint</label><Input value={form.credentialHint} onChange={e => setForm(f => ({ ...f, credentialHint: e.target.value }))} /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-[11px] font-body text-muted-foreground">Contact</label><Input value={form.primaryContactForEvent} onChange={e => setForm(f => ({ ...f, primaryContactForEvent: e.target.value }))} /></div>
        <div><label className="text-[11px] font-body text-muted-foreground">Notes</label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => { ctx.setVendorEventBridge({ ...bridge, ...form }); toast.success('Updated'); onDone(); }}>Save</Button>
        <Button size="sm" variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════
   CLIENTS TAB
   ═════════════════════════════════════════════ */

function ClientsTab({ event }: { event: EventDef }) {
  const ctx = useAppContext();
  const navigate = useNavigate();
  const eventContracts = ctx.contracts.filter(c => c.eventId === event.id && c.contractType === 'SALE');
  const clientIds = [...new Set(eventContracts.map(c => c.partyId))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-body text-sm font-semibold text-foreground">Clients ({clientIds.length})</h3>
          <p className="font-body text-[12px] text-muted-foreground mt-0.5">Clients with active sale contracts for this event.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => navigate('/masters/contracts')}><Plus size={14} className="mr-1" /> Add Contract</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {clientIds.map(cId => {
          const client = ctx.getClient(cId);
          if (!client) return null;
          const contracts = eventContracts.filter(c => c.partyId === cId);
          return (
            <div key={cId} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-body text-sm font-medium text-foreground">{client.companyName}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{client.code}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">{client.type}</Badge>
              </div>
              <div className="text-[12px] font-body text-muted-foreground space-y-0.5">
                <p><CreditCard size={11} className="inline mr-1" />Credit Limit: {ctx.formatCurrency(client.creditLimit)}</p>
                <p>{client.primaryContactName} · {client.email}</p>
              </div>
              <div className="mt-3 space-y-1">
                {contracts.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-[11px] font-body px-2 py-1.5 rounded bg-muted/50">
                    <span className="font-mono">{c.contractRef}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>{c.status}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {clientIds.length === 0 && (
        <div className="text-center py-10">
          <p className="font-body text-sm text-muted-foreground">No clients with sale contracts for this event yet.</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => navigate('/masters/contracts')}>Create Contract</Button>
        </div>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════
   VENUES TAB
   ═════════════════════════════════════════════ */

function VenuesTab({ event }: { event: EventDef }) {
  const ctx = useAppContext();
  const venueIds = [...new Set(event.matches.map(m => m.venueId).filter(Boolean))];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-body text-sm font-semibold text-foreground">Venues ({venueIds.length})</h3>
        <p className="font-body text-[12px] text-muted-foreground mt-0.5">Venues used by matches in this event.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {venueIds.map(vId => {
          const venue = ctx.getVenue(vId);
          if (!venue) return null;
          const matchesAtVenue = event.matches.filter(m => m.venueId === vId);
          return (
            <div key={vId} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={14} className="text-primary" />
                <p className="font-body text-sm font-medium text-foreground">{venue.name}</p>
              </div>
              <div className="text-[12px] font-body text-muted-foreground space-y-0.5">
                <p>{venue.city}, {venue.country}</p>
                <p>Capacity: {venue.capacity.toLocaleString()}</p>
                <p>Timezone: {venue.timezone}</p>
              </div>
              <div className="mt-3">
                <p className="font-body text-[11px] text-muted-foreground mb-1">{matchesAtVenue.length} match{matchesAtVenue.length !== 1 ? 'es' : ''} here:</p>
                <div className="flex gap-1 flex-wrap">
                  {matchesAtVenue.map(m => (
                    <span key={m.id} className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground">{m.code}</span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {venueIds.length === 0 && (
        <div className="text-center py-10">
          <p className="font-body text-sm text-muted-foreground">No venues mapped yet. Add matches with venues first.</p>
        </div>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════
   SETTINGS TAB
   ═════════════════════════════════════════════ */

function EventSettingsTab({ event }: { event: EventDef }) {
  const ctx = useAppContext();
  const [form, setForm] = useState({
    dispatchBufferHours: event.dispatchBufferHours,
    portalTokenExpiryDays: event.portalTokenExpiryDays,
    allowOversell: event.allowOversell,
    defaultCurrency: event.defaultCurrency,
  });

  const handleSave = () => {
    ctx.updateEvent(event.id, form);
    toast.success('Event settings saved');
  };

  return (
    <div className="space-y-4 max-w-lg">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-body text-xs text-muted-foreground">Dispatch Buffer (hours)</label>
          <Input type="number" value={form.dispatchBufferHours} onChange={e => setForm(f => ({ ...f, dispatchBufferHours: +e.target.value }))} className="mt-1" />
        </div>
        <div>
          <label className="font-body text-xs text-muted-foreground">Portal Token Expiry (days)</label>
          <Input type="number" value={form.portalTokenExpiryDays} onChange={e => setForm(f => ({ ...f, portalTokenExpiryDays: +e.target.value }))} className="mt-1" />
        </div>
      </div>
      <div>
        <label className="font-body text-xs text-muted-foreground">Default Currency</label>
        <Select value={form.defaultCurrency} onValueChange={v => setForm(f => ({ ...f, defaultCurrency: v }))}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{ctx.currencies.filter(c => c.isActive).map(c => <SelectItem key={c.id} value={c.code}>{c.code}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3">
        <label className="font-body text-sm text-foreground">Allow Oversell</label>
        <button onClick={() => setForm(f => ({ ...f, allowOversell: !f.allowOversell }))}
          className={`w-10 h-5 rounded-full transition-colors ${form.allowOversell ? 'bg-accent' : 'bg-muted'}`}>
          <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.allowOversell ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>
      <div>
        <label className="font-body text-xs text-muted-foreground">FX Rates Snapshot</label>
        <div className="mt-2 border border-border rounded-lg overflow-hidden">
          <table className="w-full text-[12px] font-body">
            <thead><tr className="bg-muted/50"><th className="px-3 py-2 text-left text-muted-foreground">Currency</th><th className="px-3 py-2 text-right text-muted-foreground">Rate to AED</th><th className="px-3 py-2 text-right text-muted-foreground">Last Updated</th></tr></thead>
            <tbody>
              {ctx.currencies.filter(c => c.isActive).map(c => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono">{c.code} {c.symbol}</td>
                  <td className="px-3 py-2 text-right font-mono">{c.exchangeRateToAed}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{c.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <label className="font-body text-xs text-muted-foreground">Event Timezone</label>
        <p className="font-body text-sm text-foreground mt-1">
          {ctx.getVenue(event.matches[0]?.venueId)?.timezone ?? ctx.organisation.timezone}
        </p>
      </div>
      <Button onClick={handleSave}>Save Event Settings</Button>
    </div>
  );
}

/* ═════════════════════════════════════════════
   MANAGE SESSIONS DRAWER
   ═════════════════════════════════════════════ */

const SESSION_TYPES: SubGameDef['sessionType'][] = ['MATCH', 'QUALIFYING', 'SPRINT', 'FP', 'RACE', 'SHOW', 'DAY', 'OTHER'];

function ManageSessionsDrawer({ match, open, onClose }: { match: MatchDef | null; open: boolean; onClose: () => void }) {
  const ctx = useAppContext();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<SubGameDef['sessionType']>('MATCH');
  const [newTime, setNewTime] = useState('');
  const [newDuration, setNewDuration] = useState('120');
  const [newCats, setNewCats] = useState<{ name: string; order: number }[]>([{ name: '', order: 1 }]);
  const [editCatSg, setEditCatSg] = useState<string | null>(null);
  const [addingCatName, setAddingCatName] = useState('');

  const handleAddSession = () => {
    if (!match || !newName.trim() || !newTime.trim()) return;
    const validCats = newCats.filter(c => c.name.trim());
    ctx.addSubGameToMatch(match.id, {
      matchId: match.id, name: newName, sessionType: newType,
      startTime: newTime, durationMinutes: parseInt(newDuration) || 120,
      isDefault: match.subGames.length === 0,
      categories: validCats.map((c) => ({
        id: '', displayName: c.name, label: c.name, level: c.order,
        description: '', seatSectionHint: '', isActive: true,
      })),
    });
    toast.success(`Session "${newName}" added`);
    setAdding(false);
    setNewName(''); setNewTime(''); setNewCats([{ name: '', order: 1 }]);
  };

  const handleAddCat = (sgId: string) => {
    if (!addingCatName.trim()) return;
    const sg = match?.subGames.find(s => s.id === sgId);
    const nextLevel = (sg?.categories.length || 0) + 1;
    ctx.addCategoryToSubGame(sgId, {
      displayName: addingCatName, label: addingCatName, level: nextLevel,
      description: '', seatSectionHint: '', isActive: true,
    });
    toast.success(`Category "${addingCatName}" added`);
    setAddingCatName('');
    setEditCatSg(null);
  };

  return (
    <AnimatePresence>
      {open && match && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
          <motion.div initial={{ x: 480 }} animate={{ x: 0 }} exit={{ x: 480 }}
            transition={{ duration: 0.25 }} className="fixed top-0 right-0 h-full w-full max-w-[480px] bg-card border-l border-border shadow-xl z-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-xl text-primary">Sessions — {match.code}</h2>
                  <p className="font-body text-sm text-muted-foreground">{match.teamsOrDescription}</p>
                </div>
                <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X size={20} /></button>
              </div>

              <div className="space-y-3 mb-6">
                {match.subGames.map(sg => (
                  <div key={sg.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-body text-sm font-medium text-foreground">{sg.name}</span>
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-muted text-muted-foreground">{sg.sessionType}</span>
                    </div>
                    <p className="font-body text-xs text-muted-foreground">{sg.startTime} · {sg.durationMinutes}min</p>
                    <div className="mt-3 space-y-1">
                      {sg.categories.sort((a, b) => a.level - b.level).map(cat => (
                        <div key={cat.id} className="flex items-center gap-2 py-1 px-2 rounded bg-muted/50">
                          <GripVertical size={12} className="text-muted-foreground" />
                          <Badge variant="outline" className="text-[10px] font-mono">L{cat.level}</Badge>
                          <span className="font-body text-xs text-foreground flex-1">{cat.displayName}</span>
                          <button className={`text-xs ${cat.isActive ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                            {cat.isActive ? '●' : '○'}
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => { setEditCatSg(editCatSg === sg.id ? null : sg.id); }}
                        className="font-body text-xs text-accent hover:underline">+ Add Category</button>
                    </div>
                    {editCatSg === sg.id && (
                      <div className="flex gap-2 mt-2">
                        <Input value={addingCatName} onChange={e => setAddingCatName(e.target.value)}
                          placeholder="Category name" className="h-8 text-xs flex-1" />
                        <Button size="sm" className="h-8 text-xs" onClick={() => handleAddCat(sg.id)}>Add</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {adding ? (
                <div className="border border-border rounded-lg p-4 space-y-3">
                  <h3 className="font-body text-sm font-semibold text-foreground">New Session</h3>
                  <div>
                    <label className="font-body text-xs text-muted-foreground">Session Name *</label>
                    <Input value={newName} onChange={e => setNewName(e.target.value)} className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-body text-xs text-muted-foreground">Type</label>
                      <Select value={newType} onValueChange={v => setNewType(v as SubGameDef['sessionType'])}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{SESSION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="font-body text-xs text-muted-foreground">Duration (min)</label>
                      <Input type="number" value={newDuration} onChange={e => setNewDuration(e.target.value)} className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="font-body text-xs text-muted-foreground">Date / Time *</label>
                    <Input value={newTime} onChange={e => setNewTime(e.target.value)} placeholder="e.g. 22 Sep 2026 14:00" className="mt-1" />
                  </div>
                  <div>
                    <label className="font-body text-xs text-muted-foreground mb-2 block">Categories</label>
                    {newCats.map((cat, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <Input value={cat.name} onChange={e => { const c = [...newCats]; c[i].name = e.target.value; setNewCats(c); }}
                          placeholder="Category name *" className="flex-1 h-8 text-xs" />
                        <Input type="number" value={cat.order} onChange={e => { const c = [...newCats]; c[i].order = +e.target.value; setNewCats(c); }}
                          className="w-16 h-8 text-xs" />
                        {newCats.length > 1 && (
                          <button onClick={() => setNewCats(newCats.filter((_, j) => j !== i))} className="text-destructive text-sm">×</button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => setNewCats([...newCats, { name: '', order: newCats.length + 1 }])}
                      className="font-body text-xs text-accent hover:underline">+ Add Category</button>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={handleAddSession}>Save Session</Button>
                    <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAdding(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border font-body text-sm text-muted-foreground hover:bg-muted w-full justify-center">
                  <Plus size={14} /> Add Session
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═════════════════════════════════════════════
   ADD MATCH MODAL
   ═════════════════════════════════════════════ */

function AddMatchModal({ eventId, open, onClose }: { eventId: string; open: boolean; onClose: () => void }) {
  const ctx = useAppContext();
  const event = ctx.getEvent(eventId);
  const [form, setForm] = useState({
    code: '', teamsOrDescription: '', matchDate: '', matchTime: '',
    venueId: '', groupStage: '',
  });

  const deadline = useMemo(() => {
    if (!form.matchDate || !form.matchTime || !event) return '';
    const dt = new Date(`${form.matchDate}T${form.matchTime}`);
    dt.setHours(dt.getHours() - event.dispatchBufferHours);
    return dt.toISOString().slice(0, 16).replace('T', ' ');
  }, [form.matchDate, form.matchTime, event]);

  const handleSave = () => {
    if (!form.code.trim() || !form.teamsOrDescription.trim() || !form.matchDate || !form.matchTime) {
      toast.error('Fill required fields'); return;
    }
    const venue = ctx.getVenue(form.venueId);
    ctx.addMatchToEvent(eventId, {
      eventId, code: form.code, teamsOrDescription: form.teamsOrDescription,
      teams: form.teamsOrDescription, matchDate: form.matchDate, matchTime: form.matchTime,
      venueId: form.venueId, venue: venue?.name || '', city: venue?.city || '',
      date: `${form.matchDate} ${form.matchTime}`,
      groupStage: form.groupStage, dispatchDeadline: deadline, isActive: true,
    });
    toast.success(`Match ${form.code} added`);
    onClose();
    setForm({ code: '', teamsOrDescription: '', matchDate: '', matchTime: '', venueId: '', groupStage: '' });
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary">Add Match</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-muted-foreground">Match Code *</label>
              <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="mt-1 font-mono" placeholder="M04" />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground">Group / Stage</label>
              <Input value={form.groupStage} onChange={e => setForm(f => ({ ...f, groupStage: e.target.value }))} className="mt-1" placeholder="Group A" />
            </div>
          </div>
          <div>
            <label className="font-body text-xs text-muted-foreground">Teams / Description *</label>
            <Input value={form.teamsOrDescription} onChange={e => setForm(f => ({ ...f, teamsOrDescription: e.target.value }))} className="mt-1" placeholder="GER v JPN" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-muted-foreground">Date *</label>
              <Input type="date" value={form.matchDate} onChange={e => setForm(f => ({ ...f, matchDate: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground">Time *</label>
              <Input type="time" value={form.matchTime} onChange={e => setForm(f => ({ ...f, matchTime: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <div>
            <label className="font-body text-xs text-muted-foreground">Venue *</label>
            <Select value={form.venueId} onValueChange={v => setForm(f => ({ ...f, venueId: v }))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select venue..." /></SelectTrigger>
              <SelectContent>{ctx.venues.filter(v => v.isActive).map(v => <SelectItem key={v.id} value={v.id}>{v.name}, {v.city}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {deadline && (
            <p className="font-body text-xs text-muted-foreground bg-muted p-2 rounded">
              Dispatch deadline (auto): <strong>{deadline}</strong>
            </p>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Add Match</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═════════════════════════════════════════════
   MAIN PAGE
   ═════════════════════════════════════════════ */

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ctx = useAppContext();
  const { currentUser } = useAuth();

  const [drawerMatch, setDrawerMatch] = useState<string | null>(null);
  const [showAddMatch, setShowAddMatch] = useState(false);

  const event = ctx.events.find(e => e.id === id || e.code.toLowerCase().replace(/[^a-z0-9]/g, '-') === id);

  if (!event) return <div className="p-10 text-center font-body text-muted-foreground">Event not found</div>;

  const matchObj = drawerMatch ? event.matches.find(m => m.id === drawerMatch) : null;
  const vendorCount = ctx.vendorEventBridges.filter(b => b.eventId === event.id).length;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 font-body text-sm text-muted-foreground">
        <Link to="/events" className="hover:underline text-accent">Events</Link>
        <ChevronRight size={14} />
        <span>{event.name}</span>
      </div>

      {/* Event header */}
      <div className="rounded-2xl p-6 mb-6 bg-primary">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-[28px] text-primary-foreground">{event.name}</h1>
            <p className="font-mono text-xs mt-1 text-accent">{event.code}</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className={`px-3 py-1 rounded-full font-body text-xs font-medium ${STATE_COLORS[event.status]}`}>{STATE_LABELS[event.status]}</span>
              <span className="px-3 py-1 rounded-full font-body text-xs bg-primary-foreground/10 text-primary-foreground/80">{event.eventType.replace(/_/g, ' ')}</span>
              <span className="px-3 py-1 rounded-full font-body text-xs bg-primary-foreground/10 text-primary-foreground/80">{event.matches.length} Matches</span>
              <span className="px-3 py-1 rounded-full font-body text-xs bg-primary-foreground/10 text-primary-foreground/80">{vendorCount} Vendors</span>
              <span className="px-3 py-1 rounded-full font-body text-xs bg-primary-foreground/10 text-primary-foreground/80">{event.defaultCurrency}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs — 7 tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="venues">Venues</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab event={event} ctx={ctx} />
        </TabsContent>

        <TabsContent value="matches">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-body text-sm font-semibold text-foreground">{event.matches.length} matches</h2>
            <RoleGuard roles={['super_admin', 'ops_manager', 'sr_operator']}>
              <Button size="sm" onClick={() => setShowAddMatch(true)}><Plus size={14} className="mr-1" /> Add Match</Button>
            </RoleGuard>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {event.matches.map(m => (
              <MatchCard key={m.id} match={m} onManageSessions={() => setDrawerMatch(m.id)} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <CategoriesTab event={event} />
        </TabsContent>

        <TabsContent value="vendors">
          <VendorTab event={event} />
        </TabsContent>

        <TabsContent value="clients">
          <ClientsTab event={event} />
        </TabsContent>

        <TabsContent value="venues">
          <VenuesTab event={event} />
        </TabsContent>

        <TabsContent value="settings">
          <EventSettingsTab event={event} />
        </TabsContent>
      </Tabs>

      {/* Drawers & Modals */}
      <ManageSessionsDrawer match={matchObj ?? null} open={!!drawerMatch} onClose={() => setDrawerMatch(null)} />
      <AddMatchModal eventId={event.id} open={showAddMatch} onClose={() => setShowAddMatch(false)} />
    </div>
  );
}
