import { useState } from 'react';
import { useAppContext, type Venue } from '@/context/AppContext';
import MasterPage, { FieldRow, SectionHeading, StatusBadge, FormField, inputCls, selectCls, textareaCls, type ColumnDef } from '@/components/MasterPage';
import { toast } from 'sonner';

export default function VenuesPage() {
  const ctx = useAppContext();

  const getMatchCount = (venueId: string) => ctx.matches.filter(m => m.venueId === venueId).length;

  const columns: ColumnDef<Venue>[] = [
    { key: 'name', header: 'Venue Name', render: v => <span className="font-medium">{v.name}</span> },
    { key: 'city', header: 'City', render: v => v.city },
    { key: 'country', header: 'Country', render: v => v.country },
    { key: 'capacity', header: 'Capacity', render: v => v.capacity > 0 ? v.capacity.toLocaleString() : '—' },
    { key: 'timezone', header: 'Timezone', render: v => <span className="text-[11px] font-mono">{v.timezone}</span> },
    { key: 'matches', header: 'Matches Using', render: v => {
      const count = getMatchCount(v.id);
      return <span className="text-[12px]">{count} match{count !== 1 ? 'es' : ''}</span>;
    }},
    { key: 'active', header: 'Status', render: v => <StatusBadge active={v.isActive} />, width: '100px' },
  ];

  const renderDrawer = (venue: Venue, onClose: () => void) => {
    const venueMatches = ctx.matches.filter(m => m.venueId === venue.id);
    return (
      <div>
        <SectionHeading title="Venue Details" />
        <FieldRow label="Name" value={venue.name} />
        <FieldRow label="City" value={venue.city} />
        <FieldRow label="Country" value={venue.country} />
        <FieldRow label="Capacity" value={venue.capacity > 0 ? `${venue.capacity.toLocaleString()} seats` : '—'} />
        <FieldRow label="Address" value={venue.address || '—'} />
        <FieldRow label="Timezone" value={venue.timezone} />
        {venue.mapUrl && <FieldRow label="Map"><a href={venue.mapUrl} target="_blank" rel="noreferrer" className="text-primary underline text-[12px]">View Map ↗</a></FieldRow>}
        <FieldRow label="Status"><StatusBadge active={venue.isActive} /></FieldRow>
        {venue.notes && <><SectionHeading title="Notes" /><p className="text-[13px] font-body text-muted-foreground">{venue.notes}</p></>}

        <SectionHeading title="Matches Using This Venue" count={venueMatches.length} />
        {venueMatches.length === 0 ? (
          <p className="text-[12px] text-muted-foreground font-body">No matches assigned to this venue.</p>
        ) : venueMatches.map(m => {
          const ev = ctx.events.find(e => e.matches.some(mm => mm.id === m.id));
          return (
            <div key={m.id} className="py-2 border-b border-border/50">
              <div className="font-body text-[13px] font-medium text-foreground">{m.code} — {m.teams}</div>
              <div className="text-[11px] text-muted-foreground font-body">{ev?.name} · {m.date}</div>
            </div>
          );
        })}

        <div className="mt-6 flex gap-3">
          <button onClick={() => { ctx.updateVenue(venue.id, { isActive: !venue.isActive }); toast.success(`Venue ${venue.isActive ? 'deactivated' : 'activated'}`); onClose(); }}
            className={`px-4 py-2 rounded-xl text-[13px] font-body font-medium ${venue.isActive ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-success/10 text-success hover:bg-success/20'}`}>
            {venue.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    );
  };

  const renderCreate = (onClose: () => void) => <VenueForm onClose={onClose} />;

  return (
    <MasterPage<Venue>
      title="Venues"
      entityName="Venue"
      data={ctx.venues}
      columns={columns}
      searchFields={v => `${v.name} ${v.city} ${v.country} ${v.address}`}
      getId={v => v.id}
      getIsActive={v => v.isActive}
      renderDrawer={renderDrawer}
      renderCreateModal={renderCreate}
      writeRoles={['super_admin', 'event_admin', 'ops_manager']}
    />
  );
}

function VenueForm({ onClose }: { onClose: () => void }) {
  const { addVenue } = useAppContext();
  const [form, setForm] = useState({ name: '', city: '', country: '', capacity: 0, address: '', timezone: 'Asia/Dubai', mapUrl: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const upd = (k: string, v: string | number) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => { const n = { ...p }; delete n[k]; return n; }); };

  const save = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.city.trim()) e.city = 'Required';
    if (!form.country.trim()) e.country = 'Required';
    if (!form.timezone.trim()) e.timezone = 'Required';
    if (Object.keys(e).length) { setErrors(e); return; }
    addVenue({ ...form, isActive: true });
    toast.success(`Venue "${form.name}" created`);
    onClose();
  };

  return (
    <div className="space-y-4">
      <FormField label="Venue Name" required error={errors.name}><input className={inputCls} value={form.name} onChange={e => upd('name', e.target.value)} placeholder="e.g. Wembley Stadium" /></FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="City" required error={errors.city}><input className={inputCls} value={form.city} onChange={e => upd('city', e.target.value)} /></FormField>
        <FormField label="Country" required error={errors.country}><input className={inputCls} value={form.country} onChange={e => upd('country', e.target.value)} /></FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Capacity"><input className={inputCls} type="number" value={form.capacity || ''} onChange={e => upd('capacity', Number(e.target.value))} /></FormField>
        <FormField label="Timezone" required error={errors.timezone}><input className={inputCls} value={form.timezone} onChange={e => upd('timezone', e.target.value)} placeholder="e.g. Europe/London" /></FormField>
      </div>
      <FormField label="Address"><input className={inputCls} value={form.address} onChange={e => upd('address', e.target.value)} /></FormField>
      <FormField label="Map URL"><input className={inputCls} value={form.mapUrl} onChange={e => upd('mapUrl', e.target.value)} placeholder="https://maps.google.com/..." /></FormField>
      <FormField label="Notes"><textarea className={textareaCls} rows={3} value={form.notes} onChange={e => upd('notes', e.target.value)} /></FormField>
      <div className="flex justify-end gap-3 pt-4">
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-body text-muted-foreground hover:text-foreground">Cancel</button>
        <button onClick={save} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-body font-medium hover:opacity-90">Save Venue</button>
      </div>
    </div>
  );
}
