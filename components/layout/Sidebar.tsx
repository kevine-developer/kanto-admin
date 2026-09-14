'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from '@/lib/auth-client';
import {
  LayoutDashboard,
  BookOpen,
  ScrollText,
  Mic,
  Quote,
  Users,
  Settings2,
  CheckCheck,
  HelpCircle,
  Layers,
  Smartphone,
  Bell,
  Puzzle,
  Star,
  HeartHandshake,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Megaphone,
} from 'lucide-react';

interface AuthUser {
  name?: string | null;
  email?: string | null;
}

const COLLAPSED_W = 58;
const EXPANDED_W  = 220;

const NAV_GROUPS: { label: string; items: { href: string; icon: React.ElementType; label: string }[] }[] = [
  {
    label: 'Principal',
    items: [
      { href: '/',              icon: LayoutDashboard, label: "Vue d'ensemble" },
      { href: '/contributions', icon: HeartHandshake,  label: 'Contributions' },
    ],
  },
  {
    label: 'Patrimoine',
    items: [
      { href: '/contes',    icon: BookOpen,   label: 'Contes & Angano' },
      { href: '/proverbes', icon: ScrollText, label: 'Proverbes & Fady' },
      { href: '/kabary',    icon: Mic,        label: 'Discours & Kabary' },
      { href: '/citations', icon: Quote,      label: 'Citations & Auteurs' },
    ],
  },
  {
    label: 'Jeux',
    items: [
      { href: '/true-false',   icon: CheckCheck, label: 'Vrai ou Faux' },
      { href: '/word-puzzle',  icon: Puzzle,     label: "Remets dans l'ordre" },
      { href: '/missing-word', icon: HelpCircle, label: 'Mot Manquant' },
      { href: '/locks',        icon: Layers,     label: 'Catégories & Jeux' },
      { href: '/progression',  icon: Star,       label: 'Progression & XP' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/onboarding',    icon: Smartphone, label: 'Onboarding' },
      { href: '/notifications', icon: Bell,       label: 'Notifications' },
      { href: '/announcements', icon: Megaphone,  label: 'Annonces Système' },
      { href: '/users',         icon: Users,      label: 'Utilisateurs' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { data: session } = useSession();
  // Lazy initializer : lit localStorage au premier rendu sans useEffect
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('kanto-sidebar-collapsed');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('kanto-sidebar-collapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    const handleToggle = () => toggleCollapsed();
    window.addEventListener('kanto:toggle-sidebar', handleToggle);
    return () => window.removeEventListener('kanto:toggle-sidebar', handleToggle);
  }, []);

  const user    = session?.user as AuthUser | undefined;
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'A';

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (err) {
      console.error('Erreur déconnexion:', err);
    }
  };

  const w = collapsed ? COLLAPSED_W : EXPANDED_W;

  return (
    <>
      <aside
        className="flex flex-col shrink-0 h-screen sticky top-0 z-20 select-none overflow-hidden"
        style={{
          width: w,
          minWidth: w,
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-border)',
          transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1), min-width 0.22s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* ── Header : logo + toggle ──────────────────────────── */}
        <div
          className="h-12 flex items-center shrink-0 border-b border-[var(--sidebar-border)]"
          style={{
            padding: collapsed ? '0' : '0 12px',
            justifyContent: collapsed ? 'center' : 'space-between',
          }}
        >
          {collapsed ? (
            /* Mode replié (58px) : Logo interactif qui ouvre la navigation au clic */
            <button
              onClick={toggleCollapsed}
              title="Déplier la barre latérale"
              className="group relative w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer hover:bg-[var(--sidebar-hover)]"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm font-heritage leading-none transition-transform group-hover:scale-90"
                style={{ background: 'var(--sidebar-accent)', color: '#080B0F' }}
              >
                K
              </div>
              <div
                className="absolute inset-0 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(20, 24, 31, 0.94)' }}
              >
                <PanelLeftOpen size={16} style={{ color: 'var(--sidebar-accent)' }} />
              </div>
            </button>
          ) : (
            /* Mode déplié (220px) : Logo + Titre à gauche, bouton rétracter à droite */
            <>
              <div className="flex items-center gap-2.5 overflow-hidden">
                <button
                  onClick={toggleCollapsed}
                  title="Réduire la barre latérale"
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm font-heritage leading-none shrink-0 cursor-pointer hover:opacity-85 transition"
                  style={{ background: 'var(--sidebar-accent)', color: '#080B0F' }}
                >
                  K
                </button>
                <div className="flex flex-col leading-tight">
                  <span
                    className="text-sm font-bold font-heritage whitespace-nowrap leading-none"
                    style={{ color: 'var(--sidebar-fg)' }}
                  >
                    Kanto
                  </span>
                  <span
                    className="text-[10px] tracking-widest uppercase font-mono whitespace-nowrap"
                    style={{ color: 'var(--sidebar-muted)' }}
                  >
                    Admin
                  </span>
                </div>
              </div>

              {/* Bouton toggle réduction */}
              <button
                onClick={toggleCollapsed}
                title="Réduire la barre latérale"
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer hover:bg-[var(--sidebar-hover)]"
                style={{ color: 'var(--sidebar-muted)' }}
              >
                <PanelLeftClose size={15} />
              </button>
            </>
          )}
        </div>

        {/* ── Navigation ──────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 flex flex-col gap-0">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi}>
              {/* Divider entre groupes */}
              {gi > 0 && (
                <div
                  className="my-1.5"
                  style={{
                    height: '1px',
                    background: 'var(--sidebar-border)',
                    marginLeft: collapsed ? 12 : 12,
                    marginRight: collapsed ? 12 : 12,
                  }}
                />
              )}

              {/* Label du groupe (uniquement quand déplié) */}
              {!collapsed && (
                <div
                  className="px-3 pt-1 pb-1 text-[10px] font-mono uppercase tracking-wider whitespace-nowrap overflow-hidden"
                  style={{
                    color: 'var(--sidebar-muted)',
                    opacity: collapsed ? 0 : 0.6,
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  {group.label}
                </div>
              )}

              {/* Items */}
              <div className="px-2 flex flex-col gap-0.5">
                {group.items.map(({ href, icon: Icon, label }) => {
                  const isActive =
                    pathname === href ||
                    (href !== '/' && pathname.startsWith(href));

                  return (
                    <Link
                      key={href}
                      href={href}
                      title={collapsed ? label : undefined}
                      className="relative flex items-center gap-2.5 h-9 rounded-lg transition-colors overflow-hidden whitespace-nowrap"
                      style={{
                        padding: collapsed ? '0' : '0 10px',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        background: isActive ? 'var(--sidebar-active)' : 'transparent',
                        color: isActive ? 'var(--sidebar-fg)' : 'var(--sidebar-muted)',
                      }}
                    >
                      {/* Indicateur actif */}
                      {isActive && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full shrink-0"
                          style={{
                            width: '2px',
                            height: '16px',
                            background: 'var(--sidebar-accent)',
                          }}
                        />
                      )}

                      <Icon
                        size={15}
                        className="shrink-0"
                        style={{ color: isActive ? 'var(--sidebar-accent)' : 'var(--sidebar-muted)' }}
                      />

                      {/* Label (uniquement quand déplié) */}
                      <span
                        className="text-xs font-medium overflow-hidden"
                        style={{
                          maxWidth: collapsed ? 0 : 160,
                          opacity: collapsed ? 0 : 1,
                          transition: 'max-width 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.15s ease',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Footer ──────────────────────────────────────────── */}
        <div
          className="pt-2 pb-3 px-2 flex flex-col gap-0.5 shrink-0"
          style={{ borderTop: '1px solid var(--sidebar-border)' }}
        >
          {/* Paramètres (Lien vers /settings) */}
          <Link
            href="/settings"
            title="Paramètres & Configuration"
            className="group relative flex items-center gap-2.5 h-9 rounded-lg transition-colors cursor-pointer overflow-hidden whitespace-nowrap"
            style={{
              padding: collapsed ? '0' : '0 10px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: pathname === '/settings' ? 'var(--sidebar-active)' : 'transparent',
              color: pathname === '/settings' ? 'var(--sidebar-accent)' : 'var(--sidebar-muted)',
            }}
          >
            {/* Barre active */}
            {pathname === '/settings' && (
              <span
                className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r"
                style={{ background: 'var(--sidebar-accent)' }}
              />
            )}

            <Settings2
              size={15}
              className="shrink-0 transition-colors"
              style={{
                color: pathname === '/settings' ? 'var(--sidebar-accent)' : 'var(--sidebar-muted)',
              }}
            />

            <span
              className="text-xs font-medium"
              style={{
                maxWidth: collapsed ? 0 : 160,
                opacity: collapsed ? 0 : 1,
                transition: 'max-width 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.15s ease',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              Paramètres
            </span>

            {/* Tooltip en mode rétracté */}
            {collapsed && (
              <div
                className="fixed left-[64px] px-2 py-1 rounded-md text-[11px] font-medium shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap"
                style={{
                  background: '#1F242C',
                  color: '#E6EDF3',
                  border: '1px solid #2D333B',
                }}
              >
                Paramètres
              </div>
            )}
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Se déconnecter"
            className="relative flex items-center gap-2.5 h-9 rounded-lg transition-colors cursor-pointer overflow-hidden whitespace-nowrap"
            style={{
              padding: collapsed ? '0' : '0 10px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              color: 'var(--sidebar-muted)',
            }}
          >
            <LogOut size={15} className="shrink-0" style={{ color: 'var(--sidebar-muted)' }} />
            <span
              className="text-xs font-medium"
              style={{
                maxWidth: collapsed ? 0 : 160,
                opacity: collapsed ? 0 : 1,
                transition: 'max-width 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.15s ease',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              Déconnexion
            </span>
          </button>

          {/* Avatar */}
          <div
            className="flex items-center gap-2.5 h-9 rounded-lg overflow-hidden cursor-default"
            style={{
              padding: collapsed ? '0' : '0 10px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: 'var(--sidebar-hover)',
            }}
            title={user?.email || 'Administrateur'}
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs font-heritage shrink-0"
              style={{ background: 'var(--sidebar-accent)', color: '#080B0F' }}
            >
              {initial}
            </div>
            <div
              className="flex flex-col leading-tight"
              style={{
                maxWidth: collapsed ? 0 : 140,
                opacity: collapsed ? 0 : 1,
                transition: 'max-width 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.15s ease',
                overflow: 'hidden',
              }}
            >
              <span
                className="text-[11px] font-semibold whitespace-nowrap"
                style={{ color: 'var(--sidebar-fg)' }}
              >
                {user?.name || 'Administrateur'}
              </span>
              <span
                className="text-[10px] font-mono whitespace-nowrap"
                style={{ color: 'var(--sidebar-muted)' }}
              >
                {user?.email || 'admin@kanto.mg'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
