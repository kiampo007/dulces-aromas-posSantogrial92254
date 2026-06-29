import type { JSX } from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  AlertCircle,
  Users,
  BarChart3,
  ChevronRight,
  Clock,
  Check,
  Trash2,
  Plus,
  ArrowLeft,
  Bell,
  FileX,
  Banknote,
  ArrowRightLeft,
  Wallet,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/* ─── Types ─── */
interface Payment {
  id: string;
  amount: number;
  method: 'efectivo' | 'transferencia' | 'otro';
  date: string;
  note?: string;
}

interface Debt {
  id: string;
  clientName: string;
  clientPhone?: string;
  totalAmount: number;
  paidAmount: number;
  remaining: number;
  status: 'activa' | 'vencida' | 'pagada';
  saleId: string;
  createdAt: string;
  dueDate?: string;
  payments: Payment[];
}

/* ─── Currency format ─── */
function fmt(n: number): string {
  return '$ ' + n.toLocaleString('es-CL');
}

/* ─── Date helpers ─── */
function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.floor(ms / 86400000);
}

function agingDays(createdAt: string): number {
  return daysBetween(createdAt, new Date().toISOString());
}

function agingColor(days: number): string {
  if (days <= 30) return 'text-[#4CAF50] bg-[#4CAF50]/10 border-success-mint/20';
  if (days <= 60) return 'text-[#FFA000] bg-[#FFA000]/10 border-warning-amber/20';
  if (days <= 90) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
  return 'text-danger-rose bg-danger-rose/10 border-danger-rose/20';
}

function agingBarColor(days: number): string {
  if (days <= 30) return 'bg-[#4CAF50]';
  if (days <= 60) return 'bg-[#FFA000]';
  if (days <= 90) return 'bg-orange-500';
  return 'bg-danger-rose';
}

/* ─── Mock Debts ─── */
const MOCK_DEBTS: Debt[] = [
  {
    id: 'd1',
    clientName: 'Maria Garcia',
    clientPhone: '+56912345678',
    totalAmount: 89000,
    paidAmount: 40000,
    remaining: 49000,
    status: 'activa',
    saleId: '0005',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    payments: [
      { id: 'pay1', amount: 40000, method: 'efectivo', date: new Date(Date.now() - 10 * 86400000).toISOString() },
    ],
  },
  {
    id: 'd2',
    clientName: 'Maria Garcia',
    totalAmount: 72000,
    paidAmount: 0,
    remaining: 72000,
    status: 'activa',
    saleId: '0012',
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    dueDate: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
    payments: [],
  },
  {
    id: 'd3',
    clientName: 'Carlos Mendez',
    clientPhone: '+56987654321',
    totalAmount: 125000,
    paidAmount: 125000,
    remaining: 0,
    status: 'pagada',
    saleId: '0003',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    dueDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    payments: [
      { id: 'pay2', amount: 60000, method: 'efectivo', date: new Date(Date.now() - 55 * 86400000).toISOString() },
      { id: 'pay3', amount: 65000, method: 'transferencia', date: new Date(Date.now() - 40 * 86400000).toISOString() },
    ],
  },
  {
    id: 'd4',
    clientName: 'Carlos Mendez',
    totalAmount: 54000,
    paidAmount: 0,
    remaining: 54000,
    status: 'vencida',
    saleId: '0018',
    createdAt: new Date(Date.now() - 100 * 86400000).toISOString(),
    dueDate: new Date(Date.now() - 70 * 86400000).toISOString().split('T')[0],
    payments: [],
  },
  {
    id: 'd5',
    clientName: 'Maria Garcia',
    totalAmount: 35000,
    paidAmount: 15000,
    remaining: 20000,
    status: 'activa',
    saleId: '0025',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    payments: [
      { id: 'pay4', amount: 15000, method: 'efectivo', date: new Date(Date.now() - 5 * 86400000).toISOString() },
    ],
  },
];

/* ─── Filter tabs ─── */
const FILTER_TABS = ['Todas', 'Activas', 'Vencidas', 'Pagadas'] as const;
type FilterTab = (typeof FILTER_TABS)[number];

/* ─── Main Page ─── */
export default function DeudasPage() {
  const [debts, setDebts] = useState<Debt[]>(() => {
    const stored = localStorage.getItem('debts');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.length > 0) return parsed;
    }
    localStorage.setItem('debts', JSON.stringify(MOCK_DEBTS));
    return MOCK_DEBTS;
  });

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('Todas');
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNewDebtModal, setShowNewDebtModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /* Persist */
  useEffect(() => {
    localStorage.setItem('debts', JSON.stringify(debts));
  }, [debts]);

  /* Sync selected debt if data changes */
  useEffect(() => {
    if (selectedDebt) {
      const updated = debts.find((d) => d.id === selectedDebt.id);
      if (updated) setSelectedDebt(updated);
    }
  }, [debts, selectedDebt?.id]);

  /* Derived */
  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      const matchFilter =
        activeFilter === 'Todas'
          ? true
          : activeFilter === 'Activas'
            ? d.status === 'activa'
            : activeFilter === 'Vencidas'
              ? d.status === 'vencida'
              : d.status === 'pagada';
      const q = search.toLowerCase();
      const matchSearch =
        !q || d.clientName.toLowerCase().includes(q) || d.saleId.includes(q);
      return matchFilter && matchSearch;
    });
  }, [debts, activeFilter, search]);

  const activeDebts = useMemo(() => debts.filter((d) => d.status === 'activa' || d.status === 'vencida'), [debts]);
  const totalOwed = useMemo(() => activeDebts.reduce((s, d) => s + d.remaining, 0), [activeDebts]);
  const uniqueClients = useMemo(() => new Set(activeDebts.map((d) => d.clientName)).size, [activeDebts]);
  const avgDebt = useMemo(() => (activeDebts.length > 0 ? Math.round(totalOwed / activeDebts.length) : 0), [activeDebts, totalOwed]);
  const overdueCount = useMemo(() => debts.filter((d) => d.status === 'vencida').length, [debts]);

  /* Actions */
  const handleAddPayment = useCallback(
    (debtId: string, amount: number, method: 'efectivo' | 'transferencia' | 'otro', note: string) => {
      setDebts((prev) =>
        prev.map((d) => {
          if (d.id !== debtId) return d;
          const newPaid = d.paidAmount + amount;
          const newRemaining = Math.max(0, d.totalAmount - newPaid);
          const payment: Payment = {
            id: crypto.randomUUID(),
            amount,
            method,
            date: new Date().toISOString(),
            note: note || undefined,
          };
          return {
            ...d,
            paidAmount: newPaid,
            remaining: newRemaining,
            status: newRemaining <= 0 ? 'pagada' : d.status,
            payments: [...d.payments, payment],
          };
        })
      );
      toast.success(`Pago de ${fmt(amount)} registrado`);
    },
    []
  );

  const handleMarkPaid = useCallback((debtId: string) => {
    setDebts((prev) =>
      prev.map((d) =>
        d.id === debtId
          ? {
              ...d,
              paidAmount: d.totalAmount,
              remaining: 0,
              status: 'pagada' as const,
              payments: [
                ...d.payments,
                {
                  id: crypto.randomUUID(),
                  amount: d.remaining,
                  method: 'otro' as const,
                  date: new Date().toISOString(),
                  note: 'Marcado como pagado',
                },
              ],
            }
          : d
      )
    );
    toast.success('Deuda marcada como pagada');
  }, []);

  const handleWriteOff = useCallback((debtId: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== debtId));
    toast.info('Deuda eliminada');
    setSelectedDebt(null);
    setShowDeleteConfirm(false);
  }, []);

  const handleSendReminder = useCallback((debt: Debt) => {
    toast.success(`Recordatorio enviado a ${debt.clientName}`);
  }, []);

  const handleNewDebt = useCallback(
    (clientName: string, totalAmount: number, dueDate: string, phone?: string) => {
      const newDebt: Debt = {
        id: crypto.randomUUID(),
        clientName,
        clientPhone: phone,
        totalAmount,
        paidAmount: 0,
        remaining: totalAmount,
        status: 'activa',
        saleId: 'MANUAL',
        createdAt: new Date().toISOString(),
        dueDate: dueDate || undefined,
        payments: [],
      };
      setDebts((prev) => [newDebt, ...prev]);
      toast.success('Deuda registrada');
      setShowNewDebtModal(false);
    },
    []
  );

  const handleSelectDebt = useCallback((debt: Debt) => {
    setSelectedDebt(debt);
    setShowMobileDetail(true);
  }, []);

  /* Status badge component */
  const StatusBadge = ({ status }: { status: Debt['status'] }) => {
    const map = {
      activa: { label: 'Activa', className: 'bg-[#FFA000]/10 text-[#FFA000] border-warning-amber/20' },
      vencida: { label: 'Vencida', className: 'bg-danger-rose/10 text-danger-rose border-danger-rose/20' },
      pagada: { label: 'Pagada', className: 'bg-[#4CAF50]/10 text-[#4CAF50] border-success-mint/20' },
    };
    const s = map[status];
    return (
      <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', s.className)}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 -m-4 lg:-m-6 min-h-[calc(100dvh-56px-64px)] lg:min-h-[calc(100dvh-56px)]">
      {/* ═══ LEFT: Debt List ═══ */}
      <div className="flex-1 min-w-0 flex flex-col p-4 lg:p-6">
        {/* Header */}
        <motion.div
          className="flex items-center gap-3 mb-5 flex-wrap"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-sans text-2xl font-bold text-gray-800 dark:text-gray-100">
            Deudas
          </h1>
          <div className="flex items-center gap-2 ml-auto">
            {overdueCount > 0 && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-danger-rose/10 text-danger-rose border border-danger-rose/20">
                Vencidas: {overdueCount}
              </span>
            )}
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#FFA000]/10 text-[#FFA000] border border-warning-amber/20">
              Activas: {activeDebts.length}
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-danger-rose/10 text-danger-rose border border-danger-rose/20">
              Total: {fmt(totalOwed)}
            </span>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          className="grid grid-cols-3 gap-3 mb-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SummaryCard
            label="Total Adeudado"
            value={fmt(totalOwed)}
            icon={AlertCircle}
            colorClass="text-danger-rose bg-danger-rose/10 border-danger-rose/20"
          />
          <SummaryCard
            label="Clientes Deudores"
            value={String(uniqueClients)}
            icon={Users}
            colorClass="text-[#FFA000] bg-[#FFA000]/10 border-warning-amber/20"
          />
          <SummaryCard
            label="Promedio Deuda"
            value={fmt(avgDebt)}
            icon={BarChart3}
            colorClass="text-[#00BCD4] bg-[#00BCD4]/10 border-info-cyan/20"
          />
        </motion.div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className={cn(
              'w-full pl-10 pr-10 py-2.5 rounded-full text-sm font-sans',
              'bg-white dark:bg-[#12121A] border border-gray-200 dark:border-white/10',
              'text-gray-800 dark:text-gray-100 placeholder:text-gray-400',
              'focus:outline-none focus:border-[#00BCD4] dark:focus:border-[#FFC107] focus:shadow-glow-cyan transition-all'
            )}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-white/10">
          {FILTER_TABS.map((tab) => {
            const count =
              tab === 'Todas'
                ? debts.length
                : debts.filter((d) =>
                    tab === 'Activas'
                      ? d.status === 'activa'
                      : tab === 'Vencidas'
                        ? d.status === 'vencida'
                        : d.status === 'pagada'
                  ).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={cn(
                  'px-3 py-2 text-sm font-sans relative transition-colors',
                  activeFilter === tab
                    ? 'text-[#00BCD4] dark:text-[#FFC107] font-semibold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                )}
              >
                {tab}
                <span
                  className={cn(
                    'ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full',
                    activeFilter === tab
                      ? 'bg-[#00BCD4]/10 text-[#00BCD4] dark:bg-[#FFC107]/10 dark:text-[#FFC107]'
                      : 'bg-gray-100 text-gray-500 dark:bg-white/5'
                  )}
                >
                  {count}
                </span>
                {activeFilter === tab && (
                  <motion.div
                    layoutId="debtTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00BCD4] dark:bg-[#FFC107] rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* New debt button */}
        <button
          onClick={() => setShowNewDebtModal(true)}
          className={cn(
            'mb-3 py-2.5 px-4 rounded-lg text-sm font-medium',
            'border border-dashed border-gray-300 dark:border-gray-600',
            'text-gray-500 dark:text-gray-400 hover:border-[#00BCD4] hover:text-[#00BCD4]',
            'dark:hover:border-[#FFC107] dark:hover:text-[#FFC107]',
            'transition-colors flex items-center justify-center gap-2'
          )}
        >
          <Plus size={16} />
          Registrar Nueva Deuda
        </button>

        {/* Debt list */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-0">
          {filteredDebts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package size={56} className="text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-1">
                No hay deudas registradas
              </h3>
              <p className="text-sm text-gray-400">
                Las deudas apareceran aqui cuando registres ventas a credito
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredDebts.map((debt, idx) => {
                const days = agingDays(debt.createdAt);
                const isSelected = selectedDebt?.id === debt.id;
                return (
                  <motion.button
                    key={debt.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: Math.min(idx * 0.05, 0.3), duration: 0.25 }}
                    onClick={() => handleSelectDebt(debt)}
                    className={cn(
                      'w-full flex items-center gap-3 p-4 rounded-lg text-left transition-all duration-200 mb-1',
                      'border border-transparent',
                      isSelected
                        ? 'bg-[#00BCD4]/5 border-l-[3px] border-l-deep-teal dark:bg-[#FFC107]/5 dark:border-l-gold-accent'
                        : 'hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-100 dark:border-white/5 rounded-none'
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm',
                        debt.status === 'pagada'
                          ? 'bg-[#4CAF50]/15 text-[#4CAF50]'
                          : 'bg-[#00BCD4]/15 text-[#00BCD4] dark:bg-[#FFC107]/15 dark:text-[#FFC107]'
                      )}
                    >
                      {debt.clientName.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                        {debt.clientName}
                      </p>
                      <p className="text-xs text-gray-400">
                        Desde {new Date(debt.createdAt).toLocaleDateString('es-ES')}
                      </p>
                    </div>

                    {/* Right */}
                    <div className="text-right shrink-0">
                      <p
                        className={cn(
                          'text-sm font-mono font-semibold',
                          debt.status === 'pagada' ? 'text-gray-400' : 'text-danger-rose'
                        )}
                      >
                        {fmt(debt.remaining)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                        <span
                          className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-full border',
                            agingColor(days)
                          )}
                        >
                          {days}d
                        </span>
                        <StatusBadge status={debt.status} />
                      </div>
                    </div>

                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  </motion.button>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ═══ RIGHT: Debt Detail (Desktop) ═══ */}
      <div className="hidden lg:block w-[450px] xl:w-[500px] border-l border-gray-200 dark:border-white/10 bg-white/30 dark:bg-[#12121A]/30">
        {selectedDebt ? (
          <DebtDetailPanel
            debt={selectedDebt}
            onAddPayment={() => setShowPaymentModal(true)}
            onMarkPaid={() => handleMarkPaid(selectedDebt.id)}
            onSendReminder={() => handleSendReminder(selectedDebt)}
            onWriteOff={() => setShowDeleteConfirm(true)}
            StatusBadge={StatusBadge}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <Package size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-1">
              Selecciona una deuda
            </h3>
            <p className="text-sm text-gray-400">Haz clic en una deuda para ver los detalles</p>
          </div>
        )}
      </div>

      {/* ═══ MOBILE: Detail Slide-in ═══ */}
      <AnimatePresence>
        {showMobileDetail && selectedDebt && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileDetail(false)}
            />
            <motion.div
              className="lg:hidden fixed top-0 right-0 bottom-0 w-full z-50 bg-white dark:bg-[#12121A] overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="flex items-center p-4 border-b border-gray-200 dark:border-white/10">
                <button
                  onClick={() => setShowMobileDetail(false)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <ArrowLeft size={18} />
                  Volver
                </button>
              </div>
              <DebtDetailPanel
                debt={selectedDebt}
                onAddPayment={() => setShowPaymentModal(true)}
                onMarkPaid={() => handleMarkPaid(selectedDebt.id)}
                onSendReminder={() => handleSendReminder(selectedDebt)}
                onWriteOff={() => setShowDeleteConfirm(true)}
                StatusBadge={StatusBadge}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ PAYMENT MODAL ═══ */}
      <AnimatePresence>
        {showPaymentModal && selectedDebt && (
          <ModalOverlay onClose={() => setShowPaymentModal(false)}>
            <PaymentModal
              debt={selectedDebt}
              onSubmit={handleAddPayment}
              onClose={() => setShowPaymentModal(false)}
            />
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* ═══ NEW DEBT MODAL ═══ */}
      <AnimatePresence>
        {showNewDebtModal && (
          <ModalOverlay onClose={() => setShowNewDebtModal(false)}>
            <NewDebtModal onSubmit={handleNewDebt} onClose={() => setShowNewDebtModal(false)} />
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* ═══ DELETE CONFIRM MODAL ═══ */}
      <AnimatePresence>
        {showDeleteConfirm && selectedDebt && (
          <ModalOverlay onClose={() => setShowDeleteConfirm(false)}>
            <motion.div
              className={cn(
                'bg-white dark:bg-[#12121A] rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6',
                'border border-gray-200 dark:border-white/10'
              )}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-danger-rose/10 flex items-center justify-center">
                <FileX size={24} className="text-danger-rose" />
              </div>
              <h3 className="font-sans text-lg font-bold text-gray-800 dark:text-gray-100 text-center mb-2">
                Eliminar Deuda
              </h3>
              <p className="text-sm text-gray-500 text-center mb-5">
                Esta accion no se puede deshacer. La deuda de{' '}
                <strong>{selectedDebt.clientName}</strong> por {fmt(selectedDebt.remaining)} sera
                eliminada.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleWriteOff(selectedDebt.id)}
                  className="flex-1 py-2.5 rounded-lg bg-danger-rose text-white text-sm font-medium hover:opacity-90"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SUMMARY CARD
   ═══════════════════════════════════════════ */
function SummaryCard({
  label,
  value,
  icon: Icon,
  colorClass,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  colorClass: string;
}) {
  return (
    <motion.div
      className={cn(
        'rounded-lg border p-3 text-center',
        'bg-white dark:bg-[#12121A] border-gray-200 dark:border-white/10'
      )}
      whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.2 }}
    >
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2', colorClass)}>
        <Icon size={16} />
      </div>
      <p className="font-mono text-lg font-bold text-gray-800 dark:text-gray-100">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-gray-400">{label}</p>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   DEBT DETAIL PANEL
   ═══════════════════════════════════════════ */
function DebtDetailPanel({
  debt,
  onAddPayment,
  onMarkPaid,
  onSendReminder,
  onWriteOff,
  StatusBadge,
}: {
  debt: Debt;
  onAddPayment: () => void;
  onMarkPaid: () => void;
  onSendReminder: () => void;
  onWriteOff: () => void;
  StatusBadge: ({ status }: { status: Debt['status'] }) => JSX.Element;
}) {
  const days = agingDays(debt.createdAt);
  const isPaid = debt.status === 'pagada';
  const progress = debt.totalAmount > 0 ? (debt.paidAmount / debt.totalAmount) * 100 : 0;

  return (
    <motion.div
      className="p-5 lg:p-6 h-full overflow-y-auto"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-lg font-bold',
            isPaid
              ? 'bg-[#4CAF50]/15 text-[#4CAF50]'
              : 'bg-[#00BCD4]/15 text-[#00BCD4] dark:bg-[#FFC107]/15 dark:text-[#FFC107]'
          )}
        >
          {debt.clientName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-sans text-xl font-bold text-gray-800 dark:text-gray-100 truncate">
            {debt.clientName}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={debt.status} />
            <span className={cn('text-xs', agingColor(days))}>
              {days} dias
            </span>
          </div>
        </div>
      </div>

      {/* Amount */}
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400">
          Monto Total
        </span>
        <motion.p
          key={debt.remaining}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          className={cn(
            'font-sans text-4xl lg:text-5xl font-bold font-mono',
            isPaid ? 'text-gray-400' : 'text-danger-rose'
          )}
        >
          {fmt(debt.remaining)}
        </motion.p>
        {!isPaid && debt.paidAmount > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            Pagado: <span className="font-mono text-[#4CAF50]">{fmt(debt.paidAmount)}</span>
            {' | '}
            Restante: <span className="font-mono text-danger-rose">{fmt(debt.remaining)}</span>
          </p>
        )}
      </div>

      {/* Progress bar */}
      {debt.paidAmount > 0 && (
        <motion.div
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full', isPaid ? 'bg-[#4CAF50]' : agingBarColor(days))}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
            />
          </div>
          <p className="text-[10px] text-gray-400 text-right mt-1">{Math.round(progress)}% pagado</p>
        </motion.div>
      )}

      {/* Aging indicator */}
      <div className="mb-6 p-3 rounded-lg border bg-white dark:bg-[#12121A] border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={14} className={agingBarColor(days).replace('bg-', 'text-')} />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Analisis de Antiguedad
          </span>
        </div>
        <div className="flex gap-1 h-3 rounded-full overflow-hidden">
          <div className={cn('flex-1', days <= 30 ? agingBarColor(days) : 'bg-[#4CAF50]/20')} />
          <div className={cn('flex-1', days > 30 && days <= 60 ? agingBarColor(days) : days > 60 ? 'bg-[#FFA000]/20' : 'bg-[#FFA000]/20')} />
          <div className={cn('flex-1', days > 60 && days <= 90 ? agingBarColor(days) : days > 90 ? 'bg-orange-500/20' : 'bg-orange-500/20')} />
          <div className={cn('flex-1', days > 90 ? agingBarColor(days) : 'bg-danger-rose/20')} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px] text-gray-400">0-30d</span>
          <span className="text-[9px] text-gray-400">31-60d</span>
          <span className="text-[9px] text-gray-400">61-90d</span>
          <span className="text-[9px] text-gray-400">90d+</span>
        </div>
        <p className={cn('text-xs mt-2 font-medium', agingBarColor(days).replace('bg-', 'text-'))}>
          {days <= 30 && 'Al dia - Pago dentro de los primeros 30 dias'}
          {days > 30 && days <= 60 && 'En seguimiento - Entre 31 y 60 dias'}
          {days > 60 && days <= 90 && 'Preocupante - Entre 61 y 90 dias'}
          {days > 90 && 'Critico - Mas de 90 dias de antiguedad'}
        </p>
      </div>

      {/* Original sale info */}
      <div className="mb-6 p-3 rounded-lg border bg-white dark:bg-[#12121A] border-gray-200 dark:border-white/10">
        <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400 block mb-2">
          Venta Original
        </span>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Recibo</span>
            <span className="font-mono text-gray-700 dark:text-gray-300">#{debt.saleId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Fecha</span>
            <span className="text-gray-700 dark:text-gray-300">
              {new Date(debt.createdAt).toLocaleDateString('es-ES')}
            </span>
          </div>
          {debt.dueDate && (
            <div className="flex justify-between">
              <span className="text-gray-500">Vencimiento</span>
              <span className="text-gray-700 dark:text-gray-300">
                {new Date(debt.dueDate).toLocaleDateString('es-ES')}
              </span>
            </div>
          )}
          {debt.clientPhone && (
            <div className="flex justify-between">
              <span className="text-gray-500">Telefono</span>
              <span className="text-gray-700 dark:text-gray-300">{debt.clientPhone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
          Historial de Pagos
        </h3>
        {debt.payments.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Sin pagos registrados</p>
        ) : (
          <div className="relative pl-4">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="space-y-4">
              {debt.payments.map((payment, idx) => (
                <motion.div
                  key={payment.id}
                  className="relative flex items-start gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                >
                  {/* Dot */}
                  <div className="absolute -left-[9px] w-3.5 h-3.5 rounded-full bg-[#4CAF50] border-2 border-white dark:border-midnight z-10" />
                  <div className="flex-1 min-w-0 ml-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold text-[#4CAF50]">
                        {fmt(payment.amount)}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(payment.date).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 capitalize">{payment.method}</span>
                      {payment.note && (
                        <span className="text-[10px] text-gray-400">{payment.note}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {!isPaid && (
        <div className="space-y-3">
          <button
            onClick={onAddPayment}
            className={cn(
              'w-full py-3 rounded-lg text-sm font-semibold text-white',
              'bg-[#00BCD4] hover:opacity-90 dark:bg-[#FFC107] dark:text-dark-slate',
              'transition-opacity flex items-center justify-center gap-2'
            )}
          >
            <Banknote size={16} />
            Registrar Pago
          </button>

          <div className="flex gap-2">
            <button
              onClick={onMarkPaid}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-xs font-medium',
                'border border-success-mint/30 text-[#4CAF50]',
                'hover:bg-[#4CAF50]/10 transition-colors flex items-center justify-center gap-1.5'
              )}
            >
              <Check size={14} />
              Marcar Pagada
            </button>
            <button
              onClick={onSendReminder}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-xs font-medium',
                'border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400',
                'hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5'
              )}
            >
              <Bell size={14} />
              Recordatorio
            </button>
            <button
              onClick={onWriteOff}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-xs font-medium',
                'border border-danger-rose/30 text-danger-rose',
                'hover:bg-danger-rose/10 transition-colors flex items-center justify-center gap-1.5'
              )}
            >
              <Trash2 size={14} />
              Eliminar
            </button>
          </div>
        </div>
      )}

      {isPaid && (
        <div className="p-4 rounded-lg bg-[#4CAF50]/10 border border-success-mint/20 text-center">
          <Check size={24} className="text-[#4CAF50] mx-auto mb-2" />
          <p className="text-sm font-medium text-[#4CAF50]">Deuda completamente pagada</p>
          <button
            onClick={onWriteOff}
            className="mt-3 text-xs text-gray-400 hover:text-danger-rose transition-colors"
          >
            Eliminar registro
          </button>
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   PAYMENT MODAL
   ═══════════════════════════════════════════ */
function PaymentModal({
  debt,
  onSubmit,
  onClose,
}: {
  debt: Debt;
  onSubmit: (debtId: string, amount: number, method: 'efectivo' | 'transferencia' | 'otro', note: string) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(String(debt.remaining));
  const [method, setMethod] = useState<'efectivo' | 'transferencia' | 'otro'>('efectivo');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Ingresa un monto valido');
      return;
    }
    if (numAmount > debt.remaining) {
      toast.error('El pago no puede superar el saldo restante');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit(debt.id, numAmount, method, note);
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <motion.div
      className={cn(
        'bg-white dark:bg-[#12121A] rounded-2xl shadow-xl w-full max-w-md mx-4 p-6',
        'border border-gray-200 dark:border-white/10'
      )}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
    >
      <h2 className="font-sans text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">
        Registrar Pago
      </h2>
      <p className="text-sm text-gray-500 mb-5">
        {debt.clientName} - Saldo: {fmt(debt.remaining)}
      </p>

      <div className="space-y-4 mb-5">
        {/* Amount */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Monto</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={cn(
                'w-full pl-8 pr-3 py-2.5 rounded-lg text-sm font-mono',
                'border border-gray-200 dark:border-white/10',
                'bg-white dark:bg-[#12121A] text-gray-800 dark:text-gray-100',
                'focus:outline-none focus:border-[#00BCD4] dark:focus:border-[#FFC107]'
              )}
            />
          </div>
        </div>

        {/* Method */}
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Metodo</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'efectivo' as const, label: 'Efectivo', icon: Banknote },
              { key: 'transferencia' as const, label: 'Transf.', icon: ArrowRightLeft },
              { key: 'otro' as const, label: 'Otro', icon: Wallet },
            ].map((m) => (
              <button
                key={m.key}
                onClick={() => setMethod(m.key)}
                className={cn(
                  'flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs transition-all',
                  method === m.key
                    ? 'border-[#00BCD4] bg-[#00BCD4]/5 text-[#00BCD4] dark:border-[#FFC107] dark:bg-[#FFC107]/10 dark:text-[#FFC107]'
                    : 'border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'
                )}
              >
                <m.icon size={16} />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Nota (opcional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej: Pago parcial..."
            className={cn(
              'w-full px-3 py-2.5 rounded-lg text-sm',
              'border border-gray-200 dark:border-white/10',
              'bg-white dark:bg-[#12121A] text-gray-800 dark:text-gray-100 placeholder:text-gray-400',
              'focus:outline-none focus:border-[#00BCD4] dark:focus:border-[#FFC107]'
            )}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={cn(
            'flex-1 py-2.5 rounded-lg text-sm font-semibold text-white',
            'bg-[#00BCD4] hover:opacity-90 dark:bg-[#FFC107] dark:text-dark-slate',
            'disabled:opacity-50 flex items-center justify-center gap-2'
          )}
        >
          {isSubmitting ? (
            <motion.div
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            <>
              <Check size={16} />
              Registrar
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   NEW DEBT MODAL
   ═══════════════════════════════════════════ */
function NewDebtModal({
  onSubmit,
  onClose,
}: {
  onSubmit: (clientName: string, totalAmount: number, dueDate: string, phone?: string) => void;
  onClose: () => void;
}) {
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!clientName.trim()) {
      toast.error('Ingresa el nombre del cliente');
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Ingresa un monto valido');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit(clientName.trim(), numAmount, dueDate, phone.trim() || undefined);
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <motion.div
      className={cn(
        'bg-white dark:bg-[#12121A] rounded-2xl shadow-xl w-full max-w-md mx-4 p-6',
        'border border-gray-200 dark:border-white/10'
      )}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
    >
      <h2 className="font-sans text-xl font-bold text-gray-800 dark:text-gray-100 mb-5">
        Nueva Deuda
      </h2>

      <div className="space-y-4 mb-5">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Nombre del cliente *</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Ej: Juan Perez"
            className={cn(
              'w-full px-3 py-2.5 rounded-lg text-sm',
              'border border-gray-200 dark:border-white/10',
              'bg-white dark:bg-[#12121A] text-gray-800 dark:text-gray-100 placeholder:text-gray-400',
              'focus:outline-none focus:border-[#00BCD4] dark:focus:border-[#FFC107]'
            )}
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Telefono</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+56912345678"
            className={cn(
              'w-full px-3 py-2.5 rounded-lg text-sm',
              'border border-gray-200 dark:border-white/10',
              'bg-white dark:bg-[#12121A] text-gray-800 dark:text-gray-100 placeholder:text-gray-400',
              'focus:outline-none focus:border-[#00BCD4] dark:focus:border-[#FFC107]'
            )}
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Monto *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className={cn(
                'w-full pl-8 pr-3 py-2.5 rounded-lg text-sm font-mono',
                'border border-gray-200 dark:border-white/10',
                'bg-white dark:bg-[#12121A] text-gray-800 dark:text-gray-100 placeholder:text-gray-400',
                'focus:outline-none focus:border-[#00BCD4] dark:focus:border-[#FFC107]'
              )}
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Fecha de vencimiento</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={cn(
              'w-full px-3 py-2.5 rounded-lg text-sm',
              'border border-gray-200 dark:border-white/10',
              'bg-white dark:bg-[#12121A] text-gray-800 dark:text-gray-100',
              'focus:outline-none focus:border-[#00BCD4] dark:focus:border-[#FFC107]'
            )}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={cn(
            'flex-1 py-2.5 rounded-lg text-sm font-semibold text-white',
            'bg-[#00BCD4] hover:opacity-90 dark:bg-[#FFC107] dark:text-dark-slate',
            'disabled:opacity-50 flex items-center justify-center gap-2'
          )}
        >
          {isSubmitting ? (
            <motion.div
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            <>
              <Plus size={16} />
              Registrar Deuda
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   MODAL OVERLAY
   ═══════════════════════════════════════════ */
function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
