export default function SettingsPage() {
  return (
    <div>
      <h1 className="font-display text-[26px] mb-5" style={{ color: '#0B2D5E' }}>Settings</h1>
      <div className="bg-bg-card rounded-xl shadow-sm p-6 max-w-2xl">
        <h3 className="font-body text-sm font-bold mb-4" style={{ color: '#0B2D5E' }}>System Configuration</h3>
        <div className="space-y-4">
          {[
            ['Default Currency', 'AED'],
            ['Timezone', 'Asia/Dubai (GMT+4)'],
            ['Auto-generate Unit IDs', 'Enabled'],
            ['Oversell Threshold', 'Require Manager Approval'],
            ['Client Portal Expiry', '7 days'],
            ['Supplier Portal Expiry', '14 days'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#F3F4F6' }}>
              <span className="font-body text-sm" style={{ color: '#1A1A2E' }}>{label}</span>
              <span className="font-body text-sm" style={{ color: '#6B7280' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
