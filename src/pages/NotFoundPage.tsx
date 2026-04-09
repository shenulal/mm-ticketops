import { useLocation, useNavigate, Link } from 'react-router-dom';

const QUICK_LINKS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Events', path: '/events' },
  { label: 'Purchases', path: '/purchases' },
  { label: 'Sales', path: '/sales' },
  { label: 'Distribution', path: '/distribution' },
  { label: 'Reports', path: '/reports' },
];

export default function NotFoundPage() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center font-display text-2xl text-primary font-bold mb-6">T</div>
      <h1 className="font-display text-[80px] leading-none text-primary mb-2">404</h1>
      <p className="font-display text-xl text-foreground mb-2">Page not found</p>
      <p className="font-body text-sm text-muted-foreground mb-1">
        Could not find: <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{location.pathname}</code>
      </p>
      <p className="font-body text-sm text-muted-foreground mb-6">This page does not exist or you do not have access to it.</p>

      <div className="flex gap-3 mb-8">
        <button onClick={() => navigate('/dashboard')}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-body text-sm font-medium hover:opacity-90 transition-opacity">
          ← Go to Dashboard
        </button>
        <button onClick={() => { /* toast handled by import */ import('sonner').then(m => m.toast.info(`Issue logged — path: ${location.pathname}`)); }}
          className="px-5 py-2.5 rounded-xl border border-border text-foreground font-body text-sm font-medium hover:bg-muted transition-colors">
          Report this issue
        </button>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {QUICK_LINKS.map(link => (
          <Link key={link.path} to={link.path}
            className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-body text-xs hover:bg-muted/80 transition-colors">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
