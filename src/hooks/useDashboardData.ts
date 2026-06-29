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

const STORAGE_KEY = 'dulces-aromas-dashboard-data';
const PEDIDOS_KEY = 'dulces_aromas_pedidos';

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

const initialStockAlerts: StockItem[] = [
  { id: '1', name: 'AGUA BRAVA AZUL 100ml', price: 15000, stock: 1 },
  { id: '2', name: 'SET AGUA BRAVA 50ml + DEO 150ml', price: 15000, stock: 1 },
  { id: '3', name: 'SET QUORUM 50ml + DEO 150ml', price: 15000, stock: 1 },
  { id: '4', name: 'BLUE HOMME EDP 100ml', price: 40000, stock: 2 },
  { id: '5', name: 'CLUB DE NUIT SILLAGE EDP 105ml', price: 45000, stock: 2 },
];

const initialTopProducts: ProductMargin[] = [
  { id: '1', name: 'Club de Nuit Intense', margin: 65, gain: 28500, sales: 8 },
  { id: '2', name: 'Armaf Tres Nuit', margin: 62, gain: 18600, sales: 6 },
  { id: '3', name: 'Lattafa Fakhar Black', margin: 58, gain: 23200, sales: 5 },
  { id: '4', name: 'Rasasi Hawas', margin: 55, gain: 22000, sales: 4 },
  { id: '5', name: 'Al Haramain Amber Oud', margin: 52, gain: 26000, sales: 3 },
];

const initialLowProducts: ProductMargin[] = [
  { id: '6', name: 'Antonio Banderas Blue', margin: 25, gain: 8750, sales: 12 },
  { id: '7', name: 'Shakira Dance Midnight', margin: 22, gain: 6600, sales: 10 },
  { id: '8', name: 'J Del Pozo Halloween', margin: 20, gain: 8000, sales: 8 },
];

const initialAchievements: Achievement[] = [
  { id: '1', name: 'Inventario', unlocked: true, icon: 'Package' },
  { id: '2', name: 'Primera Venta', unlocked: false, icon: 'DollarSign' },
  { id: '3', name: 'Vendedor', unlocked: false, icon: 'ShoppingBag' },
  { id: '4', name: 'Experto', unlocked: false, icon: 'Award' },
  { id: '5', name: 'Cobrador', unlocked: false, icon: 'HandCoins' },
  { id: '6', name: 'Organizado', unlocked: false, icon: 'FolderCheck' },
  { id: '7', name: 'Tendencia', unlocked: false, icon: 'TrendingUp' },
  { id: '8', name: 'Social', unlocked: false, icon: 'Instagram' },
  { id: '9', name: 'Meta', unlocked: false, icon: 'Target' },
  { id: '10', name: 'Leyenda', unlocked: false, icon: 'Crown' },
];

const initialWeeklyStats: DayStat[] = [
  { day: 'domingo', short: 'dom', amount: 0 },
  { day: 'lunes', short: 'lun', amount: 0 },
  { day: 'martes', short: 'mar', amount: 0 },
  { day: 'miercoles', short: 'mie', amount: 0 },
  { day: 'jueves', short: 'jue', amount: 0 },
  { day: 'viernes', short: 'vie', amount: 0 },
  { day: 'sabado', short: 'sab', amount: 0 },
];

const initialTrendsDama: TrendItem[] = [
  { rank: 1, name: 'Libre Intense', brand: 'Yves Saint Laurent' },
  { rank: 2, name: "J'adore", brand: 'Dior' },
  { rank: 3, name: 'Chanel No.5', brand: 'Chanel' },
  { rank: 4, name: 'La Vie Est Belle', brand: 'Lancome' },
  { rank: 5, name: 'Good Girl Blush', brand: 'Carolina Herrera' },
  { rank: 6, name: 'Bloom', brand: 'Gucci' },
  { rank: 7, name: 'Paradoxe', brand: 'Prada' },
  { rank: 8, name: 'Donna Born In Roma', brand: 'Valentino' },
  { rank: 9, name: 'Black Opium', brand: 'Yves Saint Laurent' },
  { rank: 10, name: 'Daisy Wild', brand: 'Marc Jacobs' },
];

const initialTrendsCaballero: TrendItem[] = [
  { rank: 1, name: 'Sauvage Elixir', brand: 'Dior' },
  { rank: 2, name: 'Bleu de Chanel', brand: 'Chanel' },
  { rank: 3, name: 'Acqua di Gio', brand: 'Giorgio Armani' },
  { rank: 4, name: 'Terre d\'Hermes', brand: 'Hermes' },
  { rank: 5, name: 'Aventus', brand: 'Creed' },
  { rank: 6, name: 'One Million', brand: 'Paco Rabanne' },
  { rank: 7, name: 'Invictus', brand: 'Paco Rabanne' },
  { rank: 8, name: 'Light Blue Intense', brand: 'Dolce & Gabbana' },
  { rank: 9, name: 'Halloween Man X', brand: 'J. Del Pozo' },
  { rank: 10, name: 'Scandal Pour Homme', brand: 'Jean Paul Gaultier' },
];

const initialTrendsUnisex: TrendItem[] = [
  { rank: 1, name: 'Baccarat Rouge 540', brand: 'Maison Francis Kurkdjian' },
  { rank: 2, name: 'Santal 33', brand: 'Le Labo' },
  { rank: 3, name: 'Black Phantom', brand: 'Kilian' },
  { rank: 4, name: 'Silver Mountain Water', brand: 'Creed' },
  { rank: 5, name: 'Gypsy Water', brand: 'Byredo' },
];

function getDefaultData(): DashboardData {
  return {
    kpi: {
      ventasHoy: 0,
      inventario: 175,
      deudas: 0,
      margen: 67,
      pedidosPendientes: 0,
    },
    stockAlerts: initialStockAlerts,
    reminders: {
      stockBajo: [
        { id: '1', name: 'AGUA BRAVA AZUL 100ml' },
        { id: '2', name: 'SET AGUA BRAVA 50ml + DEO' },
        { id: '3', name: 'SET QUORUM 50ml + DEO' },
        { id: '4', name: 'BLUE HOMME EDP 100ml' },
        { id: '5', name: 'CLUB DE NUIT SILLAGE EDP' },
      ],
      agotados: [
        { id: '6', name: 'ACQUA DI GIO 100ml' },
      ],
    },
    monthlyGoal: {
      current: 0,
      target: 1000000,
      month: 'Junio',
      year: 2026,
      daysElapsed: 27,
      totalDays: 30,
    },
    profitability: {
      averageMargin: 40,
      topProducts: initialTopProducts,
      lowProducts: initialLowProducts,
      categories: [
        { name: 'Caballero', margin: 40 },
        { name: 'Dama', margin: 40 },
        { name: 'Ninos', margin: 40 },
      ],
    },
    achievements: initialAchievements,
    weeklyStats: initialWeeklyStats,
    boutiqueSummary: {
      productos: 175,
      ventas: 0,
      clientes: 2,
      encargos: 0,
    },
    trends: {
      dama: initialTrendsDama,
      caballero: initialTrendsCaballero,
      unisex: initialTrendsUnisex,
    },
  };
}

function loadData(): DashboardData {
  if (typeof window === 'undefined') return getDefaultData();
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as DashboardData;
      // Migration: ensure pedidosPendientes exists
      if (typeof parsed.kpi.pedidosPendientes !== 'number') {
        parsed.kpi.pedidosPendientes = 0;
      }
      return parsed;
    } catch {
      return getDefaultData();
    }
  }
  const defaultData = getDefaultData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
  return defaultData;
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>(() => {
    const loaded = loadData();
    // Sync pedidos count on load
    loaded.kpi.pedidosPendientes = countPedidosPendientes();
    return loaded;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  /* Refresh pedidos count from localStorage */
  const refreshPedidos = useCallback(() => {
    setData(prev => ({
      ...prev,
      kpi: { ...prev.kpi, pedidosPendientes: countPedidosPendientes() },
    }));
  }, []);

  const updateStock = useCallback((id: string, delta: number) => {
    setData(prev => ({
      ...prev,
      stockAlerts: prev.stockAlerts.map(item =>
        item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item
      ),
    }));
  }, []);

  const updateKPI = useCallback((key: keyof DashboardData['kpi'], value: number) => {
    setData(prev => ({
      ...prev,
      kpi: { ...prev.kpi, [key]: value },
    }));
  }, []);

  return { data, updateStock, updateKPI, refreshPedidos };
}

export function formatCurrency(value: number): string {
  return `$ ${value.toLocaleString('es-ES').replace(/,/g, '.')}`;
}

export function formatPercent(value: number): string {
  return `${value}%`;
}
