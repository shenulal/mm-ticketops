import { useState } from 'react';
import { useAppContext, type Currency } from '@/context/AppContext';
import MasterPage, { FieldRow, SectionHeading, StatusBadge, FormField, inputCls, type ColumnDef } from '@/components/MasterPage';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function CurrenciesPage() {
  const ctx = useAppContext();

  const columns: ColumnDef<Currency>[] = [
    { key: 'code', header: 'Code', render: c => (
      <div className="flex items-center gap-2">
        <span className="font-mono font-medium text-[13px]">{c.code}</span>
        {c.code === 'AED' && <Lock size={12} className="text-muted-foreground" />}
      </div>
    )},
    { key: 'name', header: 'Name', render: c => c.name },
    { key: 'symbol', header: 'Symbol', render: c => <span className="font-mono">{c.symbol}</span> },
    { key: 'rate', header: 'Rate to AED', render: c => (
      <span className="font-mono text-[12px]">{c.exchangeRateToAed.toFixed(4)}</span>
    )},
    { key: 'updated', header: 'Last Updated', render: c => <span className="text-[12px]">{c.lastUpdated}</span> },
    { key: 'active', header: 'Status', render: c => <StatusBadge active={c.isActive} />, width: '100px' },
  ];

  const renderDrawer = (currency: Currency, onClose: () => void) => {
    const isBase = currency.code === 'AED';
    const [rate, setRate] = useState(currency.exchangeRateToAed);
    const [editing, setEditing] = useState(false);

    const saveRate = () => {
      ctx.updateCurrency(currency.id, {
        exchangeRateToAed: rate,
        lastUpdated: new Date().toISOString().slice(0, 10),
      });
      toast.success(`${currency.code} rate updated to ${rate.toFixed(4)}`);
      setEditing(false);
    };

    return (
      <div>
        <SectionHeading title="Currency Details" />
        <FieldRow label="Code" value={currency.code} />
        <FieldRow label="Name" value={currency.name} />
        <FieldRow label="Symbol" value={currency.symbol} />
        <FieldRow label="Status"><StatusBadge active={currency.isActive} /></FieldRow>
        <FieldRow label="Last Updated" value={currency.lastUpdated} />

        <SectionHeading title="Exchange Rate" />
        {isBase ? (
          <div className="flex items-center gap-2 py-3 px-4 rounded-lg bg-muted/50">
            <Lock size={14} className="text-muted-foreground" />
            <span className="text-[12px] font-body text-muted-foreground">AED is the base currency — exchange rate is always 1.0000</span>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 py-2">
              <span className="text-[13px] font-body text-foreground">1 {currency.code} =</span>
              {editing ? (
                <input className={inputCls + ' w-[120px]'} type="number" step="0.0001" value={rate} onChange={e => setRate(Number(e.target.value))} />
              ) : (
                <span className="font-mono text-[14px] font-medium text-foreground">{rate.toFixed(4)}</span>
              )}
              <span className="text-[13px] font-body text-muted-foreground">AED</span>
            </div>
            <div className="mt-3 flex gap-3">
              {editing ? (
                <>
                  <button onClick={saveRate} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-body font-medium hover:opacity-90">Update Rate</button>
                  <button onClick={() => { setRate(currency.exchangeRateToAed); setEditing(false); }} className="px-4 py-2 rounded-xl text-[13px] font-body text-muted-foreground hover:text-foreground">Cancel</button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="px-4 py-2 rounded-xl bg-muted text-foreground text-[13px] font-body font-medium hover:bg-muted/80">Edit Rate</button>
              )}
            </div>
          </div>
        )}

        {!isBase && (
          <div className="mt-6 flex gap-3">
            <button onClick={() => { ctx.updateCurrency(currency.id, { isActive: !currency.isActive }); toast.success(`${currency.code} ${currency.isActive ? 'deactivated' : 'activated'}`); onClose(); }}
              className={`px-4 py-2 rounded-xl text-[13px] font-body font-medium ${currency.isActive ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-success/10 text-success hover:bg-success/20'}`}>
              {currency.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderCreate = (onClose: () => void) => <CurrencyForm onClose={onClose} />;

  return (
    <MasterPage<Currency>
      title="Currencies"
      entityName="Currency"
      data={ctx.currencies}
      columns={columns}
      searchFields={c => `${c.code} ${c.name} ${c.symbol}`}
      getId={c => c.id}
      getIsActive={c => c.isActive}
      renderDrawer={renderDrawer}
      renderCreateModal={renderCreate}
      writeRoles={['super_admin', 'event_admin']}
      extraHeaderContent={
        <span className="text-[11px] font-body text-muted-foreground ml-auto">
          Exchange rates are manually maintained. All values stored in AED.
        </span>
      }
    />
  );
}

function CurrencyForm({ onClose }: { onClose: () => void }) {
  const { addCurrency } = useAppContext();
  const [form, setForm] = useState({ code: '', name: '', symbol: '', exchangeRateToAed: 1 });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const upd = (k: string, v: string | number) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => { const n = { ...p }; delete n[k]; return n; }); };

  const save = () => {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = 'Required';
    if (!form.name.trim()) e.name = 'Required';
    if (!form.symbol.trim()) e.symbol = 'Required';
    if (form.exchangeRateToAed <= 0) e.exchangeRateToAed = 'Must be > 0';
    if (Object.keys(e).length) { setErrors(e); return; }
    addCurrency({ ...form, code: form.code.toUpperCase(), isActive: true, lastUpdated: new Date().toISOString().slice(0, 10) });
    toast.success(`Currency "${form.code.toUpperCase()}" created`);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <FormField label="Currency Code" required error={errors.code}><input className={inputCls} value={form.code} onChange={e => upd('code', e.target.value.toUpperCase())} placeholder="e.g. JPY" maxLength={3} /></FormField>
        <FormField label="Name" required error={errors.name}><input className={inputCls} value={form.name} onChange={e => upd('name', e.target.value)} placeholder="e.g. Japanese Yen" /></FormField>
        <FormField label="Symbol" required error={errors.symbol}><input className={inputCls} value={form.symbol} onChange={e => upd('symbol', e.target.value)} placeholder="e.g. ¥" /></FormField>
      </div>
      <FormField label="Exchange Rate to AED" required error={errors.exchangeRateToAed}>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-body text-muted-foreground">1 {form.code || '???'} =</span>
          <input className={inputCls + ' w-[140px]'} type="number" step="0.0001" value={form.exchangeRateToAed} onChange={e => upd('exchangeRateToAed', Number(e.target.value))} />
          <span className="text-[13px] font-body text-muted-foreground">AED</span>
        </div>
      </FormField>
      <div className="flex justify-end gap-3 pt-4">
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-body text-muted-foreground hover:text-foreground">Cancel</button>
        <button onClick={save} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-body font-medium hover:opacity-90">Save Currency</button>
      </div>
    </div>
  );
}
