import { useAppContext } from '@/context/AppContext';
import { MOCK_USERS } from '@/data/mockData';
import { ExternalLink, Shield, Users } from 'lucide-react';

export default function SupplierPortalsPage() {
  const ctx = useAppContext();
  const supplierUsers = MOCK_USERS.filter(u => u.role === 'supplier');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-[26px] text-foreground">Supplier Portals</h1>
        <p className="font-body text-[13px] text-muted-foreground">Manage supplier portal access. Suppliers log in with their own credentials and see only their allocated tickets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <div className="flex items-center gap-2"><Users size={16} className="text-primary" /><span className="text-[12px] font-body text-muted-foreground">Active Suppliers</span></div>
          <p className="font-heading text-[28px] text-primary">{supplierUsers.length}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <div className="flex items-center gap-2"><Shield size={16} className="text-success" /><span className="text-[12px] font-body text-muted-foreground">Vendor Groups</span></div>
          <p className="font-heading text-[28px] text-success">{new Set(supplierUsers.flatMap(u => u.vendorGroups ?? [])).size}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <div className="flex items-center gap-2"><ExternalLink size={16} className="text-accent-foreground" /><span className="text-[12px] font-body text-muted-foreground">Portal URL</span></div>
          <p className="font-mono text-[13px] text-foreground">/supplier</p>
        </div>
      </div>

      {/* Supplier users table */}
      <div className="border border-border rounded-2xl overflow-hidden bg-card">
        <table className="w-full text-[13px] font-body">
          <thead>
            <tr className="bg-muted/50 text-left text-[11px] text-muted-foreground uppercase tracking-wider">
              <th className="px-4 py-3">Supplier User</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Vendor Groups</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {supplierUsers.map(u => (
              <tr key={u.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 flex-wrap">
                    {(u.vendorGroups ?? []).map(g => (
                      <span key={g} className="px-2 py-0.5 rounded-full text-[10px] font-body font-medium bg-accent/20 text-accent-foreground uppercase">{g}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-success text-[12px] flex items-center gap-1"><Shield size={12} /> Active</span>
                </td>
              </tr>
            ))}
            {supplierUsers.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No supplier users configured.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-muted/30 border border-border rounded-xl p-4">
        <p className="text-[12px] font-body text-muted-foreground">
          <strong>Security note:</strong> Supplier users only see purchase units from their assigned vendor groups.
          Client names, emails, sale prices, and internal notes are never exposed. Company value is redacted as "MIRRA".
        </p>
      </div>
    </div>
  );
}
