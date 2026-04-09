import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  time: string;
  body: string;
  link: string;
  linkLabel: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'error', title: 'Oversell Alert', time: '2 mins ago', body: 'Sale S250145 requires manager approval — Cat 2 oversold', link: '/sales', linkLabel: 'Review →', read: false },
  { id: 'n2', type: 'warning', title: 'Portal Submitted', time: '1 hour ago', body: 'Roadtrips submitted guest details for S250132 (12 tickets)', link: '/client-portal/demo-token-123', linkLabel: 'View Portal →', read: false },
  { id: 'n3', type: 'info', title: 'Dispatch Deadline', time: 'Today', body: 'M01 — 11 tickets not yet dispatched. 47 days to event.', link: '/staff-queue', linkLabel: 'View Queue →', read: false },
];

const DOT_COLORS = { error: '#DC2626', warning: '#D97706', info: '#3B82F6' };

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const handleLink = (link: string) => {
    setOpen(false);
    navigate(link);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative text-text-muted hover:text-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-danger rounded-full" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 w-[360px] bg-bg-card rounded-xl shadow-xl border z-50"
            style={{ borderColor: '#E5E7EB' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
              <span className="font-body text-sm font-bold" style={{ color: '#0B2D5E' }}>Notifications ({unreadCount})</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="font-body text-xs hover:underline" style={{ color: '#C9A84C' }}>Mark all read</button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.map(n => (
                <div key={n.id} className="px-4 py-3 border-b last:border-b-0 hover:bg-muted/30 transition-colors" style={{ borderColor: '#F3F4F6' }}>
                  <div className="flex items-start gap-2.5">
                    {!n.read && <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: DOT_COLORS[n.type] }} />}
                    {n.read && <div className="w-2 h-2 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-body text-sm font-bold" style={{ color: '#1A1A2E' }}>{n.title}</span>
                        <span className="font-body text-[11px]" style={{ color: '#9CA3AF' }}>{n.time}</span>
                      </div>
                      <p className="font-body text-xs mt-0.5" style={{ color: '#6B7280' }}>{n.body}</p>
                      <button onClick={() => handleLink(n.link)} className="font-body text-xs font-medium mt-1 hover:underline" style={{ color: '#C9A84C' }}>
                        {n.linkLabel}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
