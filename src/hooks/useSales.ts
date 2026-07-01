import { useState, useEffect, useCallback } from 'react';

export interface SaleItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia' | 'mercadopago' | 'credito';
  clientName?: string;
  clientPhone?: string;
  dueDate?: string;
  createdAt: string;
}

const STORAGE_KEY = 'dulces_aromas_sales';

function loadSales(): Sale[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Sale[];
  } catch { /* ignore */ }
  return [];
}

function saveSales(sales: Sale[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
}

export function useSales() {
  const [sales, setSales] = useState<Sale[]>(loadSales);

  useEffect(() => {
    saveSales(sales);
  }, [sales]);

  const addSale = useCallback((sale: Omit<Sale, 'id' | 'createdAt'>) => {
    const newSale: Sale = {
      ...sale,
      id: sale,
      createdAt: new Date().toISOString(),
    };
    setSales(prev => [newSale, ...prev]);
    return newSale;
  }, []);

  const getTodaySales = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return sales.filter(s => s.createdAt.startsWith(today));
  }, [sales]);

  const getTodayTotal = useCallback(() => {
    return getTodaySales().reduce((sum, s) => sum + s.total, 0);
  }, [getTodaySales]);

  const getSalesByDate = useCallback((date: string) => {
    return sales.filter(s => s.createdAt.startsWith(date));
  }, [sales]);

  const getWeeklyStats = useCallback(() => {
    const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const shorts = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
    return days.map((day, i) => ({
      day,
      short: shorts[i],
      amount: sales
        .filter(s => new Date(s.createdAt).getDay() === i)
        .reduce((sum, s) => sum + s.total, 0),
    }));
  }, [sales]);

  return {
    sales,
    addSale,
    getTodaySales,
    getTodayTotal,
    getSalesByDate,
    getWeeklyStats,
  };
}
