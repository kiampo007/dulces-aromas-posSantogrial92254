import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import {
  Search, LayoutGrid, List, Plus, Pencil, Trash2, X,
  ChevronDown, AlertTriangle, Download, Upload, Minus, Plus as PlusIcon,
  Copy, Check, FileSpreadsheet, Package, Filter, ArrowUpDown,
  QrCode,
} from 'lucide-react';
import { ProductQRModal } from '../components/ProductQR';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Product, Category, ProductFilters, SortOption } from '@/types/product';
import {
  useProducts, filterAndSortProducts, getStockStatus,
  formatPrice, getCategoryColor, getCategoryLabel,
} from '@/hooks/useProducts';
import { CATEGORIES } from '@/data/productData';

const easing = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ─── toast ─── */
interface Toast { id: string; message: string; type: 'success' | 'error' | 'info'; }

/* ─── sort options ─── */
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name-asc', label: 'Nombre A-Z' },
  { value: 'name-desc', label: 'Nombre Z-A' },
  { value: 'price-asc', label: 'Precio: Menor a Mayor' },
  { value: 'price-desc', label: 'Precio: Mayor a Menor' },
  { value: 'stock-desc', label: 'Stock: Mayor a Menor' },
  { value: 'stock-asc', label: 'Stock: Menor a Mayor' },
  { value: 'margin-desc', label: 'Margen: Mayor a Menor' },
];

/* ─── empty product template ─── */
const emptyProduct: Omit<Product, 'id' | 'margin' | 'createdAt' | 'updatedAt'> = {
  name: '', brand: '', category: 'dama', price: 0, cost: 0, stock: 0, minStock: 5,
  notes: '', description: '', image: null,
};

export default function CatalogoPage() {
  const {
    products, selectedIds, addProduct, updateProduct, deleteProduct,
    deleteProducts, duplicateProduct, adjustStock,
    toggleSelection, selectAll, clearSelection, importProducts,
  } = useProducts();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<ProductFilters>({
    search: '', category: 'todos', priceMin: null, priceMax: null,
    stockStatus: 'todos', sortBy: 'name-asc',
  });
  const [sortOpen, setSortOpen] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  /* modals */
  const [productModal, setProductModal] = useState<{ open: boolean; editing?: Product }>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const [detailModal, setDetailModal] = useState<Product | null>(null);
  const [qrProduct, setQrProduct] = useState<Product | null>(null);

  /* toasts */
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  /* CSV import */
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = `toast_${++toastId.current}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  /* derived state */
  const filteredProducts = useMemo(() =>
    filterAndSortProducts(products, filters),
    [products, filters]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { todos: products.length };
    for (const p of products) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, [products]);

  /* actions */
  const handleAddProduct = useCallback((data: Omit<Product, 'id' | 'margin' | 'createdAt' | 'updatedAt'>) => {
    addProduct(data);
    showToast('Producto agregado exitosamente');
    setProductModal({ open: false });
  }, [addProduct, showToast]);

  const handleUpdateProduct = useCallback((id: string, data: Partial<Product>) => {
    updateProduct(id, data);
    showToast('Producto actualizado exitosamente');
    setProductModal({ open: false });
  }, [updateProduct, showToast]);

  const handleDelete = useCallback((product: Product) => {
    deleteProduct(product.id);
    showToast(`"${product.name}" eliminado`, 'info');
    setDeleteConfirm(null);
  }, [deleteProduct, showToast]);

  const handleBulkDelete = useCallback(() => {
    const ids = Array.from(selectedIds);
    deleteProducts(ids);
    showToast(`${ids.length} productos eliminados`, 'info');
  }, [selectedIds, deleteProducts, showToast]);

  const handleDuplicate = useCallback((product: Product) => {
    duplicateProduct(product.id);
    showToast(`"${product.name}" duplicado`);
  }, [duplicateProduct, showToast]);

  const handleExportExcel = useCallback(() => {
    const data = filteredProducts.map(p => ({
      ID: p.id,
      Nombre: p.name,
      Marca: p.brand,
      Categoria: getCategoryLabel(p.category),
      Precio: p.price,
      Costo: p.cost,
      Stock: p.stock,
      'Stock Minimo': p.minStock,
      Margen: `${p.margin}%`,
      Notas: p.notes,
      Descripcion: p.description,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    XLSX.writeFile(wb, `catalogo_dulces_aromas_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('Catalogo exportado a Excel');
  }, [filteredProducts, showToast]);

  const handleExportSelected = useCallback(() => {
    const selected = products.filter(p => selectedIds.has(p.id));
    const data = selected.map(p => ({
      ID: p.id, Nombre: p.name, Marca: p.brand, Categoria: getCategoryLabel(p.category),
      Precio: p.price, Costo: p.cost, Stock: p.stock, Margen: `${p.margin}%`,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Seleccionados');
    XLSX.writeFile(wb, `productos_seleccionados_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('Seleccion exportada');
  }, [products, selectedIds, showToast]);

  const handleImportCSV = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        const imported: Omit<Product, 'id' | 'margin' | 'createdAt' | 'updatedAt'>[] = [];
        for (const row of rows) {
          const cat = String(row['Categoria'] || row['category'] || 'unisex').toLowerCase();
          const validCat: Category = ['caballero', 'dama', 'ninos', 'unisex'].includes(cat)
            ? (cat as Category) : 'unisex';

          imported.push({
            name: String(row['Nombre'] || row['name'] || 'Sin nombre'),
            brand: String(row['Marca'] || row['brand'] || ''),
            category: validCat,
            price: Number(row['Precio'] || row['price'] || 0),
            cost: Number(row['Costo'] || row['cost'] || 0),
            stock: Number(row['Stock'] || row['stock'] || 0),
            minStock: Number(row['Stock Minimo'] || row['minStock'] || 5),
            notes: String(row['Notas'] || row['notes'] || ''),
            description: String(row['Descripcion'] || row['description'] || ''),
            image: null,
          });
        }

        if (imported.length > 0) {
          const count = importProducts(imported);
          showToast(`${count} productos importados exitosamente`);
        }
      } catch {
        showToast('Error al importar archivo', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  }, [importProducts, showToast]);

  const allSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.has(p.id));

  return (
    <div className="min-h-full">
      {/* ─── Toasts ─── */}
      <div className="fixed top-4 right-4 z-[70] space-y-2">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3, ease: easing }}
              className={cn(
                'flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium min-w-[260px]',
                t.type === 'success' && 'bg-[#4CAF50] text-white',
                t.type === 'error' && 'bg-danger-rose text-white',
                t.type === 'info' && 'bg-[#00BCD4] text-white',
              )}
            >
              {t.type === 'success' && <Check className="w-4 h-4" />}
              {t.type === 'error' && <AlertTriangle className="w-4 h-4" />}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ─── Page Header ─── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-[#00BCD4] dark:text-[#FFC107]" />
          <h1 className="font-sans text-2xl lg:text-[2rem] font-bold text-gray-800 dark:text-gray-100">
            Catalogo
          </h1>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
          {filteredProducts.length} productos
        </span>
      </div>

      {/* ─── Filter & Search Bar ─── */}
      <div className="sticky top-0 z-30 bg-[#f0f9ff]/95 dark:bg-[#0d1b2a]/95 backdrop-blur-sm pb-3 pt-1 -mx-4 px-4 lg:-mx-6 lg:px-6">
        {/* Search row */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, marca o nota olfativa..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className={cn(
                'w-full h-10 pl-10 pr-10 rounded-full border bg-white dark:bg-[#12121A] text-sm',
                'border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100',
                'focus:outline-none focus:border-[#00BCD4] focus:ring-2 focus:ring-info-cyan/25',
                'transition-all duration-150 placeholder:text-gray-400'
              )}
            />
            {filters.search && (
              <button
                onClick={() => setFilters(f => ({ ...f, search: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Filter button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setFilterPanelOpen(o => !o)}
            className={cn(
              'h-10 w-10 rounded-full shrink-0',
              filterPanelOpen && 'border-[#00BCD4] text-[#00BCD4] bg-[#00BCD4]/10'
            )}
          >
            <Filter className="w-4 h-4" />
          </Button>

          {/* Sort dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOpen(o => !o)}
              className="h-10 rounded-full gap-1 text-xs shrink-0"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ordenar</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
            <AnimatePresence>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-[#12121A] rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 z-50 py-1"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setFilters(f => ({ ...f, sortBy: opt.value })); setSortOpen(false); }}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                          filters.sortBy === opt.value && 'text-[#00BCD4] font-medium bg-[#00BCD4]/5'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid'
                  ? 'bg-[#00BCD4] text-white'
                  : 'bg-white dark:bg-[#12121A] text-gray-400 hover:text-gray-600'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'list'
                  ? 'bg-[#00BCD4] text-white'
                  : 'bg-white dark:bg-[#12121A] text-gray-400 hover:text-gray-600'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
          {CATEGORIES.map(cat => (
            <motion.button
              key={cat.value}
              layout
              onClick={() => setFilters(f => ({ ...f, category: cat.value }))}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                filters.category === cat.value
                  ? 'bg-[#00BCD4] text-white'
                  : 'bg-white dark:bg-[#12121A] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              {cat.label}{' '}
              <span className={cn('opacity-70', filters.category === cat.value && 'text-white/70')}>
                ({categoryCounts[cat.value] || 0})
              </span>
            </motion.button>
          ))}
        </div>

        {/* Advanced filter panel */}
        <AnimatePresence>
          {filterPanelOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 pb-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <select
                  value={filters.stockStatus}
                  onChange={e => setFilters(f => ({ ...f, stockStatus: e.target.value as ProductFilters['stockStatus'] }))}
                  className="h-9 px-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#12121A] text-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#00BCD4]"
                >
                  <option value="todos">Stock: Todos</option>
                  <option value="disponible">Disponible</option>
                  <option value="bajo">Stock Bajo</option>
                  <option value="agotado">Agotado</option>
                </select>
                <Input
                  type="number"
                  placeholder="Precio min"
                  value={filters.priceMin ?? ''}
                  onChange={e => setFilters(f => ({ ...f, priceMin: e.target.value ? Number(e.target.value) : null }))}
                  className="h-9 text-xs"
                />
                <Input
                  type="number"
                  placeholder="Precio max"
                  value={filters.priceMax ?? ''}
                  onChange={e => setFilters(f => ({ ...f, priceMax: e.target.value ? Number(e.target.value) : null }))}
                  className="h-9 text-xs"
                />
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportExcel}
                    className="h-9 text-xs flex-1 gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Exportar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9 text-xs flex-1 gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" /> Importar
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bulk actions */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 pt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedIds.size} seleccionados
                </span>
                <Button variant="outline" size="sm" onClick={() => selectAll(filteredProducts.map(p => p.id))} className="h-8 text-xs">
                  Seleccionar todos
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection} className="h-8 text-xs">
                  Limpiar
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportSelected} className="h-8 text-xs gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Exportar
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="h-8 text-xs gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Product Grid ─── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4 mt-4">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                index={i}
                isSelected={selectedIds.has(product.id)}
                onSelect={() => toggleSelection(product.id)}
                onEdit={() => setProductModal({ open: true, editing: product })}
                onDelete={() => setDeleteConfirm(product)}
                onDuplicate={() => handleDuplicate(product)}
                onDetail={() => setDetailModal(product)}
                onAdjustStock={adjustStock}
                onShowQR={() => setQrProduct(product)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ─── Product List ─── */}
      {viewMode === 'list' && (
        <div className="mt-4 bg-white dark:bg-[#12121A] rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0">
                <tr>
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => allSelected ? clearSelection() : selectAll(filteredProducts.map(p => p.id))}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Producto</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Categoria</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => setFilters(f => ({ ...f, sortBy: f.sortBy === 'price-asc' ? 'price-desc' : 'price-asc' }))}>Precio</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => setFilters(f => ({ ...f, sortBy: f.sortBy === 'stock-desc' ? 'stock-asc' : 'stock-desc' }))}>Stock</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Margen</th>
                  <th className="w-24 px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                <AnimatePresence>
                  {filteredProducts.map((product, i) => (
                    <ProductListRow
                      key={product.id}
                      product={product}
                      index={i}
                      isSelected={selectedIds.has(product.id)}
                      onSelect={() => toggleSelection(product.id)}
                      onEdit={() => setProductModal({ open: true, editing: product })}
                      onDelete={() => setDeleteConfirm(product)}
                      onDuplicate={() => handleDuplicate(product)}
                      onDetail={() => setDetailModal(product)}
                      onAdjustStock={adjustStock}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredProducts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-1">No hay productos</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">Ajusta los filtros o agrega tu primer producto</p>
          <Button onClick={() => setProductModal({ open: true })}>
            <Plus className="w-4 h-4 mr-1" /> Agregar Producto
          </Button>
        </motion.div>
      )}

      {/* ─── FAB (mobile) ─── */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setProductModal({ open: true })}
        className="fixed bottom-20 right-4 lg:hidden z-40 w-14 h-14 rounded-full gradient-gold text-white shadow-glow-gold flex items-center justify-center animate-gold-pulse"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* ─── Add/Edit Product Modal ─── */}
      <ProductFormModal
        open={productModal.open}
        editing={productModal.editing}
        onClose={() => setProductModal({ open: false })}
        onSave={handleAddProduct}
        onUpdate={handleUpdateProduct}
      />

      {/* ─── Delete Confirmation ─── */}
      <DeleteConfirmModal
        product={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
      />

      {/* ─── Product Detail Modal ─── */}
      <ProductDetailModal
        product={detailModal}
        onClose={() => setDetailModal(null)}
        onEdit={(p) => { setDetailModal(null); setProductModal({ open: true, editing: p }); }}
        onDelete={(p) => { setDetailModal(null); setDeleteConfirm(p); }}
      />

      {/* ─── Product QR Modal ─── */}
      {qrProduct && <ProductQRModal product={qrProduct} onClose={() => setQrProduct(null)} />}

      {/* Hidden file input for CSV import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleImportCSV(f); e.target.value = ''; }}
        className="hidden"
      />
    </div>
  );
}

/* ==================================================================== */
/*  PRODUCT CARD (Grid)                                                  */
/* ==================================================================== */
function ProductCard({
  product, index, isSelected, onSelect, onEdit, onDelete, onDuplicate, onDetail, onAdjustStock, onShowQR,
}: {
  product: Product; index: number; isSelected: boolean;
  onSelect: () => void; onEdit: () => void; onDelete: () => void;
  onDuplicate: () => void; onDetail: () => void; onAdjustStock: (id: string, delta: number) => void;
  onShowQR: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const stockStatus = getStockStatus(product);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30, transition: { duration: 0.25 } }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4), ease: easing }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={cn(
        'group bg-white dark:bg-[#12121A] rounded-[10px] border overflow-hidden transition-shadow duration-250',
        'border-gray-100 dark:border-gray-800 hover:shadow-lg',
        isSelected && 'ring-2 ring-[#00BCD4] dark:ring-gold-accent'
      )}
    >
      {/* Image area */}
      <div className="relative aspect-[3/4] overflow-hidden cursor-pointer" onClick={onDetail}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d7377]/20 via-deep-teal-light/10 to-deep-teal/30 flex items-center justify-center">
          <Package className="w-12 h-12 text-[#00BCD4]/20" />
        </div>
        {/* Category badge */}
        <span className={cn('absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] text-white font-medium', getCategoryColor(product.category))}>
          {getCategoryLabel(product.category)}
        </span>
        {/* Stock badge */}
        <span className={cn('absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium', stockStatus.color)}>
          {stockStatus.label}
        </span>
        {/* Selection checkbox */}
        <div className="absolute bottom-2 left-2">
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className={cn(
              'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
              isSelected
                ? 'bg-[#00BCD4] border-[#00BCD4] text-white'
                : 'border-white/60 bg-black/20 hover:border-white'
            )}
          >
            {isSelected && <Check className="w-3 h-3" />}
          </button>
        </div>
        {/* Hover actions */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-2 right-2 flex items-center gap-1"
            >
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-[#00BCD4] hover:text-white transition-colors"
                title="Editar"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-[#00BCD4] hover:text-white transition-colors"
                title="Duplicar"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onShowQR(); }}
                className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-[#00BCD4] hover:text-white transition-colors"
                title="Ver QR"
              >
                <QrCode className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="w-7 h-7 rounded-full bg-danger-rose/10 text-danger-rose flex items-center justify-center hover:bg-danger-rose hover:text-white transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-2 leading-tight min-h-[2.4em]" onClick={onDetail}>
          {product.name}
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{product.brand}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="font-sans text-base text-[#FFC107] font-semibold">
            {formatPrice(product.price)}
          </span>
          {/* Quick stock adjust */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onAdjustStock(product.id, -1)}
              className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-danger-rose/20 hover:text-danger-rose transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <motion.span
              key={product.stock}
              initial={{ scale: 1.3, color: '#FFC107' }}
              animate={{ scale: 1, color: product.stock === 0 ? '#EF4444' : product.stock <= product.minStock ? '#F59E0B' : '#4CAF50' }}
              className="text-xs font-mono font-semibold w-6 text-center tabular-nums"
            >
              {product.stock}
            </motion.span>
            <button
              onClick={() => onAdjustStock(product.id, 1)}
              className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-[#4CAF50]/20 hover:text-[#4CAF50] transition-colors"
            >
              <PlusIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-mono">
          Costo: {formatPrice(product.cost)} | Margen: {product.margin}%
        </p>
      </div>
    </motion.div>
  );
}

/* ==================================================================== */
/*  PRODUCT LIST ROW                                                     */
/* ==================================================================== */
function ProductListRow({
  product, index, isSelected, onSelect, onEdit, onDelete, onDuplicate, onDetail, onAdjustStock,
}: {
  product: Product; index: number; isSelected: boolean;
  onSelect: () => void; onEdit: () => void; onDelete: () => void;
  onDuplicate: () => void; onDetail: () => void; onAdjustStock: (id: string, delta: number) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const stockStatus = getStockStatus(product);

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={cn(
        'hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer',
        isSelected && 'bg-[#00BCD4]/5 dark:bg-[#00BCD4]/10'
      )}
      onClick={onDetail}
    >
      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded border-gray-300"
        />
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#0d7377]/20 to-[#14919b]/10 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-[#00BCD4]/40" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{product.name}</p>
            <p className="text-xs text-gray-400">{product.brand}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 hidden md:table-cell">
        <span className={cn('px-2 py-0.5 rounded-full text-[10px] text-white font-medium', getCategoryColor(product.category))}>
          {getCategoryLabel(product.category)}
        </span>
      </td>
      <td className="px-3 py-3">
        <span className="font-mono text-sm text-[#FFC107] font-medium">
          {formatPrice(product.price)}
        </span>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1">
          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', stockStatus.color)}>
            {product.stock}
          </span>
          <div className="flex items-center ml-1" onClick={e => e.stopPropagation()}>
            <button onClick={() => onAdjustStock(product.id, -1)} className="w-5 h-5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400">
              <Minus className="w-3 h-3" />
            </button>
            <button onClick={() => onAdjustStock(product.id, 1)} className="w-5 h-5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400">
              <PlusIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 hidden sm:table-cell">
        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{product.margin}%</span>
      </td>
      <td className="px-3 py-3">
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={onEdit} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={onDuplicate} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button onClick={onDelete} className="p-1.5 rounded-md hover:bg-danger-rose/10 text-danger-rose">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </td>
    </motion.tr>
  );
}

/* ==================================================================== */
/*  PRODUCT FORM MODAL                                                   */
/* ==================================================================== */
function ProductFormModal({
  open, editing, onClose, onSave, onUpdate,
}: {
  open: boolean; editing?: Product;
  onClose: () => void; onSave: (data: any) => void; onUpdate: (id: string, data: any) => void;
}) {
  const [form, setForm] = useState({ ...emptyProduct });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        brand: editing.brand,
        category: editing.category,
        price: editing.price,
        cost: editing.cost,
        stock: editing.stock,
        minStock: editing.minStock,
        notes: editing.notes,
        description: editing.description,
        image: editing.image,
      });
    } else {
      setForm({ ...emptyProduct });
    }
    setErrors({});
  }, [editing, open]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'El nombre es obligatorio';
    if (!form.brand.trim()) e.brand = 'La marca es obligatoria';
    if (form.price <= 0) e.price = 'El precio debe ser mayor a 0';
    if (form.cost <= 0) e.cost = 'El costo debe ser mayor a 0';
    if (form.cost >= form.price) e.cost = 'El costo debe ser menor al precio';
    if (form.stock < 0) e.stock = 'El stock no puede ser negativo';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (editing) {
      onUpdate(editing.id, { ...form });
    } else {
      onSave({ ...form });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.3, ease: easing }}
            className="fixed inset-x-0 bottom-0 lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-50 w-full lg:w-[520px] lg:max-h-[85vh] max-h-[90vh] bg-white dark:bg-[#12121A] rounded-t-2xl lg:rounded-2xl shadow-xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-sans text-xl font-semibold text-gray-800 dark:text-gray-100">
                {editing ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <FormField label="Nombre" error={errors.name}>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Chanel No. 5 EDP 100ml"
                  className={cn(errors.name && 'border-danger-rose')}
                />
              </FormField>
              <FormField label="Marca" error={errors.brand}>
                <Input
                  value={form.brand}
                  onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                  placeholder="Ej: Chanel"
                  className={cn(errors.brand && 'border-danger-rose')}
                />
              </FormField>
              <FormField label="Categoria">
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
                  className="w-full h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#12121A] text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#00BCD4] focus:ring-2 focus:ring-info-cyan/25"
                >
                  <option value="caballero">Caballero</option>
                  <option value="dama">Dama</option>
                  <option value="ninos">Ninos</option>
                  <option value="unisex">Unisex</option>
                </select>
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Precio Venta" error={errors.price}>
                  <Input
                    type="number"
                    value={form.price || ''}
                    onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                    placeholder="$ 0"
                    className={cn(errors.price && 'border-danger-rose')}
                  />
                </FormField>
                <FormField label="Precio Costo" error={errors.cost}>
                  <Input
                    type="number"
                    value={form.cost || ''}
                    onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))}
                    placeholder="$ 0"
                    className={cn(errors.cost && 'border-danger-rose')}
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Stock Actual" error={errors.stock}>
                  <Input
                    type="number"
                    value={form.stock || ''}
                    onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))}
                    placeholder="0"
                    className={cn(errors.stock && 'border-danger-rose')}
                  />
                </FormField>
                <FormField label="Stock Minimo">
                  <Input
                    type="number"
                    value={form.minStock || ''}
                    onChange={e => setForm(f => ({ ...f, minStock: Number(e.target.value) }))}
                    placeholder="5"
                  />
                </FormField>
              </div>
              <FormField label="Notas Olfativas">
                <Input
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Ej: Floral, Almizclado, Amaderado"
                />
              </FormField>
              <FormField label="Descripcion">
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descripcion del producto..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#12121A] text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#00BCD4] focus:ring-2 focus:ring-info-cyan/25 resize-none"
                />
              </FormField>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSubmit} className="bg-[#00BCD4] hover:bg-[#00BCD4]/90 text-white">
                {editing ? 'Guardar Cambios' : 'Guardar Producto'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-danger-rose mt-1">{error}</p>}
    </div>
  );
}

/* ==================================================================== */
/*  DELETE CONFIRMATION MODAL                                            */
/* ==================================================================== */
function DeleteConfirmModal({
  product, onClose, onConfirm,
}: {
  product: Product | null; onClose: () => void; onConfirm: (p: Product) => void;
}) {
  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, ease: easing }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:w-full lg:max-w-sm z-50 bg-white dark:bg-[#12121A] rounded-2xl shadow-xl p-6 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-[#FFA000]/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-[#FFA000]" />
            </div>
            <h3 className="font-sans text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Eliminar Producto
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Estas seguro de eliminar <strong className="text-gray-700 dark:text-gray-200">{product?.name}</strong>? Esta accion no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
              <Button
                variant="destructive"
                onClick={() => product && onConfirm(product)}
                className="flex-1"
              >
                Eliminar
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ==================================================================== */
/*  PRODUCT DETAIL MODAL                                                 */
/* ==================================================================== */
function ProductDetailModal({
  product, onClose, onEdit, onDelete,
}: {
  product: Product | null; onClose: () => void;
  onEdit: (p: Product) => void; onDelete: (p: Product) => void;
}) {
  if (!product) return null;
  const stockStatus = getStockStatus(product);

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ duration: 0.3, ease: easing }}
            className="fixed inset-x-0 bottom-0 lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-50 w-full lg:w-[480px] lg:max-h-[85vh] max-h-[90vh] bg-white dark:bg-[#12121A] rounded-t-2xl lg:rounded-2xl shadow-xl overflow-y-auto"
          >
            {/* Image area */}
            <div className="relative aspect-[16/10] bg-gradient-to-br from-[#0d7377]/20 via-deep-teal-light/10 to-deep-teal/30 flex items-center justify-center">
              <Package className="w-20 h-20 text-[#00BCD4]/20" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 backdrop-blur flex items-center justify-center text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Badges */}
              <div className="flex gap-2 mb-3">
                <span className={cn('px-2.5 py-1 rounded-full text-xs text-white font-medium', getCategoryColor(product.category))}>
                  {getCategoryLabel(product.category)}
                </span>
                <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', stockStatus.color)}>
                  {stockStatus.label}: {product.stock} unidades
                </span>
              </div>

              <h2 className="font-sans text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">
                {product.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{product.brand}</p>

              {/* Price & Margin */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="font-sans text-2xl text-[#FFC107] font-bold">
                  {formatPrice(product.price)}
                </span>
                <span className="text-sm text-gray-400 dark:text-gray-500 line-through">
                  Costo: {formatPrice(product.cost)}
                </span>
              </div>
              <div className="flex items-center gap-4 mb-4 text-xs font-mono text-gray-500 dark:text-gray-400">
                <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
                  Margen: <strong className="text-[#9C27B0]">{product.margin}%</strong>
                </span>
                <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
                  Stock min: {product.minStock}
                </span>
              </div>

              {/* Notes */}
              {product.notes && (
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Notas Olfativas</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {product.notes.split(',').map((note, i) => (
                      <span key={i} className="px-2 py-1 rounded-full bg-[#00BCD4]/10 text-[#00BCD4] dark:text-[#00BCD4]-light text-xs font-medium">
                        {note.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Descripcion</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-1"
                  onClick={() => onEdit(product)}
                >
                  <Pencil className="w-4 h-4" /> Editar
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-1"
                  onClick={() => onDelete(product)}
                >
                  <Trash2 className="w-4 h-4" /> Eliminar
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
