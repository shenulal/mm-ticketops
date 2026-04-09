import { useState } from 'react';
import { useAppContext, type Contract } from '@/context/AppContext';
import MasterPage, { FieldRow, SectionHeading, StatusBadge, TypeBadge, FormField, inputCls, selectCls, textareaCls, type ColumnDef, type FilterDef } from '@/components/MasterPage';
import { toast } from 'sonner';

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  PURCHASE: { bg: 'bg-destructive/10', text: 'text-destructive' },
  SALE: { bg: 'bg-success/15', text: 'text-success' },
};
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: 'bg-success/15', text: 'text-success' },
  EXPIRED: { bg: 'bg-muted', text: 'text-muted-foreground' },
  TERMINATED: { bg: 'bg-destructive/10', text: 'text-destructive' },
};

export default function ContractsPage() {
  const ctx = useAppContext();

  const getPartyName = (c: Contract) => {
    if (c.partyType === 'VENDOR') return ctx.getVendor(c.partyId)?.name ?? c.partyId;
    return ctx.getClient(c.partyId)?.companyName ?? c.partyId;
  };

  const filters: FilterDef[] = [
    { id: 'contractType', label: 'Type', options: [{ value: 'PURCHASE', label: 'Purchase' }, { value: 'SALE', label: 'Sale' }] },
    { id: 'status', label: 'Status', options: [{ value: 'ACTIVE', label: 'Active' }, { value: 'EXPIRED', label: 'Expired' }, { value: 'TERMINATED', label: 'Terminated' }] },
  ];

  const columns: ColumnDef<Contract>[] = [
    { key: 'ref', header: 'Contract Ref', render: c => <span className="font-mono text-[12px]">{c.contractRef}</span> },
    { key: 'type', header: 'Type', render: c => <TypeBadge type={c.contractType} colorMap={TYPE_COLORS} /> },
    { key: 'party', header: 'Party', render: c => (
      <div><div className="font-medium">{getPartyName(c)}</div><div className="text-[10px] text-muted-foreground">{c.partyType}</div></div>
    )},
    { key: 'event', header: 'Event', render: c => ctx.getEvent(c.eventId)?.name ?? c.eventId },
    { key: 'period', header: 'Valid Period', render: c => <span className="text-[12px]">{c.validFrom} — {c.validTo}</span> },
    { key: 'value', header: 'Max Value', render: c => ctx.formatCurrency(c.maxValue) },
    { key: 'status', header: 'Status', render: c => <TypeBadge type={c.status} colorMap={STATUS_COLORS} /> },
  ];

  const renderDrawer = (contract: Contract, onClose: () => void) => {
    const ev = ctx.getEvent(contract.eventId);
    const daysLeft = contract.status === 'ACTIVE' ? Math.max(0, Math.floor((new Date(contract.validTo).getTime() - Date.now()) / 86400000)) : 0;
    return (
      <div>
        <SectionHeading title="Contract Details" />
        <FieldRow label="Reference" value={contract.contractRef} />
        <FieldRow label="Type"><TypeBadge type={contract.contractType} colorMap={TYPE_COLORS} /></FieldRow>
        <FieldRow label="Status"><TypeBadge type={contract.status} colorMap={STATUS_COLORS} /></FieldRow>
        <FieldRow label="Party" value={`${getPartyName(contract)} (${contract.partyType})`} />
        <FieldRow label="Event" value={ev?.name ?? contract.eventId} />
        <FieldRow label="Valid Period">{contract.validFrom} — {contract.validTo}{contract.status === 'ACTIVE' && <span className="ml-2 text-[11px] text-success">({daysLeft}d remaining)</span>}</FieldRow>
        <FieldRow label="Payment Terms" value={contract.paymentTerms || '—'} />
        <FieldRow label="Currency" value={contract.currency} />
        <FieldRow label="Max Value" value={ctx.formatCurrency(contract.maxValue)} />
        {contract.documentUrl && <FieldRow label="Document"><a href={contract.documentUrl} target="_blank" rel="noreferrer" className="text-primary underline text-[12px]">View Document ↗</a></FieldRow>}
        {contract.notes && <><SectionHeading title="Notes" /><p className="text-[13px] font-body text-muted-foreground">{contract.notes}</p></>}

        <div className="mt-6 flex gap-3">
          {contract.status === 'ACTIVE' && (
            <button onClick={() => { ctx.updateContract(contract.id, { status: 'TERMINATED' }); toast.success('Contract terminated'); onClose(); }}
              className="px-4 py-2 rounded-xl text-[13px] font-body font-medium bg-destructive/10 text-destructive hover:bg-destructive/20">
              Terminate
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderCreate = (onClose: () => void) => <ContractForm onClose={onClose} />;

  return (
    <MasterPage<Contract>
      title="Contracts"
      entityName="Contract"
      data={ctx.contracts}
      columns={columns}
      filters={filters}
      searchFields={c => `${c.contractRef} ${getPartyName(c)} ${c.contractType} ${c.status}`}
      getId={c => c.id}
      getIsActive={c => c.status === 'ACTIVE'}
      renderDrawer={renderDrawer}
      renderCreateModal={renderCreate}
      writeRoles={['super_admin', 'event_admin', 'ops_manager']}
    />
  );
}

function ContractForm({ onClose }: { onClose: () => void }) {
  const ctx = useAppContext();
  const [form, setForm] = useState({ contractRef: '', contractType: 'PURCHASE' as Contract['contractType'], partyType: 'VENDOR' as 'VENDOR' | 'CLIENT', partyId: '', eventId: '', validFrom: '', validTo: '', paymentTerms: '', currency: 'AED', maxValue: 0, notes: '', documentUrl: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const upd = (k: string, v: string | number) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => { const n = { ...p }; delete n[k]; return n; }); };

  const parties = form.partyType === 'VENDOR'
    ? ctx.vendors.filter(v => v.isActive).map(v => ({ id: v.id, name: v.name }))
    : ctx.clients.filter(c => c.isActive).map(c => ({ id: c.id, name: c.companyName }));
  const activeCurrencies = ctx.currencies.filter(c => c.isActive);

  const save = () => {
    const e: Record<string, string> = {};
    if (!form.contractRef.trim()) e.contractRef = 'Required';
    if (!form.partyId) e.partyId = 'Required';
    if (!form.eventId) e.eventId = 'Required';
    if (!form.validFrom) e.validFrom = 'Required';
    if (!form.validTo) e.validTo = 'Required';
    if (Object.keys(e).length) { setErrors(e); return; }
    ctx.addContract({ ...form, status: 'ACTIVE' });
    toast.success(`Contract "${form.contractRef}" created`);
    onClose();
  };

  return (
    <div className="space-y-4">
      <FormField label="Contract Reference" required error={errors.contractRef}><input className={inputCls} value={form.contractRef} onChange={e => upd('contractRef', e.target.value)} placeholder="e.g. 2025-200001" /></FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Contract Type" required><select className={selectCls} value={form.contractType} onChange={e => upd('contractType', e.target.value)}><option value="PURCHASE">Purchase</option><option value="SALE">Sale</option></select></FormField>
        <FormField label="Party Type" required><select className={selectCls} value={form.partyType} onChange={e => { upd('partyType', e.target.value); upd('partyId', ''); }}><option value="VENDOR">Vendor</option><option value="CLIENT">Client</option></select></FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={form.partyType === 'VENDOR' ? 'Vendor' : 'Client'} required error={errors.partyId}>
          <select className={selectCls} value={form.partyId} onChange={e => upd('partyId', e.target.value)}>
            <option value="">Select...</option>
            {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </FormField>
        <FormField label="Event" required error={errors.eventId}>
          <select className={selectCls} value={form.eventId} onChange={e => upd('eventId', e.target.value)}>
            <option value="">Select...</option>
            {ctx.events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Valid From" required error={errors.validFrom}><input className={inputCls} type="date" value={form.validFrom} onChange={e => upd('validFrom', e.target.value)} /></FormField>
        <FormField label="Valid To" required error={errors.validTo}><input className={inputCls} type="date" value={form.validTo} onChange={e => upd('validTo', e.target.value)} /></FormField>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <FormField label="Payment Terms"><input className={inputCls} value={form.paymentTerms} onChange={e => upd('paymentTerms', e.target.value)} placeholder="Net 30" /></FormField>
        <FormField label="Currency"><select className={selectCls} value={form.currency} onChange={e => upd('currency', e.target.value)}>{activeCurrencies.map(c => <option key={c.id} value={c.code}>{c.code} — {c.name}</option>)}</select></FormField>
        <FormField label="Max Value"><input className={inputCls} type="number" value={form.maxValue || ''} onChange={e => upd('maxValue', Number(e.target.value))} /></FormField>
      </div>
      <FormField label="Document URL"><input className={inputCls} value={form.documentUrl} onChange={e => upd('documentUrl', e.target.value)} placeholder="https://..." /></FormField>
      <FormField label="Notes"><textarea className={textareaCls} rows={2} value={form.notes} onChange={e => upd('notes', e.target.value)} /></FormField>
      <div className="flex justify-end gap-3 pt-4">
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-body text-muted-foreground hover:text-foreground">Cancel</button>
        <button onClick={save} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-body font-medium hover:opacity-90">Save Contract</button>
      </div>
    </div>
  );
}
