import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Home, BookOpen, Layers, HelpCircle, LogOut,
  BarChart3, GraduationCap, Calculator, Scale, Calendar, FileCheck,
  Flag, Zap, Hash, Workflow, Lock, Wind, FunctionSquare, Trophy, Medal, ListChecks,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import XpRewardToasts from './gamification/XpRewardToasts';
import SidebarDomainNav from './SidebarDomainNav';
import ImpersonationBanner from './ImpersonationBanner';

type NavItem = { to: string; label: string; icon: any; soon?: boolean; locked?: boolean };

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: '',
    items: [
      { to: '/', label: 'Home', icon: Home },
      { to: '/study', label: 'Study Hub', icon: BookOpen },
      { to: '/study/flashcards/all', label: 'Flashcards', icon: Layers },
      { to: '/study/quizzes/all', label: 'Quizzes', icon: HelpCircle },
    ],
  },
  {
    title: 'Exam Prep',
    items: [
      { to: '/calc-drill', label: 'Calc Drill', icon: Calculator },
      { to: '/formulas', label: 'Formula Guide', icon: FunctionSquare },
      { to: '/regulations', label: 'Regulations', icon: Scale },
      { to: '/study-plan', label: 'Study Plan', icon: Calendar },
      { to: '/study-guides', label: 'Study Guides (PDF)', icon: BookOpen },
      { to: '/exam-simulator', label: 'Exam Simulator', icon: FileCheck },
      { to: '/flagged', label: 'Flagged Questions', icon: Flag },
    ],
  },
  {
    title: 'Memory Tools',
    items: [
      { to: '/blitz', label: 'Blitz Mode', icon: Zap },
      { to: '/number-board', label: 'Number Board', icon: Hash },
      { to: '/concept-maps', label: 'Concept Maps', icon: Workflow },
      { to: '/visuals', label: 'Visual Library', icon: Sparkles },
      { to: '/syllabus', label: 'Syllabus Coverage', icon: BookOpen },
      { to: '/mastery', label: 'Mastery Library', icon: Trophy },
      { to: '/feynman', label: 'Teach It Back', icon: GraduationCap },
      { to: '/confusion-map', label: 'Confusion Map', icon: Workflow },
      { to: '/memory/revision-queue', label: 'Daily Revision Queue', icon: Layers },
    ],
  },
  {
    title: 'Tools',
    items: [
      { to: '/focus?next=/study', label: 'Focus Mode', icon: Wind },
      { to: '/stats', label: 'Progress', icon: BarChart3 },
      { to: '/gamification/profile', label: 'Gamification Profile', icon: Trophy },
      { to: '/gamification/missions', label: 'Missions', icon: ListChecks },
      { to: '/gamification/badges', label: 'Badge Gallery', icon: Medal },
      { to: '/gamification/achievements', label: 'Achievements', icon: Trophy },
      { to: '/gamification/leaderboard', label: 'Leaderboard', icon: BarChart3 },
    ],
  },
];

const [quickSection, ...restSections] = sections;

export default function Layout() {
  const { user, subscription, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <ImpersonationBanner />
      <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-line bg-white lg:flex">
        <Link to="/" className="flex items-center gap-2.5 px-6 py-5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow">
            <ShieldCheck className="text-white" size={18} />
          </span>
          <span className="font-display text-[16px] font-bold text-ink">IntelliCert</span>
        </Link>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-5">
          <div>
            {quickSection.title && (
              <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-muted">
                {quickSection.title}
              </div>
            )}
            <div className="space-y-0.5">
              {quickSection.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `group flex items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-ink-body hover:bg-slate-50 hover:text-ink'
                    } ${item.locked ? 'opacity-60' : ''}`
                  }
                  onClick={(e) => { if (item.locked) e.preventDefault(); }}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <item.icon size={15} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.locked && <Lock size={11} className="shrink-0 text-ink-muted" />}
                </NavLink>
              ))}
            </div>
          </div>

          <SidebarDomainNav />

          {restSections.map((section, si) => (
            <div key={si}>
              {section.title && (
                <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-muted">
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `group flex items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
                        isActive
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-ink-body hover:bg-slate-50 hover:text-ink'
                      } ${item.locked ? 'opacity-60' : ''}`
                    }
                    onClick={(e) => { if (item.locked) e.preventDefault(); }}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <item.icon size={15} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.locked && <Lock size={11} className="shrink-0 text-ink-muted" />}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="border-t border-ink-line p-4">
          {subscription && (
            <span className={`badge mb-2 ${subscription.plan === 'demo' ? 'badge-slate' : 'badge-brand'}`}>
              {subscription.plan}
              {subscription.days_remaining != null && ` · ${subscription.days_remaining}d`}
            </span>
          )}
          <div className="mb-3 flex items-center gap-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 font-display text-[12px] font-bold text-white">
              {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-semibold text-ink">{user?.name || user?.email}</div>
              <div className="truncate text-[10px] text-ink-dim">{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm w-full">
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-ink-line bg-white px-4 lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700">
            <ShieldCheck className="text-white" size={16} />
          </span>
          <span className="font-display text-[15px] font-bold text-ink">IntelliCert</span>
        </Link>
        <button onClick={handleLogout} className="btn btn-ghost btn-sm"><LogOut size={13} /></button>
      </header>

      {/* Main column */}
      <main className="relative flex-1 overflow-x-hidden">
        <XpRewardToasts />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-mesh-light" />
        <div className="relative">
          <Outlet />
        </div>
      </main>
      </div>
    </>
  );
}
