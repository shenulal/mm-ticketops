import { useParams, NavLink } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';

const SETTINGS_SECTIONS: Record<string, { title: string; description: string }> = {
  '': { title: 'Organisation Profile', description: 'Company details, branding, and contact information.' },
  'event-defaults': { title: 'Event Defaults', description: 'Default settings applied to new events.' },
  'rbac': { title: 'RBAC & Permissions', description: 'Role-based access control configuration.' },
  'notifications': { title: 'Notifications', description: 'Email and in-app notification settings.' },
  'allocation': { title: 'Allocation Rules', description: 'Default allocation strategy and oversell rules.' },
  'portal': { title: 'Portal Settings', description: 'Client and supplier portal configuration.' },
  'currency': { title: 'Currency & Pricing', description: 'Currency settings and pricing rules.' },
  'audit': { title: 'Audit & Compliance', description: 'Audit log retention and compliance settings.' },
  'integrations': { title: 'Integrations', description: 'Third-party service connections.' },
  'system': { title: 'System Info', description: 'System version, environment, and diagnostics.' },
};

export default function SettingsPage() {
  const { section } = useParams<{ section: string }>();
  const { organisation, settings } = useAppContext();
  const key = section ?? '';
  const info = SETTINGS_SECTIONS[key] ?? SETTINGS_SECTIONS[''];

  const renderContent = () => {
    if (key === '' || key === undefined) {
      return (
        <div className="space-y-4">
          {([
            ['Organisation Name', organisation.name],
            ['Address', organisation.address],
            ['Timezone', organisation.timezone],
            ['Default Currency', settings.defaultCurrency],
            ['Contact Email', organisation.contactEmail],
            ['Support Email', organisation.supportEmail],
            ['Website', organisation.website],
            ['Fiscal Year Start', `Month ${organisation.fiscalYearStart}`],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border">
              <span className="font-body text-sm text-foreground">{label}</span>
              <span className="font-body text-sm text-muted-foreground">{value}</span>
            </div>
          ))}
        </div>
      );
    }
    if (key === 'allocation') {
      return (
        <div className="space-y-4">
          {([
            ['Allocation Strategy', settings.defaultAllocationStrategy],
            ['Auto-Suggest', settings.autoSuggestAllocation ? 'Enabled' : 'Disabled'],
            ['Allow Oversell', settings.defaultAllowOversell ? 'Allowed' : 'Require Approval'],
            ['Price Change Threshold', `${settings.priceChangeApprovalThreshold}%`],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border">
              <span className="font-body text-sm text-foreground">{label}</span>
              <span className="font-body text-sm text-muted-foreground">{value}</span>
            </div>
          ))}
        </div>
      );
    }
    if (key === 'portal') {
      return (
        <div className="space-y-4">
          {([
            ['Portal Token Expiry', `${settings.defaultPortalTokenExpiryDays} days`],
            ['Reminder Interval', `${settings.portalReminderHours} hours`],
            ['Session Timeout', `${settings.sessionTimeoutMinutes} minutes`],
            ['Dispatch Buffer', `${settings.defaultDispatchBufferHours} hours`],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border">
              <span className="font-body text-sm text-foreground">{label}</span>
              <span className="font-body text-sm text-muted-foreground">{value}</span>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="text-center py-8">
        <p className="font-body text-muted-foreground">{info.title} configuration coming soon.</p>
      </div>
    );
  };

  return (
    <div>
      <h1 className="font-display text-[26px] mb-1 text-primary">{info.title}</h1>
      <p className="font-body text-sm text-muted-foreground mb-6">{info.description}</p>
      <div className="bg-card rounded-xl shadow-sm border border-border p-6 max-w-3xl">
        {renderContent()}
      </div>
    </div>
  );
}
