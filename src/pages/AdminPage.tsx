import { useParams } from 'react-router-dom';

const PAGE_INFO: Record<string, { title: string; description: string }> = {
  users: { title: 'Users & Roles', description: 'Manage user accounts, role assignments, and event access.' },
  notifications: { title: 'Notification Templates', description: 'Configure email and in-app notification templates.' },
};

export default function AdminPage() {
  const { section } = useParams<{ section: string }>();
  const info = PAGE_INFO[section ?? ''] ?? { title: 'Administration', description: '' };

  // For /admin/users, redirect to the existing UsersPage component logic
  // For now show placeholder
  return (
    <div>
      <h1 className="font-display text-[26px] mb-2 text-primary">{info.title}</h1>
      <p className="font-body text-sm text-muted-foreground mb-6">{info.description}</p>
      <div className="bg-card rounded-xl shadow-sm border border-border p-8 text-center">
        <p className="font-body text-muted-foreground">
          {info.title} management interface coming soon.
        </p>
      </div>
    </div>
  );
}
