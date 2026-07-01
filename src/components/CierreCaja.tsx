import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, CreditCard, ArrowRightLeft, QrCode, Wallet, Calendar, Download } from 'lucide-react';
import { toast } from 'sonner';

interface Venta {
  id: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
}

export function useCierreCaja(fecha?: string) {
  const hoy = fecha || new Date().toISOString().split('T')[0];
  
  const ventas = useMemo(() => {
    const stored = localStorage.getItem('dulces_aromas_sales');
    const all: Venta[] = stored ? JSON.parse(stored) : [];
    return all.filter(v => v.createdAt.startsWith(hoy));
  }, [hoy]);
  
  const resumen = useMemo(() => {
    const porMetodo: Record<string, number> = {
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0,
      mercadopago: 0,
      credito: 0,
    };
    
    let total = 0;
    let cantidad = 0;
    
    ventas.forEach(v => {
      total += v.total;
      cantidad++;
      if (porMetodo[v.paymentMethod] !== undefined) {
        porMetodo[v.paymentMethod] += v.total;
      }
    });
    
    return { total, cantidad, porMetodo };
  }, [ventas]);
  
  return { ventas, resumen, hoy };
}

export default function CierreCaja({ fecha }: { fecha?: string }) {
  const { resumen, hoy } = useCierreCaja(fecha);
  const [exportado, setExportado] = useState(false);
  
  const exportar = () => {
    const data = {
      fecha: hoy,
      ...resumen,
      hora: new Date().toLocaleTimeString('es-CL'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cierre-caja-${hoy}.json`;
    a.click();
    setExportado(true);
    toast.success('Cierre de caja exportado');
  };
  
  const metodos = [
    { key: 'efectivo', label: 'Efectivo', icon: DollarSign, color: 'text-emerald-400' },
    { key: 'tarjeta', label: 'Tarjeta', icon: CreditCard, color: 'text-blue-400' },
    { key: 'transferencia', label: 'Transferencia', icon: ArrowRightLeft, color: 'text-amber-400' },
    { key: 'mercadopago', label: 'MercadoPago', icon: QrCode, color: 'text-cyan-400' },
    { key: 'credito', label: 'A Crédito', icon: Wallet, color: 'text-rose-400' },
  ];
  
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4 text-cyan-400" />
          Cierre de Caja - {new Date(hoy).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-700/50 p-3 rounded-xl">
            <p className="text-xs text-muted-foreground">Total Ventas</p>
            <p className="text-xl font-bold text-cyan-400">${resumen.total.toLocaleString('es-CL')}</p>
          </div>
          <div className="bg-slate-700/50 p-3 rounded-xl">
            <p className="text-xs text-muted-foreground">Cantidad</p>
            <p className="text-xl font-bold text-white">{resumen.cantidad}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Desglose por método de pago</p>
          {metodos.map(m => (
            <div key={m.key} className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30">
              <div className="flex items-center gap-2">
                <m.icon className={`h-4 w-4 ${m.color}`} />
                <span className="text-sm">{m.label}</span>
              </div>
              <span className="text-sm font-medium">${resumen.porMetodo[m.key].toLocaleString('es-CL')}</span>
            </div>
          ))}
        </div>
        
        <Button onClick={exportar} className="w-full" variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {exportado ? 'Exportado ?' : 'Exportar Cierre de Caja'}
        </Button>
      </CardContent>
    </Card>
  );
}
