export type Category = 'caballero' | 'dama' | 'ninos' | 'unisex';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: Category;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  margin: number;
  notes: string;
  description: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  search: string;
  category: Category | 'todos';
  priceMin: number | null;
  priceMax: number | null;
  stockStatus: 'todos' | 'disponible' | 'bajo' | 'agotado';
  sortBy: SortOption;
}

export type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'price-asc'
  | 'price-desc'
  | 'stock-asc'
  | 'stock-desc'
  | 'margin-desc';

export interface SearchFilters {
  category?: Category;
  priceMin?: number;
  priceMax?: number;
  stockStatus?: 'disponible' | 'bajo' | 'agotado';
  notes?: string[];
  query: string;
}
