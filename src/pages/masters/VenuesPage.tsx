import { useState } from 'react';
import { useAppContext, type Venue } from '@/context/AppContext';
import MasterPage, { FieldRow, SectionHeading, StatusBadge, FormField, inputCls, selectCls, textareaCls, type ColumnDef } from '@/components/MasterPage';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function VenuesPage() {
  const ctx = useAppContext();

  const getVenueUsage = (venueId: string) => {
    const eventMap: Record<string, { eventName: string; matches: { code: string; teams: string; date: string }[] }> = {};
    ctx.events.forEach(ev => {
      ev.matches.filter(m => m.venueId === venueId).forEach(m => {
        if (!eventMap[ev.id]) eventMap[ev.id] = { eventName: ev.name, matches: [] };
        eventMap[ev.id].matches.push({ code: m.code, teams: m.teamsOrDescription, date: m.date });
      });
    });
    const matchCount = Object.values(eventMap).reduce((s, g) => s + g.matches.length, 0);
    const eventCount = Object.keys(eventMap).length;
    return { eventMap, matchCount, eventCount };
  };

  const columns: ColumnDef<Venue>[] = [
    { key: 'name', header: 'Venue Name', render: v => <span className="font-medium">{v.name}</span> },
    { key: 'city', header: 'City', render: v => v.city },
    { key: 'country', header: 'Country', render: v => v.country },
    { key: 'capacity', header: 'Capacity', render: v => v.capacity > 0 ? v.capacity.toLocaleString() : '—' },
    { key: 'timezone', header: 'Timezone', render: v => <span className="text-[11px] font-mono">{v.timezone}</span> },
    { key: 'matches', header: 'Used In', render: v => {
      const { eventMap, matchCount, eventCount } = getVenueUsage(v.id);
      if (matchCount === 0) return <span className="text-[12px] text-muted-foreground">Not used</span>;
      const tooltipLines = Object.values(eventMap).map(g =>
        `${g.eventName}: ${g.matches.map(m => m.code).join(', ')}`
      ).join('\n');
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[12px] cursor-default underline decoration-dotted underline-offset-2">
                {matchCount} match{matchCount !== 1 ? 'es' : ''} · {eventCount} event{eventCount !== 1 ? 's' : ''}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[280px] whitespace-pre-line text-[11px] font-body">
              {tooltipLines}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }},
    { key: 'active', header: 'Status', render: v => <StatusBadge active={v.isActive} />, width: '100px' },
  ];

  const renderDrawer = (venue: Venue, onClose: () => void) => {
    const { eventMap, matchCount } = getVenueUsage(venue.id);
    const activeMatchCount = ctx.events.flatMap(e => e.matches).filter(m => m.venueId === venue.id && m.isActive).length;

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

        <UsageAcrossEvents eventMap={eventMap} matchCount={matchCount} />

        <div className="mt-6 flex gap-3">
          <DeactivateButton venue={venue} activeMatchCount={activeMatchCount} onClose={onClose} />
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
      headerNote="Venues are global records. They are referenced by matches across all events. A venue does not belong to a specific event."
    />
  );
}

/* ── Usage Across Events (collapsible) ── */
function UsageAcrossEvents({ eventMap, matchCount }: { eventMap: Record<string, { eventName: string; matches: { code: string; teams: string; date: string }[] }>; matchCount: number }) {
  const [open, setOpen] = useState(matchCount > 0);
  return (
    <div className="mt-4">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 w-full text-left">
        {open ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
        <span className="font-body text-[13px] font-semibold text-foreground">Usage Across Events</span>
        <span className="text-[11px] text-muted-foreground">({matchCount})</span>
      </button>
      {open && (
        <div className="mt-2 ml-5 space-y-3">
          {matchCount === 0 ? (
            <p className="text-[12px] text-muted-foreground font-body italic">Not yet used in any matches.</p>
          ) : Object.values(eventMap).map((group, idx) => (
            <div key={idx}>
              <p className="font-body text-[13px] font-semibold text-foreground mb-1">{group.eventName}</p>
              {group.matches.map((m, mi) => (
                <div key={mi} className="text-[12px] font-body text-muted-foreground py-0.5 pl-3 border-l-2 border-border">
                  {m.code} — {m.teams} | {m.date}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Deactivate Button with dependency check ── */
function DeactivateButton({ venue, activeMatchCount, onClose }: { venue: Venue; activeMatchCount: number; onClose: () => void }) {
  const ctx = useAppContext();
  const [showWarning, setShowWarning] = useState(false);

  const handleClick = () => {
    if (venue.isActive && activeMatchCount > 0) {
      setShowWarning(true);
    } else {
      ctx.updateVenue(venue.id, { isActive: !venue.isActive });
      toast.success(`Venue ${venue.isActive ? 'deactivated' : 'activated'}`);
      onClose();
    }
  };

  const confirmDeactivate = () => {
    ctx.updateVenue(venue.id, { isActive: false });
    toast.success('Venue deactivated');
    onClose();
  };

  if (showWarning) {
    return (
      <div className="w-full space-y-3">
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-body text-[13px] font-medium text-amber-800">
              This venue is referenced by {activeMatchCount} active match{activeMatchCount !== 1 ? 'es' : ''}.
            </p>
            <p className="font-body text-[12px] text-amber-700 mt-1">
              Deactivating will not delete those matches but you should update them to use a different venue first.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={confirmDeactivate}
            className="px-4 py-2 rounded-xl text-[13px] font-body font-medium bg-destructive/10 text-destructive hover:bg-destructive/20">
            Deactivate Anyway
          </button>
          <button onClick={() => setShowWarning(false)}
            className="px-4 py-2 rounded-xl text-[13px] font-body font-medium text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button onClick={handleClick}
      className={`px-4 py-2 rounded-xl text-[13px] font-body font-medium ${venue.isActive ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-success/10 text-success hover:bg-success/20'}`}>
      {venue.isActive ? 'Deactivate' : 'Activate'}
    </button>
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
