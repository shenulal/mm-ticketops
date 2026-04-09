import { useAppContext } from '@/context/AppContext';

export default function SettingsPage() {
  const { organisation, settings } = useAppContext();

  const rows = [
    ['Organisation', organisation.name],
    ['Default Currency', settings.defaultCurrency],
    ['Timezone', organisation.timezone],
    ['Auto-Suggest Allocation', settings.autoSuggestAllocation ? 'Enabled' : 'Disabled'],
    ['Allocation Strategy', settings.defaultAllocationStrategy],
    ['Oversell Default', settings.defaultAllowOversell ? 'Allowed' : 'Require Manager Approval'],
    ['Client Portal Expiry', `${settings.defaultPortalTokenExpiryDays} days`],
    ['Supplier Portal Expiry', `${settings.defaultPortalTokenExpiryDays} days`],
    ['Price Change Threshold', `${settings.priceChangeApprovalThreshold}%`],
    ['Dispatch Buffer', `${settings.defaultDispatchBufferHours} hours`],
    ['Session Timeout', `${settings.sessionTimeoutMinutes} min`],
    ['Audit Retention', `${settings.auditRetentionDays} days`],
  ];

  return (
    <div>
      <h1 className="font-display text-[26px] mb-5 text-primary">Settings</h1>
      <div className="bg-card rounded-xl shadow-sm p-6 max-w-2xl">
        <h3 className="font-body text-sm font-bold mb-4 text-primary">System Configuration</h3>
        <div className="space-y-4">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border">
              <span className="font-body text-sm text-foreground">{label}</span>
              <span className="font-body text-sm text-muted-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
