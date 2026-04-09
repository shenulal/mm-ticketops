import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { User, Bell, Save } from 'lucide-react';

const inputCls = 'w-full px-3 py-2 rounded-xl border border-border bg-background text-[13px] font-body focus:outline-none focus:ring-2 focus:ring-primary/30';

export default function SupplierSettingsPage() {
  const { currentUser } = useAuth();
  const [contact, setContact] = useState({
    name: currentUser?.name ?? '',
    email: currentUser?.email ?? '',
    phone: '+33 1 2345 6789',
    timezone: 'Europe/Paris',
  });
  const [notifs, setNotifs] = useState({
    newAllocation: true,
    deliveryReminder: true,
    issueUpdates: true,
    weeklyDigest: false,
  });

  const handleSave = () => {
    toast.success('Settings saved');
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-heading text-[26px] text-foreground">Supplier Settings</h1>
        <p className="text-[13px] font-body text-muted-foreground">
          Manage your contact information and notification preferences.
        </p>
      </div>

      {/* Contact Info */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User size={16} className="text-primary" />
          <h2 className="font-body text-[15px] font-semibold text-foreground">Contact Information</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-body text-muted-foreground">Full Name</label>
            <input className={inputCls} value={contact.name} onChange={e => setContact(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="text-[11px] font-body text-muted-foreground">Email</label>
            <input className={inputCls} type="email" value={contact.email} onChange={e => setContact(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div>
            <label className="text-[11px] font-body text-muted-foreground">Phone</label>
            <input className={inputCls} value={contact.phone} onChange={e => setContact(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <div>
            <label className="text-[11px] font-body text-muted-foreground">Timezone</label>
            <select className={inputCls} value={contact.timezone} onChange={e => setContact(p => ({ ...p, timezone: e.target.value }))}>
              <option value="Europe/Paris">Europe/Paris</option>
              <option value="Asia/Dubai">Asia/Dubai</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Asia/Singapore">Asia/Singapore</option>
            </select>
          </div>
        </div>
        <p className="text-[11px] font-body text-muted-foreground italic">
          Vendor group: <span className="font-medium text-foreground">{currentUser?.vendorGroups?.join(', ').toUpperCase() ?? '—'}</span> (managed by MIRRA)
        </p>
      </div>

      {/* Notification Preferences */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Bell size={16} className="text-primary" />
          <h2 className="font-body text-[15px] font-semibold text-foreground">Notification Preferences</h2>
        </div>
        {[
          { key: 'newAllocation' as const, label: 'New ticket allocation', desc: 'When new tickets are allocated to your vendor group' },
          { key: 'deliveryReminder' as const, label: 'Delivery reminders', desc: 'Reminders for tickets approaching dispatch deadline' },
          { key: 'issueUpdates' as const, label: 'Issue updates', desc: 'When an issue you reported is resolved or updated' },
          { key: 'weeklyDigest' as const, label: 'Weekly digest', desc: 'Summary email every Monday with pending deliveries' },
        ].map(n => (
          <div key={n.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div>
              <p className="text-[13px] font-body text-foreground">{n.label}</p>
              <p className="text-[11px] font-body text-muted-foreground">{n.desc}</p>
            </div>
            <button onClick={() => setNotifs(p => ({ ...p, [n.key]: !p[n.key] }))}
              className={`w-10 h-5 rounded-full transition-colors relative ${notifs[n.key] ? 'bg-success' : 'bg-muted'}`}>
              <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${notifs[n.key] ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
        ))}
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-body font-medium hover:opacity-90 flex items-center gap-2">
          <Save size={14} /> Save Settings
        </button>
      </div>
    </div>
  );
}
