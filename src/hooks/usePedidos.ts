import { useState, useEffect, useCallback } from 'react';

export interface PedidoItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Pedido {
  id: string;
  cliente: string;
  telefono: string;
  direccion?: string;
  notas?: string;
  items: PedidoItem[];
  total: number;
  fecha: string;
  estado: 'pendiente' | 'en-proceso' | 'completado' | 'cancelado';
  origen: 'tienda' | 'manual';
}

const STORAGE_KEY = 'dulces_aromas_pedidos';

function loadPedidos(): Pedido[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Pedido[];
  } catch {
    // ignore parse errors
  }
  return [];
}

function savePedidos(pedidos: Pedido[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidos));
}

export function usePedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>(loadPedidos);

  useEffect(() => {
    savePedidos(pedidos);
  }, [pedidos]);

  const createPedido = useCallback((data: Omit<Pedido, 'id' | 'fecha' | 'estado'>) => {
    const newPedido: Pedido = {
      ...data,
      id: `ped_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      fecha: new Date().toISOString(),
      estado: 'pendiente',
    };
    setPedidos(prev => [newPedido, ...prev]);
    return newPedido;
  }, []);

  const updatePedido = useCallback((id: string, updates: Partial<Pedido>) => {
    setPedidos(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const deletePedido = useCallback((id: string) => {
    setPedidos(prev => prev.filter(p => p.id !== id));
  }, []);

  const getPedidos = useCallback(() => {
    return pedidos;
  }, [pedidos]);

  const getPedidosPendientes = useCallback(() => {
    return pedidos.filter(p => p.estado === 'pendiente');
  }, [pedidos]);

  return {
    pedidos,
    createPedido,
    updatePedido,
    deletePedido,
    getPedidos,
    getPedidosPendientes,
  };
}
