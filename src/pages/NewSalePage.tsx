import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MOCK_MATCHES } from '@/data/mockData';
import { ChevronRight, Lock, CheckCircle, AlertTriangle, Loader2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const CLIENTS = [
  { value: 'Roadtrips', contract: '2025-10885' },
  { value: 'Blend Group', contract: '2025-20001' },
  { value: 'One2Travel', contract: '2025-30002' },
  { value: 'Al Habtoor', contract: '' },
  { value: 'RHS Logistics', contract: '' },
];

const STOCK: Record<string, number> = { 'Top Cat 1': 31, 'Cat 2': 100, 'Cat 3': 60, 'Cat 4': 0 };
const CATEGORIES = Object.keys(STOCK);

export default function NewSalePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    matchId: 'm01', client: '', contract: '', category: 'Top Cat 1',
    qty: '', price: '', date: new Date(), notes: '',
  });
  const [autoFilled, setAutoFilled] = useState(false);
  const [contractFlash, setContractFlash] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<'normal' | 'oversell' | null>(null);

  const set = (key: string, value: string | Date) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: false }));
  };

  const handleClientChange = (client: string) => {
    set('client', client);
    const c = CLIENTS.find(c => c.value === client);
    if (c?.contract) {
      set('contract', c.contract);
      setAutoFilled(true);
      setContractFlash(true);
      setTimeout(() => setContractFlash(false), 600);
    } else { setAutoFilled(false); }
  };

  const qtyNum = parseInt(form.qty) || 0;
  const priceNum = parseFloat(form.price) || 0;
  const totalValue = qtyNum * priceNum;
  const available = STOCK[form.category] ?? 0;
  const isOversell = qtyNum > 0 && qtyNum > available;
  const remaining = available - qtyNum;

  const validate = () => {
    const required = ['matchId', 'client', 'contract', 'category', 'qty', 'price'];
    const errs: Record<string, boolean> = {};
    required.forEach(k => { if (!(form as any)[k]) errs[k] = true; });
    setErrors(errs);
    if (Object.keys(errs).length) {
      const el = document.querySelector(`[data-field="${required.find(k => errs[k])}"]`) as HTMLElement;
      el?.focus();
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setSuccess(isOversell ? 'oversell' : 'normal');
  };

  const inputClass = (field: string) =>
    `w-full h-10 px-3 rounded-lg font-body text-sm outline-none transition-all ${
      errors[field] || (field === 'qty' && isOversell) ? 'border-2 border-danger' : 'border border-border focus:ring-1 focus:ring-gold'
    } bg-bg-card`;

  const labelClass = "block font-body text-sm font-medium mb-1.5";

  return (
    <div className="max-w-[700px] mx-auto mt-8 pb-12">
      <div className="flex items-center gap-2 mb-4 font-body text-sm" style={{ color: '#6B7280' }}>
        <Link to="/sales" className="hover:underline" style={{ color: '#C9A84C' }}>Sales</Link>
        <ChevronRight size={14} /><span>New Sale</span>
      </div>

      <h1 className="font-display text-[28px] mb-1" style={{ color: '#0B2D5E' }}>New Sale Entry</h1>
      <p className="font-body text-sm mb-6" style={{ color: '#6B7280' }}>All fields marked * are required.</p>

      <div className="bg-bg-card rounded-xl shadow-sm p-8 space-y-6">
        {/* Event */}
        <div>
          <label className={labelClass} style={{ color: '#1A1A2E' }}>Active Event</label>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-body text-sm" style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}>
            <Lock size={12} /> FIFA World Cup 2026
          </span>
        </div>

        {/* Match */}
        <div>
          <label className={labelClass} style={{ color: '#1A1A2E' }}>Match *</label>
          <select data-field="matchId" value={form.matchId} onChange={e => set('matchId', e.target.value)} className={inputClass('matchId')}>
            {MOCK_MATCHES.map(m => <option key={m.id} value={m.id}>{m.code} — {m.teams} | {m.date}</option>)}
          </select>
          {errors.matchId && <p className="font-body text-xs mt-1" style={{ color: '#DC2626' }}>This field is required</p>}
        </div>

        {/* Client */}
        <div>
          <label className={labelClass} style={{ color: '#1A1A2E' }}>Client / Company *</label>
          <select data-field="client" value={form.client} onChange={e => handleClientChange(e.target.value)} className={inputClass('client')}>
            <option value="">Select client</option>
            {CLIENTS.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
          </select>
          {errors.client && <p className="font-body text-xs mt-1" style={{ color: '#DC2626' }}>This field is required</p>}
        </div>

        {/* Contract */}
        <div>
          <label className={labelClass} style={{ color: '#1A1A2E' }}>
            Contract No. *
            {autoFilled && <span className="ml-2 px-1.5 py-0.5 rounded font-body text-[11px] font-medium" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>Auto-filled</span>}
          </label>
          <input data-field="contract" type="text" value={form.contract}
            onChange={e => { set('contract', e.target.value); setAutoFilled(false); }}
            className={cn(inputClass('contract'), contractFlash && 'ring-2 ring-gold/60 bg-gold-light/30')}
          />
          {errors.contract && <p className="font-body text-xs mt-1" style={{ color: '#DC2626' }}>This field is required</p>}
        </div>

        {/* Category with stock */}
        <div>
          <label className={labelClass} style={{ color: '#1A1A2E' }}>Category *</label>
          <select data-field="category" value={form.category} onChange={e => set('category', e.target.value)} className={inputClass('category')}>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c} ({STOCK[c]} available)</option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className={labelClass} style={{ color: '#1A1A2E' }}>Quantity *</label>
          <input data-field="qty" type="number" min={1} step={1} value={form.qty}
            onChange={e => set('qty', e.target.value)} placeholder="0" className={inputClass('qty')}
          />
          {errors.qty && <p className="font-body text-xs mt-1" style={{ color: '#DC2626' }}>This field is required</p>}

          {/* Live inventory indicator */}
          <div className="mt-3 rounded-lg p-3 border" style={
            qtyNum === 0
              ? { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }
              : isOversell
                ? { backgroundColor: '#FEE2E2', borderColor: '#DC2626' }
                : { backgroundColor: '#D1FAE5', borderColor: '#1A7A4A' }
          }>
            {qtyNum === 0 ? (
              <p className="font-body text-xs" style={{ color: '#6B7280' }}>Select category and enter quantity to check availability</p>
            ) : isOversell ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} style={{ color: '#DC2626' }} />
                  <p className="font-body text-xs font-bold" style={{ color: '#991B1B' }}>
                    Oversell: Only {available} available — this will exceed inventory by {qtyNum - available} units
                  </p>
                </div>
                <p className="font-body text-xs" style={{ color: '#991B1B' }}>
                  A manager approval request will be raised automatically on save.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} style={{ color: '#1A7A4A' }} />
                  <p className="font-body text-xs font-bold" style={{ color: '#065F46' }}>
                    {qtyNum} units available · {remaining} will remain after this sale
                  </p>
                </div>
                <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: '#A7F3D0' }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${(qtyNum / available) * 100}%`, backgroundColor: '#1A7A4A' }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Price */}
        <div>
          <label className={labelClass} style={{ color: '#1A1A2E' }}>Price per Ticket (AED) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm font-medium" style={{ color: '#6B7280' }}>AED</span>
            <input data-field="price" type="number" min={0} step={0.01} value={form.price}
              onChange={e => set('price', e.target.value)} placeholder="0.00" className={cn(inputClass('price'), 'pl-12')}
            />
          </div>
          {errors.price && <p className="font-body text-xs mt-1" style={{ color: '#DC2626' }}>This field is required</p>}
          {qtyNum > 0 && priceNum > 0 && (
            <p className="font-body text-sm font-bold mt-2" style={{ color: '#0B2D5E' }}>Total Value: AED {totalValue.toLocaleString()}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className={labelClass} style={{ color: '#1A1A2E' }}>Sale Date *</label>
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn(inputClass('date'), 'flex items-center gap-2 text-left')}>
                <CalendarIcon size={14} style={{ color: '#6B7280' }} />
                {format(form.date, 'dd MMM yyyy')}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={form.date} onSelect={d => d && set('date', d)} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>

        {/* Notes */}
        <div>
          <label className={labelClass} style={{ color: '#1A1A2E' }}>Notes (optional)</label>
          <textarea value={form.notes} onChange={e => e.target.value.length <= 500 && set('notes', e.target.value)}
            rows={3} maxLength={500} placeholder="e.g. VIP client — priority allocation"
            className="w-full px-3 py-2.5 rounded-lg font-body text-sm border border-border outline-none focus:ring-1 focus:ring-gold bg-bg-card resize-none"
          />
          <p className="text-right font-body text-xs mt-1" style={{ color: '#9CA3AF' }}>{form.notes.length} / 500</p>
        </div>

        {/* Actions */}
        {!success ? (
          <>
            <button onClick={handleSubmit} disabled={loading}
              className="w-full h-12 rounded-xl font-body text-sm font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-70"
              style={{ backgroundColor: '#0B2D5E', color: 'white' }}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Saving sale...</> : 'Save Sale'}
            </button>
            <div className="text-center">
              <button onClick={() => navigate('/sales')} className="font-body text-sm hover:underline" style={{ color: '#6B7280' }}>Cancel and go back</button>
            </div>
          </>
        ) : success === 'oversell' ? (
          <div className="rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: '#FEF3C7', borderLeft: '4px solid #D97706' }}>
            <AlertTriangle size={20} style={{ color: '#D97706', marginTop: 2, flexShrink: 0 }} />
            <div>
              <p className="font-body text-sm font-bold" style={{ color: '#92400E' }}>Saved with pending approval flag.</p>
              <p className="font-body text-sm mt-1" style={{ color: '#92400E' }}>Operations Manager has been notified.</p>
              <Link to="/sales" className="font-body text-sm font-medium mt-2 inline-block hover:underline" style={{ color: '#C9A84C' }}>Back to Sales →</Link>
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: '#D1FAE5', borderLeft: '4px solid #1A7A4A' }}>
            <CheckCircle size={20} style={{ color: '#1A7A4A', marginTop: 2, flexShrink: 0 }} />
            <div>
              <p className="font-body text-sm font-bold" style={{ color: '#065F46' }}>Sale S250157 created. Distribution rows generated automatically.</p>
              <Link to="/sales" className="font-body text-sm font-medium mt-2 inline-block hover:underline" style={{ color: '#C9A84C' }}>Back to Sales →</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
