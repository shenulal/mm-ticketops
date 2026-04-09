import { useAppContext } from '@/context/AppContext';
import { getInventoryAvailable } from '@/data/mockData';
import { X, CheckCircle, AlertTriangle, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LineItemData {
  id: string;
  subGameId: string;
  categoryId: string;
  qty: string;
  price: string;
  lineNotes?: string;
  credentialId?: string;
}

interface LineItemCardProps {
  line: LineItemData;
  index: number;
  matchId: string;
  mode: 'PURCHASE' | 'SALE';
  canRemove: boolean;
  purchaseCode?: string;
  currencySymbol?: string;
  errors: Record<string, boolean>;
  onUpdate: (id: string, patch: Partial<LineItemData>) => void;
  onRemove: (id: string) => void;
  vendorId?: string;
  eventId?: string;
}

function PurchaseFeedback({ subGameId, categoryId, qty, lineNumber, purchaseCode }: {
  subGameId: string; categoryId: string; qty: number; lineNumber: number; purchaseCode: string;
}) {
  const ctx = useAppContext();
  if (!subGameId || !categoryId || qty <= 0) {
    return (
      <div className="rounded-lg px-3 py-2 bg-muted border border-border">
        <p className="font-body text-xs text-muted-foreground italic">Enter category and quantity to see unit details</p>
      </div>
    );
  }
  const sg = ctx.getSubGame(subGameId);
  const catLabel = sg?.categories.find(c => c.id === categoryId)?.displayName ?? categoryId;
  return (
    <div className="rounded-lg px-3 py-2 bg-[hsl(213_80%_96%)] border border-[hsl(213_80%_88%)]">
      <div className="flex items-center gap-2">
        <Layers size={14} className="text-[hsl(213_80%_40%)] shrink-0" />
        <p className="font-body text-xs text-[hsl(213_80%_30%)]">
          {qty} unit records will be auto-generated for {catLabel}
        </p>
      </div>
      <p className="font-mono text-[11px] text-muted-foreground mt-1">
        SetID: {purchaseCode}-L{lineNumber}-S01 · SetPos: 1–{qty}
      </p>
    </div>
  );
}

function SaleFeedback({ subGameId, categoryId, qty }: {
  subGameId: string; categoryId: string; qty: number;
}) {
  const ctx = useAppContext();
  if (!subGameId || !categoryId) {
    return (
      <div className="rounded-lg p-3 border border-border bg-muted">
        <p className="font-body text-xs text-muted-foreground">Select sub-game and category to check stock</p>
      </div>
    );
  }
  const available = getInventoryAvailable(subGameId, categoryId);
  const sg = ctx.getSubGame(subGameId);
  const catLabel = sg?.categories.find(c => c.id === categoryId)?.displayName ?? categoryId;
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
      <div className="rounded-lg p-3 border border-amber-400 bg-amber-50">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber-600 shrink-0" />
          <p className="font-body text-xs font-bold text-amber-800">
            {available} units available · close to limit · {remaining} will remain
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-lg p-3 border border-emerald-300 bg-emerald-50">
      <div className="flex items-center gap-2">
        <CheckCircle size={14} className="text-emerald-600 shrink-0" />
        <p className="font-body text-xs font-bold text-emerald-800">
          {available} {catLabel} units available · {remaining} will remain after this sale
        </p>
      </div>
      <div className="w-full h-1.5 rounded-full bg-emerald-200 mt-2">
        <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${Math.min((qty / available) * 100, 100)}%` }} />
      </div>
    </div>
  );
}

export default function LineItemCard({
  line, index, matchId, mode, canRemove, purchaseCode = 'PUR-001',
  currencySymbol = 'AED', errors, onUpdate, onRemove, vendorId, eventId,
}: LineItemCardProps) {
  const ctx = useAppContext();
  const isMultiSg = ctx.hasMultipleSubGames(matchId);
  const subGames = ctx.getSubGamesForMatch(matchId);
  const defaultSgId = !isMultiSg && subGames.length === 1 ? subGames[0].id : line.subGameId;
  const effectiveSgId = isMultiSg ? line.subGameId : defaultSgId;
  const categories = effectiveSgId ? ctx.getCategoriesForSubGame(effectiveSgId).filter(c => c.isActive) : [];

  if (!isMultiSg && subGames.length === 1 && line.subGameId !== subGames[0].id) {
    onUpdate(line.id, { subGameId: subGames[0].id });
  }

  // Credentials for purchase mode
  const credentials = mode === 'PURCHASE' && vendorId
    ? ctx.vendorCredentials.filter(c => c.vendorId === vendorId && c.active && (c.eventId === eventId || c.eventId === null))
    : [];

  // Auto-select single credential
  if (mode === 'PURCHASE' && credentials.length === 1 && !line.credentialId) {
    onUpdate(line.id, { credentialId: credentials[0].id });
  }

  const qty = parseInt(line.qty) || 0;
  const price = parseFloat(line.price) || 0;
  const lineTotal = qty * price;

  const inputCls = (field: string) =>
    `w-full h-10 px-3 rounded-lg font-body text-sm outline-none transition-all border ${
      errors[`${line.id}-${field}`] ? 'border-2 border-destructive' : 'border-border focus:ring-1 focus:ring-accent'
    } bg-card`;

  return (
    <div className={cn(
      "border rounded-xl p-5 relative transition-all",
      errors[`${line.id}-categoryId`] || errors[`${line.id}-qty`]
        ? "border-destructive/40"
        : (qty > 0 || line.categoryId) ? "border-primary/20" : "border-border",
      "bg-muted/30"
    )}>
      <div className="flex items-center justify-between mb-4">
        <span className="px-3 py-1 rounded-full font-body text-xs font-bold bg-primary/10 text-primary">
          Line {index + 1}
        </span>
        {canRemove && (
          <button onClick={() => onRemove(line.id)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Remove this line">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Row 1: Sub-game + Category */}
      <div className={`grid gap-4 mb-4 ${isMultiSg ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {isMultiSg && (
          <div>
            <label className="block font-body text-xs font-medium text-foreground mb-1.5">Session *</label>
            <select value={line.subGameId}
              onChange={e => onUpdate(line.id, { subGameId: e.target.value, categoryId: '' })}
              className={inputCls('subGameId')}>
              <option value="">Select session</option>
              {subGames.map(sg => <option key={sg.id} value={sg.id}>{sg.name} · {sg.startTime}</option>)}
            </select>
            {errors[`${line.id}-subGameId`] && <p className="font-body text-xs mt-1 text-destructive">Required</p>}
          </div>
        )}
        <div>
          <label className="block font-body text-xs font-medium text-foreground mb-1.5">Category *</label>
          <select value={line.categoryId}
            onChange={e => onUpdate(line.id, { categoryId: e.target.value })}
            className={inputCls('categoryId')} disabled={!effectiveSgId}>
            <option value="">{effectiveSgId ? 'Select category' : 'Select session first'}</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}
          </select>
          {errors[`${line.id}-categoryId`] && <p className="font-body text-xs mt-1 text-destructive">Required</p>}
        </div>
      </div>

      {/* Row 2: Qty + Price + Total */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block font-body text-xs font-medium text-foreground mb-1.5">Quantity *</label>
          <input type="number" min={1} value={line.qty}
            onChange={e => onUpdate(line.id, { qty: e.target.value })}
            placeholder="0" className={inputCls('qty')} />
          {errors[`${line.id}-qty`] && <p className="font-body text-xs mt-1 text-destructive">Required</p>}
        </div>
        <div>
          <label className="block font-body text-xs font-medium text-foreground mb-1.5">Price per Ticket ({currencySymbol}) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-xs text-muted-foreground">{currencySymbol}</span>
            <input type="number" min={0} step={0.01} value={line.price}
              onChange={e => onUpdate(line.id, { price: e.target.value })}
              placeholder="0.00" className={cn(inputCls('price'), 'pl-11')} />
          </div>
        </div>
        <div>
          <label className="block font-body text-xs font-medium text-foreground mb-1.5">Line Total</label>
          <div className="h-10 px-3 rounded-lg bg-card border border-border flex items-center font-mono text-sm font-semibold text-foreground">
            {qty > 0 && price > 0 ? `${currencySymbol} ${lineTotal.toLocaleString()}` : '—'}
          </div>
        </div>
      </div>

      {/* Purchase: Credential binding */}
      {mode === 'PURCHASE' && credentials.length > 0 && (
        <div className="mb-4">
          <label className="block font-body text-xs font-medium text-foreground mb-1.5">Vendor Credential</label>
          <select value={line.credentialId ?? ''}
            onChange={e => onUpdate(line.id, { credentialId: e.target.value || undefined })}
            className={inputCls('')}>
            <option value="">Select credential</option>
            {credentials.map(c => (
              <option key={c.id} value={c.id}>{c.loginId} — {c.email}{c.eventId ? '' : ' (Global)'}</option>
            ))}
          </select>
          {credentials.length === 1 && (
            <p className="font-body text-[11px] mt-1 text-muted-foreground">Auto-selected (only active credential)</p>
          )}
        </div>
      )}

      {/* Per-line notes */}
      <div className="mb-4">
        <label className="block font-body text-xs font-medium text-foreground mb-1.5">Line Notes</label>
        <input type="text" value={line.lineNotes ?? ''}
          onChange={e => onUpdate(line.id, { lineNotes: e.target.value })}
          placeholder="Optional notes for this line"
          className="w-full h-9 px-3 rounded-lg font-body text-sm border border-border outline-none focus:ring-1 focus:ring-accent bg-card" />
      </div>

      {/* Feedback */}
      {mode === 'PURCHASE' ? (
        <PurchaseFeedback subGameId={effectiveSgId} categoryId={line.categoryId}
          qty={qty} lineNumber={index + 1} purchaseCode={purchaseCode} />
      ) : (
        <SaleFeedback subGameId={effectiveSgId} categoryId={line.categoryId} qty={qty} />
      )}
    </div>
  );
}
