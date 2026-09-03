/**
 * Navigation (spec §20).
 * Desktop: a left control-panel rail. Mobile: a compact sticky top bar.
 * The active section is marked by a solid signal bar plus bold type, so the
 * indicator does not depend on colour alone.
 */
import {
  BookOpen,
  CircuitBoard,
  GitCompareArrows,
  Info,
  LayoutDashboard,
  ListTree,
} from 'lucide-react';
import type { ReactNode } from 'react';

export type PageId = 'home' | 'visualizer' | 'compare' | 'algorithms' | 'learn' | 'about';

interface NavItem {
  id: PageId;
  label: string;
  icon: ReactNode;
  code: string;
}

const NAV: NavItem[] = [
  { id: 'home', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, code: '00' },
  { id: 'visualizer', label: 'Visualizer', icon: <CircuitBoard className="h-4 w-4" />, code: '01' },
  { id: 'compare', label: 'Compare', icon: <GitCompareArrows className="h-4 w-4" />, code: '02' },
  { id: 'algorithms', label: 'Algorithms', icon: <ListTree className="h-4 w-4" />, code: '03' },
  { id: 'learn', label: 'Learn', icon: <BookOpen className="h-4 w-4" />, code: '04' },
  { id: 'about', label: 'About', icon: <Info className="h-4 w-4" />, code: '05' },
];

interface SidebarProps {
  page: PageId;
  onNavigate: (page: PageId) => void;
}

export function Sidebar({ page, onNavigate }: SidebarProps) {
  return (
    <nav
      aria-label="Main sections"
      className="hidden w-52 shrink-0 flex-col border-r border-ink bg-ink lg:flex"
    >
      {/* Machine plate */}
      <div className="scanlines border-b border-ink-3 px-3 py-3.5">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="block text-left"
          aria-label="SchedOS home"
        >
          <span className="tabular block text-lg leading-none font-bold tracking-tight text-bone">
            SCHED<span className="text-crt">OS</span>
          </span>
          <span className="label mt-1 block text-muted-2">Process Lab v1.0</span>
        </button>
      </div>

      <ul className="flex-1 py-2">
        {NAV.map((item) => {
          const active = page === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className={[
                  'group relative flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors',
                  active ? 'bg-ink-2 text-bone' : 'text-muted hover:bg-ink-2/60 hover:text-bone',
                ].join(' ')}
              >
                <span
                  aria-hidden="true"
                  className={[
                    'absolute top-0 left-0 h-full w-[3px] transition-colors',
                    active ? 'bg-crt' : 'bg-transparent group-hover:bg-muted-2/40',
                  ].join(' ')}
                />
                <span aria-hidden="true" className={active ? 'text-crt' : ''}>
                  {item.icon}
                </span>
                <span className={['flex-1 text-sm', active ? 'font-semibold' : ''].join(' ')}>
                  {item.label}
                </span>
                <span className="tabular text-[10px] text-muted-2">{item.code}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Status footer — reinforces the instrument metaphor */}
      <div className="border-t border-ink-3 px-3 py-2.5">
        <p className="tabular flex items-center gap-1.5 text-[10px] text-muted-2">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-crt blink" />
          SYSTEM READY
        </p>
        <p className="tabular mt-1 text-[10px] text-muted-2/70">8 ALGORITHMS LOADED</p>
      </div>
    </nav>
  );
}

/** Mobile navigation: a horizontally scrollable sticky bar (spec §20, §26). */
export function MobileNav({ page, onNavigate }: SidebarProps) {
  return (
    <nav
      aria-label="Main sections"
      className="sticky top-0 z-40 border-b border-ink bg-ink lg:hidden"
    >
      <div className="flex items-center justify-between px-3 py-2">
        <span className="tabular text-sm leading-none font-bold text-bone">
          SCHED<span className="text-crt">OS</span>
        </span>
        <span className="label text-muted-2">Process Lab v1.0</span>
      </div>
      <ul className="thin-scroll flex overflow-x-auto border-t border-ink-3">
        {NAV.map((item) => {
          const active = page === item.id;
          return (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className={[
                  'relative flex items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap transition-colors',
                  active ? 'text-bone' : 'text-muted-2',
                ].join(' ')}
              >
                <span
                  aria-hidden="true"
                  className={[
                    'absolute bottom-0 left-0 h-[3px] w-full',
                    active ? 'bg-crt' : 'bg-transparent',
                  ].join(' ')}
                />
                <span aria-hidden="true">{item.icon}</span>
                <span className={active ? 'font-semibold' : ''}>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Page header rail used at the top of each page body. */
export function PageHeader({
  code,
  title,
  subtitle,
  actions,
}: {
  code: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-3">
      <div className="min-w-0">
        <p className="label mb-1 text-muted-2">
          Module {code} <span className="mx-1 opacity-40">/</span> SchedOS
        </p>
        <h1 className="text-2xl leading-none font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-text/70">{subtitle}</p>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
