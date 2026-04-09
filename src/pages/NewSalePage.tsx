import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { useEvent } from '@/context/EventContext';
import { getInventoryAvailable } from '@/data/mockData';
import { ChevronRight, Lock, CheckCircle, AlertTriangle, Loader2, CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { motion, AnimatePresence } from 'framer-motion';
import LineItemCard, { type LineItemData } from '@/components/forms/LineItemCard';

function makeId() { return `li-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

export default function NewSalePage() {
  const navigate = useNavigate();
  const ctx = useAppContext();
  const { activeEvent } = useEvent();

  const eventMatches = useMemo(() =>
    ctx.getEvent(activeEvent.id)?.matches.filter(m => m.isActive) ?? [],
  [ctx, activeEvent.id]);

  const eventClients = useMemo(() =>
    ctx.clients.filter(c => c.isActive &&
      ctx.contracts.some(ctr => ctr.partyId === c.id && ctr.eventId === activeEvent.id
        && ctr.contractType === 'SALE' && ctr.status === 'ACTIVE')),
  [ctx.clients, ctx.contracts, activeEvent.id]);

  // Header state
  const [matchId, setMatchId] = useState(eventMatches[0]?.id ?? '');
  const [clientId, setClientId] = useState('');
  const [contract, setContract] = useState('');
  const [saleDate, setSaleDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [autoFilled, setAutoFilled] = useState(false);
  const [contractFlash, setContractFlash] = useState(false);
  const [headerErrors, setHeaderErrors] = useState<Record<string, boolean>>({});

  const defaultSg = ctx.getSubGamesForMatch(matchId)[0]?.id ?? '';

  const [lines, setLines] = useState<LineItemData[]>([
    { id: makeId(), subGameId: defaultSg, categoryId: 'topcat1', qty: '12', price: '34881' },
    { id: makeId(), subGameId: defaultSg, categoryId: 'cat2', qty: '6', price: '15420' },
    { id: makeId(), subGameId: defaultSg, categoryId: 'cat3', qty: '20', price: '10280' },
  ]);
  const [lineErrors, setLineErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const updateLine = (id: string, patch: Partial<LineItemData>) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
    Object.keys(patch).forEach(k => setLineErrors(e => ({ ...e, [`${id}-${k}`]: false })));
  };

  const removeLine = (id: string) => setLines(prev => prev.filter(l => l.id !== id));

  const addLine = () => {
    const sgs = ctx.getSubGamesForMatch(matchId);
    const sgId = sgs.length === 1 ? sgs[0].id : '';
    setLines(prev => [...prev, { id: makeId(), subGameId: sgId, categoryId: '', qty: '', price: '' }]);
  };

  const handleClientChange = (val: string) => {
    setClientId(val);
    setHeaderErrors(e => ({ ...e, client: false }));
    const ctr = ctx.getActiveContracts(val, activeEvent.id).find(c => c.contractType === 'SALE');
    if (ctr) {
      setContract(ctr.contractRef);
      setAutoFilled(true);
      setContractFlash(true);
      setTimeout(() => setContractFlash(false), 600);
    } else {
      setAutoFilled(false);
    }
  };

  const lineSummaries = useMemo(() => lines.map(l => {
    const qty = parseInt(l.qty) || 0;
    const price = parseFloat(l.price) || 0;
    const available = l.subGameId && l.categoryId ? getInventoryAvailable(l.subGameId, l.categoryId) : 0;
    const isOversell = qty > 0 && qty > available;
    const sg = ctx.getSubGame(l.subGameId);
    const catLabel = sg?.categories.find(c => c.id === l.categoryId)?.displayName ?? '';
    return { qty, total: qty * price, isOversell, catLabel };
  }), [lines, ctx]);

  const totalQty = lineSummaries.reduce((s, l) => s + l.qty, 0);
  const totalValue = lineSummaries.reduce((s, l) => s + l.total, 0);
  const oversellCount = lineSummaries.filter(l => l.isOversell).length;

  const validate = () => {
    const hErrors: Record<string, boolean> = {};
    if (!matchId) hErrors.matchId = true;
    if (!clientId) hErrors.client = true;
    if (!contract) hErrors.contract = true;
    setHeaderErrors(hErrors);

    const lErrors: Record<string, boolean> = {};
    const isMultiSg = ctx.hasMultipleSubGames(matchId);
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

  if (success) {
    return (
      <div className="max-w-[800px] mx-auto mt-8 pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-sm border p-8">
          <div className="flex justify-center mb-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-400 flex items-center justify-center">
              <CheckCircle size={40} className="text-emerald-600" />
            </motion.div>
          </div>

          <h2 className="font-display text-[26px] text-primary text-center mb-1">Sale Saved Successfully</h2>
          <div className="flex justify-center mb-6">
            <span className="font-mono text-sm px-3 py-1 rounded-full bg-primary/10 text-primary font-bold">SALE-003</span>
          </div>

          <div className="space-y-2 max-h-[200px] overflow-y-auto mb-4">
            {lines.map((l, i) => {
              const s = lineSummaries[i];
              return (
                <motion.div key={l.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-muted/50 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-primary/10 text-primary">L{i + 1}</span>
                    <span className="font-body text-sm text-foreground">{s.catLabel || '—'}</span>
                  </div>
                  <span className="font-body text-sm text-muted-foreground">{s.qty} tickets · {ctx.formatCurrency(s.total)}</span>
                  <span className="font-body text-[11px]">
                    {s.isOversell
                      ? <span className="text-amber-600 font-medium">PENDING APPROVAL ⚠</span>
                      : <span className="text-emerald-600 font-medium">UNALLOCATED ✓</span>}
                  </span>
                </motion.div>
              );
            })}
          </div>

          <div className="border-t border-border pt-3 flex items-center justify-between mb-6">
            <span className="font-body text-sm text-muted-foreground">
              {lines.length} line{lines.length > 1 ? 's' : ''} · {totalQty} total tickets
            </span>
            <span className="font-body text-sm font-semibold text-foreground">
              Total: {ctx.formatCurrency(totalValue)}
            </span>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate('/distribution')}
              className="flex-1 h-11 rounded-xl font-body text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
              Allocate Lines →
            </button>
            <button onClick={() => {
              setSuccess(false);
              setLines([{ id: makeId(), subGameId: defaultSg, categoryId: '', qty: '', price: '' }]);
            }}
              className="flex-1 h-11 rounded-xl font-body text-sm font-bold border border-border text-foreground hover:bg-muted transition-colors">
              Add Another Sale +
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

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
        <div className="flex items-center justify-between mb-1">
          <span className="font-body text-[15px] font-bold text-primary">Sale Details</span>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-body text-sm bg-accent/15 text-accent">
            <Lock size={12} /> {activeEvent.name}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-xs font-medium text-foreground mb-1.5">Match *</label>
            <select value={matchId} onChange={e => {
              setMatchId(e.target.value);
              setHeaderErrors(h => ({ ...h, matchId: false }));
              const sgs = ctx.getSubGamesForMatch(e.target.value);
              const sgId = sgs.length === 1 ? sgs[0].id : '';
              setLines(prev => prev.map(l => ({ ...l, subGameId: sgId, categoryId: '' })));
            }} className={inputCls('matchId')}>
              <option value="">Select match</option>
              {eventMatches.map(m => <option key={m.id} value={m.id}>{m.code} — {m.teamsOrDescription}</option>)}
            </select>
            {headerErrors.matchId && <p className="font-body text-xs mt-1 text-destructive">Required</p>}
          </div>
          <div>
            <label className="block font-body text-xs font-medium text-foreground mb-1.5">Client *</label>
            <select value={clientId} onChange={e => handleClientChange(e.target.value)} className={inputCls('client')}>
              <option value="">Select client</option>
              {eventClients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
            </select>
            {headerErrors.client && <p className="font-body text-xs mt-1 text-destructive">Required</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-xs font-medium text-foreground mb-1.5">
              Contract No. *
              {autoFilled && <span className="ml-2 px-1.5 py-0.5 rounded font-body text-[11px] font-medium bg-emerald-100 text-emerald-800">Auto-filled</span>}
            </label>
            <input type="text" value={contract}
              onChange={e => { setContract(e.target.value); setAutoFilled(false); setHeaderErrors(h => ({ ...h, contract: false })); }}
              className={cn(inputCls('contract'), contractFlash && 'ring-2 ring-accent/60 bg-secondary/30')}
              style={{ transition: 'all 0.3s ease' }} />
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
          <p className="text-right font-body text-[11px] mt-1 text-muted-foreground">{notes.length} / 500</p>
        </div>
      </div>

      {/* ── LINE ITEMS SECTION ── */}
      <div className="bg-card rounded-xl shadow-sm p-6 mb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h2 className="font-body text-base font-semibold text-foreground">Ticket Lines</h2>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 font-body text-[11px] font-medium text-primary">
              {lines.length} line{lines.length > 1 ? 's' : ''}
            </span>
          </div>
          <button onClick={addLine} disabled={!matchId}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
            <Plus size={13} /> Add Line
          </button>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {lines.map((line, i) => (
              <motion.div key={line.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                transition={{ duration: 0.2 }}>
                <LineItemCard line={line} index={i} matchId={matchId}
                  mode="SALE"
                  onUpdate={updateLine} onRemove={removeLine}
                  canRemove={lines.length > 1} errors={lineErrors} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* ── SALE SUMMARY FOOTER ── */}
      <div className="rounded-xl p-5 mb-4 bg-primary">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-sm text-primary-foreground/70">
              {lines.length} line{lines.length > 1 ? 's' : ''} · {totalQty} total tickets
            </p>
            <p className="font-body text-xs text-primary-foreground/45 uppercase tracking-wider mt-1">Total Sale Value</p>
            <p className="font-display text-[28px] text-accent mt-0.5">{ctx.formatCurrency(totalValue)}</p>
          </div>
          <button onClick={handleSubmit} disabled={loading}
            className={cn(
              "h-12 px-8 rounded-xl font-body text-[15px] font-semibold flex items-center gap-2 transition-all",
              loading || !matchId || !clientId || !contract
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-gradient-to-r from-accent to-[hsl(40_55%_65%)] text-primary hover:-translate-y-0.5 hover:shadow-lg"
            )}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Saving sale...</> : 'Save Sale →'}
          </button>
        </div>
        {oversellCount > 0 && (
          <div className="mt-3 rounded-lg p-3 bg-amber-500/20 border border-amber-400/40">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-300 shrink-0" />
              <p className="font-body text-xs font-medium text-amber-200">
                {oversellCount} line{oversellCount > 1 ? 's' : ''} require{oversellCount === 1 ? 's' : ''} manager approval — sale will be saved with partial pending status
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Cancel */}
      <div className="text-center">
        <button onClick={() => navigate('/sales')} className="font-body text-sm hover:underline text-muted-foreground">Cancel and go back</button>
      </div>
    </div>
  );
}
