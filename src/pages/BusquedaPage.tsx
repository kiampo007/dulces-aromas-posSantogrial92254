import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Sparkles, X, Mic, Clock, TrendingUp,
  Package, ChevronDown, SlidersHorizontal, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/product';
import {
  useProducts, getStockStatus, formatPrice, getCategoryColor, getCategoryLabel,
} from '@/hooks/useProducts';
import {
  searchWithAI, useSearchHistory, getSuggestedQueries, type ParsedQuery, type SearchResult,
} from '@/hooks/useAISearch';

const easing = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ─── Relevance badge color ─── */
function getRelevanceColor(score: number): string {
  if (score >= 80) return 'bg-[#4CAF50] text-white';
  if (score >= 50) return 'bg-[#00BCD4] text-white';
  if (score >= 30) return 'bg-[#FFA000] text-white';
  return 'bg-gray-400 text-white';
}

/* ─── Highlight matching terms in text ─── */
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (terms.length === 0) return <>{text}</>;

  const regex = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        terms.some(t => t.toLowerCase() === part.toLowerCase()) ? (
          <mark key={i} className="bg-[#FFC107]/15 text-inherit rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function BusquedaPage() {
  const { products } = useProducts();
  const { getHistory, addToHistory, clearHistory } = useSearchHistory();

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [parsedQuery, setParsedQuery] = useState<ParsedQuery | null>(null);
  const [searchDuration, setSearchDuration] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  /* Advanced filters panel */
  const [showFilters, setShowFilters] = useState(false);
  const [advCategory, setAdvCategory] = useState<Category | ''>('');
  const [advPriceMin, setAdvPriceMin] = useState('');
  const [advPriceMax, setAdvPriceMax] = useState('');
  const [advStockStatus, setAdvStockStatus] = useState<'todos' | 'disponible' | 'bajo' | 'agotado'>('todos');
  const [advMarginMin, setAdvMarginMin] = useState('');

  const [suggestions] = useState(getSuggestedQueries);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHistory(getHistory());
  }, [getHistory]);

  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    setShowHistory(false);

    // Simulate AI processing delay
    const delay = 300 + Math.random() * 500;
    setTimeout(() => {
      const { results, parsed, duration } = searchWithAI(products, searchQuery);

      // Apply advanced filters on top of AI results
      let filtered = [...results];
      if (advCategory) {
        filtered = filtered.filter(r => r.product.category === advCategory);
      }
      if (advPriceMin) {
        filtered = filtered.filter(r => r.product.price >= Number(advPriceMin));
      }
      if (advPriceMax) {
        filtered = filtered.filter(r => r.product.price <= Number(advPriceMax));
      }
      if (advStockStatus !== 'todos') {
        if (advStockStatus === 'disponible') {
          filtered = filtered.filter(r => r.product.stock > r.product.minStock);
        } else if (advStockStatus === 'bajo') {
          filtered = filtered.filter(r => r.product.stock > 0 && r.product.stock <= r.product.minStock);
        } else if (advStockStatus === 'agotado') {
          filtered = filtered.filter(r => r.product.stock === 0);
        }
      }
      if (advMarginMin) {
        filtered = filtered.filter(r => r.product.margin >= Number(advMarginMin));
      }

      setSearchResults(filtered);
      setParsedQuery(parsed);
      setSearchDuration(duration);
      setIsSearching(false);
      addToHistory(searchQuery);
      setHistory(prev => [searchQuery, ...prev.filter(h => h.toLowerCase() !== searchQuery.toLowerCase())].slice(0, 15));
    }, delay);
  }, [products, advCategory, advPriceMin, advPriceMax, advStockStatus, advMarginMin, addToHistory]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  }, [query, performSearch]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion);
  }, [performSearch]);

  const handleClearHistoryItem = useCallback((item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(h => h !== item));
  }, []);

  const clearAllHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, [clearHistory]);

  // Show empty results when no search has been done
  const showEmpty = hasSearched && !isSearching && searchResults.length === 0;
  const showInitial = !hasSearched && !isSearching;

  return (
    <div className="min-h-full max-w-4xl mx-auto">
      {/* ─── Page Header ─── */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 mb-3"
        >
          <Sparkles className="w-6 h-6 text-[#9C27B0]" />
          <h1 className="font-sans text-2xl lg:text-[2rem] font-bold text-gray-800 dark:text-gray-100">
            Busqueda IA
          </h1>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-gray-400 dark:text-gray-500"
        >
          Busca con lenguaje natural — describe lo que necesitas
        </motion.p>
      </div>

      {/* ─── Search Interface ─── */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        onSubmit={handleSubmit}
        className="relative mb-6"
      >
        <div
          className={cn(
            'relative flex items-center rounded-full border-2 bg-white dark:bg-[#12121A] transition-all duration-200',
            'border-gray-200 dark:border-gray-700',
            isSearching ? 'border-lavender-soft shadow-glow-cyan scale-[1.01]' : 'focus-within:border-[#00BCD4] focus-within:shadow-glow-cyan focus-within:scale-[1.01]'
          )}
        >
          <Sparkles className={cn(
            'absolute left-4 w-5 h-5 transition-colors',
            isSearching ? 'text-[#9C27B0] animate-pulse' : 'text-[#9C27B0]'
          )} />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setShowHistory(e.target.value === '' && history.length > 0); }}
            onFocus={() => { if (query === '' && history.length > 0) setShowHistory(true); }}
            placeholder="Ej: 'perfumes florales para mujer con buen rendimiento'"
            className="flex-1 h-14 pl-12 pr-24 bg-transparent text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none text-base"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setShowHistory(history.length > 0); searchInputRef.current?.focus(); }}
              className="absolute right-14 w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            className="absolute right-4 w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400"
            title="Entrada de voz (proximamente)"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>

        {/* Search history dropdown */}
        <AnimatePresence>
          {showHistory && history.length > 0 && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowHistory(false)} />
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#12121A] rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 z-40 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Busquedas recientes
                  </span>
                  <button
                    onClick={clearAllHistory}
                    className="text-xs text-danger-rose hover:underline"
                  >
                    Limpiar
                  </button>
                </div>
                {history.slice(0, 8).map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setQuery(item); setShowHistory(false); performSearch(item); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                  >
                    <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{item}</span>
                    <button
                      onClick={(e) => handleClearHistoryItem(item, e)}
                      className="ml-auto w-6 h-6 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.form>

      {/* ─── AI Processing State ─── */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-8 h-8 text-[#9C27B0] mx-auto mb-3" />
            </motion.div>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Analizando tu busqueda
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ...
              </motion.span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Smart Filters (Auto-Generated) ─── */}
      <AnimatePresence>
        {hasSearched && !isSearching && parsedQuery && parsedQuery.matchedTerms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: easing }}
            className="mb-4"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <Zap className="w-4 h-4 text-[#9C27B0]" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Filtros inteligentes:</span>
              {parsedQuery.matchedTerms.map((term, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#00BCD4]/10 text-[#00BCD4] dark:text-[#00BCD4]-light border border-[#00BCD4]/20"
                >
                  {term}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Advanced Filters Panel ─── */}
      <div className="mb-4">
        <button
          onClick={() => setShowFilters(f => !f)}
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
            showFilters
              ? 'bg-[#00BCD4] text-white border-[#00BCD4]'
              : 'bg-white dark:bg-[#12121A] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtros avanzados
          <ChevronDown className={cn('w-3 h-3 transition-transform', showFilters && 'rotate-180')} />
        </button>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                <select
                  value={advCategory}
                  onChange={e => setAdvCategory(e.target.value as Category | '')}
                  className="h-9 px-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#12121A] text-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#00BCD4]"
                >
                  <option value="">Todas las categorias</option>
                  <option value="caballero">Caballero</option>
                  <option value="dama">Dama</option>
                  <option value="ninos">Ninos</option>
                  <option value="unisex">Unisex</option>
                </select>
                <Input
                  type="number"
                  placeholder="Precio min"
                  value={advPriceMin}
                  onChange={e => setAdvPriceMin(e.target.value)}
                  className="h-9 text-xs"
                />
                <Input
                  type="number"
                  placeholder="Precio max"
                  value={advPriceMax}
                  onChange={e => setAdvPriceMax(e.target.value)}
                  className="h-9 text-xs"
                />
                <select
                  value={advStockStatus}
                  onChange={e => setAdvStockStatus(e.target.value as typeof advStockStatus)}
                  className="h-9 px-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#12121A] text-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#00BCD4]"
                >
                  <option value="todos">Stock: Todos</option>
                  <option value="disponible">Disponible</option>
                  <option value="bajo">Stock Bajo</option>
                  <option value="agotado">Agotado</option>
                </select>
                <Input
                  type="number"
                  placeholder="Margen min %"
                  value={advMarginMin}
                  onChange={e => setAdvMarginMin(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              {(advCategory || advPriceMin || advPriceMax || advStockStatus !== 'todos' || advMarginMin) && (
                <button
                  onClick={() => {
                    setAdvCategory(''); setAdvPriceMin(''); setAdvPriceMax('');
                    setAdvStockStatus('todos'); setAdvMarginMin('');
                  }}
                  className="mt-2 text-xs text-danger-rose hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Results Header ─── */}
      <AnimatePresence>
        {hasSearched && !isSearching && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>{searchResults.length} resultados encontrados</span>
              <span className="text-xs text-gray-400">en {searchDuration}ms</span>
            </div>
            {parsedQuery && (
              <span className="text-xs text-gray-400 dark:text-gray-500 italic truncate max-w-[200px] sm:max-w-sm">
                Para: "{parsedQuery.originalQuery}"
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Search Results ─── */}
      {hasSearched && !isSearching && searchResults.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
          <AnimatePresence mode="popLayout">
            {searchResults.map((result, i) => (
              <SearchResultCard key={result.product.id} result={result} index={i} query={query} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ─── Empty Results State ─── */}
      <AnimatePresence>
        {showEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-1">
              No encontramos productos para tu busqueda
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
              Intenta con otros terminos o ajusta los filtros
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setQuery('');
                setAdvCategory('');
                setAdvPriceMin('');
                setAdvPriceMax('');
                setAdvStockStatus('todos');
                setAdvMarginMin('');
                setHasSearched(false);
                setSearchResults([]);
              }}
              className="mb-4"
            >
              Ver todos los productos
            </Button>
            <div className="flex gap-2 flex-wrap justify-center">
              {suggestions.slice(0, 3).map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(s)}
                  className="px-3 py-1.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Suggested Searches (initial state or below results) ─── */}
      {(showInitial || (hasSearched && !isSearching && searchResults.length > 0)) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={cn(hasSearched && searchResults.length > 0 && 'mt-8 pt-6 border-t border-gray-100 dark:border-gray-800')}
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Busquedas populares
            </h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            {suggestions.map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.04 * i }}
                onClick={() => handleSuggestionClick(s)}
                className="px-3 py-1.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {s}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ==================================================================== */
/*  SEARCH RESULT CARD                                                   */
/* ==================================================================== */
function SearchResultCard({ result, index, query }: { result: SearchResult; index: number; query: string }) {
  const { product, relevance, matchReasons } = result;
  const stockStatus = getStockStatus(product);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.5), ease: easing }}
      className="group bg-white dark:bg-[#12121A] rounded-[10px] border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-shadow duration-250"
    >
      {/* Image area */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d7377]/20 via-deep-teal-light/10 to-deep-teal/30 flex items-center justify-center">
          <Package className="w-12 h-12 text-[#00BCD4]/20" />
        </div>
        {/* Category badge */}
        <span className={cn('absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] text-white font-medium', getCategoryColor(product.category))}>
          {getCategoryLabel(product.category)}
        </span>
        {/* Relevance badge */}
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 + index * 0.05 }}
          className={cn('absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium', getRelevanceColor(relevance))}
        >
          {relevance}% match
        </motion.span>
        {/* Stock badge */}
        <span className={cn('absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium', stockStatus.color)}>
          {stockStatus.label}
        </span>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-2 leading-tight min-h-[2.4em]">
          <HighlightedText text={product.name} query={query} />
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          <HighlightedText text={product.brand} query={query} />
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="font-sans text-base text-[#FFC107] font-semibold">
            {formatPrice(product.price)}
          </span>
          <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
            Stock: {product.stock}
          </span>
        </div>

        {/* Match reasons */}
        {matchReasons.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 + index * 0.05 }}
            className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 line-clamp-1"
          >
            {matchReasons.join(', ')}
          </motion.p>
        )}

        {/* Notes */}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {product.notes.split(',').slice(0, 2).map((note, i) => (
            <span key={i} className="px-1.5 py-0.5 rounded bg-[#00BCD4]/5 text-[#00BCD4] dark:text-[#00BCD4]-light text-[10px]">
              {note.trim()}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
