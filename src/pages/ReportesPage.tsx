import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import {
  DollarSign, Package, TrendingUp, Users, Settings,
  Calendar, Download, ChevronDown, FileSpreadsheet,
  FileText, Printer, ArrowUpDown, AlertTriangle,
  CheckCircle, X, FileBarChart, ShoppingBag, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/* ─── Types ─── */
interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  costo: number;
  stock: number;
  stockMinimo: number;
}

interface VentaItem {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface Venta {
  id: string;
  fecha: string;
  items: VentaItem[];
  total: number;
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta' | 'credito';
  cliente?: string;
}

interface Cliente {
  id: string;
  nombre: string;
  telefono?: string;
  totalCompras: number;
  totalGastado: number;
  ultimaCompra: string;
  visitas: number;
}

interface Deuda {
  id: string;
  cliente: string;
  monto: number;
  pagado: number;
  saldo: number;
  fecha: string;
}

type DateRangePreset = 'hoy' | 'semana' | 'mes' | 'mes-anterior' | 'personalizado';
type ReportTab = 'ventas' | 'inventario' | 'rentabilidad' | 'clientes' | 'personalizado';

/* ─── Constants ─── */
const CATEGORY_COLORS: Record<string, string> = {
  Caballero: '#00BCD4',
  Dama: '#FFC107',
  Ninos: '#4CAF50',
  Unisex: '#8B5CF6',
  General: '#00BCD4',
};
const PAYMENT_COLORS: Record<string, string> = {
  efectivo: '#4CAF50',
  transferencia: '#00BCD4',
  tarjeta: '#FFC107',
  credito: '#EF4444',
};

/* ─── Demo Data Generators ─── */
function generateDemoData() {
  const now = new Date();
  void 0; /* categories removed */
  const paymentMethods: Venta['metodoPago'][] = ['efectivo', 'transferencia', 'tarjeta', 'credito'];
  const productNames = [
    ['Acqua di Gio', 'Dama', 120000, 72000],
    ['Sauvage', 'Caballero', 150000, 90000],
    ['La Vie Est Belle', 'Dama', 130000, 78000],
    ['One Million', 'Caballero', 140000, 84000],
    ['J\'adore', 'Dama', 160000, 96000],
    ['Bleu de Chanel', 'Caballero', 170000, 102000],
    ['Good Girl', 'Dama', 110000, 66000],
    ['Invictus', 'Caballero', 125000, 75000],
    ['Miss Dior', 'Dama', 155000, 93000],
    ['Le Male', 'Caballero', 135000, 81000],
    ['Light Blue', 'Dama', 100000, 60000],
    ['212 VIP', 'Caballero', 145000, 87000],
    ['Scandal', 'Dama', 118000, 70800],
    ['Eros', 'Caballero', 132000, 79200],
    ['CK One', 'Unisex', 95000, 57000],
    ['Phantom', 'Ninos', 85000, 51000],
    ['Toy Boy', 'Ninos', 78000, 46800],
    ['Fame', 'Dama', 142000, 85200],
    ['Stronger With You', 'Caballero', 128000, 76800],
    ['Bombshell', 'Dama', 108000, 64800],
  ];

  const products: Producto[] = productNames.map(([name, cat, price, cost], i) => ({
    id: `prod-${i}`,
    nombre: name as string,
    categoria: cat as string,
    precio: price as number,
    costo: cost as number,
    stock: Math.floor(Math.random() * 50) + 2,
    stockMinimo: 5,
  }));

  const sales: Venta[] = [];
  const clientNames = ['Ana Maria Lopez', 'Carlos Rodriguez', 'Maria Garcia', 'Juan Perez', 'Laura Martinez', 'Pedro Sanchez', 'Isabel Torres', 'Luis Herrera'];

  for (let d = 29; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];
    const daySales = 3 + Math.floor(Math.random() * 8);

    for (let s = 0; s < daySales; s++) {
      const itemCount = 1 + Math.floor(Math.random() * 4);
      const items: VentaItem[] = [];
      let total = 0;
      for (let it = 0; it < itemCount; it++) {
        const prod = products[Math.floor(Math.random() * products.length)];
        const cantidad = 1 + Math.floor(Math.random() * 2);
        const subtotal = cantidad * prod.precio;
        total += subtotal;
        items.push({
          productoId: prod.id,
          nombre: prod.nombre,
          cantidad,
          precioUnitario: prod.precio,
          subtotal,
        });
      }
      sales.push({
        id: `venta-${Date.now()}-${d}-${s}`,
        fecha: dateStr,
        items,
        total,
        metodoPago: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        cliente: clientNames[Math.floor(Math.random() * clientNames.length)],
      });
    }
  }

  const clients: Cliente[] = clientNames.map((name, i) => ({
    id: `cli-${i}`,
    nombre: name,
    telefono: `300${1000000 + Math.floor(Math.random() * 8999999)}`,
    totalCompras: 0,
    totalGastado: 0,
    ultimaCompra: sales.filter(s => s.cliente === name).slice(-1)[0]?.fecha ?? '',
    visitas: new Set(sales.filter(s => s.cliente === name).map(s => s.fecha)).size,
  }));

  sales.forEach(s => {
    const c = clients.find(cl => cl.nombre === s.cliente);
    if (c) {
      c.totalCompras += 1;
      c.totalGastado += s.total;
    }
  });

  const debts: Deuda[] = [
    { id: 'deuda-1', cliente: 'Maria Garcia', monto: 250000, pagado: 100000, saldo: 150000, fecha: new Date(now.getTime() - 7 * 864e5).toISOString().split('T')[0] },
    { id: 'deuda-2', cliente: 'Juan Perez', monto: 180000, pagado: 50000, saldo: 130000, fecha: new Date(now.getTime() - 14 * 864e5).toISOString().split('T')[0] },
    { id: 'deuda-3', cliente: 'Ana Maria Lopez', monto: 320000, pagado: 200000, saldo: 120000, fecha: new Date(now.getTime() - 3 * 864e5).toISOString().split('T')[0] },
  ];

  return { products, sales, clients, debts };
}

function loadData() {
  try {
    const products = JSON.parse(localStorage.getItem('dulces-aromas-products') || '[]') as Producto[];
    const sales = JSON.parse(localStorage.getItem('dulces-aromas-sales') || '[]') as Venta[];
    const clients = JSON.parse(localStorage.getItem('dulces-aromas-clients') || '[]') as Cliente[];
    const debts = JSON.parse(localStorage.getItem('dulces-aromas-debts') || '[]') as Deuda[];
    if (products.length === 0 || sales.length === 0) {
      const demo = generateDemoData();
      return { products: demo.products, sales: demo.sales, clients: demo.clients, debts: demo.debts, isDemo: true };
    }
    return { products, sales, clients, debts, isDemo: false };
  } catch {
    const demo = generateDemoData();
    return { products: demo.products, sales: demo.sales, clients: demo.clients, debts: demo.debts, isDemo: true };
  }
}

/* ─── Formatters ─── */
function fmtMoney(value: number): string {
  return `$ ${value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
function fmtDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

/* ─── Date Range Logic ─── */
function getDateRange(preset: DateRangePreset, customStart?: string, customEnd?: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let start: Date;
  let end: Date = today;

  switch (preset) {
    case 'hoy':
      start = today;
      break;
    case 'semana':
      start = new Date(today);
      start.setDate(today.getDate() - 6);
      break;
    case 'mes':
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'mes-anterior': {
      const prevMonth = today.getMonth() - 1;
      start = new Date(today.getFullYear(), prevMonth, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
    }
    case 'personalizado':
      start = customStart ? new Date(customStart) : today;
      end = customEnd ? new Date(customEnd) : today;
      break;
  }
  return { start, end };
}

function isInRange(dateStr: string, start: Date, end: Date): boolean {
  const d = new Date(dateStr);
  return d >= start && d <= end;
}

/* ─── Export Functions ─── */
function exportToExcel(data: Record<string, unknown[]>, filename: string) {
  const wb = XLSX.utils.book_new();
  Object.entries(data).forEach(([sheetName, rows]) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  });
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function exportToCSV(data: unknown[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}

async function exportToPDF(elementId: string, filename: string) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const canvas = await html2canvas(el, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('l', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(`${filename}.pdf`);
}

function printReport(elementId: string) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(`
    <html>
      <head><title>Reporte</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:20px;color:#333}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{border:1px solid #ddd;padding:6px;text-align:left}
        th{background:#f5f5f5;font-weight:600}
        .title{font-size:18px;font-weight:bold;margin-bottom:16px}
        .subtitle{font-size:12px;color:#666;margin-bottom:20px}
        img{max-width:100%}
      </style></head>
      <body>${el.innerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

/* ─── Date Range Picker Component ─── */
function DateRangePicker({
  preset,
  onPresetChange,
  customStart,
  customEnd,
  onCustomChange,
}: {
  preset: DateRangePreset;
  onPresetChange: (p: DateRangePreset) => void;
  customStart: string;
  customEnd: string;
  onCustomChange: (s: string, e: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const presets: { label: string; value: DateRangePreset }[] = [
    { label: 'Hoy', value: 'hoy' },
    { label: 'Esta semana', value: 'semana' },
    { label: 'Este mes', value: 'mes' },
    { label: 'Mes anterior', value: 'mes-anterior' },
    { label: 'Personalizado', value: 'personalizado' },
  ];

  const presetLabel = presets.find(p => p.value === preset)?.label ?? 'Personalizado';
  return (
    <div className="relative">
      <Button variant="outline" onClick={() => setOpen(!open)} className="gap-2 text-sm">
        <Calendar size={16} />
        {presetLabel}
        <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
      </Button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 z-50 mt-2 w-56 rounded-lg border bg-card shadow-lg p-2"
            >
              {presets.map(p => (
                <button
                  key={p.value}
                  onClick={() => { onPresetChange(p.value); setOpen(false); }}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                    preset === p.value ? 'bg-[#00BCD4] text-white' : 'hover:bg-muted'
                  )}
                >
                  {p.label}
                </button>
              ))}
              {preset === 'personalizado' && (
                <div className="mt-2 pt-2 border-t space-y-2 px-1">
                  <input
                    type="date"
                    value={customStart}
                    onChange={e => onCustomChange(e.target.value, customEnd)}
                    className="w-full px-2 py-1.5 rounded border bg-background text-sm"
                  />
                  <input
                    type="date"
                    value={customEnd}
                    onChange={e => onCustomChange(customStart, e.target.value)}
                    className="w-full px-2 py-1.5 rounded border bg-background text-sm"
                  />
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Export Menu Component ─── */
function ExportMenu({
  elementId,
  filename,
  excelData,
  csvData,
}: {
  elementId: string;
  filename: string;
  excelData: Record<string, unknown[]>;
  csvData: unknown[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)} className="gap-1.5 text-xs">
        <Download size={14} />
        Exportar
      </Button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 z-50 mt-1 w-44 rounded-lg border bg-card shadow-lg py-1"
            >
              <button onClick={() => { exportToExcel(excelData, filename); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors">
                <FileSpreadsheet size={14} className="text-green-600" /> Excel (.xlsx)
              </button>
              <button onClick={() => { exportToCSV(csvData, filename); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors">
                <FileText size={14} className="text-blue-600" /> CSV
              </button>
              <button onClick={() => { exportToPDF(elementId, filename); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors">
                <FileBarChart size={14} className="text-red-600" /> PDF
              </button>
              <button onClick={() => { printReport(elementId); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors">
                <Printer size={14} className="text-gray-600" /> Imprimir
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── KPI Card ─── */
function KpiCard({
  title, value, icon: Icon, color, subtitle,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden border-l-[3px]" style={{ borderLeftColor: color }}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
              <p className="text-xl font-semibold font-[JetBrains_Mono,monospace] text-foreground">{value}</p>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="p-2 rounded-full" style={{ backgroundColor: `${color}15` }}>
              <span style={{ color }}><Icon size={20} /></span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── Section Wrapper with Export ─── */
function ReportSection({
  title, children, exportElementId, filename, excelData, csvData,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
  exportElementId: string;
  filename: string;
  excelData: Record<string, unknown[]>;
  csvData: unknown[];
}) {
  return (
    <motion.div
      id={exportElementId}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold font-[Playfair_Display,Georgia,serif] text-foreground">{title}</h3>
        <ExportMenu elementId={exportElementId} filename={filename} excelData={excelData} csvData={csvData} />
      </div>
      {children}
    </motion.div>
  );
}

/* ─── Custom Tooltip for Charts ─── */
function CustomTooltip({ active, payload, label, money = true }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string; money?: boolean }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-muted-foreground">
          {p.name}: {money ? fmtMoney(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

/* ─── Sortable Table Hook ─── */
function useSortableTable<T>(data: T[], defaultKey?: keyof T) {
  const [sortKey, setSortKey] = useState<keyof T | undefined>(defaultKey);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = useCallback((key: keyof T) => {
    setSortKey(prev => {
      if (prev === key) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        return key;
      }
      setSortDir('desc');
      return key;
    });
  }, []);

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
      const av = a[sortKey] as unknown as number | string;
      const bv = b[sortKey] as unknown as number | string;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [data, sortKey, sortDir]);

  return { sorted, toggleSort, sortKey, sortDir };
}

/* ═══════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════ */
export default function ReportesPage() {
  const { products, sales, clients, debts } = useMemo(() => loadData(), []);
  const [activeTab, setActiveTab] = useState<ReportTab>('ventas');
  const [datePreset, setDatePreset] = useState<DateRangePreset>('mes');
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split('T')[0]);

  const { start, end } = useMemo(() => getDateRange(datePreset, customStart, customEnd), [datePreset, customStart, customEnd]);

  const filteredSales = useMemo(
    () => sales.filter(s => isInRange(s.fecha, start, end)),
    [sales, start, end]
  );
  void 0; /* filteredDebts removed */

  const dateRangeStr = `${fmtDate(start.toISOString().split('T')[0])} - ${fmtDate(end.toISOString().split('T')[0])}`;

  /* ─── Tab Config ─── */
  const tabs: { id: ReportTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'ventas', label: 'Ventas', icon: DollarSign },
    { id: 'inventario', label: 'Inventario', icon: Package },
    { id: 'rentabilidad', label: 'Rentabilidad', icon: TrendingUp },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'personalizado', label: 'Personalizado', icon: Settings },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-[1400px] mx-auto"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[Playfair_Display,Georgia,serif] text-foreground">Reportes</h1>
          <p className="text-sm text-muted-foreground mt-1">{dateRangeStr}</p>
        </div>
        <DateRangePicker
          preset={datePreset}
          onPresetChange={setDatePreset}
          customStart={customStart}
          customEnd={customEnd}
          onCustomChange={(s, e) => { setCustomStart(s); setCustomEnd(e); }}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-[#00BCD4] text-[#00BCD4]'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'ventas' && (
          <VentasReport key="ventas" sales={filteredSales} products={products} start={start} end={end} />
        )}
        {activeTab === 'inventario' && (
          <InventarioReport key="inventario" products={products} sales={sales} />
        )}
        {activeTab === 'rentabilidad' && (
          <RentabilidadReport key="rentabilidad" sales={filteredSales} products={products} start={start} end={end} />
        )}
        {activeTab === 'clientes' && (
          <ClientesReport key="clientes" sales={filteredSales} clients={clients} debts={debts} />
        )}
        {activeTab === 'personalizado' && (
          <CustomReport key="personalizado" sales={filteredSales} products={products} clients={clients} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   VENTAS REPORT
   ═══════════════════════════════════════════ */
function VentasReport({ sales, products, start, end }: {
  sales: Venta[]; products: Producto[]; start: Date; end: Date;
}) {
  const productMap = useMemo(() => {
    const m: Record<string, Producto> = {};
    products.forEach(p => m[p.id] = p);
    return m;
  }, [products]);

  const totalVentas = useMemo(() => sales.reduce((s, v) => s + v.total, 0), [sales]);
  const totalTrans = sales.length;
  const ticketPromedio = totalTrans > 0 ? totalVentas / totalTrans : 0;

  const productCount: Record<string, { nombre: string; cantidad: number; revenue: number }> = {};
  sales.forEach(v => v.items.forEach(it => {
    if (!productCount[it.productoId]) productCount[it.productoId] = { nombre: it.nombre, cantidad: 0, revenue: 0 };
    productCount[it.productoId].cantidad += it.cantidad;
    productCount[it.productoId].revenue += it.subtotal;
  }));
  const topProduct = Object.entries(productCount).sort((a, b) => b[1].cantidad - a[1].cantidad)[0];

  const dailySales = useMemo(() => {
    const map: Record<string, number> = {};
    const d = new Date(start);
    while (d <= end) {
      map[d.toISOString().split('T')[0]] = 0;
      d.setDate(d.getDate() + 1);
    }
    sales.forEach(v => { if (map[v.fecha] !== undefined) map[v.fecha] += v.total; });
    return Object.entries(map).map(([fecha, total]) => ({
      fecha: fmtDate(fecha),
      total,
      rawDate: fecha,
    }));
  }, [sales, start, end]);

  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = { efectivo: 0, transferencia: 0, tarjeta: 0, credito: 0 };
    sales.forEach(v => { map[v.metodoPago] = (map[v.metodoPago] || 0) + v.total; });
    return Object.entries(map).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [sales]);

  const top10Products = useMemo(() =>
    Object.entries(productCount)
      .map(([id, data]) => ({
        id,
        nombre: data.nombre,
        categoria: productMap[id]?.categoria ?? 'General',
        cantidad: data.cantidad,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10)
      .map((p, i) => ({ ...p, rank: i + 1 })),
    [productCount, productMap]
  );

  const excelData = useMemo(() => ({
    'Ventas': sales.map(s => ({
      Fecha: fmtDate(s.fecha), Total: s.total, 'Metodo Pago': s.metodoPago, Cliente: s.cliente ?? 'N/A',
      Productos: s.items.map(i => `${i.nombre} x${i.cantidad}`).join(', '),
    })),
    'Top Productos': top10Products,
  }), [sales, top10Products]);

  const csvData = useMemo(() => sales.map(s => ({
    Fecha: fmtDate(s.fecha), Total: s.total, 'Metodo Pago': s.metodoPago, Cliente: s.cliente ?? 'N/A',
    Productos: s.items.map(i => `${i.nombre} x${i.cantidad}`).join(', '),
  })), [sales]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Ventas" value={fmtMoney(totalVentas)} icon={DollarSign} color="#00BCD4" />
        <KpiCard title="Transacciones" value={totalTrans.toLocaleString()} icon={ShoppingBag} color="#4CAF50" />
        <KpiCard title="Ticket Promedio" value={fmtMoney(ticketPromedio)} icon={CreditCard} color="#9C27B0" />
        <KpiCard title="Producto mas Vendido" value={topProduct?.[1]?.nombre ?? 'N/A'} icon={Package} color="#FFC107" subtitle={`${topProduct?.[1]?.cantidad ?? 0} unidades`} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ReportSection id="ventas-area" title="Ventas por Dia" exportElementId="ventas-area-chart" filename="ventas-diarias"
          excelData={excelData} csvData={csvData}>
          <Card>
            <CardContent className="pt-6">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailySales}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00BCD4" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#00BCD4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 11 }} stroke="rgba(128,128,128,0.5)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="rgba(128,128,128,0.5)" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="total" name="Ventas" stroke="#00BCD4" strokeWidth={2} fill="url(#salesGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </ReportSection>

        <ReportSection id="ventas-pie" title="Metodos de Pago" exportElementId="ventas-pie-chart" filename="metodos-pago"
          excelData={{ Metodos: paymentBreakdown.map(p => ({ Metodo: p.name, Total: p.value })) }}
          csvData={paymentBreakdown}>
          <Card>
            <CardContent className="pt-6">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentBreakdown} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                      {paymentBreakdown.map((entry, i) => (
                        <Cell key={i} fill={PAYMENT_COLORS[entry.name.toLowerCase()] ?? '#00BCD4'} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </ReportSection>

        <ReportSection id="ventas-top" title="Top 10 Productos" exportElementId="ventas-top-chart" filename="top-productos"
          excelData={{ 'Top Productos': top10Products }} csvData={top10Products}>
          <Card>
            <CardContent className="pt-6">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top10Products} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="rgba(128,128,128,0.5)" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10 }} width={100} stroke="rgba(128,128,128,0.5)" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" name="Ventas" fill="#00BCD4" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </ReportSection>
      </div>

      {/* Sales Detail Table */}
      <ReportSection id="ventas-table" title="Detalle de Ventas" exportElementId="ventas-detail-table" filename="detalle-ventas"
        excelData={excelData} csvData={csvData}>
        <SalesTable sales={sales} />
      </ReportSection>
    </motion.div>
  );
}

function SalesTable({ sales }: { sales: Venta[] }) {
  const { sorted, toggleSort, sortKey, sortDir: _sortDir } = useSortableTable(sales, 'fecha');
  const [page, setPage] = useState(1);
  const perPage = 10;
  const totalPages = Math.ceil(sorted.length / perPage);
  const paged = sorted.slice((page - 1) * perPage, page * perPage);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('fecha')}>
                  Fecha {sortKey === 'fecha' && <ArrowUpDown size={12} className="inline ml-1" />}
                </TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('total')}>
                  Total {sortKey === 'total' && <ArrowUpDown size={12} className="inline ml-1" />}
                </TableHead>
                <TableHead>Metodo Pago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm">{fmtDate(s.fecha)}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{s.items.map(i => `${i.nombre} x${i.cantidad}`).join(', ')}</TableCell>
                  <TableCell className="text-sm">{s.cliente ?? 'N/A'}</TableCell>
                  <TableCell className="font-[JetBrains_Mono,monospace] text-sm">{fmtMoney(s.total)}</TableCell>
                  <TableCell>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                      s.metodoPago === 'efectivo' && 'bg-green-100 text-green-700',
                      s.metodoPago === 'transferencia' && 'bg-cyan-100 text-cyan-700',
                      s.metodoPago === 'tarjeta' && 'bg-amber-100 text-amber-700',
                      s.metodoPago === 'credito' && 'bg-red-100 text-red-700',
                    )}>
                      {s.metodoPago}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {paged.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No hay ventas en este periodo</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-muted-foreground">Mostrando {paged.length} de {sorted.length}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Anterior</Button>
              <span className="px-3 py-1 text-sm">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Siguiente</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


/* ═══════════════════════════════════════════
   INVENTARIO REPORT
   ═══════════════════════════════════════════ */
function InventarioReport({ products, sales: _sales }: { products: Producto[]; sales?: Venta[] }) {
  const totalProducts = products.length;
  const agotados = products.filter(p => p.stock === 0);
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.stockMinimo);
  const valorInventario = products.reduce((s, p) => s + p.stock * p.costo, 0);

  const categoryValue = useMemo(() => {
    const map: Record<string, { categoria: string; valor: number; cantidad: number }> = {};
    products.forEach(p => {
      if (!map[p.categoria]) map[p.categoria] = { categoria: p.categoria, valor: 0, cantidad: 0 };
      map[p.categoria].valor += p.stock * p.costo;
      map[p.categoria].cantidad += p.stock;
    });
    return Object.values(map);
  }, [products]);

  const sortedByStock = useMemo(() =>
    [...products].sort((a, b) => (b.stock * b.costo) - (a.stock * a.costo)).slice(0, 15),
    [products]
  );

  const excelData = useMemo(() => ({
    'Inventario': products.map(p => ({
      Producto: p.nombre, Categoria: p.categoria, Stock: p.stock, 'Stock Minimo': p.stockMinimo,
      Costo: p.costo, 'Valor Stock': p.stock * p.costo,
    })),
    'Stock Bajo': lowStock.map(p => ({
      Producto: p.nombre, Categoria: p.categoria, Stock: p.stock, 'Stock Minimo': p.stockMinimo,
    })),
  }), [products, lowStock]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Productos" value={totalProducts.toString()} icon={Package} color="#4CAF50" />
        <KpiCard title="Productos Agotados" value={agotados.length.toString()} icon={AlertTriangle} color="#EF4444" />
        <KpiCard title="Stock Bajo" value={lowStock.length.toString()} icon={AlertTriangle} color="#F59E0B" />
        <KpiCard title="Valor Inventario" value={fmtMoney(valorInventario)} icon={DollarSign} color="#00BCD4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportSection id="inv-pie" title="Valor por Categoria" exportElementId="inv-pie-chart" filename="valor-categoria"
          excelData={{ Categorias: categoryValue }} csvData={categoryValue}>
          <Card>
            <CardContent className="pt-6">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryValue} cx="50%" cy="50%" outerRadius={100} dataKey="valor" nameKey="categoria"
                      label={({ categoria, percent }) => `${categoria}: ${(percent * 100).toFixed(0)}%`}>
                      {categoryValue.map((entry, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[entry.categoria] ?? '#00BCD4'} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </ReportSection>

        <ReportSection id="inv-stock" title="Niveles de Stock" exportElementId="inv-stock-chart" filename="niveles-stock"
          excelData={{ Stock: sortedByStock.map(p => ({ Producto: p.nombre, Stock: p.stock, 'Stock Min': p.stockMinimo })) }}
          csvData={sortedByStock}>
          <Card>
            <CardContent className="pt-6">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedByStock} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="rgba(128,128,128,0.5)" />
                    <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10 }} width={100} stroke="rgba(128,128,128,0.5)" />
                    <Tooltip content={<CustomTooltip money={false} />} />
                    <Bar dataKey="stock" name="Stock Actual" fill="#00BCD4" radius={[0, 4, 4, 0]}>
                      {sortedByStock.map((entry, i) => (
                        <Cell key={i} fill={entry.stock === 0 ? '#EF4444' : entry.stock <= entry.stockMinimo ? '#F59E0B' : '#4CAF50'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </ReportSection>
      </div>

      {/* Stock Table */}
      <ReportSection id="inv-table" title="Detalle de Inventario" exportElementId="inv-detail-table" filename="inventario-detalle"
        excelData={excelData} csvData={products}>
        <InventoryTable products={products} />
      </ReportSection>

      {/* Low Stock Alerts */}
      {(lowStock.length > 0 || agotados.length > 0) && (
        <ReportSection id="inv-alerts" title="Alertas de Stock Bajo" exportElementId="inv-alerts" filename="alertas-stock"
          excelData={{ Alertas: [...agotados, ...lowStock].map(p => ({ Producto: p.nombre, Stock: p.stock, Minimo: p.stockMinimo })) }}
          csvData={[...agotados, ...lowStock]}>
          <Card className="border-l-[3px] border-l-[#F59E0B]">
            <CardContent className="pt-6">
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {agotados.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                    <div className="flex items-center gap-3">
                      <X size={16} className="text-[#EF4444]" />
                      <div>
                        <p className="text-sm font-medium">{p.nombre}</p>
                        <p className="text-xs text-muted-foreground">{p.categoria}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Agotado</span>
                  </div>
                ))}
                {lowStock.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                    <div className="flex items-center gap-3">
                      <AlertTriangle size={16} className="text-[#F59E0B]" />
                      <div>
                        <p className="text-sm font-medium">{p.nombre}</p>
                        <p className="text-xs text-muted-foreground">{p.categoria}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium">{p.stock} / {p.stockMinimo} min</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </ReportSection>
      )}
    </motion.div>
  );
}

function InventoryTable({ products }: { products: Producto[] }) {
  const { sorted, toggleSort, sortKey } = useSortableTable(products, 'stock');
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('nombre')}>Producto {sortKey === 'nombre' && <ArrowUpDown size={12} className="inline ml-1" />}</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('categoria')}>Categoria {sortKey === 'categoria' && <ArrowUpDown size={12} className="inline ml-1" />}</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('stock')}>Stock {sortKey === 'stock' && <ArrowUpDown size={12} className="inline ml-1" />}</TableHead>
                <TableHead>Stock Min</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('costo')}>Costo {sortKey === 'costo' && <ArrowUpDown size={12} className="inline ml-1" />}</TableHead>
                <TableHead>Valor Stock</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm font-medium">{p.nombre}</TableCell>
                  <TableCell className="text-sm">{p.categoria}</TableCell>
                  <TableCell className="font-[JetBrains_Mono,monospace] text-sm">{p.stock}</TableCell>
                  <TableCell className="text-sm">{p.stockMinimo}</TableCell>
                  <TableCell className="font-[JetBrains_Mono,monospace] text-sm">{fmtMoney(p.costo)}</TableCell>
                  <TableCell className="font-[JetBrains_Mono,monospace] text-sm">{fmtMoney(p.stock * p.costo)}</TableCell>
                  <TableCell>
                    {p.stock === 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Agotado</span>
                    ) : p.stock <= p.stockMinimo ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Bajo</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">OK</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════
   RENTABILIDAD REPORT
   ═══════════════════════════════════════════ */
function RentabilidadReport({ sales, products, start, end }: {
  sales: Venta[]; products: Producto[]; start: Date; end: Date;
}) {
  const productMap = useMemo(() => {
    const m: Record<string, Producto> = {};
    products.forEach(p => m[p.id] = p);
    return m;
  }, [products]);

  const { totalRevenue, totalCost, totalProfit } = useMemo(() => {
    let rev = 0, cost = 0;
    sales.forEach(v => v.items.forEach(it => {
      rev += it.subtotal;
      const prod = productMap[it.productoId];
      cost += it.cantidad * (prod?.costo ?? 0);
    }));
    return { totalRevenue: rev, totalCost: cost, totalProfit: rev - cost };
  }, [sales, productMap]);

  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const productProfit: Record<string, { nombre: string; categoria: string; revenue: number; cost: number; profit: number; margin: number }> = {};
  sales.forEach(v => v.items.forEach(it => {
    const prod = productMap[it.productoId];
    if (!prod) return;
    if (!productProfit[it.productoId]) productProfit[it.productoId] = { nombre: prod.nombre, categoria: prod.categoria, revenue: 0, cost: 0, profit: 0, margin: 0 };
    productProfit[it.productoId].revenue += it.subtotal;
    productProfit[it.productoId].cost += it.cantidad * prod.costo;
  }));
  Object.values(productProfit).forEach(p => {
    p.profit = p.revenue - p.cost;
    p.margin = p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0;
  });
  const rankedProducts = Object.entries(productProfit).map(([id, data]) => ({ id, ...data })).sort((a, b) => b.margin - a.margin);

  const categoryProfit = useMemo(() => {
    const map: Record<string, { categoria: string; revenue: number; cost: number; profit: number }> = {};
    Object.values(productProfit).forEach(p => {
      if (!map[p.categoria]) map[p.categoria] = { categoria: p.categoria, revenue: 0, cost: 0, profit: 0 };
      map[p.categoria].revenue += p.revenue;
      map[p.categoria].cost += p.cost;
      map[p.categoria].profit += p.profit;
    });
    return Object.values(map);
  }, [productProfit]);

  const dailyProfit = useMemo(() => {
    const map: Record<string, { fecha: string; revenue: number; cost: number; profit: number }> = {};
    const d = new Date(start);
    while (d <= end) {
      const k = d.toISOString().split('T')[0];
      map[k] = { fecha: fmtDate(k), revenue: 0, cost: 0, profit: 0 };
      d.setDate(d.getDate() + 1);
    }
    sales.forEach(v => {
      if (map[v.fecha]) {
        v.items.forEach(it => {
          map[v.fecha].revenue += it.subtotal;
          const prod = productMap[it.productoId];
          map[v.fecha].cost += it.cantidad * (prod?.costo ?? 0);
        });
      }
    });
    Object.values(map).forEach(d => d.profit = d.revenue - d.cost);
    return Object.values(map);
  }, [sales, start, end, productMap]);

  const excelData = useMemo(() => ({
    'Rentabilidad': rankedProducts.map(p => ({
      Producto: p.nombre, Categoria: p.categoria, Ventas: p.revenue, Costo: p.cost,
      Ganancia: p.profit, 'Margen %': p.margin.toFixed(1),
    })),
    'Por Categoria': categoryProfit,
  }), [rankedProducts, categoryProfit]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Ventas Totales" value={fmtMoney(totalRevenue)} icon={DollarSign} color="#00BCD4" />
        <KpiCard title="Costo Total" value={fmtMoney(totalCost)} icon={ShoppingBag} color="#EF4444" />
        <KpiCard title="Ganancia Bruta" value={fmtMoney(totalProfit)} icon={TrendingUp} color="#4CAF50" />
        <KpiCard title="Margen Promedio" value={`${avgMargin.toFixed(1)}%`} icon={CheckCircle} color="#9C27B0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportSection id="rent-cat" title="Ganancia por Categoria" exportElementId="rent-cat-chart" filename="ganancia-categoria"
          excelData={{ Categorias: categoryProfit }} csvData={categoryProfit}>
          <Card>
            <CardContent className="pt-6">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryProfit}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                    <XAxis dataKey="categoria" tick={{ fontSize: 11 }} stroke="rgba(128,128,128,0.5)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="rgba(128,128,128,0.5)" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="revenue" name="Ventas" fill="#00BCD4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cost" name="Costo" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Ganancia" fill="#FFC107" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </ReportSection>

        <ReportSection id="rent-trend" title="Tendencia de Margen" exportElementId="rent-trend-chart" filename="tendencia-margen"
          excelData={{ Tendencia: dailyProfit }} csvData={dailyProfit}>
          <Card>
            <CardContent className="pt-6">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyProfit}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 11 }} stroke="rgba(128,128,128,0.5)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="rgba(128,128,128,0.5)" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" name="Ventas" stroke="#00BCD4" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="profit" name="Ganancia" stroke="#FFC107" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </ReportSection>
      </div>

      {/* Product Ranking Table */}
      <ReportSection id="rent-table" title="Ranking de Rentabilidad" exportElementId="rent-rank-table" filename="ranking-rentabilidad"
        excelData={excelData} csvData={rankedProducts}>
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Ventas</TableHead>
                    <TableHead>Costo</TableHead>
                    <TableHead>Ganancia</TableHead>
                    <TableHead>Margen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankedProducts.map((p, i) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm font-medium">{i + 1}</TableCell>
                      <TableCell className="text-sm font-medium">{p.nombre}</TableCell>
                      <TableCell className="text-sm">{p.categoria}</TableCell>
                      <TableCell className="font-[JetBrains_Mono,monospace] text-sm">{fmtMoney(p.revenue)}</TableCell>
                      <TableCell className="font-[JetBrains_Mono,monospace] text-sm">{fmtMoney(p.cost)}</TableCell>
                      <TableCell className="font-[JetBrains_Mono,monospace] text-sm text-green-600">{fmtMoney(p.profit)}</TableCell>
                      <TableCell>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          p.margin >= 40 ? 'bg-green-100 text-green-700' :
                            p.margin >= 20 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        )}>
                          {p.margin.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rankedProducts.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No hay datos de rentabilidad</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </ReportSection>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   CLIENTES REPORT
   ═══════════════════════════════════════════ */
function ClientesReport({ sales: _sales, clients, debts }: {
  sales: Venta[]; clients: Cliente[]; debts: Deuda[];
}) {
  const totalClients = clients.length;
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  const newThisMonth = clients.filter(c => c.ultimaCompra?.startsWith(currentMonth)).length;
  const topSpender = [...clients].sort((a, b) => b.totalGastado - a.totalGastado)[0];
  const avgSpend = totalClients > 0 ? clients.reduce((s, c) => s + c.totalGastado, 0) / totalClients : 0;

  const clientsWithDebt = debts.filter(d => d.saldo > 0);

  const clientRankings = useMemo(() =>
    [...clients].sort((a, b) => b.totalGastado - a.totalGastado),
    [clients]
  );

  const monthlyAcquisition = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      map[key] = 0;
    }
    clients.forEach(c => {
      const month = c.ultimaCompra?.slice(0, 7);
      if (month && map[month] !== undefined) map[month]++;
    });
    return Object.entries(map).map(([mes, count]) => {
      const [y, m] = mes.split('-');
      return { mes: `${m}/${y}`, count };
    });
  }, [clients]);

  const excelData = useMemo(() => ({
    Clientes: clientRankings.map(c => ({
      Nombre: c.nombre, Telefono: c.telefono ?? '', Compras: c.totalCompras,
      'Total Gastado': c.totalGastado, Visitas: c.visitas, 'Ultima Compra': fmtDate(c.ultimaCompra),
    })),
  }), [clientRankings]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Clientes" value={totalClients.toString()} icon={Users} color="#00BCD4" />
        <KpiCard title="Nuevos este mes" value={newThisMonth.toString()} icon={CheckCircle} color="#4CAF50" />
        <KpiCard title="Gasto Promedio" value={fmtMoney(avgSpend)} icon={DollarSign} color="#9C27B0" />
        <KpiCard title="Cliente Top" value={topSpender?.nombre ?? 'N/A'} icon={Users} color="#FFC107" subtitle={topSpender ? fmtMoney(topSpender.totalGastado) : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportSection id="cli-acq" title="Adquisicion Mensual" exportElementId="cli-acq-chart" filename="adquisicion-clientes"
          excelData={{ Adquisicion: monthlyAcquisition }} csvData={monthlyAcquisition}>
          <Card>
            <CardContent className="pt-6">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyAcquisition}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="rgba(128,128,128,0.5)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="rgba(128,128,128,0.5)" />
                    <Tooltip content={<CustomTooltip money={false} />} />
                    <Bar dataKey="count" name="Clientes" fill="#00BCD4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </ReportSection>

        {clientsWithDebt.length > 0 && (
          <ReportSection id="cli-debt" title="Clientes con Deuda" exportElementId="cli-debt-chart" filename="clientes-deuda"
            excelData={{ Deudas: clientsWithDebt.map(d => ({ Cliente: d.cliente, Saldo: d.saldo })) }}
            csvData={clientsWithDebt}>
            <Card>
              <CardContent className="pt-6">
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={clientsWithDebt} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="rgba(128,128,128,0.5)" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="cliente" tick={{ fontSize: 10 }} width={120} stroke="rgba(128,128,128,0.5)" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="saldo" name="Saldo" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </ReportSection>
        )}
      </div>

      {/* Client Ranking Table */}
      <ReportSection id="cli-table" title="Ranking de Clientes" exportElementId="cli-rank-table" filename="ranking-clientes"
        excelData={excelData} csvData={clientRankings}>
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Telefono</TableHead>
                    <TableHead>Compras</TableHead>
                    <TableHead>Total Gastado</TableHead>
                    <TableHead>Visitas</TableHead>
                    <TableHead>Ultima Compra</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientRankings.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm font-medium">{c.nombre}</TableCell>
                      <TableCell className="text-sm font-[JetBrains_Mono,monospace]">{c.telefono ?? '-'}</TableCell>
                      <TableCell className="text-sm">{c.totalCompras}</TableCell>
                      <TableCell className="text-sm font-[JetBrains_Mono,monospace]">{fmtMoney(c.totalGastado)}</TableCell>
                      <TableCell className="text-sm">{c.visitas}</TableCell>
                      <TableCell className="text-sm">{fmtDate(c.ultimaCompra)}</TableCell>
                    </TableRow>
                  ))}
                  {clientRankings.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No hay clientes registrados</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </ReportSection>
    </motion.div>
  );
}


/* ═══════════════════════════════════════════
   CUSTOM REPORT BUILDER
   ═══════════════════════════════════════════ */
function CustomReport({ sales, products: _products, clients: _clients }: {
  sales: Venta[]; products: Producto[]; clients: Cliente[];
}) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['totalVentas', 'topProducts']);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'table'>('bar');
  const [datePreset, setDatePreset] = useState<DateRangePreset>('mes');
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split('T')[0]);

  const { start, end } = useMemo(() => getDateRange(datePreset, customStart, customEnd), [datePreset, customStart, customEnd]);
  const filteredSales = useMemo(() => sales.filter(s => isInRange(s.fecha, start, end)), [sales, start, end]);

  const toggleMetric = (m: string) => setSelectedMetrics(prev =>
    prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
  );

  const metrics = [
    { id: 'totalVentas', label: 'Total de Ventas' },
    { id: 'transacciones', label: 'Numero de Transacciones' },
    { id: 'ticketPromedio', label: 'Ticket Promedio' },
    { id: 'topProducts', label: 'Productos mas Vendidos' },
    { id: 'paymentMethods', label: 'Metodos de Pago' },
    { id: 'ventasPorDia', label: 'Ventas por Dia' },
    { id: 'rentabilidad', label: 'Rentabilidad' },
  ];

  const customData = useMemo(() => {
    const data: Record<string, unknown[]> = {};

    if (selectedMetrics.includes('ventasPorDia') || selectedMetrics.includes('totalVentas')) {
      const daily: Record<string, number> = {};
      const d = new Date(start);
      while (d <= end) {
        daily[d.toISOString().split('T')[0]] = 0;
        d.setDate(d.getDate() + 1);
      }
      filteredSales.forEach(s => { if (daily[s.fecha] !== undefined) daily[s.fecha] += s.total; });
      data['Ventas por Dia'] = Object.entries(daily).map(([fecha, total]) => ({ fecha: fmtDate(fecha), total }));
    }

    if (selectedMetrics.includes('topProducts')) {
      const counts: Record<string, { nombre: string; cantidad: number; revenue: number }> = {};
      filteredSales.forEach(s => s.items.forEach(it => {
        if (!counts[it.productoId]) counts[it.productoId] = { nombre: it.nombre, cantidad: 0, revenue: 0 };
        counts[it.productoId].cantidad += it.cantidad;
        counts[it.productoId].revenue += it.subtotal;
      }));
      data['Top Productos'] = Object.entries(counts).map(([id, v]) => ({ id, ...v })).sort((a, b) => (b as { cantidad: number }).cantidad - (a as { cantidad: number }).cantidad).slice(0, 10);
    }

    if (selectedMetrics.includes('paymentMethods')) {
      const pm: Record<string, number> = {};
      filteredSales.forEach(s => { pm[s.metodoPago] = (pm[s.metodoPago] || 0) + s.total; });
      data['Metodos de Pago'] = Object.entries(pm).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
    }

    return data;
  }, [selectedMetrics, filteredSales, start, end]);

  const mainChartData = useMemo(() => {
    const firstKey = Object.keys(customData)[0];
    return customData[firstKey] ?? [];
  }, [customData]);

  const totalVentas = filteredSales.reduce((s, v) => s + v.total, 0);
  const totalTrans = filteredSales.length;
  const ticketProm = totalTrans > 0 ? totalVentas / totalTrans : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Builder Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Constructor de Reportes</CardTitle>
            <CardDescription>Selecciona las metricas y el tipo de grafico</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Rango de Fechas</Label>
              <div className="flex gap-2">
                <Button variant={datePreset === 'hoy' ? 'default' : 'outline'} size="sm" onClick={() => setDatePreset('hoy')} className="text-xs flex-1">Hoy</Button>
                <Button variant={datePreset === 'semana' ? 'default' : 'outline'} size="sm" onClick={() => setDatePreset('semana')} className="text-xs flex-1">Semana</Button>
                <Button variant={datePreset === 'mes' ? 'default' : 'outline'} size="sm" onClick={() => setDatePreset('mes')} className="text-xs flex-1">Mes</Button>
              </div>
              {datePreset === 'personalizado' && (
                <div className="flex gap-2 mt-2">
                  <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="flex-1 px-2 py-1.5 rounded border bg-background text-xs" />
                  <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="flex-1 px-2 py-1.5 rounded border bg-background text-xs" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Metricas</Label>
              <div className="space-y-2">
                {metrics.map(m => (
                  <div key={m.id} className="flex items-center space-x-2">
                    <input type="checkbox" id={m.id} checked={selectedMetrics.includes(m.id)}
                      onChange={() => toggleMetric(m.id)}
                      className="rounded border-gray-300 text-[#00BCD4] focus:ring-[#00BCD4]" />
                    <Label htmlFor={m.id} className="text-sm cursor-pointer">{m.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo de Grafico</Label>
              <div className="flex gap-2">
                {(['bar', 'line', 'pie', 'table'] as const).map(t => (
                  <Button key={t} variant={chartType === t ? 'default' : 'outline'} size="sm"
                    onClick={() => setChartType(t)} className="text-xs flex-1 capitalize">
                    {t === 'bar' ? 'Barras' : t === 'line' ? 'Linea' : t === 'pie' ? 'Torta' : 'Tabla'}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Mini KPIs */}
          {(selectedMetrics.includes('totalVentas') || selectedMetrics.includes('transacciones') || selectedMetrics.includes('ticketPromedio')) && (
            <div className="grid grid-cols-3 gap-3">
              {selectedMetrics.includes('totalVentas') && (
                <KpiCard title="Total Ventas" value={fmtMoney(totalVentas)} icon={DollarSign} color="#00BCD4" />
              )}
              {selectedMetrics.includes('transacciones') && (
                <KpiCard title="Transacciones" value={totalTrans.toString()} icon={ShoppingBag} color="#4CAF50" />
              )}
              {selectedMetrics.includes('ticketPromedio') && (
                <KpiCard title="Ticket Promedio" value={fmtMoney(ticketProm)} icon={CreditCard} color="#9C27B0" />
              )}
            </div>
          )}

          {/* Chart Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vista Previa</CardTitle>
            </CardHeader>
            <CardContent>
              {mainChartData.length > 0 ? (
                <div className="h-[350px]">
                  {chartType === 'bar' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mainChartData as Array<Record<string, unknown>>}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                        <XAxis dataKey={Object.keys(mainChartData[0] as Record<string, unknown>).find(k => k !== 'total' && k !== 'value' && k !== 'cantidad' && k !== 'revenue') ?? 'name'} tick={{ fontSize: 11 }} stroke="rgba(128,128,128,0.5)" />
                        <YAxis tick={{ fontSize: 11 }} stroke="rgba(128,128,128,0.5)" tickFormatter={v => `$${(Number(v) / 1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey={Object.keys(mainChartData[0] as Record<string, unknown>).find(k => k === 'total' || k === 'value' || k === 'cantidad' || k === 'revenue') ?? 'value'} fill="#00BCD4" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {chartType === 'line' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mainChartData as Array<Record<string, unknown>>}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                        <XAxis dataKey={Object.keys(mainChartData[0] as Record<string, unknown>).find(k => k !== 'total' && k !== 'value' && k !== 'cantidad' && k !== 'revenue') ?? 'name'} tick={{ fontSize: 11 }} stroke="rgba(128,128,128,0.5)" />
                        <YAxis tick={{ fontSize: 11 }} stroke="rgba(128,128,128,0.5)" tickFormatter={v => `$${(Number(v) / 1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey={Object.keys(mainChartData[0] as Record<string, unknown>).find(k => k === 'total' || k === 'value' || k === 'cantidad' || k === 'revenue') ?? 'value'} stroke="#00BCD4" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                  {chartType === 'pie' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={mainChartData as Array<Record<string, unknown>>} cx="50%" cy="50%" outerRadius={120}
                          dataKey={Object.keys(mainChartData[0] as Record<string, unknown>).find(k => k === 'total' || k === 'value' || k === 'cantidad' || k === 'revenue') ?? 'value'}
                          nameKey={Object.keys(mainChartData[0] as Record<string, unknown>).find(k => k !== 'total' && k !== 'value' && k !== 'cantidad' && k !== 'revenue') ?? 'name'}
                          label>
                          {(mainChartData as Array<Record<string, unknown>>).map((_e, i) => (
                            <Cell key={i} fill={Object.values(CATEGORY_COLORS)[i % Object.values(CATEGORY_COLORS).length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  {chartType === 'table' && (
                    <div className="overflow-auto max-h-[350px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(mainChartData[0] as Record<string, unknown>).map(k => (
                              <TableHead key={k} className="capitalize">{k}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(mainChartData as Array<Record<string, unknown>>).map((row, i) => (
                            <TableRow key={i}>
                              {Object.values(row).map((v, j) => (
                                <TableCell key={j} className="text-sm">
                                  {typeof v === 'number' && v > 100 ? fmtMoney(v) : String(v)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  Selecciona al menos una metrica para generar el reporte
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export */}
          {Object.keys(customData).length > 0 && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => exportToExcel(customData, 'reporte-personalizado')} className="gap-1.5">
                <FileSpreadsheet size={14} /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const firstKey = Object.keys(customData)[0];
                if (firstKey) exportToCSV(customData[firstKey], 'reporte-personalizado');
              }} className="gap-1.5">
                <FileText size={14} /> CSV
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
