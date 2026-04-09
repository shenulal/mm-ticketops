import { useState, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { useEvent } from '@/context/EventContext';
import { Lock, Loader2, CheckCircle, ChevronRight, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface FormState {
  matchId: string;
  vendor: string;
  contract: string;
  category: string;
  qty: string;
  price: string;
  date: Date;
  notes: string;
}

export default function NewPurchasePage() {
  const navigate = useNavigate();
  const ctx = useAppContext();
  const { activeEvent } = useEvent();

  // Dynamic data from AppContext
  const eventMatches = useMemo(() =>
    ctx.getEvent(activeEvent.id)?.matches.filter(m => m.isActive) ?? [],
  [ctx, activeEvent.id]);

  const eventVendors = useMemo(() =>
    ctx.vendors.filter(v => v.isActive &&
      ctx.vendorEventBridges.some(b => b.vendorId === v.id && b.eventId === activeEvent.id)),
  [ctx.vendors, ctx.vendorEventBridges, activeEvent.id]);

  const [form, setForm] = useState<FormState>({
    matchId: eventMatches[0]?.id ?? '',
    vendor: '',
    contract: '',
    category: '',
    qty: '',
    price: '',
    date: new Date(),
    notes: '',
  });
  const [autoFilled, setAutoFilled] = useState(false);
  const [contractFlash, setContractFlash] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Derive categories from selected match's default sub-game
  const selectedMatch = eventMatches.find(m => m.id === form.matchId);
  const defaultSubGame = selectedMatch?.subGames[0];
  const categories = defaultSubGame?.categories.filter(c => c.isActive) ?? [];

  const set = (key: keyof FormState, value: string | Date) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: false }));
  };

  const handleVendorChange = (vendorId: string) => {
    set('vendor', vendorId);
    const contract = ctx.getActiveContracts(vendorId, activeEvent.id)
      .find(c => c.contractType === 'PURCHASE');
    if (contract) {
      set('contract', contract.contractRef);
      setAutoFilled(true);
      setContractFlash(true);
      setTimeout(() => setContractFlash(false), 600);
    } else {
      setAutoFilled(false);
    }
  };

  const qtyNum = parseInt(form.qty) || 0;
  const priceNum = parseFloat(form.price) || 0;
  const totalValue = qtyNum * priceNum;

  const validate = () => {
    const required: (keyof FormState)[] = ['matchId', 'vendor', 'contract', 'category', 'qty', 'price'];
    const errs: Record<string, boolean> = {};
    required.forEach(k => {
      if (!form[k] || (typeof form[k] === 'string' && !(form[k] as string).trim())) errs[k] = true;
    });
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstKey = required.find(k => errs[k]);
      if (firstKey) {
        const el = document.querySelector(`[data-field="${firstKey}"]`) as HTMLElement;
        el?.focus();
      }
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setSuccess(true);
  };

  const inputClass = (field: string) =>
    `w-full h-10 px-3 rounded-lg font-body text-sm outline-none transition-all ${
      errors[field] ? 'border-2 border-destructive' : 'border border-border focus:ring-1 focus:ring-accent'
    } bg-card`;

  const labelClass = "block font-body text-sm font-medium mb-1.5 text-foreground";
  const helperError = "font-body text-xs mt-1 text-destructive";

  return (
    <div className="max-w-[700px] mx-auto mt-8 pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 font-body text-sm text-muted-foreground">
        <Link to="/purchases" className="hover:underline text-accent">Purchases</Link>
        <ChevronRight size={14} />
        <span>New Purchase</span>
      </div>

      <h1 className="font-display text-[28px] mb-1 text-primary">New Purchase Entry</h1>
      <p className="font-body text-sm mb-6 text-muted-foreground">
        All fields marked * are required. Contract auto-fills on vendor selection.
      </p>

      <div className="bg-card rounded-xl shadow-sm p-8 space-y-6">
        {/* Active Event */}
        <div>
          <label className={labelClass}>Active Event</label>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-body text-sm bg-accent/15 text-accent">
            <Lock size={12} /> {activeEvent.name}
          </span>
          <p className="font-body text-xs mt-1 text-muted-foreground">Change event from the sidebar switcher</p>
        </div>

        {/* Match */}
        <div>
          <label className={labelClass}>Match *</label>
          <select data-field="matchId" value={form.matchId}
            onChange={e => { set('matchId', e.target.value); set('category', ''); }}
            className={inputClass('matchId')}>
            <option value="">Select a match</option>
            {eventMatches.map(m => (
              <option key={m.id} value={m.id}>{m.code} — {m.teamsOrDescription} | {m.date}</option>
            ))}
          </select>
          {errors.matchId && <p className={helperError}>This field is required</p>}
        </div>

        {/* Vendor */}
        <div>
          <label className={labelClass}>Vendor *</label>
          <select data-field="vendor" value={form.vendor}
            onChange={e => handleVendorChange(e.target.value)}
            className={inputClass('vendor')}>
            <option value="">Select vendor</option>
            {eventVendors.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          {errors.vendor && <p className={helperError}>This field is required</p>}
        </div>

        {/* Contract */}
        <div>
          <label className={labelClass}>
            Contract No. *
            {autoFilled && (
              <span className="ml-2 px-1.5 py-0.5 rounded font-body text-[11px] font-medium bg-emerald-100 text-emerald-800">
                Auto-filled
              </span>
            )}
          </label>
          <input data-field="contract" type="text" value={form.contract}
            onChange={e => { set('contract', e.target.value); setAutoFilled(false); }}
            className={cn(inputClass('contract'), contractFlash && 'ring-2 ring-accent/60 bg-secondary/30')}
            style={{ transition: 'all 0.3s ease' }} />
          {errors.contract && <p className={helperError}>This field is required</p>}
        </div>

        {/* Category */}
        <div>
          <label className={labelClass}>Category *</label>
          <select data-field="category" value={form.category}
            onChange={e => set('category', e.target.value)}
            className={inputClass('category')}>
            <option value="">Select category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}
          </select>
          {errors.category && <p className={helperError}>This field is required</p>}
        </div>

        {/* Quantity */}
        <div>
          <label className={labelClass}>Quantity *</label>
          <input data-field="qty" type="number" min={1} step={1}
            value={form.qty} onChange={e => set('qty', e.target.value)}
            placeholder="0" className={inputClass('qty')} />
          {errors.qty && <p className={helperError}>This field is required</p>}
          {qtyNum > 0 && (
            <p className="font-body text-xs mt-1 text-muted-foreground">
              This will automatically generate <strong>{qtyNum}</strong> individual unit records
            </p>
          )}
        </div>

        {/* Price */}
        <div>
          <label className={labelClass}>Price per Ticket ({activeEvent.defaultCurrency}) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm font-medium text-muted-foreground">
              {activeEvent.defaultCurrency}
            </span>
            <input data-field="price" type="number" min={0} step={0.01}
              value={form.price} onChange={e => set('price', e.target.value)}
              placeholder="0.00" className={cn(inputClass('price'), 'pl-12')} />
          </div>
          {errors.price && <p className={helperError}>This field is required</p>}
          {qtyNum > 0 && priceNum > 0 && (
            <p className="font-body text-sm font-bold mt-2 text-primary">
              Total Value: {ctx.formatCurrency(totalValue)}
            </p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className={labelClass}>Purchase Date *</label>
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn(inputClass('date'), 'flex items-center gap-2 text-left')}>
                <CalendarIcon size={14} className="text-muted-foreground" />
                {format(form.date, 'dd MMM yyyy')}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={form.date} onSelect={d => d && set('date', d)}
                initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>

        {/* Notes */}
        <div>
          <label className={labelClass}>Notes (optional)</label>
          <textarea value={form.notes}
            onChange={e => e.target.value.length <= 500 && set('notes', e.target.value)}
            rows={3} maxLength={500}
            placeholder="e.g. Block allocation from venue section C, entrance 4"
            className="w-full px-3 py-2.5 rounded-lg font-body text-sm border border-border outline-none focus:ring-1 focus:ring-accent bg-card resize-none" />
          <p className="text-right font-body text-xs mt-1 text-muted-foreground">{form.notes.length} / 500</p>
        </div>

        {/* Actions */}
        {!success ? (
          <>
            <button onClick={handleSubmit} disabled={loading}
              className="w-full h-12 rounded-xl font-body text-sm font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-70 bg-primary text-primary-foreground">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Generating unit records...</> : 'Save Purchase'}
            </button>
            <div className="text-center">
              <button onClick={() => navigate('/purchases')} className="font-body text-sm hover:underline text-muted-foreground">
                Cancel and go back
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl p-4 flex items-start gap-3 bg-emerald-50 border-l-4 border-emerald-600">
              <CheckCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-body text-sm font-bold text-emerald-800">Purchase PUR-004 created successfully.</p>
                <p className="font-body text-sm mt-1 text-emerald-800">
                  {qtyNum} unit records generated automatically
                </p>
                <div className="flex gap-4 mt-3">
                  <Link to="/purchases" className="font-body text-sm font-medium hover:underline text-accent">
                    View Purchase Units →
                  </Link>
                  <button onClick={() => {
                    setSuccess(false);
                    setForm({ matchId: eventMatches[0]?.id ?? '', vendor: '', contract: '', category: '', qty: '', price: '', date: new Date(), notes: '' });
                    setAutoFilled(false);
                  }} className="font-body text-sm font-medium hover:underline text-accent">
                    Add Another Purchase →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
