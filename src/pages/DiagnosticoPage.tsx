import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Database, CheckCircle, XCircle, AlertTriangle, Shield,
  Zap, Package, DollarSign, Users, CreditCard,
  RefreshCw, ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface TestResult {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  section: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getLocalStorageSize(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) total += (localStorage.getItem(key) || '').length * 2;
  }
  return total;
}

function runAutoDiagnostics(): TestResult[] {
  const results: TestResult[] = [];
  const add = (id: string, name: string, status: TestResult['status'], message: string, section: string) => {
    results.push({ id, name, status, message, section });
  };

  // 1. LOCALSTORAGE
  try {
    localStorage.setItem('__diag_test__', '1');
    localStorage.removeItem('__diag_test__');
    add('ls_1', 'localStorage lectura/escritura', 'pass', 'Acceso OK', 'Almacenamiento');
  } catch (e) {
    add('ls_1', 'localStorage lectura/escritura', 'fail', 'No accesible', 'Almacenamiento');
  }

  const used = getLocalStorageSize();
  const limit = 5 * 1024 * 1024;
  const percent = (used / limit) * 100;
  add('ls_2', 'Capacidad localStorage', percent > 90 ? 'fail' : percent > 70 ? 'warn' : 'pass',
    `${formatBytes(used)} usado (${percent.toFixed(1)}%)`, 'Almacenamiento');

  const requiredKeys = [
    { key: 'dulces_aromas_products', name: 'Catálogo de productos' },
    { key: 'dulces_aromas_sales', name: 'Historial de ventas' },
    { key: 'dulces_aromas_debts', name: 'Deudas de clientes' },
    { key: 'dulces_aromas_creditos', name: 'Créditos con cuotas' },
    { key: 'dulces_aromas_clients', name: 'Registro de clientes' },
    { key: 'dulces_aromas_config', name: 'Configuración general' },
    { key: 'dulces_aromas_pin-hash', name: 'Hash del PIN' },
  ];
  requiredKeys.forEach((rk, i) => {
    const val = localStorage.getItem(rk.key);
    if (val !== null) {
      try {
        const parsed = JSON.parse(val);
        const count = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
        add(`ls_k${i}`, rk.name, 'pass', `${count} registros`, 'Almacenamiento');
      } catch {
        add(`ls_k${i}`, rk.name, 'pass', 'Datos guardados', 'Almacenamiento');
      }
    } else {
      add(`ls_k${i}`, rk.name, 'warn', 'Sin datos (primera carga)', 'Almacenamiento');
    }
  });

  // 2. CATÁLOGO
  try {
    const products = JSON.parse(localStorage.getItem('dulces_aromas_products') || '[]');
    if (products.length === 0) {
      add('cat_1', 'Productos cargados', 'warn', 'Catálogo vacío', 'Catálogo');
    } else {
      add('cat_1', 'Productos cargados', 'pass', `${products.length} productos`, 'Catálogo');
      const cats = new Set(products.map((p: any) => p.category));
      const expectedCats = ['caballero', 'dama', 'ninos', 'unisex'];
      const missingCats = expectedCats.filter(c => !cats.has(c));
      if (missingCats.length > 0) {
        add('cat_2', 'Categorías completas', 'warn', `Faltan: ${missingCats.join(', ')}`, 'Catálogo');
      } else {
        add('cat_2', 'Categorías completas', 'pass', 'Todas presentes', 'Catálogo');
      }
      const negativeStock = products.filter((p: any) => (p.stock || 0) < 0);
      add('cat_3', 'Stock sin negativos', negativeStock.length > 0 ? 'fail' : 'pass',
        negativeStock.length > 0 ? `${negativeStock.length} productos con stock negativo` : 'Todo OK', 'Catálogo');
    }
  } catch (e) {
    add('cat_1', 'Productos cargados', 'fail', 'Error al leer', 'Catálogo');
  }

  // 3. VENTAS
  try {
    const sales = JSON.parse(localStorage.getItem('dulces_aromas_sales') || '[]');
    add('sale_1', 'Historial de ventas', 'pass', `${sales.length} ventas`, 'Ventas');
    const emptySales = sales.filter((s: any) => !s.items || s.items.length === 0);
    if (emptySales.length > 0) {
      add('sale_2', 'Ventas con items', 'warn', `${emptySales.length} ventas sin productos`, 'Ventas');
    } else if (sales.length > 0) {
      add('sale_2', 'Ventas con items', 'pass', 'Todas tienen productos', 'Ventas');
    }
  } catch (e) {
    add('sale_1', 'Historial de ventas', 'fail', 'Error', 'Ventas');
  }

  // 4. DEUDAS
  try {
    const debts = JSON.parse(localStorage.getItem('dulces_aromas_debts') || '[]');
    add('debt_1', 'Deudas registradas', 'pass', `${debts.length} deudas`, 'Deudas');
    const activeDebts = debts.filter((d: any) => d.status === 'active');
    add('debt_2', 'Deudas activas', activeDebts.length > 0 ? 'warn' : 'pass',
      `${activeDebts.length} pendientes`, 'Deudas');
  } catch (e) {
    add('debt_1', 'Deudas registradas', 'fail', 'Error', 'Deudas');
  }

  // 5. CRÉDITOS
  try {
    const creditos = JSON.parse(localStorage.getItem('dulces_aromas_creditos') || '[]');
    add('cred_1', 'Créditos con cuotas', 'pass', `${creditos.length} créditos`, 'Créditos');
  } catch (e) {
    add('cred_1', 'Créditos con cuotas', 'fail', 'Error', 'Créditos');
  }

  // 6. CONFIG
  try {
    const meta = localStorage.getItem('dulces_aromas_meta_mes');
    if (meta) {
      add('cfg_1', 'Meta mensual', 'pass', `$${Number(meta).toLocaleString('es-CL')}`, 'Configuración');
    } else {
      add('cfg_1', 'Meta mensual', 'warn', 'Sin meta configurada', 'Configuración');
    }
  } catch (e) {
    add('cfg_1', 'Meta mensual', 'fail', 'Error', 'Configuración');
  }

  // 7. SEGURIDAD
  const pinHash = localStorage.getItem('dulces_aromas_pin-hash');
  add('sec_1', 'PIN configurado', pinHash ? 'pass' : 'warn',
    pinHash ? 'PIN personalizado' : 'PIN por defecto (2525)', 'Seguridad');

  // 8. PERFORMANCE
  const memory = (performance as any).memory;
  if (memory) {
    const usedMB = memory.usedJSHeapSize / (1024 * 1024);
    add('perf_1', 'Memoria JS', usedMB > 100 ? 'warn' : 'pass', `${usedMB.toFixed(1)} MB`, 'Performance');
  } else {
    add('perf_1', 'Memoria JS', 'warn', 'No disponible', 'Performance');
  }

  add('perf_2', 'Service Worker', 'serviceWorker' in navigator ? 'pass' : 'warn',
    'serviceWorker' in navigator ? 'Disponible' : 'No disponible', 'Performance');

  add('perf_3', 'Modo Online', navigator.onLine ? 'pass' : 'warn',
    navigator.onLine ? 'Conectado' : 'Sin conexión', 'Performance');

  return results;
}

export default function DiagnosticoPage() {
  const navigate = useNavigate();
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(true);

  const executeDiagnostics = useCallback(() => {
    setRunning(true);
    setResults([]);
    setTimeout(() => {
      setResults(runAutoDiagnostics());
      setRunning(false);
    }, 600);
  }, []);

  useEffect(() => { executeDiagnostics(); }, [executeDiagnostics]);

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warn').length;
  const total = results.length;
  const healthPercent = total > 0 ? Math.round((passed / total) * 100) : 0;

  const sections = Array.from(new Set(results.map(r => r.section)));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f] p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="w-6 h-6 text-[#00BCD4]" />
              Diagnóstico Automático
            </h1>
            <p className="text-sm text-gray-500 mt-1">Auditoría completa del sistema</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={executeDiagnostics} disabled={running}>
              <RefreshCw className={cn("w-4 h-4 mr-1", running && "animate-spin")} />
              {running ? 'Ejecutando...' : 'Re-ejecutar'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver
            </Button>
          </div>
        </div>

        {/* Health Score */}
        <Card className={cn("border-2",
          healthPercent >= 80 ? "border-green-200 bg-green-50/50" :
          healthPercent >= 50 ? "border-yellow-200 bg-yellow-50/50" :
          "border-red-200 bg-red-50/50"
        )}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">Salud del sistema</div>
                <div className="text-4xl font-bold font-mono">{healthPercent}%</div>
                <div className="text-sm text-gray-500 mt-1">
                  {running ? 'Analizando...' : `${passed} OK · ${failed} Fallos · ${warnings} Alertas`}
                </div>
              </div>
              <div className={cn("w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white",
                healthPercent >= 80 ? "bg-green-500" :
                healthPercent >= 50 ? "bg-yellow-500" :
                "bg-red-500"
              )}>
                {running ? '...' : healthPercent >= 80 ? '✓' : healthPercent >= 50 ? '!' : '✗'}
              </div>
            </div>
            <Progress value={healthPercent} className="mt-4" />
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Package, label: 'Productos', key: 'dulces_aromas_products', color: 'text-[#4CAF50]' },
            { icon: DollarSign, label: 'Ventas', key: 'dulces_aromas_sales', color: 'text-[#00BCD4]' },
            { icon: CreditCard, label: 'Deudas', key: 'dulces_aromas_debts', color: 'text-[#F59E0B]' },
            { icon: Users, label: 'Clientes', key: 'dulces_aromas_clients', color: 'text-[#9C27B0]' },
          ].map((stat) => {
            const count = (() => {
              try {
                const data = JSON.parse(localStorage.getItem(stat.key) || '[]');
                return Array.isArray(data) ? data.length : Object.keys(data).length;
              } catch { return 0; }
            })();
            return (
              <Card key={stat.label} className="border border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                    <div>
                      <div className="text-2xl font-bold font-mono">{count}</div>
                      <div className="text-xs text-gray-500">{stat.label}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tests by Section */}
        {running ? (
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              <Activity className="w-12 h-12 mx-auto mb-4 text-[#00BCD4] animate-spin" />
              <p className="text-lg font-medium">Ejecutando diagnóstico...</p>
              <p className="text-sm text-gray-500">Verificando localStorage, catálogo, ventas, deudas y más</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sections.map(section => {
              const sectionResults = results.filter(r => r.section === section);
              const sectionPass = sectionResults.filter(r => r.status === 'pass').length;
              const sectionTotal = sectionResults.length;
              return (
                <Card key={section} className="border border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {section === 'Almacenamiento' && <Database className="w-5 h-5 text-[#00BCD4]" />}
                        {section === 'Catálogo' && <Package className="w-5 h-5 text-[#4CAF50]" />}
                        {section === 'Ventas' && <DollarSign className="w-5 h-5 text-[#00BCD4]" />}
                        {section === 'Deudas' && <CreditCard className="w-5 h-5 text-[#F59E0B]" />}
                        {section === 'Créditos' && <CreditCard className="w-5 h-5 text-[#9C27B0]" />}
                        {section === 'Configuración' && <Shield className="w-5 h-5 text-[#FFC107]" />}
                        {section === 'Seguridad' && <Shield className="w-5 h-5 text-[#F44336]" />}
                        {section === 'Performance' && <Zap className="w-5 h-5 text-[#FF9800]" />}
                        {section}
                      </CardTitle>
                      <Badge variant={sectionPass === sectionTotal ? 'default' : 'secondary'} className={sectionPass === sectionTotal ? 'bg-green-500' : ''}>
                        {sectionPass}/{sectionTotal} OK
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {sectionResults.map((result) => (
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
                            <span className="text-sm">{result.name}</span>
                          </div>
                          <span className="text-xs text-gray-500">{result.message}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="text-center text-xs text-gray-400 pt-4 pb-8">
          Dulces Aromas POS v2.0 — Diagnóstico automático {new Date().toLocaleString('es-CL')}
        </div>
      </div>
    </div>
  );
}