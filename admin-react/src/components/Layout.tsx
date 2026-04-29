import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Layers,
  HelpCircle,
  Tag,
  Settings,
  BarChart3,
  LogOut,
  ShieldCheck,
  CreditCard,
  Activity,
  Wand2,
  Library,
  Activity as ActivityIcon,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import CommandPalette from './CommandPalette';

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; soon?: boolean };

const nav: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/topics', label: 'Topics', icon: BookOpen },
  { to: '/topics/new', label: 'Add Topic (AI)', icon: Wand2 },
  { to: '/topics/health', label: 'Topic Health', icon: ActivityIcon },
  { to: '/content', label: 'Content Library', icon: Library },
  { to: '/flashcards', label: 'Flashcards', icon: Layers },
  { to: '/quizzes', label: 'Quizzes', icon: HelpCircle },
  { to: '/coupons', label: 'Coupons', icon: Tag },
  { to: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/activity', label: 'Activity Log', icon: Activity },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-ink-line bg-white">
        <div className="flex items-center gap-2.5 px-6 py-5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow">
            <ShieldCheck className="text-white" size={18} />
          </span>
          <div className="font-display text-[16px] font-bold text-ink">IntelliCert</div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `group flex items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-body hover:bg-slate-50 hover:text-ink'
                } ${item.soon ? 'pointer-events-none opacity-50' : ''}`
              }
            >
              <span className="flex items-center gap-2.5">
                <item.icon size={16} />
                {item.label}
              </span>
              {item.soon && (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  Soon
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink-line p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 font-display text-[13px] font-bold text-white">
              {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-ink">
                {user?.name || user?.email}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-brand-600">{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm w-full">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-8 py-10">
          <Outlet />
        </div>
      </main>

      {/* Global command palette (Ctrl/Cmd+K) */}
      <CommandPalette />
    </div>
  );
}
