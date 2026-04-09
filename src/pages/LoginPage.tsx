import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { MOCK_USERS } from '@/data/mockData';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@ticketops.ae');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email)) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm p-8 bg-bg-card rounded-lg shadow-lg border border-border">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-navy font-display text-xl font-bold">T</div>
          <span className="font-display text-2xl text-navy">TicketOps</span>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <select
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 border border-border rounded-md text-sm font-body bg-background text-foreground"
          >
            {MOCK_USERS.map(u => (
              <option key={u.id} value={u.email}>{u.name} ({u.role.replace('_', ' ')})</option>
            ))}
          </select>
          <button type="submit" className="w-full py-2.5 bg-navy text-primary-foreground rounded-md font-body text-sm font-medium hover:opacity-90 transition-opacity">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
