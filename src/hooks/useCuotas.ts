import { useState, useEffect, useCallback } from 'react';

export interface Cuota {
  numero: number;
  monto: number;
  fechaPago: string;
  pagada: boolean;
  fechaPagada?: string;
}

export interface Credito {
  id: string;
  cliente: string;
  telefono?: string;
  montoTotal: number;
  numeroCuotas: number;
  cuotas: Cuota[];
  montoPagado: number;
  saldoPendiente: number;
  estado: 'activo' | 'completado' | 'vencido';
  fechaInicio: string;
  ventaId: string;
}

const STORAGE_KEY = 'dulces_aromas_creditos';

function loadCreditos(): Credito[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Credito[];
  } catch { /* ignore */ }
  return [];
}

function saveCreditos(creditos: Credito[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(creditos));
}

export function generarCuotas(montoTotal: number, numeroCuotas: number, fechaInicio: string = new Date().toISOString()): Cuota[] {
  const montoBase = Math.floor(montoTotal / numeroCuotas);
  const cuotas: Cuota[] = [];
  
  for (let i = 0; i < numeroCuotas; i++) {
    const fecha = new Date(fechaInicio);
    fecha.setMonth(fecha.getMonth() + i);
    fecha.setDate(Math.min(fecha.getDate(), 28));
    
    const esUltima = i === numeroCuotas - 1;
    const monto = esUltima ? montoTotal - (montoBase * (numeroCuotas - 1)) : montoBase;
    
    cuotas.push({
      numero: i + 1,
      monto,
      fechaPago: fecha.toISOString().split('T')[0],
      pagada: false,
    });
  }
  
  return cuotas;
}

export function useCuotas() {
  const [creditos, setCreditos] = useState<Credito[]>(loadCreditos);

  useEffect(() => {
    saveCreditos(creditos);
  }, [creditos]);

  const crearCredito = useCallback((datos: {
    cliente: string;
    telefono?: string;
    montoTotal: number;
    numeroCuotas: number;
    ventaId: string;
  }): Credito => {
    const cuotas = generarCuotas(datos.montoTotal, datos.numeroCuotas);
    
    const credito: Credito = {
      id: crypto.randomUUID(),
      cliente: datos.cliente,
      telefono: datos.telefono,
      montoTotal: datos.montoTotal,
      numeroCuotas: datos.numeroCuotas,
      cuotas,
      montoPagado: 0,
      saldoPendiente: datos.montoTotal,
      estado: 'activo',
      fechaInicio: new Date().toISOString(),
      ventaId: datos.ventaId,
    };
    
    setCreditos(prev => [credito, ...prev]);
    return credito;
  }, []);

  const pagarCuota = useCallback((creditoId: string, numeroCuota: number) => {
    setCreditos(prev => prev.map(c => {
      if (c.id !== creditoId) return c;
      
      const nuevasCuotas = c.cuotas.map(cuota => {
        if (cuota.numero !== numeroCuota || cuota.pagada) return cuota;
        return {
          ...cuota,
          pagada: true,
          fechaPagada: new Date().toISOString(),
        };
      });
      
      const montoPagado = nuevasCuotas.filter(c => c.pagada).reduce((sum, c) => sum + c.monto, 0);
      const saldoPendiente = c.montoTotal - montoPagado;
      const estado = nuevasCuotas.every(c => c.pagada) ? 'completado' : 'activo';
      
      return {
        ...c,
        cuotas: nuevasCuotas,
        montoPagado,
        saldoPendiente,
        estado,
      };
    }));
  }, []);

  const getCuotasProximas = useCallback((dias: number = 7) => {
    const hoy = new Date();
    const limite = new Date(hoy.getTime() + dias * 24 * 60 * 60 * 1000);
    
    const proximas: { credito: Credito; cuota: Cuota }[] = [];
    
    creditos.forEach(credito => {
      if (credito.estado !== 'activo') return;
      
      credito.cuotas.forEach(cuota => {
        if (cuota.pagada) return;
        const fechaCuota = new Date(cuota.fechaPago);
        if (fechaCuota >= hoy && fechaCuota <= limite) {
          proximas.push({ credito, cuota });
        }
      });
    });
    
    return proximas.sort((a, b) => 
      new Date(a.cuota.fechaPago).getTime() - new Date(b.cuota.fechaPago).getTime()
    );
  }, [creditos]);

  const getCreditosActivos = useCallback(() => {
    return creditos.filter(c => c.estado === 'activo');
  }, [creditos]);

  return {
    creditos,
    crearCredito,
    pagarCuota,
    getCuotasProximas,
    getCreditosActivos,
  };
}
