import { useState, useEffect, useCallback } from 'react';

export interface StockItem {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface MonthlyGoal {
  current: number;
  target: number;
  month: string;
  year: number;
  daysElapsed: number;
  totalDays: number;
}

export interface ProductMargin {
  id: string;
  name: string;
  margin: number;
  gain: number;
  sales: number;
}

export interface CategoryMargin {
  name: string;
  margin: number;
}

export interface Achievement {
  id: string;
  name: string;
  unlocked: boolean;
  icon: string;
}

export interface DayStat {
  day: string;
  short: string;
  amount: number;
}

export interface TrendItem {
  rank: number;
  name: string;
  brand: string;
}

export interface DashboardData {
  kpi: {
    ventasHoy: number;
    inventario: number;
    deudas: number;
    margen: number;
    pedidosPendientes: number;
  };
  stockAlerts: StockItem[];
  reminders: {
    stockBajo: { id: string; name: string }[];
    agotados: { id: string; name: string }[];
  };
  monthlyGoal: MonthlyGoal;
  profitability: {
    averageMargin: number;
    topProducts: ProductMargin[];
    lowProducts: ProductMargin[];
    categories: CategoryMargin[];
  };
  achievements: Achievement[];
  weeklyStats: DayStat[];
  boutiqueSummary: {
    productos: number;
    ventas: number;
    clientes: number;
    encargos: number;
  };
  trends: {
    dama: TrendItem[];
    caballero: TrendItem[];
    unisex: TrendItem[];
  };
}

const STORAGE_KEY = 'dulces_aromas_dashboard_data';
const PEDIDOS_KEY = 'dulces_aromas_pedidos';
const PRODUCTS_KEY = 'dulces_aromas_products';
const SALES_KEY = 'dulces_aromas_sales';
const DEBTS_KEY = 'dulces_aromas_debts';

function countPedidosPendientes(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const stored = localStorage.getItem(PEDIDOS_KEY);
    if (!stored) return 0;
    const pedidos = JSON.parse(stored) as { estado: string }[];
    return pedidos.filter(p => p.estado === 'pendiente').length;
  } catch {
    return 0;
  }
}

function loadProducts(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(PRODUCTS_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

function loadSales(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(SALES_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

function loadDebts(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(DEBTS_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

function calculateRealData(): DashboardData {
  const products = loadProducts();
  const sales = loadSales();
  const debts = loadDebts();
  
  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter((s: any) => s.createdAt?.startsWith(today));
  const ventasHoy = todaySales.reduce((sum: number, s: any) => sum + (s.total || 0), 0);
  
  const totalStock = products.reduce((sum: number, p: any) => sum + (p.stock || 0), 0);
  const totalDeudas = debts.reduce((sum: number, d: any) => sum + (d.remaining || 0), 0);
  
  // Calcular margen promedio real
  const margins = products.filter((p: any) => p.margin > 0).map((p: any) => p.margin);
  const avgMargin = margins.length > 0 
    ? Math.round(margins.reduce((a: number, b: number) => a + b, 0) / margins.length)
    : 0;
  
  // Stock alerts reales
  const stockBajo = products
    .filter((p: any) => p.stock > 0 && p.stock <= (p.minStock || 5))
    .map((p: any) => ({ id: p.id, name: p.name }));
  
  const agotados = products
    .filter((p: any) => p.stock === 0)
    .map((p: any) => ({ id: p.id, name: p.name }));
  
  // Productos m�s vendidos (de ventas reales)
  const productSales: Record<string, { name: string; total: number; qty: number }> = {};
  sales.forEach((sale: any) => {
    sale.items?.forEach((item: any) => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = { name: item.name, total: 0, qty: 0 };
      }
      productSales[item.productId].total += (item.price * item.quantity);
      productSales[item.productId].qty += item.quantity;
    });
  });
  
  const topProducts = Object.entries(productSales)
    .sort((a: any, b: any) => b[1].total - a[1].total)
    .slice(0, 5)
    .map(([id, data]: [string, any]) => ({
      id,
      name: data.name,
      margin: products.find((p: any) => p.id === id)?.margin || 0,
      gain: data.total,
      sales: data.qty,
    }));
  
  // Weekly stats reales
  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const shorts = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
  const weeklyStats = days.map((day, i) => ({
    day,
    short: shorts[i],
    amount: sales
      .filter((s: any) => new Date(s.createdAt).getDay() === i)
      .reduce((sum: number, s: any) => sum + (s.total || 0), 0),
  }));
  
  const now = new Date();
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
  return {
    kpi: {
      ventasHoy,
      inventario: totalStock,
      deudas: totalDeudas,
      margen: avgMargin,
      pedidosPendientes: countPedidosPendientes(),
    },
    stockAlerts: stockBajo.map((s: any) => ({ ...s, price: products.find((p: any) => p.id === s.id)?.price || 0, stock: products.find((p: any) => p.id === s.id)?.stock || 0 })),
    reminders: { stockBajo, agotados },
    monthlyGoal: {
      current: ventasHoy,
      target: 1000000,
      month: monthNames[now.getMonth()],
      year: now.getFullYear(),
      daysElapsed: now.getDate(),
      totalDays: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    },
    profitability: {
      averageMargin: avgMargin,
      topProducts: topProducts.length > 0 ? topProducts : [],
      lowProducts: [],
      categories: [
        { name: 'Caballero', margin: 0 },
        { name: 'Dama', margin: 0 },
        { name: 'Ninos', margin: 0 },
      ],
    },
    achievements: [
      { id: '1', name: 'Inventario', unlocked: products.length > 0, icon: 'Package' },
      { id: '2', name: 'Primera Venta', unlocked: sales.length > 0, icon: 'DollarSign' },
      { id: '3', name: 'Vendedor', unlocked: sales.length >= 10, icon: 'ShoppingBag' },
      { id: '4', name: 'Experto', unlocked: sales.length >= 50, icon: 'Award' },
      { id: '5', name: 'Cobrador', unlocked: debts.length > 0, icon: 'HandCoins' },
      { id: '6', name: 'Organizado', unlocked: products.length >= 50, icon: 'FolderCheck' },
      { id: '7', name: 'Tendencia', unlocked: sales.length >= 100, icon: 'TrendingUp' },
      { id: '8', name: 'Social', unlocked: false, icon: 'Instagram' },
      { id: '9', name: 'Meta', unlocked: ventasHoy >= 1000000, icon: 'Target' },
      { id: '10', name: 'Leyenda', unlocked: sales.length >= 500, icon: 'Crown' },
    ],
    weeklyStats,
    boutiqueSummary: {
      productos: products.length,
      ventas: sales.length,
      clientes: new Set(sales.filter((s: any) => s.clientName).map((s: any) => s.clientName)).size,
      encargos: countPedidosPendientes(),
    },
    trends: {
      dama: [],
      caballero: [],
      unisex: [],
    },
  };
}

function loadData(): DashboardData {
  if (typeof window === 'undefined') return calculateRealData();
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as DashboardData;
      // Recalculate with real data on every load
      const realData = calculateRealData();
      return { ...parsed, ...realData };
    } catch {
      return calculateRealData();
    }
  }
  const defaultData = calculateRealData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
  return defaultData;
}

export function useDashboardData() {
  const [data, setData] = useState(() => {
    const loaded = loadData();
    loaded.kpi.pedidosPendientes = countPedidosPendientes();
    return loaded;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const refreshData = useCallback(() => {
    setData(calculateRealData());
  }, []);

  const updateKPI = useCallback((key: keyof DashboardData['kpi'], value: number) => {
    setData(prev => ({
      ...prev,
      kpi: { ...prev.kpi, [key]: value },
    }));
  }, []);

  return { data, updateKPI, refreshData };
}

export function formatCurrency(value: number): string {
  return $ ;
}

export function formatPercent(value: number): string {
  return ${value}%;
}
