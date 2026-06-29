import { useCallback } from 'react';
import type { Product, SearchFilters } from '@/types/product';

export interface ParsedQuery {
  filters: SearchFilters;
  matchedTerms: string[];
  originalQuery: string;
}

export interface SearchResult {
  product: Product;
  relevance: number;
  matchReasons: string[];
}

const KEYWORD_MAP: Record<string, Partial<SearchFilters>> = {
  // Category keywords
  'mujer': { category: 'dama' },
  'dama': { category: 'dama' },
  'femenino': { category: 'dama' },
  'femenina': { category: 'dama' },
  'para ella': { category: 'dama' },
  'hombre': { category: 'caballero' },
  'caballero': { category: 'caballero' },
  'masculino': { category: 'caballero' },
  'masculina': { category: 'caballero' },
  'para el': { category: 'caballero' },
  'para hombre': { category: 'caballero' },
  'nino': { category: 'ninos' },
  'ninos': { category: 'ninos' },
  'infantil': { category: 'ninos' },
  'bebe': { category: 'ninos' },
  'unisex': { category: 'unisex' },
  'para todos': { category: 'unisex' },

  // Note keywords
  'floral': { notes: ['floral'] },
  'florales': { notes: ['floral'] },
  'amaderado': { notes: ['amaderado'] },
  'amaderados': { notes: ['amaderado'] },
  'madera': { notes: ['amaderado'] },
  'citrico': { notes: ['citrico'] },
  'citricos': { notes: ['citrico'] },
  'oriental': { notes: ['oriental'] },
  'orientales': { notes: ['oriental'] },
  'acuatico': { notes: ['acuatico'] },
  'acuaticos': { notes: ['acuatico'] },
  'marino': { notes: ['acuatico'] },
  'marinos': { notes: ['acuatico'] },
  'dulce': { notes: ['dulce'] },
  'dulces': { notes: ['dulce'] },
  'gourmand': { notes: ['gourmand'] },
  'especiado': { notes: ['especiado'] },
  'especiados': { notes: ['especiado'] },
  'fresco': { notes: ['fresco'] },
  'frescos': { notes: ['fresco'] },
  'fresca': { notes: ['fresco'] },
  'frescas': { notes: ['fresco'] },
  'cuero': { notes: ['cuero'] },
  'almizclado': { notes: ['almizclado'] },
  'almizclados': { notes: ['almizclado'] },

  // Price keywords - these are handled separately with number parsing
  'barato': { priceMax: 30000 },
  'baratos': { priceMax: 30000 },
  'economico': { priceMax: 25000 },
  'economicos': { priceMax: 25000 },
  'caro': { priceMin: 50000 },
  'caros': { priceMin: 50000 },
  'premium': { priceMin: 60000 },
  'lujo': { priceMin: 60000 },
  'lujoso': { priceMin: 60000 },

  // Stock keywords
  'agotado': { stockStatus: 'agotado' },
  'agotados': { stockStatus: 'agotado' },
  'sin stock': { stockStatus: 'agotado' },
  'stock bajo': { stockStatus: 'bajo' },
  'poco stock': { stockStatus: 'bajo' },
  'disponible': { stockStatus: 'disponible' },
  'en stock': { stockStatus: 'disponible' },
};

function parseNumberAfterKeyword(query: string, keyword: string): number | null {
  const idx = query.indexOf(keyword);
  if (idx === -1) return null;
  const after = query.slice(idx + keyword.length);
  const match = after.match(/\$?\s*(\d[\d.,]*\d)/);
  if (!match) return null;
  const num = parseInt(match[1].replace(/[.,]/g, ''), 10);
  return isNaN(num) ? null : num;
}

function extractPriceRange(query: string): { priceMin?: number; priceMax?: number } {
  const lower = query.toLowerCase();
  let priceMin: number | undefined;
  let priceMax: number | undefined;

  // "entre X y Y", "de X a Y"
  const rangeMatch = lower.match(/(?:entre|de)\s+\$?(\d[\d.,]*)\s+(?:y|a)\s+\$?(\d[\d.,]*)/);
  if (rangeMatch) {
    priceMin = parseInt(rangeMatch[1].replace(/[.,]/g, ''), 10);
    priceMax = parseInt(rangeMatch[2].replace(/[.,]/g, ''), 10);
    return { priceMin, priceMax };
  }

  // "menos de X"
  const lessMatch = lower.match(/menos de\s+\$?(\d[\d.,]*)/);
  if (lessMatch) {
    priceMax = parseInt(lessMatch[1].replace(/[.,]/g, ''), 10);
  }

  // "mas de X"
  const moreMatch = lower.match(/mas de\s+\$?(\d[\d.,]*)/);
  if (moreMatch) {
    priceMin = parseInt(moreMatch[1].replace(/[.,]/g, ''), 10);
  }

  return { priceMin, priceMax };
}

export function parseNaturalQuery(query: string): ParsedQuery {
  const lower = query.toLowerCase().trim();
  const filters: SearchFilters = { query: lower };
  const matchedTerms: string[] = [];
  const notes: string[] = [];

  // Extract price range
  const priceRange = extractPriceRange(lower);
  if (priceRange.priceMin !== undefined) {
    filters.priceMin = priceRange.priceMin;
    matchedTerms.push(`Precio mayor a $${priceRange.priceMin.toLocaleString('es-CO')}`);
  }
  if (priceRange.priceMax !== undefined) {
    filters.priceMax = priceRange.priceMax;
    matchedTerms.push(`Precio menor a $${priceRange.priceMax.toLocaleString('es-CO')}`);
  }

  // Extract individual price from keywords
  const priceKeywords = ['menos de', 'mas de', 'entre', 'de'];
  for (const kw of priceKeywords) {
    const num = parseNumberAfterKeyword(lower, kw);
    if (num && num > 1000) {
      if (lower.includes('menos') || lower.includes('menor')) {
        filters.priceMax = num;
      } else if (lower.includes('mas') || lower.includes('mayor')) {
        filters.priceMin = num;
      }
    }
  }

  // Check each keyword
  for (const [keyword, filterValues] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) {
      if (filterValues.category) {
        filters.category = filterValues.category;
        matchedTerms.push(`Categoria: ${filterValues.category}`);
      }
      if (filterValues.priceMin && !filters.priceMin) {
        filters.priceMin = filterValues.priceMin;
        matchedTerms.push('Precio: Premium');
      }
      if (filterValues.priceMax && !filters.priceMax) {
        filters.priceMax = filterValues.priceMax;
        matchedTerms.push('Precio: Economico');
      }
      if (filterValues.stockStatus) {
        filters.stockStatus = filterValues.stockStatus;
        matchedTerms.push(`Stock: ${filterValues.stockStatus}`);
      }
      if (filterValues.notes) {
        notes.push(...filterValues.notes);
      }
    }
  }

  if (notes.length > 0) {
    filters.notes = [...new Set(notes)];
    matchedTerms.push(`Notas: ${filters.notes.join(', ')}`);
  }

  return { filters, matchedTerms, originalQuery: query };
}

function calculateRelevance(product: Product, parsed: ParsedQuery): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const query = parsed.originalQuery.toLowerCase();
  const filters = parsed.filters;

  // Direct name match (+50)
  if (product.name.toLowerCase().includes(query)) {
    score += 50;
    reasons.push('Nombre coincide');
  }

  // Brand match (+10)
  if (product.brand.toLowerCase().includes(query)) {
    score += 10;
    reasons.push(`Marca: ${product.brand}`);
  }

  // Category match (+20)
  if (filters.category && product.category === filters.category) {
    score += 20;
    reasons.push(`Categoria: ${product.category}`);
  }

  // Notes match (+15 per note)
  if (filters.notes) {
    const productNotes = product.notes.toLowerCase();
    for (const note of filters.notes) {
      if (productNotes.includes(note.toLowerCase())) {
        score += 15;
        reasons.push(`Nota: ${note}`);
      }
    }
  }

  // Price match (+10)
  let priceMatched = true;
  if (filters.priceMin !== undefined && product.price < filters.priceMin) priceMatched = false;
  if (filters.priceMax !== undefined && product.price > filters.priceMax) priceMatched = false;
  if (priceMatched && (filters.priceMin !== undefined || filters.priceMax !== undefined)) {
    score += 10;
    reasons.push('Precio en rango');
  }

  // Stock status match (+10)
  if (filters.stockStatus) {
    let matches = false;
    if (filters.stockStatus === 'disponible' && product.stock > product.minStock) matches = true;
    if (filters.stockStatus === 'bajo' && product.stock > 0 && product.stock <= product.minStock) matches = true;
    if (filters.stockStatus === 'agotado' && product.stock === 0) matches = true;
    if (matches) {
      score += 10;
      reasons.push(`Stock: ${filters.stockStatus}`);
    }
  }

  // Generic search in notes/description (+5)
  const searchTerms = query.split(/\s+/).filter(t => t.length > 3);
  for (const term of searchTerms) {
    if (product.notes.toLowerCase().includes(term)) {
      score += 5;
      reasons.push(`Notas coinciden`);
      break;
    }
  }

  // If no specific filters matched but the product passes all filters, give base score
  if (score === 0 && filters.category) {
    if (product.category === filters.category) {
      score = 15;
      reasons.push(`Categoria: ${product.category}`);
    }
  }

  return { score, reasons };
}

export function searchWithAI(products: Product[], query: string): { results: SearchResult[]; parsed: ParsedQuery; duration: number } {
  const start = performance.now();

  if (!query.trim()) {
    return { results: [], parsed: parseNaturalQuery(''), duration: 0 };
  }

  const parsed = parseNaturalQuery(query);
  const filters = parsed.filters;

  // First pass: filter by hard criteria
  let candidates = [...products];

  if (filters.category) {
    candidates = candidates.filter(p => p.category === filters.category);
  }
  if (filters.priceMin !== undefined) {
    candidates = candidates.filter(p => p.price >= filters.priceMin!);
  }
  if (filters.priceMax !== undefined) {
    candidates = candidates.filter(p => p.price <= filters.priceMax!);
  }
  if (filters.stockStatus) {
    if (filters.stockStatus === 'disponible') {
      candidates = candidates.filter(p => p.stock > p.minStock);
    } else if (filters.stockStatus === 'bajo') {
      candidates = candidates.filter(p => p.stock > 0 && p.stock <= p.minStock);
    } else if (filters.stockStatus === 'agotado') {
      candidates = candidates.filter(p => p.stock === 0);
    }
  }

  // Score each candidate
  const results: SearchResult[] = candidates
    .map(product => {
      const { score, reasons } = calculateRelevance(product, parsed);
      return { product, relevance: Math.min(100, score), matchReasons: reasons };
    })
    .filter(r => r.relevance > 0 || (!filters.category && !filters.priceMin && !filters.priceMax && !filters.stockStatus && !filters.notes))
    .sort((a, b) => b.relevance - a.relevance);

  // If no filters applied and just a text search, include all products sorted by name match
  if (results.length === 0 && query.trim()) {
    const textResults = products
      .map(product => {
        const { score, reasons } = calculateRelevance(product, parsed);
        return { product, relevance: Math.min(100, score), matchReasons: reasons };
      })
      .filter(r => r.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance);
    const duration = Math.round(performance.now() - start);
    return { results: textResults, parsed, duration };
  }

  // If there are still no results with text search, try a broader text match
  if (results.length === 0) {
    const broadQuery = query.toLowerCase();
    const broadResults = products
      .filter(p =>
        p.name.toLowerCase().includes(broadQuery) ||
        p.brand.toLowerCase().includes(broadQuery) ||
        p.notes.toLowerCase().includes(broadQuery) ||
        p.description.toLowerCase().includes(broadQuery)
      )
      .map(product => ({
        product,
        relevance: 25,
        matchReasons: ['Coincidencia de texto'],
      }));
    const duration = Math.round(performance.now() - start);
    return { results: broadResults, parsed, duration };
  }

  const duration = Math.round(performance.now() - start);
  return { results, parsed, duration };
}

const SUGGESTED_QUERIES = [
  'Perfumes mas vendidos',
  'Fragancias amaderadas',
  'Perfumes para regalo',
  'Menos de $30.000',
  'Alta duracion',
  'Para el dia a dia',
  'Perfumes florales para mujer',
  'Perfumes caros para hombre',
  'Stock bajo dama',
  'Fragancias citricas unisex',
];

export function getSuggestedQueries(): string[] {
  return SUGGESTED_QUERIES;
}

export function useSearchHistory() {
  const STORAGE_KEY = 'dulces_aromas_search_history';

  const getHistory = useCallback((): string[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    try {
      const history = getHistory();
      const filtered = history.filter(h => h.toLowerCase() !== query.toLowerCase());
      const updated = [query, ...filtered].slice(0, 15);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }, [getHistory]);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { getHistory, addToHistory, clearHistory };
}
