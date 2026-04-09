import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MOCK_MATCHES } from '@/data/mockData';
import { Lock, Loader2, CheckCircle, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';

const VENDORS = [
  { value: 'poxami', label: 'poxami', contract: '2025-100129' },
  { value: 'viagogo', label: 'viagogo', contract: '2025-100888' },
  { value: 'stubhub', label: 'StubHub', contract: '' },
];
const CATEGORIES = ['Top Cat 1', 'Cat 2', 'Cat 3', 'Cat 4', 'Cat 5'];

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
  const [form, setForm] = useState<FormState>({
    matchId: 'm01',
    vendor: '',
    contract: '',
    category: 'Top Cat 1',
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
  const firstErrorRef = useRef<HTMLElement | null>(null);

  const set = (key: keyof FormState, value: string | Date) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: false }));
  };

  const handleVendorChange = (vendor: string) => {
    set('vendor', vendor);
    const v = VENDORS.find(v => v.value === vendor);
    if (v && v.contract) {
      set('contract', v.contract);
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
      errors[field] ? 'border-2 border-danger' : 'border border-border focus:ring-1 focus:ring-gold'
    } bg-bg-card`;

  const labelClass = "block font-body text-sm font-medium mb-1.5";
  const helperError = "font-body text-xs mt-1";

  const match = MOCK_MATCHES.find(m => m.id === form.matchId);

  return (
    <div className="max-w-[700px] mx-auto mt-8 pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 font-body text-sm" style={{ color: '#6B7280' }}>
        <Link to="/purchases" className="hover:underline" style={{ color: '#C9A84C' }}>Purchases</Link>
        <ChevronRight size={14} />
        <span>New Purchase</span>
      </div>

      <h1 className="font-display text-[28px] mb-1" style={{ color: '#0B2D5E' }}>New Purchase Entry</h1>
      <p className="font-body text-sm mb-6" style={{ color: '#6B7280' }}>
        All fields marked * are required. Contract auto-fills on vendor selection.
      </p>

      <div className="bg-bg-card rounded-xl shadow-sm p-8 space-y-6">
        {/* Field 1: Active Event */}
        <div>
          <label className={labelClass} style={{ color: '#1A1A2E' }}>Active Event</label>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-body text-sm" style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}>
              <Lock size={12} /> FIFA World Cup 2026
            </span>
          </div>
          <p className="font-body text-xs mt-1" style={{ color: '#6B7280' }}>Change event from the sidebar switcher</p>
        </div>

        {/* Field 2: Match */}
        <div>
          <label className={labelClass} style={{ color: '#1A1A2E' }}>Match *</label>
          <select
            data-field="matchId"
            value={form.matchId}
            onChange={e => set('matchId', e.target.value)}
            className={inputClass('matchId')}
          >
            <option value="">Select a match</option>
            {MOCK_MATCHES.map(m => (
              <option key={m.id} value={m.id}>{m.code} — {m.teams}  |  {m.date}</option>
            ))}
          </select>
          {errors.matchId && <p className={helperError} style={{ color: '#DC2626' }}>This field is required</p>}
        </div>

        {/* Field 3: Vendor */}
        <div>
          <label className={labelClass} style={{ color: '#1A1A2E' }}>Vendor *</label>
          <select
            data-field="vendor"
            value={form.vendor}
            onChange={e => handleVendorChange(e.target.value)}
            className={inputClass('vendor')}
          >
            <option value="">Select vendor</option>
            {VENDORS.map(v => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
          {errors.vendor && <p className={helperError} style={{ color: '#DC2626' }}>This field is required</p>}
        </div>

        {/* Field 4: Contract */}
        <div>
          <label className={labelClass} style={{ color: '#1A1A2E' }}>
            Contract No. *
            {autoFilled && (
              <span className="ml-2 px-1.5 py-0.5 rounded font-body text-[11px] font-medium" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                Auto-filled
              </span>
            )}
          </label>
          <input
            data-field="contract"
            type="text"
            value={form.contract}
            onChange={e => { set('contract', e.target.value); setAutoFilled(false); }}
            className={cn(inputClass('contract'), contractFlash && 'ring-2 ring-gold/60 bg-gold-light/30')}
            style={{ transition: 'all 0.3s ease' }}
          />
          {errors.contract && <p className={helperError} style={{ color: '#DC2626' }}>This field is required</p>}
        </div>

        {/* Field 5: Category */}
        <div>
          <label className={labelClass} style={{ color: '#1A1A2E' }}>Category *</label>
          <select
            data-field="category"
            value={form.category}
            onChange={e => set('category', e.target.value)}
            className={inputClass('category')}
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          {errors.category && <p className={helperError} style={{ color: '#DC2626' }}>This field is required</p>}
        </div>

        {/* Field 6: Quantity */}
        <div>
          <label className={labelClass} style={{ color: '#1A1A2E' }}>Quantity *</label>
          <input
            data-field="qty"
            type="number"
            min={1}
            step={1}
            value={form.qty}
            onChange={e => set('qty', e.target.value)}
            placeholder="0"
            className={inputClass('qty')}
          />
          {errors.qty && <p className={helperError} style={{ color: '#DC2626' }}>This field is required</p>}
          {qtyNum > 0 && (
            <p className="font-body text-xs mt-1" style={{ color: '#6B7280' }}>
              This will automatically generate <strong>{qtyNum}</strong> individual unit records
            </p>
          )}
        </div>

        {/* Field 7: Price */}
        <div>
          <label className={labelClass} style={{ color: '#1A1A2E' }}>Price per Ticket (AED) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm font-medium" style={{ color: '#6B7280' }}>AED</span>
            <input
              data-field="price"
              type="number"
              min={0}
              step={0.01}
              value={form.price}
              onChange={e => set('price', e.target.value)}
              placeholder="0.00"
              className={cn(inputClass('price'), 'pl-12')}
            />
          </div>
          {errors.price && <p className={helperError} style={{ color: '#DC2626' }}>This field is required</p>}
          {qtyNum > 0 && priceNum > 0 && (
            <p className="font-body text-sm font-bold mt-2" style={{ color: '#0B2D5E' }}>
              Total Value: AED {totalValue.toLocaleString()}
            </p>
          )}
        </div>

        {/* Field 8: Date */}
        <div>
          <label className={labelClass} style={{ color: '#1A1A2E' }}>Purchase Date *</label>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(inputClass('date'), 'flex items-center gap-2 text-left')}
              >
                <CalendarIcon size={14} style={{ color: '#6B7280' }} />
                {format(form.date, 'dd MMM yyyy')}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={form.date}
                onSelect={d => d && set('date', d)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Field 9: Notes */}
        <div>
          <label className={labelClass} style={{ color: '#1A1A2E' }}>Notes (optional)</label>
          <textarea
            value={form.notes}
            onChange={e => e.target.value.length <= 500 && set('notes', e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="e.g. Block allocation from venue section C, entrance 4"
            className="w-full px-3 py-2.5 rounded-lg font-body text-sm border border-border outline-none focus:ring-1 focus:ring-gold bg-bg-card resize-none"
          />
          <p className="text-right font-body text-xs mt-1" style={{ color: '#9CA3AF' }}>
            {form.notes.length} / 500
          </p>
        </div>

        {/* Actions */}
        {!success ? (
          <>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-12 rounded-xl font-body text-sm font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-70"
              style={{ backgroundColor: '#0B2D5E', color: 'white' }}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Generating unit records...</>
              ) : (
                'Save Purchase'
              )}
            </button>
            <div className="text-center">
              <button
                onClick={() => navigate('/purchases')}
                className="font-body text-sm hover:underline"
                style={{ color: '#6B7280' }}
              >
                Cancel and go back
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: '#D1FAE5', borderLeft: '4px solid #1A7A4A' }}>
              <CheckCircle size={20} style={{ color: '#1A7A4A', marginTop: 2, flexShrink: 0 }} />
              <div>
                <p className="font-body text-sm font-bold" style={{ color: '#065F46' }}>
                  Purchase PUR-004 created successfully.
                </p>
                <p className="font-body text-sm mt-1" style={{ color: '#065F46' }}>
                  {qtyNum} unit records generated automatically: P00087 – P{String(86 + qtyNum).padStart(5, '0')}
                </p>
                <div className="flex gap-4 mt-3">
                  <Link to="/purchases" className="font-body text-sm font-medium hover:underline" style={{ color: '#C9A84C' }}>
                    View Purchase Units →
                  </Link>
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setForm({ matchId: 'm01', vendor: '', contract: '', category: 'Top Cat 1', qty: '', price: '', date: new Date(), notes: '' });
                      setAutoFilled(false);
                    }}
                    className="font-body text-sm font-medium hover:underline"
                    style={{ color: '#C9A84C' }}
                  >
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
