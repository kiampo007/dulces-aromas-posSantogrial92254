import { useState, useEffect, useCallback } from 'react';
import type { Product, Category, ProductFilters } from '@/types/product';
import { seedProducts } from '@/data/productData';

const STORAGE_KEY = 'dulces_aromas_products';

function loadProducts(): Product[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as Product[];
    }
  } catch {
    // ignore
  }
  // Seed on first load
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedProducts));
  return [...seedProducts];
}

function saveProducts(products: Product[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(loadProducts);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Persist whenever products change
  useEffect(() => {
    saveProducts(products);
  }, [products]);

  const addProduct = useCallback((product: Omit<Product, 'id' | 'margin' | 'createdAt' | 'updatedAt'>) => {
    const margin = Math.round(((product.price - product.cost) / product.price) * 100);
    const newProduct: Product = {
      ...product,
      id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      margin,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts(prev => [newProduct, ...prev]);
    return newProduct;
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<Omit<Product, 'id' | 'margin'>>) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const updated = { ...p, ...updates, updatedAt: new Date().toISOString() };
        // Recalculate margin if price or cost changed
        if (updates.price !== undefined || updates.cost !== undefined) {
          const price = updates.price ?? p.price;
          const cost = updates.cost ?? p.cost;
          updated.margin = Math.round(((price - cost) / price) * 100);
        }
        return updated;
      })
    );
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const deleteProducts = useCallback((ids: string[]) => {
    setProducts(prev => prev.filter(p => !ids.includes(p.id)));
    setSelectedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
  }, []);

  const duplicateProduct = useCallback((id: string) => {
    setProducts(prev => {
      const original = prev.find(p => p.id === id);
      if (!original) return prev;
      const copy: Product = {
        ...original,
        id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: `${original.name} (Copia)`,
        stock: original.stock,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return [copy, ...prev];
    });
  }, []);

  const adjustStock = useCallback((id: string, delta: number) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const newStock = Math.max(0, p.stock + delta);
        return { ...p, stock: newStock, updatedAt: new Date().toISOString() };
      })
    );
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const importProducts = useCallback((newProducts: Omit<Product, 'id' | 'margin' | 'createdAt' | 'updatedAt'>[]) => {
    const productsToAdd: Product[] = newProducts.map(product => {
      const margin = Math.round(((product.price - product.cost) / product.price) * 100);
      return {
        ...product,
        id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        margin,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
    setProducts(prev => [...productsToAdd, ...prev]);
    return productsToAdd.length;
  }, []);

  return {
    products,
    selectedIds,
    addProduct,
    updateProduct,
    deleteProduct,
    deleteProducts,
    duplicateProduct,
    adjustStock,
    toggleSelection,
    selectAll,
    clearSelection,
    importProducts,
  };
}

export function filterAndSortProducts(
  products: Product[],
  filters: ProductFilters
): Product[] {
  let result = [...products];

  // Search filter (name, brand, notes)
  if (filters.search.trim()) {
    const query = filters.search.toLowerCase().trim();
    result = result.filter(
      p =>
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.notes.toLowerCase().includes(query)
    );
  }

  // Category filter
  if (filters.category !== 'todos') {
    result = result.filter(p => p.category === filters.category);
  }

  // Price range
  if (filters.priceMin !== null) {
    result = result.filter(p => p.price >= filters.priceMin!);
  }
  if (filters.priceMax !== null) {
    result = result.filter(p => p.price <= filters.priceMax!);
  }

  // Stock status
  if (filters.stockStatus === 'disponible') {
    result = result.filter(p => p.stock > p.minStock);
  } else if (filters.stockStatus === 'bajo') {
    result = result.filter(p => p.stock > 0 && p.stock <= p.minStock);
  } else if (filters.stockStatus === 'agotado') {
    result = result.filter(p => p.stock === 0);
  }

  // Sorting
  switch (filters.sortBy) {
    case 'name-asc':
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      result.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'price-asc':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      result.sort((a, b) => b.price - a.price);
      break;
    case 'stock-asc':
      result.sort((a, b) => a.stock - b.stock);
      break;
    case 'stock-desc':
      result.sort((a, b) => b.stock - a.stock);
      break;
    case 'margin-desc':
      result.sort((a, b) => b.margin - a.margin);
      break;
  }

  return result;
}

export function getStockStatus(product: Product): { label: string; color: string } {
  if (product.stock === 0) return { label: 'Agotado', color: 'bg-danger-rose text-white' };
  if (product.stock <= product.minStock) return { label: 'Bajo', color: 'bg-[#FFA000] text-white' };
  return { label: 'Disponible', color: 'bg-[#4CAF50] text-white' };
}

export function formatPrice(value: number): string {
  return `$ ${value.toLocaleString('es-CO')}`;
}

export function getCategoryColor(category: Category): string {
  switch (category) {
    case 'caballero': return 'bg-blue-500/80';
    case 'dama': return 'bg-pink-500/80';
    case 'ninos': return 'bg-green-500/80';
    case 'unisex': return 'bg-purple-500/80';
    default: return 'bg-gray-500/80';
  }
}

export function getCategoryLabel(category: Category): string {
  switch (category) {
    case 'caballero': return 'Caballero';
    case 'dama': return 'Dama';
    case 'ninos': return 'Ninos';
    case 'unisex': return 'Unisex';
  }
}
