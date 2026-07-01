import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  Banknote,
  CreditCard,
  ArrowRightLeft,
  Wallet,
  Printer,
  Check,
  Keyboard,
  Sparkles,
  Package,
  ScanLine,
  QrCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useProducts } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { useCuotas } from '@/hooks/useCuotas';

/* â”€â”€â”€ Types â”€â”€â”€ */
interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
  category: 'caballero' | 'dama' | 'ninos' | 'unisex';
}

interface CartItem extends Product {
  quantity: number;
}



/* â”€â”€â”€ Constants â”€â”€â”€ */
const CATEGORIES = ['Todos', 'Caballero', 'Dama', 'NiÃ±os', 'Unisex'] as const;
type Category = (typeof CATEGORIES)[number];

const PAYMENT_METHODS = [
  { key: 'efectivo' as const, label: 'Efectivo', icon: Banknote },
  { key: 'tarjeta' as const, label: 'Tarjeta', icon: CreditCard },
  { key: 'transferencia' as const, label: 'Transferencia', icon: ArrowRightLeft },
  { key: 'mercadopago' as const, label: 'MercadoPago', icon: QrCode },
  { key: 'credito' as const, label: 'A Credito', icon: Wallet },
];

/* â”€â”€â”€ Currency format â”€â”€â”€ */
function fmt(n: number): string {
  return '$ ' + n.toLocaleString('es-CL');
}

/* â”€â”€â”€ Receipt number generator â”€â”€â”€ */


/* â”€â”€â”€ Mock Products â”€â”€â”€ */


/* â”€â”€â”€ Confetti Component â”€â”€â”€ */
function ConfettiEffect() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1.5 + Math.random() * 1,
        color: ['#00BCD4', '#FFC107', '#4CAF50', '#00BCD4', '#FFD54F'][
          Math.floor(Math.random() * 5)
        ],
        size: 6 + Math.random() * 6,
      })),
    []
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-[70] overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: -20,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          initial={{ y: 0, opacity: 1, rotate: 0 }}
          animate={{
            y: window.innerHeight + 40,
            opacity: [1, 1, 0.5, 0],
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
            x: (Math.random() - 0.5) * 200,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
          }}
        />
      ))}
    </div>
  );
}

/* â”€â”€â”€ Success Checkmark â”€â”€â”€ */
function SuccessCheckmark() {
  return (
    <motion.div
      className="relative w-20 h-20 mx-auto mb-4"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
    >
      <div className="w-20 h-20 rounded-full bg-[#4CAF50]/20 flex items-center justify-center">
        <motion.div
          className="w-16 h-16 rounded-full bg-[#4CAF50] flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
        >
          <motion.svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <motion.path d="M5 13l4 4L19 7" />
          </motion.svg>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* â”€â”€â”€ Main Page Component â”€â”€â”€ */
export default function VentaPage() {
  /* -- State -- */
  const { products, adjustStock } = useProducts();

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('current_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('Todos');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia' | 'mercadopago' | 'credito'>('efectivo');
  const [showCart, setShowCart] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  /* -- Derived values -- */
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        activeCategory === 'Todos'
          ? true
          : activeCategory === 'NiÃ±os'
            ? p.category === 'ninos'
            : p.category === activeCategory.toLowerCase();
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [products, activeCategory, search]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );
  const discountAmount = useMemo(() => Math.round(subtotal * (discount / 100)), [subtotal, discount]);
  const total = useMemo(() => subtotal - discountAmount, [subtotal, discountAmount]);
  const itemCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  /* -- Persistence -- */
  useEffect(() => {
    localStorage.setItem('current_cart', JSON.stringify(cart));
  }, [cart]);

  /* -- Keyboard shortcuts -- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT';

      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (search) {
          setSearch('');
        } else {
          setShowCart(false);
        }
      }
      if (e.key === '+' && !isTyping && cart.length > 0) {
        e.preventDefault();
        const lastItem = cart[cart.length - 1];
        updateQty(lastItem.id, 1);
      }
      if (e.key === '-' && !isTyping && cart.length > 0) {
        e.preventDefault();
        const lastItem = cart[cart.length - 1];
        updateQty(lastItem.id, -1);
      }
      if (e.key === '?' && !isTyping) {
        e.preventDefault();
        setShowShortcuts(true);
      }
      if (e.key === 'Enter' && !isTyping && cart.length > 0 && !showConfirm && !showReceipt && !showSuccess) {
        handleCompleteSale();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [search, cart, showConfirm, showReceipt, showSuccess]);

  /* -- Cart actions -- */
  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.name} agregado`, { duration: 1500 });
  }, []);

  const updateQty = useCallback((id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscount(0);
  }, []);

  /* -- Complete sale -- */
  const handleCompleteSale = useCallback(() => {
    if (cart.length === 0) return;
    if (paymentMethod === 'credito' && !clientName.trim()) {
      toast.error('Ingresa el nombre del cliente para credito');
      return;
    }
    setShowConfirm(true);
  }, [cart, paymentMethod, clientName]);

  const { addSale } = useSales();
  const { crearCredito } = useCuotas();

  const confirmSale = useCallback(() => {
    setIsProcessing(true);
    setTimeout(() => {
      const sale = {
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal,
        discount,
        total,
        paymentMethod,
        clientName: clientName || undefined,
        clientPhone: clientPhone || undefined,
        dueDate: dueDate || undefined,
      };

      /* Save sale via hook */
      const savedSale = addSale(sale);

      /* If credit, create debt */
      if (paymentMethod === 'credito' && clientName) {
        const debts = JSON.parse(localStorage.getItem('dulces_aromas_debts') || '[]');
        debts.push({
          id: crypto.randomUUID(),
          clientName: clientName.trim(),
          clientPhone: clientPhone?.trim() || undefined,
          totalAmount: total,
          paidAmount: 0,
          remaining: total,
          status: 'activa',
          saleId: savedSale.id,
          createdAt: savedSale.createdAt,
          dueDate: dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          payments: [],
        });
        localStorage.setItem('dulces_aromas_debts', JSON.stringify(debts));

        /* Create credit with quotas */
        crearCredito({
          cliente: clientName.trim(),
          telefono: clientPhone?.trim() || undefined,
          montoTotal: total,
          numeroCuotas: 3,
          ventaId: savedSale.id,
        });
      }

      /* Update stock via hook */
      cart.forEach((item) => {
        adjustStock(item.id, -item.quantity);
      });

      setIsProcessing(false);
      setShowConfirm(false);
      setShowSuccess(true);
      setShowConfetti(true);
      setCart([]);
      setDiscount(0);
      setTimeout(() => setShowConfetti(false), 3000);
    }, 800);
  }, [cart, subtotal, discount, total, paymentMethod, clientName, clientPhone, dueDate, addSale, adjustStock]);

  /* -- Receipt data -- */
  const [receiptNumber, setReceiptNumber] = useState('');
  useEffect(() => {
    if (showSuccess) {
      const sales = JSON.parse(localStorage.getItem('dulces_aromas_sales') || '[]');
      if (sales.length > 0) {
        setReceiptNumber(sales[sales.length - 1].id);
      }
    }
  }, [showSuccess]);

  /* -- Helpers -- */
  const stockColor = (stock: number) => {
    if (stock <= 0) return 'bg-danger-rose text-white';
    if (stock <= 5) return 'bg-[#FFA000] text-white';
    return 'bg-[#00BCD4]/10 text-[#00BCD4] dark:bg-[#00BCD4]/20 dark:text-teal-300';
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 -m-4 lg:-m-6 min-h-[calc(100dvh-56px-64px)] lg:min-h-[calc(100dvh-56px)]">
      {/* â•â•â• LEFT: Product Browser â•â•â• */}
      <div className="flex-1 min-w-0 flex flex-col p-4 lg:p-6">
        {/* Page header */}
        <motion.div
          className="flex items-center gap-3 mb-5"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="font-sans text-2xl font-bold text-gray-800 dark:text-gray-100">
            Nueva Venta
          </h1>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <button
            onClick={() => setShowShortcuts(true)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Atajos de teclado (?)"
          >
            <Keyboard size={18} />
          </button>
        </motion.div>

        {/* Search bar */}
        <motion.div
          className="relative mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto por nombre, marca o codigo..."
            className={cn(
              'w-full pl-11 pr-24 py-3 rounded-full text-sm font-sans',
              'bg-white dark:bg-[#12121A] border border-gray-200 dark:border-white/10',
              'text-gray-800 dark:text-gray-100 placeholder:text-gray-400',
              'focus:outline-none focus:border-[#00BCD4] dark:focus:border-[#FFC107] focus:shadow-glow-cyan transition-all duration-150'
            )}
          />
          {search && (
            <button
              onClick={() => { setSearch(''); searchRef.current?.focus(); }}
              className="absolute right-28 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400"
            >
              <X size={16} />
            </button>
          )}
          {/* QR Scan button */}
          <button
            onClick={() => setShowQRScanner(true)}
            className="absolute right-14 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 hover:text-[#00BCD4] transition-colors"
            title="Escanear QR"
          >
            <ScanLine size={18} />
          </button>
          <span className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FFC107]/15 text-[#FFC107] border border-[#FFC107]/20">
              IA
            </span>
          </span>
        </motion.div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-sans whitespace-nowrap transition-all duration-200',
                activeCategory === cat
                  ? 'bg-[#00BCD4] text-white dark:bg-[#FFC107] dark:text-dark-slate font-medium'
                  : 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <Package size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-medium text-gray-500 dark:text-gray-400 mb-2">
              No hay productos
            </h3>
            <p className="text-sm text-gray-400">
              {search
                ? 'Intenta con otra busqueda'
                : 'Agrega productos en el catalogo para comenzar a vender'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, idx) => {
                const inCart = cart.find((i) => i.id === product.id);
                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{
                      duration: 0.25,
                      delay: Math.min(idx * 0.05, 0.4),
                      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
                    }}
                    className={cn(
                      'group rounded-lg border overflow-hidden',
                      'bg-white dark:bg-[#12121A] border-gray-200 dark:border-white/10',
                      'hover:shadow-lg hover:-translate-y-1 transition-all duration-250'
                    )}
                  >
                    {/* Image placeholder */}
                    <div className="relative aspect-[3/4] bg-gradient-to-br from-[#0d7377]/5 to-gold-accent/5 dark:from-[#0d7377]/10 dark:to-gold-accent/10 flex items-center justify-center overflow-hidden">
                      <Package
                        size={36}
                        className="text-[#00BCD4]/30 dark:text-[#FFC107]/30"
                      />
                      {/* Stock badge */}
                      <span
                        className={cn(
                          'absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-full',
                          stockColor(product.stock)
                        )}
                      >
                        {product.stock} uds
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
                        {product.brand}
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate mb-2">
                        {product.name}
                      </p>
                      <p className="font-sans text-base text-[#FFC107] font-semibold mb-3">
                        {fmt(product.price)}
                      </p>

                      {/* Add / Stepper */}
                      <AnimatePresence mode="wait">
                        {inCart ? (
                          <motion.div
                            key="stepper"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="flex items-center justify-between bg-[#00BCD4]/5 dark:bg-[#FFC107]/10 rounded-md"
                          >
                            <button
                              onClick={() => updateQty(product.id, -1)}
                              className="flex-1 flex items-center justify-center py-2 text-[#00BCD4] dark:text-[#FFC107] hover:bg-[#00BCD4]/10 dark:hover:bg-[#FFC107]/20 rounded-l-md transition-colors"
                            >
                              <Minus size={16} />
                            </button>
                            <motion.span
                              key={inCart.quantity}
                              initial={{ scale: 1.2 }}
                              animate={{ scale: 1 }}
                              className="px-2 text-sm font-mono font-semibold text-gray-800 dark:text-gray-100"
                            >
                              {inCart.quantity}
                            </motion.span>
                            <button
                              onClick={() => {
                                if (inCart.quantity < product.stock) {
                                  updateQty(product.id, 1);
                                } else {
                                  toast.warning('Sin stock suficiente');
                                }
                              }}
                              className="flex-1 flex items-center justify-center py-2 text-[#00BCD4] dark:text-[#FFC107] hover:bg-[#00BCD4]/10 dark:hover:bg-[#FFC107]/20 rounded-r-md transition-colors"
                            >
                              <Plus size={16} />
                            </button>
                          </motion.div>
                        ) : (
                          <motion.button
                            key="add"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            onClick={() => {
                              if (product.stock > 0) {
                                addToCart(product);
                              } else {
                                toast.error('Producto sin stock');
                              }
                            }}
                            disabled={product.stock <= 0}
                            className={cn(
                              'w-full py-2 rounded-md text-sm font-medium transition-all duration-200',
                              product.stock > 0
                                ? 'bg-[#00BCD4] text-white dark:bg-[#FFC107] dark:text-dark-slate hover:opacity-90 active:scale-95'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            )}
                          >
                            {product.stock > 0 ? 'Agregar' : 'Sin stock'}
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* â•â•â• RIGHT: Cart Panel (Desktop) â•â•â• */}
      <motion.div
        className={cn(
          'hidden lg:flex w-[400px] xl:w-[420px] flex-col border-l',
          'bg-white/50 dark:bg-[#12121A]/50 border-gray-200 dark:border-white/10'
        )}
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
      >
        <CartPanelContent
          cart={cart}
          itemCount={itemCount}
          subtotal={subtotal}
          discount={discount}
          discountAmount={discountAmount}
          total={total}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          setDiscount={setDiscount}
          updateQty={updateQty}
          removeItem={removeItem}
          clearCart={clearCart}
          onComplete={handleCompleteSale}
          clientName={clientName}
          setClientName={setClientName}
          clientPhone={clientPhone}
          setClientPhone={setClientPhone}
          dueDate={dueDate}
          setDueDate={setDueDate}
          isProcessing={isProcessing}
        />
      </motion.div>

      {/* â•â•â• MOBILE: Cart FAB â•â•â• */}
      <button
        onClick={() => setShowCart(true)}
        className={cn(
          'lg:hidden fixed right-4 bottom-20 z-30 flex items-center gap-2',
          'px-4 py-3 rounded-full shadow-lg',
          'bg-[#00BCD4] text-white dark:bg-[#FFC107] dark:text-dark-slate',
          'active:scale-95 transition-transform',
          itemCount === 0 && 'opacity-70'
        )}
      >
        <ShoppingCart size={20} />
        <AnimatePresence mode="wait">
          <motion.span
            key={itemCount}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className="font-mono text-sm font-semibold"
          >
            {itemCount}
          </motion.span>
        </AnimatePresence>
      </button>

      {/* â•â•â• MOBILE: Cart Bottom Sheet â•â•â• */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
            />
            <motion.div
              className={cn(
                'lg:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl',
                'bg-white dark:bg-[#12121A] border-t border-gray-200 dark:border-white/10',
                'shadow-xl'
              )}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{ maxHeight: '85vh' }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 20px)' }}>
                <CartPanelContent
                  cart={cart}
                  itemCount={itemCount}
                  subtotal={subtotal}
                  discount={discount}
                  discountAmount={discountAmount}
                  total={total}
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  setDiscount={setDiscount}
                  updateQty={updateQty}
                  removeItem={removeItem}
                  clearCart={clearCart}
                  onComplete={handleCompleteSale}
                  clientName={clientName}
                  setClientName={setClientName}
                  clientPhone={clientPhone}
                  setClientPhone={setClientPhone}
                  dueDate={dueDate}
                  setDueDate={setDueDate}
                  isProcessing={isProcessing}
                  onCloseMobile={() => setShowCart(false)}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* â•â•â• SALE CONFIRMATION MODAL â•â•â• */}
      <AnimatePresence>
        {showConfirm && (
          <ModalOverlay onClose={() => !isProcessing && setShowConfirm(false)}>
            <motion.div
              className={cn(
                'bg-white dark:bg-[#12121A] rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden',
                'border border-gray-200 dark:border-white/10'
              )}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <div className="p-6">
                <h2 className="font-sans text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">
                  Confirmar Venta
                </h2>
                <p className="text-sm text-gray-500 mb-5">
                  Revisa los detalles antes de confirmar
                </p>

                <div className="space-y-3 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Items</span>
                    <span className="font-mono text-gray-800 dark:text-gray-100">{itemCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-mono text-gray-800 dark:text-gray-100">{fmt(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Descuento ({discount}%)</span>
                      <span className="font-mono text-danger-rose">-{fmt(discountAmount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-white/10 pt-3 flex justify-between">
                    <span className="text-xs uppercase tracking-wider text-gray-400">Total</span>
                    <span className="font-sans text-2xl font-bold text-[#FFC107]">
                      {fmt(total)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Metodo</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {PAYMENT_METHODS.find((p) => p.key === paymentMethod)?.label}
                    </span>
                  </div>
                </div>

                {paymentMethod === 'credito' && (
                  <div className="bg-[#FFA000]/10 rounded-lg p-3 mb-4 text-sm text-[#FFA000]">
                    <p>Se registrara una deuda para: <strong>{clientName}</strong></p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={isProcessing}
                    className="flex-1 py-3 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmSale}
                    disabled={isProcessing}
                    className={cn(
                      'flex-1 py-3 rounded-lg text-sm font-semibold text-white',
                      'bg-gradient-to-r from-gold-accent to-gold-light hover:opacity-90',
                      'disabled:opacity-50 flex items-center justify-center gap-2'
                    )}
                  >
                    {isProcessing ? (
                      <>
                        <motion.div
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
                        />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        Confirmar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* â•â•â• SUCCESS MODAL â•â•â• */}
      <AnimatePresence>
        {showSuccess && (
          <ModalOverlay onClose={() => { setShowSuccess(false); setShowReceipt(true); }}>
            <motion.div
              className={cn(
                'bg-white dark:bg-[#12121A] rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 text-center',
                'border border-gray-200 dark:border-white/10'
              )}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <SuccessCheckmark />
              <h2 className="font-sans text-2xl font-bold text-[#4CAF50] mb-1">
                Venta Completada!
              </h2>
              <p className="font-mono text-sm text-gray-500 mb-1">
                Recibo #{receiptNumber}
              </p>
              <p className="font-sans text-3xl font-bold text-[#FFC107] mb-6">
                {fmt(total)}
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { setShowSuccess(false); setShowReceipt(true); }}
                  className={cn(
                    'w-full py-3 rounded-lg text-sm font-semibold',
                    'bg-[#00BCD4] text-white dark:bg-[#FFC107] dark:text-dark-slate',
                    'hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2'
                  )}
                >
                  <Printer size={16} />
                  Imprimir Recibo
                </button>
                <button
                  onClick={() => {
                    setShowSuccess(false);
                    setClientName('');
                    setClientPhone('');
                    setDueDate('');
                    setPaymentMethod('efectivo');
                  }}
                  className="w-full py-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Nueva Venta
                </button>
              </div>
            </motion.div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* â•â•â• RECEIPT PRINT VIEW â•â•â• */}
      <AnimatePresence>
        {showReceipt && (
          <ModalOverlay onClose={() => setShowReceipt(false)}>
            <motion.div
              className={cn(
                'bg-white dark:bg-[#12121A] rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden',
                'border border-gray-200 dark:border-white/10'
              )}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.3 }}
            >
              {/* Receipt body */}
              <div className="p-6">
                <ReceiptView
                  receiptNumber={receiptNumber}
                  cart={cart}
                  subtotal={subtotal}
                  discount={discount}
                  discountAmount={discountAmount}
                  total={total}
                  paymentMethod={paymentMethod}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-white/10">
                <button
                  onClick={() => window.print()}
                  className={cn(
                    'flex-1 py-3 rounded-lg text-sm font-semibold',
                    'bg-[#00BCD4] text-white dark:bg-[#FFC107] dark:text-dark-slate',
                    'hover:opacity-90 flex items-center justify-center gap-2'
                  )}
                >
                  <Printer size={16} />
                  Imprimir
                </button>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="flex-1 py-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* â•â•â• KEYBOARD SHORTCUTS MODAL â•â•â• */}
      <AnimatePresence>
        {showShortcuts && (
          <ModalOverlay onClose={() => setShowShortcuts(false)}>
            <motion.div
              className={cn(
                'bg-white dark:bg-[#12121A] rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6',
                'border border-gray-200 dark:border-white/10'
              )}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="font-sans text-xl font-bold text-gray-800 dark:text-gray-100 mb-5">
                Atajos de Teclado
              </h2>
              <div className="space-y-3">
                {[
                  { key: '/', desc: 'Buscar producto' },
                  { key: 'Esc', desc: 'Limpiar busqueda / cerrar' },
                  { key: '+', desc: 'Aumentar ultimo item' },
                  { key: '-', desc: 'Disminuir ultimo item' },
                  { key: 'Enter', desc: 'Completar venta' },
                  { key: '?', desc: 'Mostrar atajos' },
                ].map((shortcut) => (
                  <div key={shortcut.key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {shortcut.desc}
                    </span>
                    <kbd className="px-2 py-1 rounded-md bg-gray-100 dark:bg-white/10 text-xs font-mono font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowShortcuts(false)}
                className="mt-5 w-full py-2.5 rounded-lg bg-[#00BCD4] text-white dark:bg-[#FFC107] dark:text-dark-slate text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Entendido
              </button>
            </motion.div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* â•â•â• QR SCANNER MODAL (placeholder) â•â•â• */}
      <AnimatePresence>
        {showQRScanner && (
          <ModalOverlay onClose={() => setShowQRScanner(false)}>
            <motion.div
              className={cn(
                'bg-white dark:bg-[#12121A] rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center',
                'border border-gray-200 dark:border-white/10'
              )}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <div className="w-16 h-16 rounded-full bg-[#00BCD4]/10 flex items-center justify-center mx-auto mb-4">
                <ScanLine size={32} className="text-[#00BCD4]" />
              </div>
              <h2 className="font-sans text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                Escanear QR
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Funcion de escaneo QR proximamente disponible
              </p>
              <button
                onClick={() => setShowQRScanner(false)}
                className="w-full py-2.5 rounded-lg bg-[#00BCD4] text-white dark:bg-[#FFC107] dark:text-dark-slate text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Cerrar
              </button>
            </motion.div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* â•â•â• CONFETTI â•â•â• */}
      {showConfetti && <ConfettiEffect />}

      {/* â•â•â• Print-only receipt (hidden) â•â•â• */}
      <div className="hidden print:block fixed inset-0 bg-white z-[100]">
        <div className="max-w-[80mm] mx-auto p-4">
          <ReceiptView
            receiptNumber={receiptNumber}
            cart={cart}
            subtotal={subtotal}
            discount={discount}
            discountAmount={discountAmount}
            total={total}
            paymentMethod={paymentMethod}
          />
        </div>
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CART PANEL CONTENT (shared desktop + mobile)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function CartPanelContent({
  cart,
  itemCount,
  subtotal,
  discount,
  discountAmount,
  total,
  paymentMethod,
  setPaymentMethod,
  setDiscount,
  updateQty,
  removeItem,
  clearCart,
  onComplete,
  clientName,
  setClientName,
  clientPhone,
  setClientPhone,
  dueDate,
  setDueDate,
  isProcessing,
  onCloseMobile,
}: {
  cart: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  discountAmount: number;
  total: number;
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia' | 'mercadopago' | 'credito';
  setPaymentMethod: (m: 'efectivo' | 'tarjeta' | 'transferencia' | 'mercadopago' | 'credito') => void;
  setDiscount: (d: number) => void;
  updateQty: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  onComplete: () => void;
  clientName: string;
  setClientName: (v: string) => void;
  clientPhone: string;
  setClientPhone: (v: string) => void;
  dueDate: string;
  setDueDate: (v: string) => void;
  isProcessing: boolean;
  onCloseMobile?: () => void;
}) {
  return (
    <div className="flex flex-col h-full p-4 lg:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShoppingCart size={20} className="text-[#00BCD4] dark:text-[#FFC107]" />
          <h2 className="font-sans text-lg font-bold text-gray-800 dark:text-gray-100">
            Ticket de Venta
          </h2>
          <span className="text-xs text-gray-400">{itemCount} items</span>
        </div>
        <div className="flex items-center gap-2">
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400"
            >
              <X size={16} />
            </button>
          )}
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="flex items-center gap-1 text-xs text-danger-rose hover:opacity-70 transition-opacity"
            >
              <Trash2 size={14} />
              Vaciar
            </button>
          )}
        </div>
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-0 mb-4">
        <AnimatePresence mode="popLayout">
          {cart.length === 0 ? (
            <motion.div
              key="empty"
              className="flex flex-col items-center justify-center py-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <ShoppingCart size={40} className="text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-400">El carrito esta vacio</p>
              <p className="text-xs text-gray-300">Agrega productos para comenzar</p>
            </motion.div>
          ) : (
            cart.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -40, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 30,
                }}
                className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-white/5"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-md bg-gradient-to-br from-[#0d7377]/5 to-gold-accent/5 dark:from-[#0d7377]/10 dark:to-gold-accent/10 flex items-center justify-center shrink-0">
                  <Package size={18} className="text-gray-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs font-mono text-gray-400">
                    {fmt(item.price)} / ud
                  </p>
                </div>

                {/* Stepper + subtotal */}
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <motion.span
                      key={item.quantity}
                      initial={{ scale: 1.3 }}
                      animate={{ scale: 1 }}
                      className="w-7 text-center text-sm font-mono font-semibold text-gray-800 dark:text-gray-100"
                    >
                      {item.quantity}
                    </motion.span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="text-xs font-mono font-semibold text-[#FFC107]">
                    {fmt(item.price * item.quantity)}
                  </span>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="p-1 rounded-md hover:bg-danger-rose/10 text-gray-300 hover:text-danger-rose transition-colors"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Summary */}
      <div className="border-t border-gray-200 dark:border-white/10 pt-4 space-y-4">
        {/* Discount */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Descuento</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              value={discount}
              onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
              className={cn(
                'w-16 py-1 px-2 rounded-md text-right text-sm font-mono',
                'border border-gray-200 dark:border-white/10',
                'bg-white dark:bg-[#12121A] text-gray-800 dark:text-gray-100',
                'focus:outline-none focus:border-[#00BCD4] dark:focus:border-[#FFC107]'
              )}
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-mono text-gray-700 dark:text-gray-300">{fmt(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Descuento</span>
              <span className="font-mono text-danger-rose">-{fmt(discountAmount)}</span>
            </div>
          )}
        </div>
        <div className="border-t border-gray-200 dark:border-white/10 pt-2">
          <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400">Total</span>
          <motion.p
            key={total}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            className="font-sans text-3xl font-bold text-[#FFC107]"
          >
            {fmt(total)}
          </motion.p>
        </div>

        {/* Payment method */}
        <div>
          <span className="text-xs text-gray-500 mb-2 block">Metodo de Pago</span>
          <div className="grid grid-cols-4 gap-2">
            {PAYMENT_METHODS.map((pm) => {
              const Icon = pm.icon;
              return (
                <button
                  key={pm.key}
                  onClick={() => setPaymentMethod(pm.key)}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg border text-xs font-medium transition-all duration-200',
                    paymentMethod === pm.key
                      ? 'border-[#00BCD4] bg-[#00BCD4]/5 text-[#00BCD4] dark:border-[#FFC107] dark:bg-[#FFC107]/10 dark:text-[#FFC107]'
                      : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                  )}
                >
                  <Icon size={18} />
                  <span className="text-[10px] leading-tight">{pm.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Credit fields */}
        <AnimatePresence>
          {paymentMethod === 'credito' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-2 overflow-hidden"
            >
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nombre del cliente *"
                className={cn(
                  'w-full px-3 py-2.5 rounded-lg text-sm',
                  'border border-gray-200 dark:border-white/10',
                  'bg-white dark:bg-[#12121A] text-gray-800 dark:text-gray-100 placeholder:text-gray-400',
                  'focus:outline-none focus:border-[#00BCD4] dark:focus:border-[#FFC107]'
                )}
              />
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="Telefono (opcional)"
                className={cn(
                  'w-full px-3 py-2.5 rounded-lg text-sm',
                  'border border-gray-200 dark:border-white/10',
                  'bg-white dark:bg-[#12121A] text-gray-800 dark:text-gray-100 placeholder:text-gray-400',
                  'focus:outline-none focus:border-[#00BCD4] dark:focus:border-[#FFC107]'
                )}
              />
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Complete button */}
        <button
          onClick={onComplete}
          disabled={cart.length === 0 || isProcessing}
          className={cn(
            'w-full py-4 rounded-lg text-base font-semibold text-white transition-all duration-200',
            'flex items-center justify-center gap-2',
            cart.length > 0
              ? 'bg-gradient-to-r from-gold-accent to-gold-light shadow-glow-gold animate-gold-pulse'
              : 'bg-gray-300 cursor-not-allowed'
          )}
        >
          {isProcessing ? (
            <motion.div
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            <>
              <Sparkles size={18} />
              Completar Venta
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   RECEIPT VIEW (screen + print)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function ReceiptView({
  receiptNumber,
  cart,
  subtotal,
  discount,
  discountAmount,
  total,
  paymentMethod,
}: {
  receiptNumber: string;
  cart: CartItem[];
  subtotal: number;
  discount: number;
  discountAmount: number;
  total: number;
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia' | 'mercadopago' | 'credito';
}) {
  const now = new Date();
  const pmLabel = PAYMENT_METHODS.find((p) => p.key === paymentMethod)?.label || paymentMethod;

  return (
    <div className="text-center">
      {/* Header */}
      <div className="mb-4">
        <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-[#0d7377] to-gold-accent rounded-full flex items-center justify-center">
          <Package size={20} className="text-white" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Dulces Aromas</h3>
        <p className="text-xs text-gray-500">Perfumeria & Fragancias</p>
        <p className="text-[10px] text-gray-400">Av. Siempre Viva 742, Santiago</p>
        <p className="text-[10px] text-gray-400">+56 9 1234 5678</p>
      </div>

      <div className="border-b border-dashed border-gray-300 dark:border-gray-600 my-3" />

      {/* Transaction */}
      <div className="text-left space-y-0.5 mb-3">
        <p className="text-xs font-mono text-gray-700 dark:text-gray-300">
          RECIBO #{receiptNumber}
        </p>
        <p className="text-[10px] text-gray-500">
          {now.toLocaleDateString('es-ES')} {now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="text-[10px] text-gray-500">Cajero: Admin</p>
      </div>

      <div className="border-b border-dashed border-gray-300 dark:border-gray-600 my-3" />

      {/* Items */}
      <table className="w-full text-left text-xs mb-3">
        <thead>
          <tr className="text-gray-500 text-[10px]">
            <th className="pb-1 font-normal">Cant</th>
            <th className="pb-1 font-normal">Descripcion</th>
            <th className="pb-1 font-normal text-right">P.Unit</th>
            <th className="pb-1 font-normal text-right">Subt</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item) => (
            <tr key={item.id} className="text-gray-700 dark:text-gray-300">
              <td className="py-0.5 font-mono">{item.quantity}</td>
              <td className="py-0.5">{item.name}</td>
              <td className="py-0.5 font-mono text-right">{fmt(item.price)}</td>
              <td className="py-0.5 font-mono text-right">{fmt(item.price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-b border-dashed border-gray-300 dark:border-gray-600 my-3" />

      {/* Totals */}
      <div className="text-right space-y-0.5 text-xs">
        <div className="flex justify-between text-gray-500">
          <span>Subtotal</span>
          <span className="font-mono">{fmt(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-danger-rose">
            <span>Descuento ({discount}%)</span>
            <span className="font-mono">-{fmt(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold text-gray-900 dark:text-gray-100 mt-2">
          <span>TOTAL</span>
          <span className="font-mono">{fmt(total)}</span>
        </div>
        <div className="flex justify-between text-gray-500 mt-1">
          <span>Metodo</span>
          <span>{pmLabel}</span>
        </div>
      </div>

      <div className="border-b border-dashed border-gray-300 dark:border-gray-600 my-3" />

      {/* Footer */}
      <div className="mt-4">
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Gracias por su compra!</p>
        <div className="w-20 h-20 mx-auto mb-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          <div className="text-[8px] font-mono text-gray-400 text-center leading-tight">
            <Package size={28} className="mx-auto mb-1 text-gray-300" />
            QR
          </div>
        </div>
        <p className="text-[10px] text-[#00BCD4]">@dulcesaromas</p>
        <p className="text-[10px] text-gray-400 italic">Vuelva pronto</p>
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MODAL OVERLAY
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
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
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}



