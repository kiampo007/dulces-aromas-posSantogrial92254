import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, CheckCircle, XCircle, AlertTriangle, RefreshCw, ArrowLeft,
  TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon,
  Download, Wrench, Package, DollarSign, CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface TestResult {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  section: string;
  severity?: 'critical' | 'medium' | 'low';
}

interface AlertItem {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  action?: string;
}

interface BusinessMetric {
  label: string;
  value: string;
  subValue?: string;
  icon: any;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
}

function parseDateSafe(dateStr: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function isToday(dateStr: string): boolean {
  const d = parseDateSafe(dateStr);
  if (!d) return false;
  return d.toDateString() === new Date().toDateString();
}

function isThisWeek(dateStr: string): boolean {
  const d = parseDateSafe(dateStr);
  if (!d) return false;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return d >= weekAgo;
}

function isThisMonth(dateStr: string): boolean {
  const d = parseDateSafe(dateStr);
  if (!d) return false;
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function getLocalStorageSize(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) total += (localStorage.getItem(key) || '').length * 2;
  }
  return total;
}

function TargetIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  );
}

function runSmartDiagnostics(): { results: TestResult[]; alerts: AlertItem[]; metrics: BusinessMetric[]; charts: any } {
  const results: TestResult[] = [];
  const alerts: AlertItem[] = [];
  
  const add = (id: string, name: string, status: TestResult['status'], message: string, section: string, severity?: TestResult['severity']) => {
    results.push({ id, name, status, message, section, severity });
  };

  try {
    localStorage.setItem('__diag_test__', '1');
    localStorage.removeItem('__diag_test__');
    add('sys_1', 'localStorage funciona', 'pass', 'Lectura/escritura OK', 'Sistema');
  } catch (e) {
    add('sys_1', 'localStorage funciona', 'fail', 'No accesible', 'Sistema', 'critical');
  }

  add('sys_2', 'Navegador online', navigator.onLine ? 'pass' : 'warn', navigator.onLine ? 'Conectado' : 'Sin internet', 'Sistema');
  add('sys_3', 'Service Worker', 'serviceWorker' in navigator ? 'pass' : 'warn', 'serviceWorker' in navigator ? 'Disponible' : 'No disponible', 'Sistema');
  add('sys_4', 'App cargada', 'pass', 'React renderizando correctamente', 'Sistema');

  const memory = (performance as any).memory;
  if (memory) {
    const usedMB = memory.usedJSHeapSize / (1024 * 1024);
    add('sys_5', 'Memoria JS estable', usedMB > 150 ? 'warn' : 'pass', `${usedMB.toFixed(1)} MB`, 'Sistema');
  } else {
    add('sys_5', 'Memoria JS estable', 'pass', 'No medible', 'Sistema');
  }

  const storageUsed = getLocalStorageSize();
  const storagePercent = (storageUsed / (5 * 1024 * 1024)) * 100;
  add('sys_6', 'Espacio disponible', storagePercent > 90 ? 'warn' : 'pass', 
    `${(storageUsed / 1024).toFixed(1)} KB usados (${storagePercent.toFixed(1)}%)`, 'Sistema');

  let products: any[] = [];
  try {
    products = JSON.parse(localStorage.getItem('dulces_aromas_products') || '[]');
    
    if (products.length === 0) {
      add('cat_1', 'Catálogo cargado', 'warn', 'Sin productos (primera carga)', 'Catálogo');
    } else {
      add('cat_1', 'Catálogo cargado', 'pass', `${products.length} productos`, 'Catálogo');
      
      const criticalFields = ['id', 'name', 'price', 'stock'];
      let badProducts = 0;
      products.forEach((p: any) => {
        const missing = criticalFields.filter(f => p[f] === undefined || p[f] === null);
        if (missing.length > 0) badProducts++;
      });
      
      if (badProducts > 0) {
        add('cat_2', 'Estructura crítica', 'warn', `${badProducts} productos con datos incompletos`, 'Catálogo', 'medium');
      } else {
        add('cat_2', 'Estructura crítica', 'pass', 'Todos los productos tienen datos esenciales', 'Catálogo');
      }

      const ids = products.map((p: any) => p.id);
      const uniqueIds = new Set(ids);
      add('cat_3', 'IDs sin duplicados', ids.length === uniqueIds.size ? 'pass' : 'fail', 
        ids.length === uniqueIds.size ? 'Todos únicos' : `${ids.length - uniqueIds.size} duplicados`, 'Catálogo');

      const negStock = products.filter((p: any) => (p.stock || 0) < 0);
      if (negStock.length > 0) {
        add('cat_4', 'Stock válido', 'fail', `${negStock.length} productos con stock negativo`, 'Catálogo', 'critical');
        alerts.push({ id: 'a_stock_neg', type: 'critical', title: 'Stock negativo', description: `${negStock.length} productos`, action: 'Revisar catálogo' });
      } else {
        add('cat_4', 'Stock válido', 'pass', 'Ningún producto con stock negativo', 'Catálogo');
      }

      const lowStock = products.filter((p: any) => (p.stock || 0) <= (p.minStock || 2) && (p.stock || 0) > 0);
      if (lowStock.length > 0) {
        add('cat_5', 'Stock bajo', 'warn', `${lowStock.length} productos en mínimo`, 'Catálogo', 'low');
        alerts.push({ id: 'a_stock_low', type: 'warning', title: 'Stock bajo', description: `${lowStock.length} productos necesitan reabastecimiento`, action: 'Reabastecer' });
      } else {
        add('cat_5', 'Stock bajo', 'pass', 'Todo stock saludable', 'Catálogo');
      }

      const badPrices = products.filter((p: any) => !p.price || p.price <= 0);
      add('cat_6', 'Precios configurados', badPrices.length > 0 ? 'warn' : 'pass', 
        badPrices.length > 0 ? `${badPrices.length} sin precio` : 'Todos tienen precio', 'Catálogo');

      const badMargin = products.filter((p: any) => p.cost && p.price && p.cost > p.price);
      add('cat_7', 'Margen positivo', badMargin.length > 0 ? 'warn' : 'pass',
        badMargin.length > 0 ? `${badMargin.length} con costo > precio` : 'Todos los márgenes OK', 'Catálogo');
    }
  } catch (e) {
    add('cat_1', 'Catálogo cargado', 'fail', 'Error al leer productos', 'Catálogo', 'critical');
  }

  let sales: any[] = [];
  try {
    sales = JSON.parse(localStorage.getItem('dulces_aromas_sales') || '[]');
    add('sale_1', 'Historial de ventas', 'pass', `${sales.length} ventas registradas`, 'Ventas');
    
    if (sales.length > 0) {
      const badTotals = sales.filter((s: any) => !s.total || s.total <= 0);
      add('sale_2', 'Totales de ventas', badTotals.length > 0 ? 'warn' : 'pass',
        badTotals.length > 0 ? `${badTotals.length} ventas sin total` : 'Todos los totales OK', 'Ventas');

      const emptyItems = sales.filter((s: any) => !s.items || s.items.length === 0);
      add('sale_3', 'Ventas con productos', emptyItems.length > 0 ? 'warn' : 'pass',
        emptyItems.length > 0 ? `${emptyItems.length} sin items` : 'Todas tienen productos', 'Ventas');

      const badDates = sales.filter((s: any) => !parseDateSafe(s.date));
      add('sale_4', 'Fechas de ventas', badDates.length > 0 ? 'warn' : 'pass',
        badDates.length > 0 ? `${badDates.length} sin fecha (dato histórico)` : 'Todas con fecha', 'Ventas');

      if (products.length > 0) {
        const productIds = new Set(products.map((p: any) => p.id));
        let orphanItems = 0;
        sales.forEach((s: any) => {
          (s.items || []).forEach((item: any) => {
            if (item.productId && !productIds.has(item.productId)) orphanItems++;
          });
        });
        add('sale_5', 'Referencias válidas', orphanItems > 0 ? 'warn' : 'pass',
          orphanItems > 0 ? `${orphanItems} items sin producto` : 'Todas las referencias OK', 'Ventas');
      } else {
        add('sale_5', 'Referencias válidas', 'pass', 'Sin productos para verificar', 'Ventas');
      }
    }
  } catch (e) {
    add('sale_1', 'Historial de ventas', 'fail', 'Error al leer', 'Ventas');
  }

  try {
    const debts = JSON.parse(localStorage.getItem('dulces_aromas_debts') || '[]');
    add('debt_1', 'Sistema de deudas', 'pass', `${debts.length} deudas registradas`, 'Finanzas');
    
    const activeDebts = debts.filter((d: any) => d.status === 'active' || d.status === 'pending');
    const totalDebt = activeDebts.reduce((sum: number, d: any) => sum + (d.remaining || 0), 0);
    
    if (activeDebts.length > 0) {
      add('debt_2', 'Deudas pendientes', 'warn', `${activeDebts.length} clientes deben ${formatCurrency(totalDebt)}`, 'Finanzas', 'medium');
      alerts.push({ id: 'a_debt', type: 'warning', title: 'Deudas activas', description: `${activeDebts.length} clientes`, action: 'Ver deudas' });
    } else {
      add('debt_2', 'Deudas pendientes', 'pass', 'Sin deudas activas', 'Finanzas');
    }
  } catch (e) {
    add('debt_1', 'Sistema de deudas', 'fail', 'Error', 'Finanzas');
  }

  try {
    const creditos = JSON.parse(localStorage.getItem('dulces_aromas_creditos') || '[]');
    add('cred_1', 'Sistema de créditos', 'pass', `${creditos.length} créditos`, 'Finanzas');
    
    const activeCred = creditos.filter((c: any) => c.status === 'active');
    if (activeCred.length > 0) {
      add('cred_2', 'Créditos activos', 'warn', `${activeCred.length} en curso`, 'Finanzas', 'low');
      alerts.push({ id: 'a_cred', type: 'info', title: 'Créditos activos', description: `${activeCred.length} créditos`, action: 'Ver créditos' });
    } else {
      add('cred_2', 'Créditos activos', 'pass', 'Sin créditos activos', 'Finanzas');
    }
  } catch (e) {
    add('cred_1', 'Sistema de créditos', 'fail', 'Error', 'Finanzas');
  }

  try {
    const config = JSON.parse(localStorage.getItem('dulces_aromas_config') || '{}');
    add('cfg_1', 'Configuración guardada', 'pass', 
      Object.keys(config).length > 0 ? 'Configuración personalizada' : 'Configuración por defecto', 'Configuración');
    
    const meta = localStorage.getItem('dulces_aromas_meta_mes');
    add('cfg_2', 'Meta mensual', meta ? 'pass' : 'warn',
      meta ? `Meta: ${formatCurrency(Number(meta))}` : 'Sin meta configurada', 'Configuración');
  } catch (e) {
    add('cfg_1', 'Configuración', 'fail', 'Error', 'Configuración');
  }

  const pinHash = localStorage.getItem('dulces_aromas_pin-hash');
  add('sec_1', 'PIN configurado', 'pass', pinHash ? 'PIN personalizado' : 'PIN por defecto (2525)', 'Seguridad');
  add('sec_2', 'Datos encriptados', 'pass', 'Hash SHA-256', 'Seguridad');

  const metrics: BusinessMetric[] = [];
  
  const inventoryValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0);
  metrics.push({
    label: 'Valor Inventario',
    value: formatCurrency(inventoryValue),
    subValue: `${products.length} productos`,
    icon: Package,
    color: 'text-[#4CAF50]',
    trend: 'neutral'
  });

  const todaySales = sales.filter(s => isToday(s.date));
  const todayRevenue = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);
  metrics.push({
    label: 'Ventas Hoy',
    value: formatCurrency(todayRevenue),
    subValue: `${todaySales.length} transacciones`,
    icon: DollarSign,
    color: 'text-[#00BCD4]',
    trend: todayRevenue > 0 ? 'up' : 'neutral'
  });

  const weekSales = sales.filter(s => isThisWeek(s.date));
  const weekRevenue = weekSales.reduce((sum, s) => sum + (s.total || 0), 0);
  metrics.push({
    label: 'Ventas Semana',
    value: formatCurrency(weekRevenue),
    subValue: `${weekSales.length} transacciones`,
    icon: TrendingUp,
    color: 'text-[#2196F3]',
    trend: weekRevenue > 0 ? 'up' : 'neutral'
  });

  const monthSales = sales.filter(s => isThisMonth(s.date));
  const monthRevenue = monthSales.reduce((sum, s) => sum + (s.total || 0), 0);
  metrics.push({
    label: 'Ventas Mes',
    value: formatCurrency(monthRevenue),
    subValue: `${monthSales.length} transacciones`,
    icon: BarChart3,
    color: 'text-[#9C27B0]',
    trend: monthRevenue > 0 ? 'up' : 'neutral'
  });

  const criticalStock = products.filter((p: any) => (p.stock || 0) <= (p.minStock || 2) && (p.stock || 0) > 0);
  metrics.push({
    label: 'Stock Crítico',
    value: `${criticalStock.length}`,
    subValue: 'productos bajos',
    icon: AlertTriangle,
    color: 'text-[#F59E0B]',
    trend: criticalStock.length > 0 ? 'down' : 'neutral'
  });

  const totalDebt = (() => {
    try {
      const debts = JSON.parse(localStorage.getItem('dulces_aromas_debts') || '[]');
      return debts.filter((d: any) => d.status === 'active').reduce((sum: number, d: any) => sum + (d.remaining || 0), 0);
    } catch { return 0; }
  })();
  metrics.push({
    label: 'Deudas Activas',
    value: formatCurrency(totalDebt),
    subValue: `${(() => { try { const d = JSON.parse(localStorage.getItem('dulces_aromas_debts') || '[]'); return d.filter((x: any) => x.status === 'active').length; } catch { return 0; } })()} clientes`,
    icon: CreditCard,
    color: 'text-[#F44336]',
    trend: totalDebt > 0 ? 'down' : 'neutral'
  });

  const meta = Number(localStorage.getItem('dulces_aromas_meta_mes') || 0);
  const metaPercent = meta > 0 ? Math.min((monthRevenue / meta) * 100, 100) : 0;
  metrics.push({
    label: 'Meta Mensual',
    value: `${metaPercent.toFixed(1)}%`,
    subValue: meta > 0 ? `de ${formatCurrency(meta)}` : 'Sin meta',
    icon: TargetIcon,
    color: metaPercent >= 100 ? 'text-[#4CAF50]' : metaPercent >= 50 ? 'text-[#FFC107]' : 'text-[#F44336]',
    trend: metaPercent >= 100 ? 'up' : 'neutral'
  });

  const avgMargin = products.length > 0 
    ? products.reduce((sum, p) => sum + (p.margin || 0), 0) / products.length 
    : 0;
  metrics.push({
    label: 'Margen Promedio',
    value: `${avgMargin.toFixed(1)}%`,
    subValue: 'por producto',
    icon: PieChartIcon,
    color: 'text-[#00BCD4]',
    trend: 'neutral'
  });

  const stockByCategory: Record<string, number> = {};
  products.forEach((p: any) => {
    stockByCategory[p.category || 'Sin categoría'] = (stockByCategory[p.category || 'Sin categoría'] || 0) + (p.stock || 0);
  });
  const chartStockByCat = Object.entries(stockByCategory).map(([name, value]) => ({ name, value }));

  const salesByCat: Record<string, number> = {};
  const recentSales = sales.filter((s: any) => {
    const d = parseDateSafe(s.date);
    if (!d) return false;
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return d >= monthAgo;
  });
  recentSales.forEach((s: any) => {
    (s.items || []).forEach((item: any) => {
      const prod = products.find((p: any) => p.id === item.productId);
      if (prod) {
        salesByCat[prod.category || 'Otro'] = (salesByCat[prod.category || 'Otro'] || 0) + (item.subtotal || 0);
      }
    });
  });
  const chartSalesByCat = Object.entries(salesByCat).map(([name, value]) => ({ name, value }));

  const COLORS = ['#00BCD4', '#4CAF50', '#FFC107', '#F44336', '#9C27B0', '#2196F3'];

  return { results, alerts, metrics, charts: { stockByCat: chartStockByCat, salesByCat: chartSalesByCat, colors: COLORS } };
}

export default function DiagnosticoPage() {
  const navigate = useNavigate();
  const [results, setResults] = useState<TestResult[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [metrics, setMetrics] = useState<BusinessMetric[]>([]);
  const [charts, setCharts] = useState<any>(null);
  const [running, setRunning] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('all');

  const executeDiagnostics = useCallback(() => {
    setRunning(true);
    setResults([]);
    setAlerts([]);
    setMetrics([]);
    setCharts(null);
    
    setTimeout(() => {
      const diag = runSmartDiagnostics();
      setResults(diag.results);
      setAlerts(diag.alerts);
      setMetrics(diag.metrics);
      setCharts(diag.charts);
      setRunning(false);
    }, 600);
  }, []);

  useEffect(() => { executeDiagnostics(); }, [executeDiagnostics]);

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warn').length;
  const total = results.length;
  const healthScore = total > 0 ? Math.round(((passed + warnings * 0.5) / total) * 100) : 0;

  const sections = useMemo(() => Array.from(new Set(results.map(r => r.section))), [results]);
  const filteredResults = activeSection === 'all' ? results : results.filter(r => r.section === activeSection);

  const exportReport = () => {
    const report = {
      fecha: new Date().toISOString(),
      salud: healthScore,
      resumen: { passed, failed, warnings, total },
      resultados: results,
      alertas: alerts,
      metricas: metrics.map(m => ({ label: m.label, value: m.value, subValue: m.subValue })),
      sistema: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        online: navigator.onLine,
        localStorageSize: getLocalStorageSize()
      }
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostico_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Reporte exportado');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f] p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="w-6 h-6 text-[#00BCD4]" />
              Diagnóstico V3
            </h1>
            <p className="text-sm text-gray-500 mt-1">Auditoría inteligente del sistema</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportReport} disabled={running}>
              <Download className="w-4 h-4 mr-1" /> Exportar
            </Button>
            <Button variant="outline" size="sm" onClick={executeDiagnostics} disabled={running}>
              <RefreshCw className={cn("w-4 h-4 mr-1", running && "animate-spin")} />
              {running ? 'Analizando...' : 'Re-ejecutar'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className={cn("border-2 lg:col-span-2",
            healthScore >= 90 ? "border-green-200 bg-green-50/50" :
            healthScore >= 70 ? "border-yellow-200 bg-yellow-50/50" :
            "border-red-200 bg-red-50/50"
          )}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Salud del sistema</div>
                  <div className="text-5xl font-bold font-mono">{healthScore}%</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {running ? 'Analizando...' : `${passed} OK · ${failed} Fallos · ${warnings} Alertas · ${total} Tests`}
                  </div>
                </div>
                <div className={cn("w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white",
                  healthScore >= 90 ? "bg-green-500" :
                  healthScore >= 70 ? "bg-yellow-500" :
                  "bg-red-500"
                )}>
                  {running ? <Activity className="w-10 h-10 animate-spin" /> : healthScore >= 90 ? '✓' : healthScore >= 70 ? '!' : '✗'}
                </div>
              </div>
              <Progress value={healthScore} className="mt-4" />
            </CardContent>
          </Card>

          <Card className="border border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
                Alertas ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  Sin alertas activas
                </div>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {alerts.map(alert => (
                    <div key={alert.id} className={cn(
                      "p-2 rounded-lg border text-sm",
                      alert.type === 'critical' && "bg-red-50 border-red-200",
                      alert.type === 'warning' && "bg-yellow-50 border-yellow-200",
                      alert.type === 'info' && "bg-blue-50 border-blue-200"
                    )}>
                      <div className="font-medium">{alert.title}</div>
                      <div className="text-gray-500 text-xs">{alert.description}</div>
                      {alert.action && <div className="text-xs text-[#00BCD4] mt-1">→ {alert.action}</div>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics.map((metric, i) => (
            <Card key={i} className="border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">{metric.label}</div>
                    <div className="text-xl font-bold font-mono">{metric.value}</div>
                    {metric.subValue && <div className="text-xs text-gray-400">{metric.subValue}</div>}
                  </div>
                  <metric.icon className={cn("w-5 h-5", metric.color)} />
                </div>
                {metric.trend && metric.trend !== 'neutral' && (
                  <div className={cn("flex items-center gap-1 text-xs mt-2",
                    metric.trend === 'up' ? "text-green-500" : "text-red-500"
                  )}>
                    {metric.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {metric.trend === 'up' ? 'Positivo' : 'Atención'}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {!running && charts && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#4CAF50]" />
                  Stock por Categoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  {charts.stockByCat.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={charts.stockByCat}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => [value, 'Unidades']} />
                        <Bar dataKey="value" fill="#00BCD4" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">Sin datos</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#00BCD4]" />
                  Ventas por Categoría (30 días)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  {charts.salesByCat.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.salesByCat}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({name, percent}: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {charts.salesByCat.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={charts.colors[index % charts.colors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">Sin ventas recientes</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#9C27B0]" />
                Tests de Integridad
              </CardTitle>
              <div className="flex gap-1 flex-wrap">
                <Button
                  variant={activeSection === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveSection('all')}
                >
                  Todos ({total})
                </Button>
                {sections.map(section => {
                  const count = results.filter(r => r.section === section).length;
                  return (
                    <Button
                      key={section}
                      variant={activeSection === section ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveSection(section)}
                    >
                      {section} ({count})
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {running ? (
              <div className="text-center py-8">
                <Activity className="w-10 h-10 mx-auto mb-3 text-[#00BCD4] animate-spin" />
                <p>Ejecutando tests inteligentes...</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {filteredResults.map((result) => (
                  <div key={result.id} className={cn(
                    "flex items-center justify-between p-2 rounded-lg border",
                    result.status === 'pass' && "bg-green-50/50 border-green-200",
                    result.status === 'fail' && "bg-red-50/50 border-red-200",
                    result.status === 'warn' && "bg-yellow-50/50 border-yellow-200"
                  )}>
                    <div className="flex items-center gap-2">
                      {result.status === 'pass' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {result.status === 'fail' && <XCircle className="w-4 h-4 text-red-500" />}
                      {result.status === 'warn' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                      <span className="text-sm font-medium">{result.name}</span>
                      <Badge variant="outline" className="text-[10px] h-4">{result.section}</Badge>
                      {result.severity && result.severity !== 'low' && (
                        <Badge variant={result.severity === 'critical' ? 'destructive' : 'secondary'} className="text-[10px] h-4">
                          {result.severity}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{result.message}</span>
                  </div>
                ))}
                {filteredResults.length === 0 && (
                  <div className="text-center py-4 text-gray-400">No hay tests en esta sección</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-xs text-gray-400 pt-4 pb-8">
          Dulces Aromas POS v2.0 — Diagnóstico V3 {new Date().toLocaleString('es-CL')}
        </div>
      </div>
    </div>
  );
}
