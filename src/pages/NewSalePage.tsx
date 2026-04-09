import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MOCK_MATCHES, MOCK_SUBGAMES, getSubGamesForMatch, hasMultipleSubGames,
  getCategoriesForSubGame, getInventoryAvailable, type SubGame, type Category,
} from '@/data/mockData';
import { ChevronRight, Lock, CheckCircle, AlertTriangle, Loader2, CalendarIcon, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { motion, AnimatePresence } from 'framer-motion';

const CLIENTS = [
  { value: 'Roadtrips', contract: '2025-10885' },
  { value: 'Blend Group', contract: '2025-20001' },
  { value: 'One2Travel', contract: '2025-30002' },
  { value: 'Al Habtoor', contract: '' },
];

interface LineItem {
  id: string;
  subGameId: string;
  categoryId: string;
  qty: string;
  price: string;
}

function makeId() { return `li-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

/* ── Inventory indicator per line ── */
function InventoryIndicator({ subGameId, categoryId, qty }: { subGameId: string; categoryId: string; qty: number }) {
  if (!subGameId || !categoryId) {
    return (
      <div className="rounded-lg p-3 border border-border bg-muted">
        <p className="font-body text-xs text-muted-foreground">Select sub-game and category to check stock</p>
      </div>
    );
  }

  const available = getInventoryAvailable(subGameId, categoryId);
  const catLabel = MOCK_SUBGAMES.find(sg => sg.id === subGameId)?.categories.find(c => c.id === categoryId)?.label ?? categoryId;
  const remaining = available - qty;
  const isOversell = qty > 0 && qty > available;
  const isClose = qty > 0 && !isOversell && remaining <= 5;

  if (qty === 0) {
    return (
      <div className="rounded-lg p-3 border border-border bg-muted">
        <p className="font-body text-xs text-muted-foreground">{available} {catLabel} units available — enter quantity to check</p>
      </div>
    );
  }

  if (isOversell) {
    return (
      <div className="rounded-lg p-3 border border-destructive bg-destructive/10">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-destructive shrink-0" />
          <p className="font-body text-xs font-bold text-destructive">
            OVERSELL: Only {available} {catLabel} units available · this line will exceed by {qty - available}
          </p>
        </div>
        <p className="font-body text-xs text-destructive/80 mt-1">A manager approval request will be raised for this line specifically.</p>
      </div>
    );
  }

  if (isClose) {
    return (
      <div className="rounded-lg p-3 border border-warning bg-warning/10">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-warning shrink-0" />
          <p className="font-body text-xs font-bold" style={{ color: '#92400E' }}>
            {available} units available · close to limit · {remaining} will remain
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg p-3 border border-success bg-success/10">
      <div className="flex items-center gap-2">
        <CheckCircle size={14} className="text-success shrink-0" />
        <p className="font-body text-xs font-bold" style={{ color: '#065F46' }}>
          {available} {catLabel} units available · {remaining} will remain after this sale
        </p>
      </div>
      <div className="w-full h-1.5 rounded-full bg-success/20 mt-2">
        <div className="h-1.5 rounded-full bg-success" style={{ width: `${Math.min((qty / available) * 100, 100)}%` }} />
      </div>
    </div>
  );
}

/* ── Line Item Card ── */
function LineItemCard({
  line, index, matchId, onUpdate, onRemove, canRemove, errors,
}: {
  line: LineItem; index: number; matchId: string;
  onUpdate: (id: string, patch: Partial<LineItem>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
  errors: Record<string, boolean>;
}) {
  const isMultiSg = hasMultipleSubGames(matchId);
  const subGames = getSubGamesForMatch(matchId);
  const defaultSgId = !isMultiSg && subGames.length === 1 ? subGames[0].id : line.subGameId;
  const effectiveSgId = isMultiSg ? line.subGameId : defaultSgId;
  const categories = effectiveSgId ? getCategoriesForSubGame(effectiveSgId) : [];

  // Auto-set subGameId for single sub-game matches
  if (!isMultiSg && subGames.length === 1 && line.subGameId !== subGames[0].id) {
    onUpdate(line.id, { subGameId: subGames[0].id });
  }

  const qty = parseInt(line.qty) || 0;
  const price = parseFloat(line.price) || 0;
  const lineTotal = qty * price;

  const inputCls = (field: string) =>
    `w-full h-10 px-3 rounded-lg font-body text-sm outline-none transition-all border ${
      errors[`${line.id}-${field}`] ? 'border-2 border-destructive' : 'border-border focus:ring-1 focus:ring-accent'
    } bg-card`;

  return (
    <div className="border border-border rounded-xl p-5 relative">
      <div className="flex items-center justify-between mb-4">
        <span className="font-body text-sm font-semibold text-foreground">Line {index + 1}</span>
        {canRemove && (
          <button onClick={() => onRemove(line.id)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Row 1: Sub-game + Category */}
      <div className={`grid gap-4 mb-4 ${isMultiSg ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {isMultiSg && (
          <div>
            <label className="block font-body text-xs font-medium text-foreground mb-1.5">Sub-Game *</label>
            <select
              value={line.subGameId}
              onChange={e => onUpdate(line.id, { subGameId: e.target.value, categoryId: '' })}
              className={inputCls('subGameId')}
            >
              <option value="">Select session</option>
              {subGames.map(sg => <option key={sg.id} value={sg.id}>{sg.name}</option>)}
            </select>
            {errors[`${line.id}-subGameId`] && <p className="font-body text-xs mt-1 text-destructive">Required</p>}
          </div>
        )}
        <div>
          <label className="block font-body text-xs font-medium text-foreground mb-1.5">Category *</label>
          <select
            value={line.categoryId}
            onChange={e => onUpdate(line.id, { categoryId: e.target.value })}
            className={inputCls('categoryId')}
            disabled={!effectiveSgId}
          >
            <option value="">Select category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          {errors[`${line.id}-categoryId`] && <p className="font-body text-xs mt-1 text-destructive">Required</p>}
        </div>
      </div>

      {/* Row 2: Qty + Price + Total */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block font-body text-xs font-medium text-foreground mb-1.5">Quantity *</label>
          <input type="number" min={1} value={line.qty} onChange={e => onUpdate(line.id, { qty: e.target.value })}
            placeholder="0" className={inputCls('qty')} />
          {errors[`${line.id}-qty`] && <p className="font-body text-xs mt-1 text-destructive">Required</p>}
        </div>
        <div>
          <label className="block font-body text-xs font-medium text-foreground mb-1.5">Price per Ticket (AED)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-xs text-muted-foreground">AED</span>
            <input type="number" min={0} step={0.01} value={line.price} onChange={e => onUpdate(line.id, { price: e.target.value })}
              placeholder="0.00" className={cn(inputCls('price'), 'pl-11')} />
          </div>
        </div>
        <div>
          <label className="block font-body text-xs font-medium text-foreground mb-1.5">Line Total</label>
          <div className="h-10 px-3 rounded-lg bg-muted border border-border flex items-center font-mono text-sm text-foreground">
            AED {lineTotal.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Row 3: Inventory indicator */}
      <InventoryIndicator subGameId={effectiveSgId} categoryId={line.categoryId} qty={qty} />
    </div>
  );
}

/* ── Main Page ── */
export default function NewSalePage() {
  const navigate = useNavigate();

  // Header state
  const [matchId, setMatchId] = useState('m01');
  const [client, setClient] = useState('Roadtrips');
  const [contract, setContract] = useState('2025-10885');
  const [saleDate, setSaleDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [autoFilled, setAutoFilled] = useState(true);
  const [headerErrors, setHeaderErrors] = useState<Record<string, boolean>>({});

  // Default sub-game for m01
  const defaultSg = getSubGamesForMatch('m01')[0]?.id ?? '';

  // Line items — 3 pre-filled demo lines
  const [lines, setLines] = useState<LineItem[]>([
    { id: makeId(), subGameId: defaultSg, categoryId: 'topcat1', qty: '12', price: '34881' },
    { id: makeId(), subGameId: defaultSg, categoryId: 'cat2', qty: '6', price: '15420' },
    { id: makeId(), subGameId: defaultSg, categoryId: 'cat3', qty: '20', price: '10280' },
  ]);
  const [lineErrors, setLineErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const updateLine = (id: string, patch: Partial<LineItem>) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
    Object.keys(patch).forEach(k => setLineErrors(e => ({ ...e, [`${id}-${k}`]: false })));
  };

  const removeLine = (id: string) => setLines(prev => prev.filter(l => l.id !== id));

  const addLine = () => {
    const sgs = getSubGamesForMatch(matchId);
    const sgId = sgs.length === 1 ? sgs[0].id : '';
    setLines(prev => [...prev, { id: makeId(), subGameId: sgId, categoryId: '', qty: '', price: '' }]);
  };

  const handleClientChange = (val: string) => {
    setClient(val);
    setHeaderErrors(e => ({ ...e, client: false }));
    const c = CLIENTS.find(x => x.value === val);
    if (c?.contract) { setContract(c.contract); setAutoFilled(true); } else { setAutoFilled(false); }
  };

  // Summary computations
  const lineSummaries = useMemo(() => lines.map(l => {
    const qty = parseInt(l.qty) || 0;
    const price = parseFloat(l.price) || 0;
    const available = l.subGameId && l.categoryId ? getInventoryAvailable(l.subGameId, l.categoryId) : 0;
    const isOversell = qty > 0 && qty > available;
    const catLabel = MOCK_SUBGAMES.find(sg => sg.id === l.subGameId)?.categories.find(c => c.id === l.categoryId)?.label ?? '';
    return { qty, total: qty * price, isOversell, catLabel };
  }), [lines]);

  const totalQty = lineSummaries.reduce((s, l) => s + l.qty, 0);
  const totalValue = lineSummaries.reduce((s, l) => s + l.total, 0);
  const oversellCount = lineSummaries.filter(l => l.isOversell).length;

  const validate = () => {
    const hErrors: Record<string, boolean> = {};
    if (!matchId) hErrors.matchId = true;
    if (!client) hErrors.client = true;
    if (!contract) hErrors.contract = true;
    setHeaderErrors(hErrors);

    const lErrors: Record<string, boolean> = {};
    const isMultiSg = hasMultipleSubGames(matchId);
    lines.forEach(l => {
      if (isMultiSg && !l.subGameId) lErrors[`${l.id}-subGameId`] = true;
      if (!l.categoryId) lErrors[`${l.id}-categoryId`] = true;
      if (!l.qty || parseInt(l.qty) <= 0) lErrors[`${l.id}-qty`] = true;
    });
    setLineErrors(lErrors);

    return Object.keys(hErrors).length === 0 && Object.keys(lErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setSuccess(true);
  };

  const inputCls = (field: string) =>
    `w-full h-10 px-3 rounded-lg font-body text-sm outline-none transition-all border ${
      headerErrors[field] ? 'border-2 border-destructive' : 'border-border focus:ring-1 focus:ring-accent'
    } bg-card`;

  return (
    <div className="max-w-[800px] mx-auto mt-8 pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 font-body text-sm text-muted-foreground">
        <Link to="/sales" className="hover:underline text-accent">Sales</Link>
        <ChevronRight size={14} /><span>New Sale</span>
      </div>

      <h1 className="font-display text-[28px] mb-1 text-primary">New Sale Entry</h1>
      <p className="font-body text-sm mb-6 text-muted-foreground">One client, one contract — add as many lines as needed across matches and sessions.</p>

      {/* ── HEADER SECTION ── */}
      <div className="bg-card rounded-xl shadow-sm p-6 mb-4 space-y-5">
        {/* Event */}
        <div>
          <label className="block font-body text-xs font-medium text-foreground mb-1.5">Active Event</label>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-body text-sm bg-accent/15 text-accent">
            <Lock size={12} /> FIFA World Cup 2026
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-xs font-medium text-foreground mb-1.5">Match *</label>
            <select value={matchId} onChange={e => {
              setMatchId(e.target.value);
              setHeaderErrors(h => ({ ...h, matchId: false }));
              // Reset lines sub-games on match change
              const sgs = getSubGamesForMatch(e.target.value);
              const sgId = sgs.length === 1 ? sgs[0].id : '';
              setLines(prev => prev.map(l => ({ ...l, subGameId: sgId, categoryId: '' })));
            }} className={inputCls('matchId')}>
              {MOCK_MATCHES.map(m => <option key={m.id} value={m.id}>{m.code} — {m.teams}</option>)}
            </select>
            {headerErrors.matchId && <p className="font-body text-xs mt-1 text-destructive">Required</p>}
          </div>
          <div>
            <label className="block font-body text-xs font-medium text-foreground mb-1.5">Client *</label>
            <select value={client} onChange={e => handleClientChange(e.target.value)} className={inputCls('client')}>
              <option value="">Select client</option>
              {CLIENTS.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
            </select>
            {headerErrors.client && <p className="font-body text-xs mt-1 text-destructive">Required</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-xs font-medium text-foreground mb-1.5">
              Contract No. *
              {autoFilled && <span className="ml-2 px-1.5 py-0.5 rounded font-body text-[11px] font-medium bg-success/10 text-success">Auto-filled</span>}
            </label>
            <input type="text" value={contract}
              onChange={e => { setContract(e.target.value); setAutoFilled(false); setHeaderErrors(h => ({ ...h, contract: false })); }}
              className={inputCls('contract')} />
            {headerErrors.contract && <p className="font-body text-xs mt-1 text-destructive">Required</p>}
          </div>
          <div>
            <label className="block font-body text-xs font-medium text-foreground mb-1.5">Sale Date *</label>
            <Popover>
              <PopoverTrigger asChild>
                <button className={cn(inputCls(''), 'flex items-center gap-2 text-left')}>
                  <CalendarIcon size={14} className="text-muted-foreground" />
                  {format(saleDate, 'dd MMM yyyy')}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={saleDate} onSelect={d => d && setSaleDate(d)} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div>
          <label className="block font-body text-xs font-medium text-foreground mb-1.5">Notes (optional)</label>
          <textarea value={notes} onChange={e => e.target.value.length <= 500 && setNotes(e.target.value)}
            rows={2} maxLength={500} placeholder="e.g. VIP client — priority allocation"
            className="w-full px-3 py-2.5 rounded-lg font-body text-sm border border-border outline-none focus:ring-1 focus:ring-accent bg-card resize-none" />
        </div>
      </div>

      {/* ── LINE ITEMS SECTION ── */}
      <div className="bg-card rounded-xl shadow-sm p-6 mb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h2 className="font-body text-base font-semibold text-foreground">Ticket Lines</h2>
            <span className="px-2 py-0.5 rounded-full bg-muted font-body text-[11px] font-medium text-foreground">{lines.length} lines</span>
          </div>
          <button onClick={addLine}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-medium bg-primary text-primary-foreground hover:opacity-90">
            <Plus size={13} /> Add Line
          </button>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {lines.map((line, i) => (
              <motion.div
                key={line.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                transition={{ duration: 0.2 }}
              >
                <LineItemCard
                  line={line}
                  index={i}
                  matchId={matchId}
                  onUpdate={updateLine}
                  onRemove={removeLine}
                  canRemove={lines.length > 1}
                  errors={lineErrors}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* ── SALE SUMMARY FOOTER ── */}
      <div className="rounded-xl p-5 mb-4 bg-primary">
        <div className="flex items-center justify-between">
          <span className="font-body text-sm text-primary-foreground/80">
            {lines.length} lines · {totalQty} total tickets
          </span>
          <span className="font-body text-base font-bold text-primary-foreground">
            Total Sale Value: AED {totalValue.toLocaleString()}
          </span>
        </div>
        {oversellCount > 0 && (
          <div className="mt-3 rounded-lg p-3 bg-warning/20 border border-warning/40">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-warning shrink-0" />
              <p className="font-body text-xs font-medium text-warning">
                {oversellCount} line{oversellCount > 1 ? 's' : ''} require{oversellCount === 1 ? 's' : ''} manager approval — sale will be saved with partial pending status
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── ACTIONS ── */}
      {!success ? (
        <div className="space-y-3">
          <button onClick={handleSubmit} disabled={loading}
            className="w-full h-12 rounded-xl font-body text-sm font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-70 bg-primary text-primary-foreground">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Saving sale...</> : 'Save Sale'}
          </button>
          <div className="text-center">
            <button onClick={() => navigate('/sales')} className="font-body text-sm hover:underline text-muted-foreground">Cancel and go back</button>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="rounded-xl p-5 bg-card border border-success shadow-sm"
        >
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-success shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-body text-sm font-bold text-foreground">
                SALE-003 created — {lines.length} lines · {totalQty} total tickets
              </p>
              <div className="mt-2 space-y-1">
                {lines.map((l, i) => {
                  const s = lineSummaries[i];
                  return (
                    <p key={l.id} className="font-body text-xs text-muted-foreground">
                      Line {i + 1}: {s.catLabel || '—'} × {s.qty} — {s.isOversell
                        ? <span className="text-warning font-medium">PENDING APPROVAL ⚠</span>
                        : <span className="text-success font-medium">UNALLOCATED ✓</span>}
                    </p>
                  );
                })}
              </div>
              <button onClick={() => navigate('/distribution')}
                className="mt-3 px-4 py-2 rounded-lg font-body text-xs font-medium bg-primary text-primary-foreground hover:opacity-90">
                Allocate Lines →
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
