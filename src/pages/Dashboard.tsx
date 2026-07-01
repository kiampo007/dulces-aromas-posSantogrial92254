import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  DollarSign, Package, AlertCircle, TrendingUp, LayoutGrid,
  BarChart3, Sparkles, Instagram, Moon, Sun, AlertTriangle,
  ChevronDown, Bell, Trophy, BarChart as BarChartIcon, Globe,
  Users, ShoppingBag, Clipboard, Lock, ChevronRight, Minus, Plus,
  QrCode, ClipboardList, X, CheckCircle,
} from 'lucide-react';
import { useDashboardData, formatCurrency } from '@/hooks/useDashboardData';
import type { DashboardData, StockItem, Achievement } from '@/hooks/useDashboardData';
import { useDarkMode } from '@/hooks/useDarkMode';
import { usePedidos } from '@/hooks/usePedidos';
import type { Pedido } from '@/hooks/usePedidos';
import { cn } from '@/lib/utils';

/* ───────────────────── animation constants ───────────────────── */
const easeOut = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];
const spring = { type: 'spring' as const, stiffness: 300, damping: 24 };

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: easeOut },
  }),
};

/* ───────────────────── AnimatedNumber ───────────────────── */
function AnimatedNumber({ value, prefix = '', suffix = '', duration = 0.6 }: {
  value: number; prefix?: string; suffix?: string; duration?: number;
}) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(motionValue, value, { duration, ease: 'easeOut' });
    return controls.stop;
  }, [value, motionValue, duration]);

  useEffect(() => {
    const unsub = rounded.on('change', (v) => setDisplay(v));
    return unsub;
  }, [rounded]);

  return <span>{prefix}{display.toLocaleString('es-ES').replace(/,/g, '.')}{suffix}</span>;
}

/* ───────────────────── Section wrapper ───────────────────── */
function Section({ children, className, delay = 0 }: {
  children: ReactNode; className?: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: easeOut }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════ 1. WELCOME BANNER ═══════════════════ */
function WelcomeBanner() {
  const now = new Date();
  const opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
  const dateStr = now.toLocaleDateString('es-ES', opts);

  return (
    <Section className="w-full" delay={0}>
      <div className="glass-panel rounded-lg p-5 lg:p-6 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, rgba(200,151,62,0.05) 0%, rgba(255,255,255,0.08) 100%)', backdropFilter: 'blur(20px)' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">👋</span>
            <h1 className="font-sans text-2xl font-semibold text-gray-800 dark:text-gray-100">
              Hola!
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aqui tienes el resumen de tu boutique
          </p>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-white/10 px-3 py-1.5 rounded-full capitalize">
          {dateStr}
        </span>
      </div>
    </Section>
  );
}

/* ═══════════════════ 2. KPI GRID ═══════════════════ */
const kpiConfig = [
  { key: 'ventasHoy' as const, label: 'VENTAS HOY', icon: DollarSign, color: '#00BCD4', colorClass: 'bg-[#00BCD4]/10 text-[#00BCD4]', borderColor: 'border-l-[#00BCD4]' },
  { key: 'inventario' as const, label: 'INVENTARIO', icon: Package, color: '#4CAF50', colorClass: 'bg-[#4CAF50]/10 text-[#4CAF50]', borderColor: 'border-l-[#4CAF50]' },
  { key: 'deudas' as const, label: 'DEUDAS', icon: AlertCircle, color: '#F59E0B', colorClass: 'bg-[#F59E0B]/10 text-[#F59E0B]', borderColor: 'border-l-[#F59E0B]' },
  { key: 'margen' as const, label: 'MARGEN', icon: TrendingUp, color: '#9C27B0', colorClass: 'bg-[#9C27B0]/10 text-[#9C27B0]', borderColor: 'border-l-[#9C27B0]' },
  { key: 'pedidosPendientes' as const, label: 'PEDIDOS', icon: ClipboardList, color: '#EF4444', colorClass: 'bg-[#EF4444]/10 text-[#EF4444]', borderColor: 'border-l-[#EF4444]' },
];

function KPICard({ config, value, index }: {
  config: typeof kpiConfig[0]; value: number; index: number;
}) {
  const Icon = config.icon;
  const isMargen = config.key === 'margen';
  const isCurrency = config.key === 'ventasHoy' || config.key === 'deudas';

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      transition={{ ...spring, y: { duration: 0.2 } }}
      className={cn(
        'bg-white dark:bg-[#12121A] rounded-md p-4 shadow-sm border-l-[3px] cursor-default',
        config.borderColor
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', config.colorClass)}>
          <Icon size={18} />
        </div>
      </div>
      <div className="font-sans text-2xl text-gray-800 dark:text-gray-100 mb-1">
        {isMargen ? (
          <AnimatedNumber value={value} suffix="%" />
        ) : isCurrency ? (
          <span>$ <AnimatedNumber value={value} /></span>
        ) : (
          <AnimatedNumber value={value} />
        )}
      </div>
      <div className="text-xs uppercase tracking-[0.1em] text-gray-500">
        {config.label}
      </div>
    </motion.div>
  );
}

function KPIGrid({ kpi }: { kpi: DashboardData['kpi'] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpiConfig.map((config, i) => (
        <KPICard
          key={config.key}
          config={config}
          value={kpi[config.key]}
          index={i + 1}
        />
      ))}
    </div>
  );
}

/* ═══════════════════ 3. QUICK ACTIONS ═══════════════════ */
const quickActions = [
  { label: 'Nueva Venta', icon: DollarSign, color: 'text-[#FFC107]', route: '/venta' },
  { label: 'Catalogo', icon: LayoutGrid, color: 'text-[#00BCD4]', route: '/catalogo' },
  { label: 'Deudas', icon: BarChart3, color: 'text-[#F59E0B]', route: '/deudas' },
  { label: 'Pedidos', icon: ClipboardList, color: 'text-[#EF4444]', action: 'view-pedidos' },
  { label: 'IA Buscar', icon: Sparkles, color: 'text-[#9C27B0]', route: '/busqueda' },
  { label: 'Redes', icon: Instagram, color: 'text-[#00BCD4]', external: 'https://instagram.com' },
  { label: 'QR Tienda', icon: QrCode, color: 'text-[#00BCD4]', action: 'qr-tienda' },
  { label: 'Modo Oscuro', icon: Moon, color: 'text-gray-500', toggle: 'theme' },
];

function QuickActions({ onQRAction, onPedidosAction }: { onQRAction: () => void; onPedidosAction: () => void }) {
  const { isDark, toggle } = useDarkMode();
  const navigate = useCallback((route: string) => {
    window.location.href = route;
  }, []);

  return (
    <Section delay={0.5}>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
        {quickActions.map((action, i) => {
          const isThemeToggle = action.toggle === 'theme';
          const isQRAction = action.action === 'qr-tienda';
          const isPedidosAction = action.action === 'view-pedidos';
          const label = isThemeToggle ? (isDark ? 'Modo Claro' : 'Modo Oscuro') : action.label;
          const ThemeIcon = isThemeToggle ? (isDark ? Sun : Moon) : null;

          return (
            <motion.button
              key={action.label}
              custom={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.06, duration: 0.35, ease: easeOut }}
              whileHover={{ scale: 1.08, boxShadow: '0 0 20px rgba(200,151,62,0.3)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (isThemeToggle) toggle();
                else if (isQRAction) onQRAction();
                else if (isPedidosAction) onPedidosAction();
                else if (action.external) window.open(action.external, '_blank');
                else if (action.route) navigate(action.route);
              }}
              className="flex flex-col items-center gap-2 min-w-[64px] flex-shrink-0"
            >
              <div className="w-14 h-14 rounded-full bg-white dark:bg-[#12121A] border border-gray-200 dark:border-white/[0.08] flex items-center justify-center shadow-sm transition-colors">
                {ThemeIcon ? (
                  <ThemeIcon size={22} className={action.color} />
                ) : (
                  <action.icon size={22} className={action.color} />
                )}
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 text-center leading-tight max-w-[64px]">
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </Section>
  );
}

/* ═══════════════════ 4. STOCK ALERTS ═══════════════════ */
function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="px-2.5 py-1 rounded-full text-xs bg-[#EF4444]/15 text-[#EF4444] font-medium">0</span>;
  if (stock <= 5) return <span className="px-2.5 py-1 rounded-full text-xs bg-[#F59E0B]/15 text-[#F59E0B] font-medium">{stock}</span>;
  return <span className="px-2.5 py-1 rounded-full text-xs bg-[#4CAF50]/15 text-[#4CAF50] font-medium">{stock}</span>;
}

function StockAlerts({ items, onUpdate }: { items: StockItem[]; onUpdate: (id: string, delta: number) => void }) {
  return (
    <Section delay={0.3}>
      <div className="bg-white dark:bg-[#12121A] rounded-md shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-[#F59E0B]" />
            <h3 className="font-sans text-xl text-gray-800 dark:text-gray-100">Alertas de Stock</h3>
            <span className="px-2.5 py-1 rounded-full text-xs bg-[#F59E0B]/15 text-[#F59E0B] font-medium">
              160 productos
            </span>
          </div>
          <button className="text-sm text-[#00BCD4] hover:underline flex items-center gap-1">
            Ver todo <ChevronRight size={14} />
          </button>
        </div>

        {/* List */}
        <div className="max-h-[300px] overflow-y-auto">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.04, duration: 0.3, ease: easeOut }}
              className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1 min-w-0 truncate pr-4">
                {item.name}
              </span>
              <span className="text-sm font-mono text-[#FFC107] mr-4 flex-shrink-0">
                {formatCurrency(item.price)}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => onUpdate(item.id, -1)}
                  className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                >
                  <Minus size={14} />
                </motion.button>
                <StockBadge stock={item.stock} />
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => onUpdate(item.id, 1)}
                  className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                >
                  <Plus size={14} />
                </motion.button>
              </div>
            </motion.div>
          ))}
          <div className="py-3 text-center text-sm text-[#00BCD4] cursor-pointer hover:underline">
            + 155 mas...
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════ 5. RECORDATORIOS ═══════════════════ */
function Recordatorios({ reminders }: { reminders: DashboardData['reminders'] }) {
  const [expanded, setExpanded] = useState(false);
  const totalAlerts = reminders.stockBajo.length + reminders.agotados.length;

  return (
    <Section delay={0.35}>
      <div className="bg-white dark:bg-[#12121A] rounded-md shadow-sm overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell size={20} className="text-gray-600 dark:text-gray-400" />
              {totalAlerts > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[10px] flex items-center justify-center font-bold">
                  {totalAlerts}
                </span>
              )}
            </div>
            <h3 className="font-sans text-xl text-gray-800 dark:text-gray-100">Recordatorios</h3>
            <span className="px-2.5 py-1 rounded-full text-xs bg-[#EF4444]/15 text-[#EF4444] font-medium">
              {totalAlerts} requieren atencion
            </span>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={20} className="text-gray-400" />
          </motion.div>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-4">
                {/* Stock Bajo */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Stock Bajo ({reminders.stockBajo.length} productos)
                    </span>
                  </div>
                  <div className="pl-4 space-y-1">
                    {reminders.stockBajo.map((item) => (
                      <p key={item.id} className="text-xs text-gray-500 dark:text-gray-400">
                        {item.name}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Agotados */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Agotados ({reminders.agotados.length} producto)
                    </span>
                  </div>
                  <div className="pl-4">
                    {reminders.agotados.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{item.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#EF4444]/15 text-[#EF4444] font-medium">
                          AGOTADO
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Section>
  );
}

/* ═══════════════════ 6. META DEL MES ═══════════════════ */
function MetaDelMes({ goal }: { goal: DashboardData['monthlyGoal'] }) {
  const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
  const remaining = Math.max(0, goal.target - goal.current);
  const dayAvg = goal.daysElapsed > 0 ? goal.current / goal.daysElapsed : 0;
  const projection = dayAvg * goal.totalDays;

  return (
    <Section delay={0.4}>
      <div className="bg-white dark:bg-[#12121A] rounded-md shadow-sm p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-[#FFC107]" />
            <h3 className="font-sans text-xl text-gray-800 dark:text-gray-100">Meta del Mes</h3>
          </div>
          <span className="text-xs text-gray-400">
            {goal.month} {goal.year}
          </span>
        </div>

        {/* Day tracker */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {goal.daysElapsed} de {goal.totalDays} dias
        </p>

        {/* Progress bar */}
        <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden mb-5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
            className="h-full rounded-full gradient-gold"
          />
        </div>

        {/* Financials */}
        <div className="text-center mb-4">
          <p className="font-sans text-2xl text-[#EF4444]">
            Faltan $ <AnimatedNumber value={remaining} />
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Proyeccion</p>
            <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
              {formatCurrency(Math.round(projection))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Prom/dia</p>
            <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
              {formatCurrency(Math.round(dayAvg))}
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════ 7. RENTABILIDAD ═══════════════════ */
const rentaTabs = ['Por Margen %', 'Por Ganancia $', 'Por Ventas'] as const;
type RentaTab = typeof rentaTabs[number];

function Rentabilidad({ data }: { data: DashboardData['profitability'] }) {
  const [activeTab, setActiveTab] = useState<RentaTab>('Por Margen %');

  const getValue = (p: typeof data.topProducts[0]) => {
    if (activeTab === 'Por Margen %') return p.margin;
    if (activeTab === 'Por Ganancia $') return p.gain;
    return p.sales;
  };

  const getSuffix = () => {
    if (activeTab === 'Por Margen %') return '%';
    if (activeTab === 'Por Ganancia $') return '';
    return '';
  };

  const maxVal = Math.max(...data.topProducts.map(getValue), 1);

  return (
    <Section delay={0.45}>
      <div className="bg-white dark:bg-[#12121A] rounded-md shadow-sm p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={18} className="text-[#9C27B0]" />
          <h3 className="font-sans text-xl text-gray-800 dark:text-gray-100">Rentabilidad</h3>
        </div>

        <p className="font-sans text-2xl text-[#9C27B0] mb-4">
          Margen promedio: {data.averageMargin}%
        </p>

        {/* Tab selector */}
        <div className="flex rounded-md bg-gray-100 dark:bg-white/10 p-1 mb-5">
          {rentaTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2 px-2 text-xs font-medium rounded-md transition-all duration-200',
                activeTab === tab
                  ? 'bg-[#00BCD4] text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Top products ranking */}
        <div className="space-y-3 mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Top productos</p>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {data.topProducts.map((product, i) => {
                const val = getValue(product);
                const barWidth = (val / maxVal) * 100;
                const rankColors = ['text-[#FFC107]', 'text-gray-400', 'text-[#A67C2E]'];

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.3 }}
                    className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-md px-2 py-1.5 transition-colors"
                  >
                    <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold', i < 3 ? rankColors[i] : 'text-gray-500')}>
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 min-w-0 truncate">
                      {product.name}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-20 h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidth}%` }}
                          transition={{ delay: 0.3 + i * 0.1, duration: 0.5, ease: easeOut }}
                          className="h-full rounded-full bg-[#9C27B0]"
                        />
                      </div>
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-400 w-12 text-right">
                        {activeTab === 'Por Ganancia $' ? formatCurrency(val) : `${val}${getSuffix()}`}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-3 gap-3">
          {data.categories.map((cat) => (
            <div key={cat.name} className="flex flex-col items-center p-3 rounded-md bg-gray-50 dark:bg-white/5">
              {/* Donut chart simulation */}
              <svg width="48" height="48" viewBox="0 0 48 48" className="mb-2">
                <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-200 dark:text-white/10" />
                <circle
                  cx="24" cy="24" r="18" fill="none" stroke="#9C27B0"
                  strokeWidth="6"
                  strokeDasharray={`${cat.margin * 1.13} ${113 - cat.margin * 1.13}`}
                  strokeDashoffset={-28.25}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
                <text x="24" y="27" textAnchor="middle" className="text-[10px] fill-gray-600 dark:fill-gray-400 font-mono">
                  {cat.margin}%
                </text>
              </svg>
              <span className="text-xs text-gray-600 dark:text-gray-400">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════ 8. LOGROS ═══════════════════ */
const achievementLabels: Record<string, string> = {
  'Inventario': 'Inventario',
  'Primera Venta': 'Primera Venta',
  'Vendedor': 'Vendedor',
  'Experto': 'Experto',
  'Cobrador': 'Cobrador',
  'Organizado': 'Organizado',
  'Tendencia': 'Tendencia',
  'Social': 'Social',
  'Meta': 'Meta',
  'Leyenda': 'Leyenda',
};

function Logros({ achievements }: { achievements: Achievement[] }) {
  const unlocked = achievements.filter(a => a.unlocked).length;
  const percent = Math.round((unlocked / achievements.length) * 100);

  return (
    <Section delay={0.5}>
      <div className="bg-white dark:bg-[#12121A] rounded-md shadow-sm p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-[#FFC107]" />
            <h3 className="font-sans text-xl text-gray-800 dark:text-gray-100">Logros</h3>
          </div>
          <span className="text-sm text-gray-500">
            {unlocked} de {achievements.length} desbloqueados ({unlocked > 0 ? percent : 0}%)
          </span>
        </div>

        {/* Horizontal scroll of badges */}
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-3 -mx-1 px-1">
          {achievements.map((ach, i) => (
            <motion.div
              key={ach.id}
              initial={ach.unlocked ? { scale: 0 } : { opacity: 0 }}
              animate={ach.unlocked ? { scale: 1 } : { opacity: 0.4 }}
              transition={ach.unlocked ? { type: 'spring', stiffness: 260, damping: 20, delay: 0.6 + i * 0.05 } : { delay: 0.6 + i * 0.05 }}
              className="flex flex-col items-center min-w-[72px] flex-shrink-0"
            >
              <div
                className={cn(
                  'w-[72px] h-[72px] rounded-full flex items-center justify-center border-2 mb-2',
                  ach.unlocked
                    ? 'bg-[#4CAF50]/15 border-[#FFC107] shadow-[0_0_12px_rgba(200,151,62,0.3)] animate-gold-pulse'
                    : 'bg-gray-100 dark:bg-white/5 border-gray-300 dark:border-white/10 grayscale'
                )}
              >
                {ach.unlocked ? (
                  <Package size={28} className="text-[#4CAF50]" />
                ) : (
                  <Lock size={24} className="text-gray-300 dark:text-gray-600" />
                )}
              </div>
              <span className={cn(
                'text-xs text-center leading-tight',
                ach.unlocked ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-400'
              )}>
                {achievementLabels[ach.name] || ach.name}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Expand link */}
        <button className="text-sm text-[#00BCD4] hover:underline flex items-center gap-1 mx-auto mt-2">
          Ver todos ({achievements.length - unlocked} por desbloquear) <ChevronRight size={14} />
        </button>
      </div>
    </Section>
  );
}

/* ═══════════════════ 9. ESTADISTICAS ═══════════════════ */
const chartTooltipStyle = {
  backgroundColor: 'rgba(26, 26, 46, 0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#F3F4F6',
};

function Estadisticas({ stats }: { stats: DashboardData['weeklyStats'] }) {
  const total = stats.reduce((s, d) => s + d.amount, 0);

  return (
    <Section delay={0.55}>
      <div className="bg-white dark:bg-[#12121A] rounded-md shadow-sm p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <BarChartIcon size={18} className="text-[#00BCD4]" />
            <h3 className="font-sans text-xl text-gray-800 dark:text-gray-100">Estadisticas</h3>
          </div>
          <span className="text-xs text-gray-400">Ultimos 7 dias</span>
        </div>

        <p className="font-sans text-2xl text-gray-800 dark:text-gray-100 mb-5">
          {formatCurrency(total)} <span className="text-sm text-gray-500 font-sans">esta semana</span>
        </p>

        {/* Bar chart */}
        <div className="h-[160px] w-full mb-5">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats} barCategoryGap="20%">
              <XAxis
                dataKey="short"
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {stats.map((entry, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={entry.amount > 0 ? '#00BCD4' : '#E5E7EB'}
                    className="transition-opacity hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-white/10">
          <div>
            <p className="text-xs text-gray-400 mb-2">Horas pico</p>
            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-[10px] text-gray-500">Manana</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-[10px] text-gray-500">Tarde</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-[10px] text-gray-500">Noche</span>
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Promedio diario</p>
            <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
              {formatCurrency(Math.round(total / 7))}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-1">Mejor dia</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {stats.reduce((best, s) => s.amount > best.amount ? s : best, stats[0])?.amount > 0
                ? stats.reduce((best, s) => s.amount > best.amount ? s : best, stats[0]).short
                : '—'}
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════ 10. BOUTIQUE SUMMARY ═══════════════════ */
function BoutiqueSummary({ summary }: { summary: DashboardData['boutiqueSummary'] }) {
  const items = [
    { label: 'Productos', value: summary.productos, icon: Package, color: 'text-[#4CAF50]' },
    { label: 'Ventas', value: summary.ventas, icon: ShoppingBag, color: 'text-[#00BCD4]' },
    { label: 'Clientes', value: summary.clientes, icon: Users, color: 'text-[#9C27B0]' },
    { label: 'Encargos', value: summary.encargos, icon: Clipboard, color: 'text-[#F59E0B]' },
  ];

  return (
    <Section delay={0.6}>
      <div className="bg-white dark:bg-[#12121A] rounded-md shadow-sm p-4">
        <div className="grid grid-cols-4 divide-x divide-gray-200 dark:divide-white/10">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 + i * 0.1, duration: 0.35 }}
                className="flex flex-col items-center gap-1 px-2 first:pl-0 last:pr-0"
              >
                <Icon size={16} className={item.color} />
                <span className="font-mono text-lg text-gray-800 dark:text-gray-100">
                  <AnimatedNumber value={item.value} />
                </span>
                <span className="text-xs text-gray-400">{item.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════ 11. TENDENCIAS MUNDIAL ═══════════════════ */
const trendTabs = [
  { key: 'dama' as const, label: 'Dama', count: 14 },
  { key: 'caballero' as const, label: 'Caballero', count: 14 },
  { key: 'unisex' as const, label: 'Unisex', count: 5 },
];

function TendenciasMundial({ trends }: { trends: DashboardData['trends'] }) {
  const [activeTab, setActiveTab] = useState<'dama' | 'caballero' | 'unisex'>('dama');
  const currentItems = trends[activeTab];

  return (
    <Section delay={0.65}>
      <div className="bg-white dark:bg-[#12121A] rounded-md shadow-sm p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-[#00BCD4]" />
            <h3 className="font-sans text-xl text-gray-800 dark:text-gray-100">Tendencias Mundial</h3>
            <span className="px-2.5 py-1 rounded-full text-xs bg-[#4CAF50]/15 text-[#4CAF50] font-medium">
              Datos en tiempo real
            </span>
          </div>
          <span className="text-xs text-gray-400">Jun 2026</span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-white/10 mb-4">
          {trendTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'relative px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'text-[#00BCD4] dark:text-[#FFC107]'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {tab.label} ({tab.count})
              {activeTab === tab.key && (
                <motion.div
                  layoutId="trendTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00BCD4] dark:bg-[#FFC107]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="max-h-[400px] overflow-y-auto space-y-1"
          >
            {currentItems.map((item, i) => (
              <motion.div
                key={`${activeTab}-${item.rank}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <span className={cn(
                  'w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0',
                  item.rank <= 3 ? 'text-[#FFC107]' : 'text-gray-500'
                )}>
                  {item.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {item.name}
                  </p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">—</span>
                <span className="text-xs text-gray-400 flex-shrink-0">{item.brand}</span>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <p className="text-xs text-gray-400 italic mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
          Fuentes: Fragrantica, ScentStore, IRFE, PerfumesClub, Real Men Real Style
        </p>
      </div>
    </Section>
  );
}

/* ═══════════════════ PEDIDOS MODAL ═══════════════════ */
function PedidosModal({ open, onClose, pedidos }: { open: boolean; onClose: () => void; pedidos: Pedido[] }) {
  if (!open) return null;
  const pendientes = pedidos.filter(p => p.estado === 'pendiente');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-[#12121A] rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <ClipboardList size={20} className="text-[#EF4444]" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Pedidos Pendientes</h3>
            <span className="px-2 py-0.5 rounded-full text-xs bg-[#EF4444]/15 text-[#EF4444] font-medium">
              {pendientes.length}
            </span>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {pendientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <CheckCircle size={48} className="mb-3 text-green-400 opacity-60" />
              <p className="text-sm">No hay pedidos pendientes</p>
              <p className="text-xs">Los pedidos de la tienda apareceran aqui</p>
            </div>
          ) : (
            pendientes.map(pedido => (
              <motion.div
                key={pedido.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{pedido.cliente}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#F59E0B]/15 text-[#F59E0B] font-medium uppercase">
                    {pedido.estado}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{pedido.telefono} {pedido.direccion ? `- ${pedido.direccion}` : ''}</p>
                <div className="space-y-1">
                  {pedido.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">{item.name} x{item.quantity}</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-white/10">
                  <span className="text-xs font-medium text-gray-500">
                    {new Date(pedido.fecha).toLocaleDateString('es-ES')}
                  </span>
                  <span className="text-sm font-bold text-[#00BCD4]">{formatCurrency(pedido.total)}</span>
                </div>
                {pedido.notas && <p className="text-xs text-gray-400 italic">{pedido.notas}</p>}
              </motion.div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-gray-100 dark:border-white/10">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#00BCD4] text-white rounded-lg font-medium hover:bg-[#00ACC1] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════ STORE QR MODAL ═══════════════════ */
function StoreQRModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-[#12121A] rounded-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-center text-gray-800 dark:text-gray-100">Dulces Aromas</h3>
        <div className="flex justify-center mb-4">
          <img src="/qr-code-placeholder.png" alt="QR Tienda" className="w-48 h-48" />
        </div>
        <p className="text-sm text-gray-500 text-center mb-4">Escanea para ver nuestra tienda</p>
        <button onClick={onClose} className="w-full py-2 bg-[#00BCD4] text-white rounded-lg hover:bg-[#00BCD4]/90 transition-colors">Cerrar</button>
      </div>
    </div>
  );
}

/* ═══════════════════ MAIN DASHBOARD ═══════════════════ */
export default function Dashboard() {
  const { data, updateStock, refreshPedidos } = useDashboardData();
  const { pedidos } = usePedidos();
  const [showStoreQR, setShowStoreQR] = useState(false);
  const [showPedidos, setShowPedidos] = useState(false);

  // Refresh pedidos count when modal opens
  const handleOpenPedidos = useCallback(() => {
    // refreshPedidos()
    setShowPedidos(true);
  }, [refreshPedidos]);

  return (
    <div className="space-y-5 pb-4">
      <WelcomeBanner />
      <KPIGrid kpi={data.kpi} />
      <QuickActions onQRAction={() => setShowStoreQR(true)} onPedidosAction={handleOpenPedidos} />
      <StockAlerts items={data.stockAlerts} onUpdate={updateStock} />
      <Recordatorios reminders={data.reminders} />
      <MetaDelMes goal={data.monthlyGoal} />
      <Rentabilidad data={data.profitability} />
      <Logros achievements={data.achievements} />
      <Estadisticas stats={data.weeklyStats} />
      <BoutiqueSummary summary={data.boutiqueSummary} />
      <TendenciasMundial trends={data.trends} />
      <StoreQRModal open={showStoreQR} onClose={() => setShowStoreQR(false)} />
      <PedidosModal open={showPedidos} onClose={() => setShowPedidos(false)} pedidos={pedidos} />
    </div>
  );
}
