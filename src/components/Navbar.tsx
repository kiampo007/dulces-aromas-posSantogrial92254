import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Grid3X3,
  BarChart3,
  FileText,
  MoreHorizontal,
  Plus,
  Moon,
  Sun,
  Maximize,
  Minimize,
  Search,
  Settings,
  X,
  Menu,
} from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { cn } from '@/lib/utils';
import LanguageSwitcher from './LanguageSwitcher';

/* ─── Desktop Sidebar Nav Items ─── */
const mainNavItems = [
  { path: '/dashboard', label: 'Inicio', icon: BarChart3 },
  { path: '/venta', label: 'Ventas', icon: DollarSign },
  { path: '/catalogo', label: 'Catálogo', icon: Grid3X3 },
  { path: '/deudas', label: 'Deudas', icon: FileText },
  { path: '/reportes', label: 'Reportes', icon: BarChart3 },
];

const bottomNavItems = [
  { path: '/busqueda', label: 'Búsqueda', icon: Search },
  { path: '/configuracion', label: 'Configuración', icon: Settings },
];

/* ─── Mobile Bottom Nav Items (5 + FAB) ─── */
const mobileNavItems = [
  { path: '/venta', label: 'Ventas', icon: DollarSign },
  { path: '/catalogo', label: 'Catálogo', icon: Grid3X3 },
  { path: '/_fab', label: 'Nueva Venta', icon: Plus },
  { path: '/deudas', label: 'Deudas', icon: FileText },
  { path: '/reportes', label: 'Reportes', icon: BarChart3 },
  { path: '/mas', label: 'Más', icon: MoreHorizontal },
];

/* ─── Status Bar Component ─── */
function StatusBar({ isDark }: { isDark: boolean }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [time, setTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const timer = setInterval(() => setTime(new Date()), 1000);
    const fsHandler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', fsHandler);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timer);
      document.removeEventListener('fullscreenchange', fsHandler);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const dateStr = time.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const timeStr = time.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className="flex items-center gap-3 text-xs font-sans">
      {/* Online indicator */}
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            'w-2 h-2 rounded-full',
            isOnline ? 'bg-success-mint' : 'bg-danger-rose'
          )}
        />
        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Clock */}
      <span
        className={cn(
          'font-mono font-semibold tabular-nums',
          isDark ? 'text-gray-300' : 'text-gray-700'
        )}
      >
        {timeStr}
      </span>

      {/* Date */}
      <span
        className={cn(
          'capitalize hidden sm:inline',
          isDark ? 'text-gray-400' : 'text-gray-500'
        )}
      >
        {dateStr}
      </span>

      {/* Fullscreen toggle */}
      <button
        onClick={toggleFullscreen}
        className={cn(
          'p-1 rounded-md transition-colors',
          isDark
            ? 'text-gray-400 hover:text-white hover:bg-white/10'
            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
        )}
        title="Pantalla completa"
      >
        {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
      </button>
    </div>
  );
}

/* ─── Desktop Sidebar ─── */
function DesktopSidebar({
  isDark,
  toggleDark,
}: {
  isDark: boolean;
  toggleDark: () => void;
}) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <aside className="hidden lg:flex flex-col w-[240px] min-h-[100dvh] fixed left-0 top-0 z-40 border-r bg-white dark:bg-[#12121A] dark:border-white/10 border-gray-200">
      {/* Logo area */}
      <div className="flex items-center gap-3 px-4 h-14 border-b dark:border-white/10 border-gray-200">
        <img
          src="/logo-dulces-aromas.svg"
          alt="Dulces Aromas"
          className="w-8 h-8"
        />
        <div className="flex flex-col">
          <span className="font-sans text-sm font-bold text-[#00BCD4] dark:text-[#FFC107] leading-tight">
            Dulces Aromas
          </span>
          <span className="text-[10px] font-sans text-gray-400 uppercase tracking-wider">
            POS
          </span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {mainNavItems.map((item) => {
          const isActive = currentPath === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-sans transition-colors duration-200',
                isActive
                  ? 'bg-[#e0f7fa] text-[#00BCD4] dark:bg-[#FFC107]/15 dark:text-[#FFC107] font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
              )}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-3 border-t dark:border-white/10 border-gray-200 space-y-1">
        {bottomNavItems.map((item) => {
          const isActive = currentPath === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-sans transition-colors duration-200',
                isActive
                  ? 'bg-[#e0f7fa] text-[#00BCD4] dark:bg-[#FFC107]/15 dark:text-[#FFC107] font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
              )}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-sans transition-colors duration-200 w-full',
            'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
          )}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
          <span>{isDark ? 'Modo claro' : 'Modo oscuro'}</span>
        </button>

        {/* Language switcher */}
        <LanguageSwitcher />
      </div>
    </aside>
  );
}

/* ─── Mobile Top Bar ─── */
function MobileTopBar({
  isDark,
  onMenuOpen,
}: {
  isDark: boolean;
  onMenuOpen: () => void;
}) {
  const location = useLocation();
  const pageNames: Record<string, string> = {
    '/dashboard': 'Inicio',
    '/venta': 'Ventas',
    '/catalogo': 'Catálogo',
    '/deudas': 'Deudas',
    '/reportes': 'Reportes',
    '/busqueda': 'Búsqueda',
    '/configuracion': 'Configuración',
    '/mas': 'Más',
  };
  const title = pageNames[location.pathname] || 'Dulces Aromas';

  return (
    <header
      className={cn(
        'lg:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 border-b',
        isDark
          ? 'bg-[#0d1b2a] border-white/10'
          : 'bg-[#f0f9ff] border-gray-200'
      )}
    >
      <button
        onClick={onMenuOpen}
        className={cn(
          'p-2 -ml-2 rounded-md',
          isDark
            ? 'text-gray-300 hover:bg-white/10'
            : 'text-gray-700 hover:bg-gray-100'
        )}
      >
        <Menu size={20} />
      </button>

      <h1
        className={cn(
          'font-sans text-base font-semibold absolute left-1/2 -translate-x-1/2',
          isDark ? 'text-white' : 'text-gray-800'
        )}
      >
        {title}
      </h1>

      <StatusBar isDark={isDark} />
    </header>
  );
}

/* ─── Mobile Bottom Navigation ─── */
function MobileBottomNav({ isDark }: { isDark: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className={cn(
        'lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t flex items-center justify-around px-2',
        'pb-[env(safe-area-inset-bottom)]',
        isDark
          ? 'bg-[#12121A] border-white/10'
          : 'bg-white border-gray-200'
      )}
    >
      {mobileNavItems.map((item) => {
        if (item.path === '/_fab') {
          /* FAB Nueva Venta */
          return (
            <button
              key="fab"
              onClick={() => navigate('/venta')}
              className="relative -mt-6 flex flex-col items-center"
            >
              <div className="w-14 h-14 rounded-full gradient-gold flex items-center justify-center shadow-glow-gold animate-gold-pulse">
                <Plus size={24} className="text-dark-slate" />
              </div>
              <span
                className={cn(
                  'text-[10px] mt-0.5 font-sans',
                  isDark ? 'text-gray-400' : 'text-gray-500'
                )}
              >
                {item.label}
              </span>
            </button>
          );
        }

        const isActive =
          item.path === '/mas'
            ? ['/busqueda', '/configuracion'].includes(location.pathname)
            : location.pathname === item.path;
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            to={item.path === '/mas' ? '/busqueda' : item.path}
            className="flex flex-col items-center justify-center gap-0.5 w-16 h-full relative"
          >
            {/* Active indicator bar */}
            {isActive && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full bg-[#00BCD4] dark:bg-[#FFC107]"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <Icon
              size={22}
              className={cn(
                'transition-colors duration-200',
                isActive
                  ? 'text-[#00BCD4] dark:text-[#FFC107]'
                  : isDark
                    ? 'text-gray-500'
                    : 'text-gray-400'
              )}
            />
            <span
              className={cn(
                'text-[10px] font-sans transition-colors duration-200',
                isActive
                  ? 'text-[#00BCD4] dark:text-[#FFC107] font-bold'
                  : isDark
                    ? 'text-gray-500'
                    : 'text-gray-400'
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/* ─── Mobile Menu Drawer ─── */
function MobileMenuDrawer({
  open,
  onClose,
  isDark,
  toggleDark,
}: {
  open: boolean;
  onClose: () => void;
  isDark: boolean;
  toggleDark: () => void;
}) {
  const location = useLocation();

  if (!open) return null;

  const allItems = [
    { path: '/dashboard', label: 'Inicio', icon: BarChart3 },
    { path: '/venta', label: 'Nueva Venta', icon: Plus },
    { path: '/catalogo', label: 'Catálogo', icon: Grid3X3 },
    { path: '/deudas', label: 'Deudas', icon: FileText },
    { path: '/reportes', label: 'Reportes', icon: BarChart3 },
    { path: '/busqueda', label: 'Búsqueda', icon: Search },
    { path: '/configuracion', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-[260px] flex flex-col',
          isDark ? 'bg-[#12121A]' : 'bg-white'
        )}
        initial={{ x: -260 }}
        animate={{ x: 0 }}
        exit={{ x: -260 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between px-4 h-14 border-b',
            isDark ? 'border-white/10' : 'border-gray-200'
          )}
        >
          <div className="flex items-center gap-3">
            <img
              src="/logo-dulces-aromas.svg"
              alt="Dulces Aromas"
              className="w-8 h-8"
            />
            <span
              className={cn(
                'font-sans text-sm font-bold',
                isDark ? 'text-[#FFC107]' : 'text-[#00BCD4]'
              )}
            >
              Dulces Aromas
            </span>
          </div>
          <button
            onClick={onClose}
            className={cn(
              'p-1.5 rounded-md',
              isDark
                ? 'text-gray-400 hover:bg-white/10'
                : 'text-gray-500 hover:bg-gray-100'
            )}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-1">
          {allItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-md text-sm font-sans transition-colors',
                  isActive
                    ? 'bg-[#e0f7fa] text-[#00BCD4] dark:bg-[#FFC107]/15 dark:text-[#FFC107] font-semibold'
                    : isDark
                      ? 'text-gray-300 hover:bg-white/5'
                      : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className={cn(
            'p-3 border-t space-y-1',
            isDark ? 'border-white/10' : 'border-gray-200'
          )}
        >
          <button
            onClick={toggleDark}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-sans w-full transition-colors',
              isDark
                ? 'text-gray-300 hover:bg-white/5'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
            <span>{isDark ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>
          <LanguageSwitcher />
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Desktop TopBar ─── */
function DesktopTopBar({ isDark }: { isDark: boolean }) {
  return (
    <header
      className={cn(
        'hidden lg:flex fixed top-0 right-0 left-[240px] z-30 h-14 items-center justify-end px-6 border-b',
        isDark
          ? 'bg-[#0d1b2a]/80 border-white/10'
          : 'bg-[#f0f9ff]/80 border-gray-200'
      )}
      style={{ backdropFilter: 'blur(12px)' }}
    >
      <StatusBar isDark={isDark} />
    </header>
  );
}

/* ─── Main Navbar Export ─── */
export default function Navbar() {
  const { isDark, toggle } = useDarkMode();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <DesktopSidebar isDark={isDark} toggleDark={toggle} />

      {/* Desktop top bar (status bar on right) */}
      <DesktopTopBar isDark={isDark} />

      {/* Mobile top bar */}
      <MobileTopBar isDark={isDark} onMenuOpen={() => setMobileMenuOpen(true)} />

      {/* Mobile bottom nav */}
      <MobileBottomNav isDark={isDark} />

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <MobileMenuDrawer
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          isDark={isDark}
          toggleDark={toggle}
        />
      )}
    </>
  );
}


