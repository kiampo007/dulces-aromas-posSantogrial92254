import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Plus, Minus, X, Send, Trash2, Store, Lock,
  Search, Package, Phone, User, MapPin, FileText, CheckCircle, ExternalLink
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { usePedidos } from '@/hooks/usePedidos';
import type { Product, Category } from '@/types/product';

/* ───────────────────── types ───────────────────── */
interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

/* ───────────────────── constants ───────────────────── */
const CATEGORIES: { value: Category | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'caballero', label: 'Caballero' },
  { value: 'dama', label: 'Dama' },
  { value: 'ninos', label: 'Ninos' },
  { value: 'unisex', label: 'Unisex' },
];

const CATEGORY_COLORS: Record<Category | 'todos', string> = {
  todos: 'bg-gray-500',
  caballero: 'bg-blue-500',
  dama: 'bg-pink-500',
  ninos: 'bg-green-500',
  unisex: 'bg-purple-500',
};

const CATEGORY_GRADIENTS: Record<Category, string> = {
  caballero: 'from-blue-400 to-blue-600',
  dama: 'from-pink-400 to-pink-600',
  ninos: 'from-green-400 to-green-600',
  unisex: 'from-purple-400 to-purple-600',
};

/* ───────────────────── helpers ───────────────────── */
function formatPrice(value: number): string {
  return `$ ${value.toLocaleString('es-ES').replace(/,/g, '.')}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/* ─══════════════════ HEADER ═══════════════════ */
function Header({ onCartClick, cartCount }: { onCartClick: () => void; cartCount: number }) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00BCD4] flex items-center justify-center">
              <Store size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-gray-800 leading-tight">Dulces Aromas</h1>
              <span className="text-[10px] text-gray-500 tracking-wider uppercase">Perfumeria & Fragancias</span>
            </div>
          </div>

          {/* Cart button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCartClick}
            className="relative flex items-center gap-2 px-4 py-2 bg-[#00BCD4] text-white rounded-full text-sm font-medium hover:bg-[#00ACC1] transition-colors"
          >
            <ShoppingCart size={18} />
            <span className="hidden sm:inline">Hacer Pedido</span>
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-[#F59E0B] text-white text-xs font-bold rounded-full flex items-center justify-center"
              >
                {cartCount}
              </motion.span>
            )}
          </motion.button>
        </div>
      </div>
    </header>
  );
}

/* ─══════════════════ HERO BANNER ═══════════════════ */
function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-[#00BCD4] py-8 sm:py-12">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white" />
        <div className="absolute top-20 -left-10 w-32 h-32 rounded-full bg-white" />
        <div className="absolute bottom-0 right-1/4 w-24 h-24 rounded-full bg-white" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold text-white mb-2"
        >
          Bienvenidos a Dulces Aromas
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-white/90 text-sm sm:text-base max-w-xl mx-auto"
        >
          Descubre nuestra coleccion de fragancias exclusivas para cada ocasion. Calidad y elegancia en cada aroma.
        </motion.p>
      </div>
    </section>
  );
}

/* ─══════════════════ CATEGORY TABS ═══════════════════ */
function CategoryTabs({ active, onChange }: { active: Category | 'todos'; onChange: (c: Category | 'todos') => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {CATEGORIES.map(cat => (
        <motion.button
          key={cat.value}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(cat.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            active === cat.value
              ? 'bg-[#00BCD4] text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          {cat.label}
        </motion.button>
      ))}
    </div>
  );
}

/* ─══════════════════ PRODUCT CARD ═══════════════════ */
function ProductCard({ product, onAdd, onClick }: { product: Product; onAdd: (p: Product) => void; onClick: (p: Product) => void }) {
  const category = product.category as Category;
  const gradient = CATEGORY_GRADIENTS[category] || 'from-gray-400 to-gray-600';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden border border-gray-100 cursor-pointer"
      onClick={() => onClick(product)}
    >
      {/* Image placeholder */}
      <div className={`h-40 bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
        <span className="text-white/90 text-3xl font-bold tracking-wider">
          {getInitials(product.name)}
        </span>
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] text-white font-medium ${CATEGORY_COLORS[category]}`}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 min-h-[2.5rem] leading-snug">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 mt-1">{product.brand}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-[#00BCD4]">{formatPrice(product.price)}</span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onAdd(product);
            }}
            className="w-8 h-8 rounded-full bg-[#00BCD4] text-white flex items-center justify-center hover:bg-[#00ACC1] transition-colors"
          >
            <Plus size={16} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─══════════════════ PRODUCT MODAL ═══════════════════ */
function ProductModal({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: (p: Product, qty: number) => void }) {
  const [quantity, setQuantity] = useState(1);
  const category = product.category as Category;
  const gradient = CATEGORY_GRADIENTS[category] || 'from-gray-400 to-gray-600';

  const stockLabel = product.stock === 0 ? 'Agotado' : product.stock <= product.minStock ? `Solo ${product.stock} disponibles` : 'En stock';
  const stockColor = product.stock === 0 ? 'text-red-500' : product.stock <= product.minStock ? 'text-amber-500' : 'text-green-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Image */}
        <div className={`h-52 bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
          <span className="text-white/90 text-5xl font-bold tracking-wider">{getInitials(product.name)}</span>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Details */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs text-white font-medium ${CATEGORY_COLORS[category]}`}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </span>
            <span className={`text-xs font-medium ${stockColor}`}>{stockLabel}</span>
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-1">{product.name}</h2>
          <p className="text-sm text-gray-500 mb-3">{product.brand}</p>

          <p className="text-sm text-gray-600 leading-relaxed mb-4">{product.description}</p>

          {product.notes && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-1">Notas:</p>
              <p className="text-sm text-gray-600">{product.notes}</p>
            </div>
          )}

          <div className="flex items-center justify-between mb-5">
            <span className="text-2xl font-bold text-[#00BCD4]">{formatPrice(product.price)}</span>

            {/* Quantity selector */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-full px-3 py-1.5">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-100"
              >
                <Minus size={14} />
              </motion.button>
              <span className="text-sm font-semibold w-4 text-center">{quantity}</span>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => setQuantity(q => q + 1)}
                className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-100"
              >
                <Plus size={14} />
              </motion.button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onAdd(product, quantity);
              onClose();
            }}
            className="w-full py-3 bg-[#00BCD4] text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#00ACC1] transition-colors"
          >
            <ShoppingCart size={18} />
            Agregar al Pedido - {formatPrice(product.price * quantity)}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─══════════════════ CART DRAWER ═══════════════════ */
interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
  onSubmitWhatsApp: (cliente: string, telefono: string, direccion: string, notas: string) => void;
  onSubmitSystem: (cliente: string, telefono: string, direccion: string, notas: string) => void;
}

function CartDrawer({ open, onClose, items, onUpdateQty, onRemove, onClear, onSubmitWhatsApp, onSubmitSystem }: CartDrawerProps) {
  const [cliente, setCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [notas, setNotas] = useState('');

  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  const canSubmit = cliente.trim().length > 0 && telefono.trim().length > 0 && items.length > 0;

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingCart size={20} className="text-[#00BCD4]" />
                <h2 className="text-lg font-semibold text-gray-800">Tu Pedido</h2>
                <span className="px-2 py-0.5 rounded-full text-xs bg-[#00BCD4]/10 text-[#00BCD4] font-medium">
                  {items.length} items
                </span>
              </div>
              <div className="flex items-center gap-1">
                {items.length > 0 && (
                  <button
                    onClick={onClear}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Vaciar carrito"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ShoppingCart size={48} className="mb-3 opacity-30" />
                  <p className="text-sm">Tu carrito esta vacio</p>
                  <p className="text-xs">Agrega productos para comenzar tu pedido</p>
                </div>
              ) : (
                <AnimatePresence>
                  {items.map(item => (
                    <motion.div
                      key={item.productId}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center gap-3 bg-gray-50 rounded-xl p-3"
                    >
                      <div className="w-12 h-12 rounded-lg bg-[#00BCD4]/10 flex items-center justify-center flex-shrink-0">
                        <Package size={20} className="text-[#00BCD4]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">{formatPrice(item.price)} c/u</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => onUpdateQty(item.productId, -1)}
                          className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600"
                        >
                          <Minus size={12} />
                        </motion.button>
                        <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => onUpdateQty(item.productId, 1)}
                          className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600"
                        >
                          <Plus size={12} />
                        </motion.button>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="text-sm font-semibold text-gray-800">{formatPrice(item.price * item.quantity)}</p>
                        <button onClick={() => onRemove(item.productId)} className="text-xs text-red-400 hover:text-red-600">
                          Eliminar
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {items.length > 0 && (
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-800 mb-4">
                    <span>Total</span>
                    <span className="text-[#00BCD4]">{formatPrice(total)}</span>
                  </div>

                  {/* Customer form */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <User size={16} /> Datos del Cliente
                    </h3>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Nombre completo *"
                        value={cliente}
                        onChange={e => setCliente(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                      />
                    </div>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        placeholder="Telefono *"
                        value={telefono}
                        onChange={e => setTelefono(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                      />
                    </div>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Direccion (opcional)"
                        value={direccion}
                        onChange={e => setDireccion(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                      />
                    </div>
                    <div className="relative">
                      <FileText size={16} className="absolute left-3 top-3 text-gray-400" />
                      <textarea
                        placeholder="Notas adicionales (opcional)"
                        value={notas}
                        onChange={e => setNotas(e.target.value)}
                        rows={2}
                        className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            {items.length > 0 && (
              <div className="p-4 border-t border-gray-100 space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSubmitWhatsApp(cliente, telefono, direccion, notas)}
                  disabled={!canSubmit}
                  className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
                    canSubmit
                      ? 'bg-[#25D366] text-white hover:bg-[#128C7E]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <ExternalLink size={18} />
                  Enviar Pedido por WhatsApp
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSubmitSystem(cliente, telefono, direccion, notas)}
                  disabled={!canSubmit}
                  className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
                    canSubmit
                      ? 'bg-[#00BCD4] text-white hover:bg-[#00ACC1]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Send size={18} />
                  Enviar Pedido al Sistema
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─══════════════════ SUCCESS TOAST ═══════════════════ */
function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 max-w-sm"
    >
      <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-white">
        <X size={14} />
      </button>
    </motion.div>
  );
}

/* ─══════════════════ FOOTER ═══════════════════ */
function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-8 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Store size={18} className="text-[#00BCD4]" />
          <span className="font-semibold text-gray-800">Dulces Aromas</span>
        </div>
        <p className="text-sm text-gray-500 mb-3">Hecho con amor</p>
        <a
          href="/"
          className="inline-flex items-center gap-1 text-xs text-[#00BCD4] hover:underline"
        >
          <Lock size={12} />
          Acceso Administrativo
        </a>
      </div>
    </footer>
  );
}

/* ─══════════════════ FLOATING CART BUTTON ═══════════════════ */
function FloatingCartButton({ count, onClick }: { count: number; onClick: () => void }) {
  if (count === 0) return null;

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#00BCD4] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#00ACC1] transition-colors"
    >
      <ShoppingCart size={22} />
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute -top-1 -right-1 w-6 h-6 bg-[#F59E0B] text-white text-xs font-bold rounded-full flex items-center justify-center"
      >
        {count}
      </motion.span>
    </motion.button>
  );
}

/* ═══════════════════ MAIN TIENDA PAGE ═══════════════════ */
export default function TiendaPage() {
  const { products } = useProducts();
  const { createPedido } = usePedidos();
  const [activeCategory, setActiveCategory] = useState<Category | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  /* ── filtered products ── */
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (activeCategory !== 'todos') {
      result = result.filter(p => p.category === activeCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.notes.toLowerCase().includes(q)
      );
    }

    // Only show in-stock products on storefront
    result = result.filter(p => p.stock > 0);

    // Sort by name
    result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [products, activeCategory, searchQuery]);

  /* ── cart helpers ── */
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const addToCart = useCallback((product: Product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: qty }];
    });
    setToast(`${product.name} agregado al pedido`);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const updateCartQty = useCallback((productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  /* ── WhatsApp submit ── */
  const submitWhatsApp = useCallback((cliente: string, telefono: string, direccion: string, notas: string) => {
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    let message = `Hola! Quiero hacer un pedido de Dulces Aromas:\n\n`;
    cart.forEach((item, i) => {
      const subtotal = item.price * item.quantity;
      message += `${i + 1}. ${item.name} - ${formatPrice(item.price)} x ${item.quantity} = ${formatPrice(subtotal)}\n`;
    });
    message += `\nTotal: ${formatPrice(total)}\n`;
    message += `\nCliente: ${cliente}`;
    message += `\nTelefono: ${telefono}`;
    if (direccion.trim()) message += `\nDireccion: ${direccion}`;
    if (notas.trim()) message += `\nNotas: ${notas}`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }, [cart]);

  /* ── System submit ── */
  const submitSystem = useCallback((cliente: string, telefono: string, direccion: string, notas: string) => {
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    createPedido({
      cliente: cliente.trim(),
      telefono: telefono.trim(),
      direccion: direccion.trim() || undefined,
      notas: notas.trim() || undefined,
      items: cart.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      total,
      origen: 'tienda',
    });

    setCart([]);
    setCartOpen(false);
    setToast('Pedido enviado al sistema exitosamente!');
    setTimeout(() => setToast(null), 3000);
  }, [cart, createPedido]);

  return (
    <div className="min-h-[100dvh] bg-[#f0f9ff] flex flex-col">
      <Header onCartClick={() => setCartOpen(true)} cartCount={cartCount} />
      <HeroBanner />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Search & Filters */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar fragancias..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent shadow-sm"
            />
          </div>

          {/* Category tabs */}
          <CategoryTabs active={activeCategory} onChange={setActiveCategory} />
        </div>

        {/* Product count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={addToCart}
                onClick={setSelectedProduct}
              />
            ))}
          </AnimatePresence>
        </div>

        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Search size={48} className="mb-3 opacity-30" />
            <p className="text-sm">No se encontraron productos</p>
            <p className="text-xs">Intenta con otra busqueda o categoria</p>
          </div>
        )}
      </main>

      <Footer />

      {/* Product Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAdd={addToCart}
          />
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onUpdateQty={updateCartQty}
        onRemove={removeFromCart}
        onClear={clearCart}
        onSubmitWhatsApp={submitWhatsApp}
        onSubmitSystem={submitSystem}
      />

      {/* Floating Cart Button */}
      <AnimatePresence>
        <FloatingCartButton count={cartCount} onClick={() => setCartOpen(true)} />
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && <SuccessToast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
