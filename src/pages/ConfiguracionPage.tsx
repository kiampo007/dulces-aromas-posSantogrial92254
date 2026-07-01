import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette, Moon, Shield, Lock, Timer, Database,
  FileSpreadsheet, HardDrive, UploadCloud, Trash2,
  Receipt, Target, BookOpen, Smartphone, ChevronRight,
  Check, AlertTriangle, Search, Printer, Download,
  Sun, Type, Globe, Award, Info, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useDarkMode } from '@/hooks/useDarkMode';
import * as XLSX from 'xlsx';

/* â”€â”€â”€ Types â”€â”€â”€ */
interface Producto { id: string; nombre: string; categoria: string; precio: number; costo: number; stock: number; stockMinimo: number; }
interface Venta { id: string; fecha: string; items: Array<{ productoId: string; nombre: string; cantidad: number; precioUnitario: number; subtotal: number }>; total: number; metodoPago: string; cliente?: string; }
interface Cliente { id: string; nombre: string; telefono?: string; totalCompras: number; totalGastado: number; ultimaCompra: string; visitas: number; }
interface Deuda { id: string; cliente: string; monto: number; pagado: number; saldo: number; fecha: string; }

/* â”€â”€â”€ Formatters â”€â”€â”€ */
function fmtMoney(value: number): string {
  return `$ ${value.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/* â”€â”€â”€ PIN Hash Function â”€â”€â”€ */
function hashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(16);
}

/* â”€â”€â”€ Generic Load Functions â”€â”€â”€ */
function loadProducts(): Producto[] { try { return JSON.parse(localStorage.getItem('dulces_aromas_products') || '[]'); } catch { return []; } }
function loadSales(): Venta[] { try { return JSON.parse(localStorage.getItem('dulces_aromas_sales') || '[]'); } catch { return []; } }
function loadClients(): Cliente[] { try { return JSON.parse(localStorage.getItem('dulces_aromas_clients') || '[]'); } catch { return []; } }
function loadDebts(): Deuda[] { try { return JSON.parse(localStorage.getItem('dulces_aromas_debts') || '[]'); } catch { return []; } }

/* â”€â”€â”€ Settings Key Helpers â”€â”€â”€ */
const S = (k: string) => `dulces-aromas-${k}`;
function getSetting<T>(key: string, defaultVal: T): T {
  try { const v = localStorage.getItem(S(key)); return v !== null ? JSON.parse(v) : defaultVal; } catch { return defaultVal; }
}
function setSetting<T>(key: string, val: T) { localStorage.setItem(S(key), JSON.stringify(val)); }

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN PAGE COMPONENT
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function ConfiguracionPage() {
  const { isDark, toggle } = useDarkMode();
  const [accentColor, setAccentColor] = useState(() => getSetting('accent-color', 'gold'));
  const [compactMode, setCompactMode] = useState(() => getSetting('compact-mode', false));

  const handleAccentChange = (color: string) => { setAccentColor(color); setSetting('accent-color', color); };
  const handleCompactChange = (v: boolean) => { setCompactMode(v); setSetting('compact-mode', v); };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-[720px] mx-auto"
    >
      <div>
        <h1 className="text-2xl font-bold font-[Playfair_Display,Georgia,serif] text-foreground">Configuracion</h1>
        <p className="text-sm text-muted-foreground mt-1">Personaliza y administra tu sistema</p>
      </div>

      <div className="space-y-4">
        <AparienciaSection isDark={isDark} toggleDark={toggle} accentColor={accentColor} onAccentChange={handleAccentChange}
          compactMode={compactMode} onCompactChange={handleCompactChange} />
        <SeguridadSection />
        <DatosSection />
        <ImpresionSection />
        <MetasSection />
        <ManualUsuarioSection />
        <InformacionSection />
      </div>
    </motion.div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   1. APARIENCIA
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function AparienciaSection({
  isDark, toggleDark, accentColor, onAccentChange, compactMode, onCompactChange
}: {
  isDark: boolean; toggleDark: () => void; accentColor: string; onAccentChange: (c: string) => void;
  compactMode: boolean; onCompactChange: (v: boolean) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette size={16} className="text-[#00BCD4]" />
            Apariencia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? <Moon size={20} className="text-[#9C27B0]" /> : <Sun size={20} className="text-[#F59E0B]" />}
              <div>
                <p className="text-sm font-medium">Modo Oscuro</p>
                <p className="text-xs text-muted-foreground">Reduce la fatiga visual</p>
              </div>
            </div>
            <Switch checked={isDark} onCheckedChange={toggleDark} />
          </div>

          <Separator />

          {/* Accent Color */}
          <div>
            <p className="text-sm font-medium mb-3">Color de Acento</p>
            <div className="flex gap-3">
              {[
                { id: 'gold', label: 'Dorado', color: '#FFC107' },
                { id: 'teal', label: 'Teal', color: '#00BCD4' },
                { id: 'rose', label: 'Rosado', color: '#E11D48' },
              ].map(c => (
                <button key={c.id} onClick={() => onAccentChange(c.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm',
                    accentColor === c.id ? 'border-current' : 'border-transparent hover:border-gray-200'
                  )}
                  style={{ color: c.color }}
                >
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Compact Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Type size={20} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Modo Compacto</p>
                <p className="text-xs text-muted-foreground">Reduce el espaciado entre elementos</p>
              </div>
            </div>
            <Switch checked={compactMode} onCheckedChange={onCompactChange} />
          </div>

          <Separator />

          {/* Language */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe size={20} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Idioma</p>
                <p className="text-xs text-muted-foreground">Idioma de la interfaz</p>
              </div>
            </div>
            <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-md">Espanol</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   2. SEGURIDAD
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function SeguridadSection() {
  const [showPinModal, setShowPinModal] = useState(false);
  const [autoLock, setAutoLock] = useState(() => getSetting('auto-lock', true));
  const [autoLockMinutes, setAutoLockMinutes] = useState(() => getSetting('auto-lock-minutes', 5));

  const handleAutoLockChange = (v: boolean) => { setAutoLock(v); setSetting('auto-lock', v); };
  const handleMinutesChange = (mins: number) => { setAutoLockMinutes(mins); setSetting('auto-lock-minutes', mins); };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield size={16} className="text-[#00BCD4]" />
              Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Change PIN */}
            <button onClick={() => setShowPinModal(true)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left">
              <div className="flex items-center gap-3">
                <Lock size={20} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Cambiar PIN</p>
                  <p className="text-xs text-muted-foreground">PIN de acceso al sistema</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>

            <Separator />

            {/* Auto Lock */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Timer size={20} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Bloqueo automatico</p>
                  <p className="text-xs text-muted-foreground">
                    {autoLock ? `Despues de ${autoLockMinutes} minutos de inactividad` : 'Desactivado'}
                  </p>
                </div>
              </div>
              <Switch checked={autoLock} onCheckedChange={handleAutoLockChange} />
            </div>

            {autoLock && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pl-11">
                <div className="flex gap-2">
                  {[1, 5, 15, 30].map(m => (
                    <Button key={m} variant={autoLockMinutes === m ? 'default' : 'outline'} size="sm"
                      onClick={() => handleMinutesChange(m)} className="text-xs flex-1">
                      {m} min
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}

            <Separator />

            {/* Session */}
            <button onClick={() => {
              localStorage.removeItem('dulces_aromas_pin-attempts');
              localStorage.removeItem('dulces_aromas_pin-lockout');
              alert('Sesion actual reiniciada');
            }}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left">
              <div className="flex items-center gap-3">
                <Zap size={20} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Reiniciar sesion</p>
                  <p className="text-xs text-muted-foreground">Limpiar intentos y bloqueos</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          </CardContent>
        </Card>
      </motion.div>

      <PinChangeModal open={showPinModal} onClose={() => setShowPinModal(false)} />
    </>
  );
}

/* â”€â”€â”€ PIN Change Modal â”€â”€â”€ */
function PinChangeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = () => {
    setError('');
    const storedHash = localStorage.getItem('dulces_aromas_pin-hash') ?? '';
    const defaultHash = hashPin('2525');

    if (hashPin(currentPin) !== storedHash && hashPin(currentPin) !== defaultHash) {
      setError('PIN actual incorrecto');
      return;
    }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setError('El nuevo PIN debe tener 4 digitos');
      return;
    }
    if (newPin !== confirmPin) {
      setError('Los PINs no coinciden');
      return;
    }

    localStorage.setItem('dulces_aromas_pin-hash', hashPin(newPin));
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      onClose();
    }, 1500);
  };

  const renderDots = (pin: string) => (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className={cn('w-3 h-3 rounded-full border-2 transition-all',
          i < pin.length ? 'bg-[#00BCD4] border-[#00BCD4]' : 'border-muted-foreground bg-transparent'
        )} />
      ))}
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }
            } transition={{ type: 'spring', damping: 25 }}
            className="relative w-full max-w-[400px] bg-card border rounded-2xl p-6 shadow-xl"
          >
            <h2 className="text-xl font-semibold font-[Playfair_Display,Georgia,serif] mb-4">Cambiar PIN</h2>

            {success ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Check size={24} className="text-green-600" />
                </div>
                <p className="text-sm font-medium text-green-600">PIN actualizado correctamente</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 block">PIN Actual</Label>
                  <Input type="password" inputMode="numeric" maxLength={4}
                    value={currentPin} onChange={e => { setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
                    placeholder="****" className="text-center text-lg tracking-[0.5em] font-[JetBrains_Mono,monospace]" />
                  {currentPin.length === 4 && renderDots(currentPin)}
                </div>

                <div>
                  <Label className="text-sm mb-2 block">Nuevo PIN (4 digitos)</Label>
                  <Input type="password" inputMode="numeric" maxLength={4}
                    value={newPin} onChange={e => { setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
                    placeholder="****" className="text-center text-lg tracking-[0.5em] font-[JetBrains_Mono,monospace]" />
                </div>

                <div>
                  <Label className="text-sm mb-2 block">Confirmar Nuevo PIN</Label>
                  <Input type="password" inputMode="numeric" maxLength={4}
                    value={confirmPin} onChange={e => { setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
                    placeholder="****" className="text-center text-lg tracking-[0.5em] font-[JetBrains_Mono,monospace]" />
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-sm text-[#EF4444] flex items-center gap-1.5">
                    <AlertTriangle size={14} /> {error}
                  </motion.p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
                  <Button className="flex-1" onClick={handleSave}>Guardar PIN</Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   3. DATOS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function DatosSection() {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetInput, setResetInput] = useState('');
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restorePreview, setRestorePreview] = useState<Record<string, number> | null>(null);
  const [restoreFile, setRestoreFile] = useState<Record<string, unknown[]> | null>(null);

  const exportAllData = () => {
    const data = {
      products: loadProducts(),
      sales: loadSales(),
      clients: loadClients(),
      debts: loadDebts(),
      settings: Object.fromEntries(
        Object.entries(localStorage).filter(([k]) => k.startsWith('dulces_aromas_'))
      ),
      exportDate: new Date().toISOString(),
      version: '2.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dulces-aromas-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const products = loadProducts();
    const sales = loadSales();
    const debts = loadDebts();

    if (products.length) {
      const ws1 = XLSX.utils.json_to_sheet(products.map(p => ({
        ID: p.id, Nombre: p.nombre, Categoria: p.categoria, Precio: p.precio,
        Costo: p.costo, Stock: p.stock, 'Stock Minimo': p.stockMinimo,
      })));
      XLSX.utils.book_append_sheet(wb, ws1, 'Productos');
    }
    if (sales.length) {
      const ws2 = XLSX.utils.json_to_sheet(sales.map(s => ({
        ID: s.id, Fecha: s.fecha, Total: s.total, 'Metodo Pago': s.metodoPago, Cliente: s.cliente ?? 'N/A',
        Productos: s.items.map(i => `${i.nombre} x${i.cantidad}`).join(', '),
      })));
      XLSX.utils.book_append_sheet(wb, ws2, 'Ventas');
    }
    if (debts.length) {
      const ws3 = XLSX.utils.json_to_sheet(debts.map(d => ({
        ID: d.id, Cliente: d.cliente, Monto: d.monto, Pagado: d.pagado, Saldo: d.saldo, Fecha: d.fecha,
      })));
      XLSX.utils.book_append_sheet(wb, ws3, 'Deudas');
    }
    const ws4 = XLSX.utils.json_to_sheet([{
      'Total Productos': products.length,
      'Total Ventas': sales.length,
      'Ventas Acumuladas': sales.reduce((s, v) => s + v.total, 0),
      'Total Deudas': debts.length,
      'Saldo Deudas': debts.reduce((s, d) => s + d.saldo, 0),
    }]);
    XLSX.utils.book_append_sheet(wb, ws4, 'Resumen');
    XLSX.writeFile(wb, 'dulces_aromas_export.xlsx');
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const preview: Record<string, number> = {};
        if (Array.isArray(data.products)) preview['Productos'] = data.products.length;
        if (Array.isArray(data.sales)) preview['Ventas'] = data.sales.length;
        if (Array.isArray(data.clients)) preview['Clientes'] = data.clients.length;
        if (Array.isArray(data.debts)) preview['Deudas'] = data.debts.length;
        setRestorePreview(preview);
        setRestoreFile(data);
        setShowRestoreConfirm(true);
      } catch {
        alert('Archivo invalido');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmRestore = () => {
    if (!restoreFile) return;
    if (Array.isArray(restoreFile.products)) localStorage.setItem('dulces_aromas_products', JSON.stringify(restoreFile.products));
    if (Array.isArray(restoreFile.sales)) localStorage.setItem('dulces_aromas_sales', JSON.stringify(restoreFile.sales));
    if (Array.isArray(restoreFile.clients)) localStorage.setItem('dulces_aromas_clients', JSON.stringify(restoreFile.clients));
    if (Array.isArray(restoreFile.debts)) localStorage.setItem('dulces_aromas_debts', JSON.stringify(restoreFile.debts));
    setShowRestoreConfirm(false);
    setRestorePreview(null);
    setRestoreFile(null);
    alert('Datos restaurados. Recarga la pagina para ver los cambios.');
  };

  const resetAllData = () => {
    if (resetInput !== 'ELIMINAR') return;
    localStorage.removeItem('dulces_aromas_products');
    localStorage.removeItem('dulces_aromas_sales');
    localStorage.removeItem('dulces_aromas_clients');
    localStorage.removeItem('dulces_aromas_debts');
    setShowResetConfirm(false);
    setResetInput('');
    alert('Todos los datos han sido eliminados. Recarga la pagina.');
  };

  const loadDemoData = () => {
    void 0; /* categories removed */
    const paymentMethods: string[] = ['efectivo', 'transferencia', 'tarjeta', 'credito'];
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
      ['CK One', 'Unisex', 95000, 57000],
      ['Phantom', 'Ninos', 85000, 51000],
      ['Fame', 'Dama', 142000, 85200],
    ];

    const demoProducts: Producto[] = productNames.map(([name, cat, price, cost], i) => ({
      id: `prod-${i}`, nombre: name as string, categoria: cat as string,
      precio: price as number, costo: cost as number,
      stock: Math.floor(Math.random() * 40) + 5, stockMinimo: 5,
    }));

    const now = new Date();
    const demoSales: Venta[] = [];
    const clientNames = ['Ana Maria Lopez', 'Carlos Rodriguez', 'Maria Garcia', 'Juan Perez', 'Laura Martinez'];

    for (let d = 29; d >= 0; d--) {
      const date = new Date(now); date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().split('T')[0];
      const daySales = 2 + Math.floor(Math.random() * 5);
      for (let s = 0; s < daySales; s++) {
        const items = []; let total = 0;
        const itemCount = 1 + Math.floor(Math.random() * 3);
        for (let it = 0; it < itemCount; it++) {
          const prod = demoProducts[Math.floor(Math.random() * demoProducts.length)];
          const cantidad = 1 + Math.floor(Math.random() * 2);
          const subtotal = cantidad * prod.precio;
          total += subtotal;
          items.push({ productoId: prod.id, nombre: prod.nombre, cantidad, precioUnitario: prod.precio, subtotal });
        }
        demoSales.push({
          id: `venta-${Date.now()}-${d}-${s}`, fecha: dateStr, items,
          total, metodoPago: paymentMethods[Math.floor(Math.random() * paymentMethods.length)] as Venta['metodoPago'],
          cliente: clientNames[Math.floor(Math.random() * clientNames.length)],
        });
      }
    }

    localStorage.setItem('dulces_aromas_products', JSON.stringify(demoProducts));
    localStorage.setItem('dulces_aromas_sales', JSON.stringify(demoSales));
    alert('Datos de demostracion cargados. Recarga la pagina para ver los cambios.');
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.16 }}>
        <Card className="border-[#00BCD4]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database size={16} className="text-[#00BCD4]" />
              Gestion de Datos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Export Excel */}
            <button onClick={exportToExcel}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left">
              <div className="flex items-center gap-3">
                <FileSpreadsheet size={20} className="text-green-600" />
                <div>
                  <p className="text-sm font-medium">Exportar a Excel</p>
                  <p className="text-xs text-muted-foreground">Productos, ventas, deudas y resumen</p>
                </div>
              </div>
              <Download size={16} className="text-[#00BCD4]" />
            </button>

            <Separator />

            {/* Full Backup */}
            <button onClick={exportAllData}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left">
              <div className="flex items-center gap-3">
                <HardDrive size={20} className="text-[#00BCD4]" />
                <div>
                  <p className="text-sm font-medium">Backup completo</p>
                  <p className="text-xs text-muted-foreground">Exportar todos los datos como JSON</p>
                </div>
              </div>
              <Download size={16} className="text-[#00BCD4]" />
            </button>

            <Separator />

            {/* Restore */}
            <label className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left cursor-pointer">
              <div className="flex items-center gap-3">
                <UploadCloud size={20} className="text-[#F59E0B]" />
                <div>
                  <p className="text-sm font-medium">Restaurar desde backup</p>
                  <p className="text-xs text-muted-foreground">Carga un archivo de backup previo</p>
                </div>
              </div>
              <Download size={16} className="rotate-180 text-[#00BCD4]" />
              <input type="file" accept=".json" className="hidden" onChange={handleRestoreFile} />
            </label>

            <Separator />

            {/* Demo Data */}
            <button onClick={loadDemoData}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left">
              <div className="flex items-center gap-3">
                <Database size={20} className="text-[#9C27B0]" />
                <div>
                  <p className="text-sm font-medium">Cargar datos de demostracion</p>
                  <p className="text-xs text-muted-foreground">Genera datos de ejemplo para probar</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>

            <Separator />

            {/* Reset Data */}
            <button onClick={() => { setShowResetConfirm(true); setResetInput(''); }}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left">
              <div className="flex items-center gap-3">
                <Trash2 size={20} className="text-[#EF4444]" />
                <div>
                  <p className="text-sm font-medium text-[#EF4444]">Borrar todos los datos</p>
                  <p className="text-xs text-[#EF4444]/70">Elimina productos, ventas y deudas</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-[#EF4444]" />
            </button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowResetConfirm(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }
              } transition={{ type: 'spring', damping: 25 }}
              className="relative w-full max-w-[400px] bg-card border rounded-2xl p-6 shadow-xl"
            >
              <div className="flex flex-col items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle size={24} className="text-[#EF4444]" />
                </div>
                <h3 className="text-lg font-semibold">Borrar todos los datos</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Esta accion no se puede deshacer. Escribe <strong>ELIMINAR</strong> para confirmar.
                </p>
              </div>
              <Input value={resetInput} onChange={e => setResetInput(e.target.value)}
                placeholder="Escribe ELIMINAR" className="mb-4 text-center" />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowResetConfirm(false)}>Cancelar</Button>
                <Button variant="destructive" className="flex-1" onClick={resetAllData}
                  disabled={resetInput !== 'ELIMINAR'}>Confirmar</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Restore Preview Modal */}
      <AnimatePresence>
        {showRestoreConfirm && restorePreview && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRestoreConfirm(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }
              } transition={{ type: 'spring', damping: 25 }}
              className="relative w-full max-w-[400px] bg-card border rounded-2xl p-6 shadow-xl"
            >
              <h3 className="text-lg font-semibold mb-3">Confirmar Restauracion</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Esto reemplazara todos los datos actuales. Se encontraron:
              </p>
              <div className="space-y-1.5 mb-5">
                {Object.entries(restorePreview).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span>{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowRestoreConfirm(false)}>Cancelar</Button>
                <Button className="flex-1" onClick={confirmRestore}>Restaurar</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   4. IMPRESION
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function ImpresionSection() {
  const [storeName, setStoreName] = useState(() => getSetting('receipt-store-name', 'Dulces Aromas'));
  const [storeAddress, setStoreAddress] = useState(() => getSetting('receipt-address', ''));
  const [storePhone, setStorePhone] = useState(() => getSetting('receipt-phone', ''));
  const [footerMsg, setFooterMsg] = useState(() => getSetting('receipt-footer', 'Gracias por su compra!'));
  const [showLogo, setShowLogo] = useState(() => getSetting('receipt-show-logo', true));
  const [showQR, setShowQR] = useState(() => getSetting('receipt-show-qr', true));
  const [paperSize, setPaperSize] = useState<'58' | '80'>(() => getSetting('receipt-paper-size', '80'));

  const update = (key: string, val: unknown) => {
    setSetting(`receipt-${key}`, val);
    // Trigger re-render by updating local state
    switch (key) {
      case 'store-name': setStoreName(String(val)); break;
      case 'address': setStoreAddress(String(val)); break;
      case 'phone': setStorePhone(String(val)); break;
      case 'footer': setFooterMsg(String(val)); break;
      case 'show-logo': setShowLogo(Boolean(val)); break;
      case 'show-qr': setShowQR(Boolean(val)); break;
      case 'paper-size': setPaperSize(String(val) as '58' | '80'); break;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.24 }}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt size={16} className="text-[#00BCD4]" />
            Configuracion de Recibos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm mb-1.5 block">Nombre de la tienda</Label>
              <Input value={storeName} onChange={e => update('store-name', e.target.value)} />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Direccion</Label>
              <Input value={storeAddress} onChange={e => update('address', e.target.value)} placeholder="Direccion de la tienda" />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Telefono</Label>
              <Input value={storePhone} onChange={e => update('phone', e.target.value)} placeholder="Telefono" />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Mensaje de pie</Label>
              <Input value={footerMsg} onChange={e => update('footer', e.target.value)} />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm">Opciones de Recibo</Label>
            <div className="flex items-center justify-between">
              <span className="text-sm">Mostrar logo en recibo</span>
              <Switch checked={showLogo} onCheckedChange={v => update('show-logo', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Incluir QR code</span>
              <Switch checked={showQR} onCheckedChange={v => update('show-qr', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">TamaÃ±o de papel</span>
              <div className="flex gap-2">
                <Button variant={paperSize === '58' ? 'default' : 'outline'} size="sm" className="text-xs"
                  onClick={() => update('paper-size', '58')}>58mm</Button>
                <Button variant={paperSize === '80' ? 'default' : 'outline'} size="sm" className="text-xs"
                  onClick={() => update('paper-size', '80')}>80mm</Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Mini Receipt Preview */}
          <div>
            <Label className="text-sm mb-2 block">Vista Previa</Label>
            <motion.div
              key={`${storeName}-${footerMsg}-${showLogo}-${showQR}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
              className="mx-auto border-2 border-dashed border-muted rounded-lg p-4 text-center"
              style={{ maxWidth: paperSize === '58' ? '200px' : '260px', fontSize: '11px', fontFamily: 'monospace' }}
            >
              {showLogo && (
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-[#00BCD4] to-[#FFC107] flex items-center justify-center">
                  <span className="text-white text-[8px] font-bold">DA</span>
                </div>
              )}
              <p className="font-bold text-xs">{storeName || 'Dulces Aromas'}</p>
              {storeAddress && <p className="text-[9px] text-muted-foreground">{storeAddress}</p>}
              {storePhone && <p className="text-[9px] text-muted-foreground">Tel: {storePhone}</p>}
              <Separator className="my-2" />
              <div className="text-left space-y-1">
                <div className="flex justify-between"><span>Producto x1</span><span>$ 120.000</span></div>
                <div className="flex justify-between"><span>Producto x2</span><span>$ 300.000</span></div>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>TOTAL</span><span>$ 420.000</span>
              </div>
              {showQR && (
                <div className="mt-2 mx-auto w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-0.5">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className={`w-2.5 h-2.5 rounded-sm ${i % 2 === 0 ? 'bg-gray-800 dark:bg-gray-300' : 'bg-transparent'}`} />
                    ))}
                  </div>
                </div>
              )}
              <p className="mt-2 text-[9px] text-muted-foreground">{footerMsg}</p>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   5. METAS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function MetasSection() {
  const [monthlyGoal, setMonthlyGoal] = useState(() => getSetting('dulces_aromas_meta_mes', 1000000));
  const [lowStockAlert, setLowStockAlert] = useState(() => getSetting('low-stock-threshold', 5));
  const [notifyGoal, setNotifyGoal] = useState(() => getSetting('notify-goal', true));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.32 }}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target size={16} className="text-[#00BCD4]" />
            Metas de Ventas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label className="text-sm mb-1.5 block">Meta mensual de ventas</Label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium">$</span>
              <Input type="number" value={monthlyGoal}
                onChange={e => { const v = parseInt(e.target.value) || 0; setMonthlyGoal(v); setSetting('dulces_aromas_meta_mes', v); }}
                className="font-[JetBrains_Mono,monospace]" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Se reinicia cada mes automaticamente</p>
          </div>

          <Separator />

          <div>
            <Label className="text-sm mb-1.5 block">Umbral de alerta para stock bajo</Label>
            <Input type="number" value={lowStockAlert}
              onChange={e => { const v = parseInt(e.target.value) || 0; setLowStockAlert(v); setSetting('low-stock-threshold', v); }}
              className="font-[JetBrains_Mono,monospace]" />
            <p className="text-xs text-muted-foreground mt-1">Cantidad minima antes de alertar</p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Notificar al acercarse a la meta</p>
              <p className="text-xs text-muted-foreground">Alerta cuando se alcance el 80% de la meta</p>
            </div>
            <Switch checked={notifyGoal} onCheckedChange={v => { setNotifyGoal(v); setSetting('notify-goal', v); }} />
          </div>

          {/* Goal Progress */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Progreso del mes actual</span>
              <span className="font-medium">{fmtMoney(monthlyGoal)}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #00BCD4, #FFC107)' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, ((loadSales().filter(s => s.fecha.startsWith(new Date().toISOString().slice(0, 7))).reduce((sum, v) => sum + v.total, 0) / monthlyGoal) * 100))}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}


/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   6. MANUAL DE USUARIO (EMBEDDED)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

interface ManualChapter {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  sections: { heading: string; content: string }[];
}

const manualChapters: ManualChapter[] = [
  {
    id: 'intro',
    title: '1. Introduccion',
    icon: Info,
    sections: [
      {
        heading: 'Overview del Sistema',
        content: `Dulces Aromas POS es un sistema completo de punto de venta disenado especificamente para perfumerias y boutiques de fragancias. El sistema permite gestionar ventas, catalogo de productos, cuentas por cobrar, reportes analiticos y configuraciones personalizadas.\n\nFunciona completamente offline despues de cargado, almacenando todos los datos localmente en tu navegador mediante localStorage. Esto garantiza que tu informacion este siempre disponible, incluso sin conexion a internet.\n\nEl sistema esta optimizado para funcionar tanto en computadores de escritorio como en tablets, con una interfaz adaptativa que se ajusta al tamano de pantalla.`
      },
      {
        heading: 'Caracteristicas Principales',
        content: `- Ventas rapidas con busqueda de productos\n- Catalogo completo con gestion de stock\n- Sistema de deudas y cuentas por cobrar\n- Reportes detallados con exportacion a Excel, CSV y PDF\n- Modo oscuro para reducir la fatiga visual\n- Impresion de recibos personalizados\n- Backup y restauracion de datos\n- Constructor de reportes personalizados`
      },
    ],
  },
  {
    id: 'primeros-pasos',
    title: '2. Primeros Pasos',
    icon: Smartphone,
    sections: [
      {
        heading: 'Como Acceder al Sistema',
        content: `Al abrir la aplicacion veras una pantalla de bienvenida con el logo de Dulces Aromas. Despues de la animacion de carga, aparecera la pantalla de acceso protegido.\n\nEl PIN por defecto es 2525. Ingresa estos 4 digitos usando el teclado numerico en pantalla o el teclado fisico. Si el PIN es correcto, seras redirigido automaticamente al dashboard principal.\n\nSi olvidas tu PIN, puedes recuperarlo usando la opcion "Olvide mi PIN" en la pantalla de login.`
      },
      {
        heading: 'Navegacion Principal',
        content: `La interfaz cuenta con una barra de navegacion lateral en escritorio (izquierda) y una barra inferior en dispositivos moviles.\n\nLas secciones principales son:\n- Dashboard: Resumen con KPIs y alertas\n- Nueva Venta: Proceso de venta paso a paso\n- Catalogo: Gestion de productos\n- Deudas: Cuentas por cobrar\n- Reportes: Analisis y estadisticas\n- Configuracion: Ajustes del sistema\n\nEn la parte superior encontraras la barra de estado con el indicador de conexion, reloj y fecha actual.`
      },
      {
        heading: 'Modo Oscuro',
        content: `Puedes activar el modo oscuro desde la seccion Configuracion > Apariencia > Modo Oscuro. Este cambio se aplica inmediatamente a toda la interfaz y se guarda automaticamente para futuras sesiones.\n\nEl modo oscuro es especialmente util para trabajar en ambientes con poca luz, reduciendo la fatiga visual y el consumo de bateria en dispositivos moviles con pantallas OLED.`
      },
    ],
  },
  {
    id: 'ventas',
    title: '3. Ventas',
    icon: Target,
    sections: [
      {
        heading: 'Como Hacer una Venta Paso a Paso',
        content: `1. Ve a la seccion "Nueva Venta" desde el menu principal\n2. Busca el producto usando la barra de busqueda o navega por categorias\n3. Haz clic en el producto para agregarlo al carrito\n4. Ajusta las cantidades si es necesario\n5. Selecciona el metodo de pago (efectivo, transferencia, tarjeta o credito)\n6. Si es venta a credito, selecciona o registra el cliente\n7. Revisa el resumen de la venta\n8. Haz clic en "Finalizar Venta"\n9. Se generara el recibo que puedes imprimir o compartir`
      },
      {
        heading: 'Metodos de Pago',
        content: `El sistema acepta cuatro metodos de pago:\n\n- Efectivo: Pago en efectivo. El sistema calcula automaticamente el cambio si ingresas el monto recibido.\n- Transferencia: Registra pagos por transferencia bancaria o nequi/daviplata.\n- Tarjeta: Registra pagos con tarjeta de credito o debito.\n- Credito: Venta a credito que genera una deuda asociada al cliente. El cliente queda registrado automaticamente si es nuevo.`
      },
      {
        heading: 'Imprimir Recibos',
        content: `Despues de finalizar una venta, se muestra automaticamente el recibo. Puedes:\n\n- Imprimir: Conecta tu impresora termica y haz clic en el boton de imprimir\n- Compartir: En dispositivos moviles, usa la funcion compartir para enviar el recibo por WhatsApp, email, etc.\n- Guardar como PDF: Descarga el recibo como archivo PDF\n\nLos recibos incluyen el logo de la tienda, informacion de contacto, detalle de productos, totales y un codigo QR opcional.`
      },
    ],
  },
  {
    id: 'catalogo',
    title: '4. Catalogo',
    icon: Database,
    sections: [
      {
        heading: 'Agregar un Producto',
        content: `Para agregar un nuevo producto al catalogo:\n\n1. Ve a la seccion "Catalogo"\n2. Haz clic en el boton "+ Nuevo Producto"\n3. Completa los campos obligatorios:\n   - Nombre del producto\n   - Categoria (Caballero, Dama, Ninos, Unisex)\n   - Precio de venta\n   - Costo (para calculos de rentabilidad)\n   - Stock inicial\n   - Stock minimo (para alertas)\n4. Opcionalmente agrega una imagen del producto\n5. Haz clic en "Guardar"`
      },
      {
        heading: 'Editar y Eliminar Productos',
        content: `En la vista de catalogo, cada producto tiene un menu de acciones (tres puntos):\n\n- Editar: Modifica cualquier campo del producto\n- Eliminar: Elimina el producto permanentemente (solo si no tiene ventas asociadas)\n- Ver detalle: Muestra informacion completa incluyendo historial de ventas\n\nTambien puedes usar los botones +/- en la tarjeta del producto para ajustar el stock rapidamente.`
      },
      {
        heading: 'Ajuste Rapido de Stock',
        content: `Los botones + y - en las tarjetas de producto permiten ajustar el stock sin entrar al formulario de edicion. Cada clic aumenta o disminuye la cantidad en 1 unidad.\n\nCuando un producto alcanza el stock minimo configurado, aparece una alerta visual en color ambar. Si el stock llega a cero, la alerta cambia a rojo indicando que el producto esta agotado.\n\nEstas alertas tambien aparecen en el dashboard principal para que siempre tengas visibilidad del estado del inventario.`
      },
    ],
  },
  {
    id: 'deudas',
    title: '5. Deudas',
    icon: Receipt,
    sections: [
      {
        heading: 'Registrar una Deuda',
        content: `Las deudas se registran automaticamente al hacer una venta con metodo de pago "Credito". Sin embargo, tambien puedes registrar deudas manualmente:\n\n1. Ve a la seccion "Deudas"\n2. Haz clic en "+ Nueva Deuda"\n3. Selecciona o registra el cliente\n4. Ingresa el monto y una descripcion\n5. Configura la fecha de vencimiento si aplica\n6. Guarda la deuda\n\nEl cliente queda registrado automaticamente en el sistema para futuras operaciones.`
      },
      {
        heading: 'Registrar Pagos',
        content: `Para registrar un pago sobre una deuda existente:\n\n1. En la lista de deudas, selecciona la deuda del cliente\n2. En la vista de detalle, haz clic en "Registrar Pago"\n3. Ingresa el monto del pago\n4. Selecciona el metodo de pago\n5. Opcionalmente agrega una nota\n6. Guarda el pago\n\nEl sistema actualiza automaticamente el saldo restante y muestra el historial de pagos.`
      },
      {
        heading: 'Seguimiento de Deudas',
        content: `El dashboard de deudas muestra:\n\n- Total de deudas pendientes\n- Clientes con deudas vencidas\n- Historial de pagos recientes\n\nLas deudas se ordenan por fecha, mostrando primero las mas recientes. Las deudas vencidas aparecen destacadas en color rojo para facil identificacion.\n\nPuedes filtrar por cliente o rango de fechas para encontrar deudas especificas.`
      },
    ],
  },
  {
    id: 'reportes',
    title: '6. Reportes',
    icon: Target,
    sections: [
      {
        heading: 'Tipos de Reportes',
        content: `El modulo de reportes ofrece cinco tipos de analisis:\n\n1. Ventas: Total de ventas, transacciones, ticket promedio, productos mas vendidos, metodos de pago y tendencias diarias.\n\n2. Inventario: Valor del inventario, productos agotados, stock bajo, distribucion por categoria.\n\n3. Rentabilidad: Margenes de ganancia, productos mas rentables, comparacion costo vs venta.\n\n4. Clientes: Ranking de clientes, gasto promedio, adquisicion mensual.\n\n5. Personalizado: Constructor para crear reportes a medida seleccionando metricas y tipo de grafico.`
      },
      {
        heading: 'Exportar Datos',
        content: `Todos los reportes pueden exportarse en multiples formatos:\n\n- Excel (.xlsx): Archivo con multiples hojas, formato profesional para analisis\n- CSV: Datos separados por comas, compatible con cualquier hoja de calculo\n- PDF: Reporte formateado para impresion y presentaciones\n- Imprimir: Envia directamente a la impresora\n\nUsa el boton "Exportar" en la esquina superior derecha de cada seccion de reporte.`
      },
      {
        heading: 'Reporte Personalizado',
        content: `El constructor de reportes te permite:\n\n1. Seleccionar metricas especificas (ventas, productos, metodos de pago, etc.)\n2. Definir el rango de fechas\n3. Elegir el tipo de grafico (barras, linea, torta o tabla)\n4. Ver la vista previa en tiempo real\n5. Exportar el resultado\n\nEste modulo es ideal para crear analisis especificos que no estan cubiertos por los reportes predefinidos.`
      },
    ],
  },
  {
    id: 'configuracion',
    title: '7. Configuracion',
    icon: Smartphone,
    sections: [
      {
        heading: 'Cambiar PIN',
        content: `Para cambiar tu PIN de acceso:\n\n1. Ve a Configuracion > Seguridad > Cambiar PIN\n2. Ingresa tu PIN actual\n3. Ingresa el nuevo PIN (4 digitos)\n4. Confirma el nuevo PIN\n5. Haz clic en "Guardar PIN"\n\nSi olvidas tu PIN, contacta al administrador. Por seguridad, no hay forma de recuperar el PIN sin autorizacion.`
      },
      {
        heading: 'Backup y Restauracion',
        content: `Es crucial hacer backups periodicos de tus datos:\n\nBackup completo:\n1. Ve a Configuracion > Gestion de Datos > Backup completo\n2. Se descargara un archivo JSON con todos los datos\n3. Guardalo en un lugar seguro\n\nRestauracion:\n1. Ve a Configuracion > Gestion de Datos > Restaurar desde backup\n2. Selecciona el archivo JSON de backup\n3. Revisa la vista previa de los datos\n4. Confirma la restauracion\n\nLa restauracion reemplazara todos los datos actuales. Los datos reemplazados no se pueden recuperar.`
      },
      {
        heading: 'Metas de Ventas',
        content: `Configura tus metas mensuales en Configuracion > Metas:\n\n1. Ingresa el monto objetivo para el mes\n2. Configura el umbral de alerta para stock bajo\n3. Activa las notificaciones para recibir alertas al acercarte a la meta\n\nEl sistema muestra una barra de progreso con tus ventas acumuladas del mes actual. Cuando alcanzas el 80% de la meta, recibes una notificacion de felicitacion.`
      },
    ],
  },
];

function ManualUsuarioSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedChapter, setExpandedChapter] = useState<string | null>('intro');

  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return manualChapters;
    const q = searchQuery.toLowerCase();
    return manualChapters
      .map(ch => ({
        ...ch,
        sections: ch.sections.filter(s =>
          s.heading.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
        ),
      }))
      .filter(ch => ch.sections.length > 0);
  }, [searchQuery]);

  const totalResults = useMemo(() =>
    filteredChapters.reduce((sum, ch) => sum + ch.sections.length, 0),
    [filteredChapters]
  );

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} className="bg-[#FFC107]/15 text-foreground rounded px-0.5">{part}</mark>
        : part
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.40 }}>
      <Card className="border-[#FFC107]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-[#FFC107]">
            <BookOpen size={16} />
            Manual de Usuario
          </CardTitle>
          <CardDescription>Guia completa de uso del sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar en el manual..." className="pl-9" />
            {searchQuery && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {totalResults} resultado{totalResults !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Print Button */}
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => {
              const printWindow = window.open('', '_blank');
              if (!printWindow) return;
              const chaptersHtml = manualChapters.map(ch => `
                <div style="margin-bottom:24px">
                  <h2 style="font-size:16px;font-weight:bold;color:#00BCD4;margin-bottom:8px">${ch.title}</h2>
                  ${ch.sections.map(s => `
                    <div style="margin-bottom:12px">
                      <h3 style="font-size:14px;font-weight:600;margin-bottom:4px">${s.heading}</h3>
                      <p style="font-size:12px;line-height:1.6;white-space:pre-line;color:#444">${s.content.replace(/\n/g, '<br>')}</p>
                    </div>
                  `).join('')}
                </div>
              `).join('');
              printWindow.document.write(`
                <html><head><title>Manual Dulces Aromas</title>
                <style>body{font-family:system-ui,sans-serif;padding:20px;max-width:700px;margin:0 auto;color:#333}
                h1{font-size:20px;color:#00BCD4;margin-bottom:16px}</style></head>
                <body><h1>Manual de Usuario - Dulces Aromas POS</h1>${chaptersHtml}</body></html>
              `);
              printWindow.document.close();
              printWindow.print();
            }} className="gap-1.5 text-xs">
              <Printer size={13} /> Imprimir manual
            </Button>
          </div>

          {/* Accordion Chapters */}
          <div className="space-y-1">
            {filteredChapters.map(chapter => {
              const Icon = chapter.icon;
              const isExpanded = expandedChapter === chapter.id;
              return (
                <div key={chapter.id} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedChapter(isExpanded ? null : chapter.id)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className="text-[#00BCD4]" />
                      <span className="text-sm font-medium">{chapter.title}</span>
                    </div>
                    <ChevronRight size={16} className={cn('text-muted-foreground transition-transform duration-200', isExpanded && 'rotate-90')} />
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 space-y-4">
                          <Separator />
                          {chapter.sections.map((section, si) => (
                            <div key={si}>
                              <h4 className="text-sm font-semibold mb-1.5 text-foreground">{highlightText(section.heading, searchQuery)}</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                {highlightText(section.content, searchQuery)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {filteredChapters.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Search size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No se encontraron resultados para &quot;{searchQuery}&quot;</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   7. INFORMACION
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function InformacionSection() {
  const [pwaStatus, setPwaStatus] = useState<'installed' | 'installable' | 'unsupported'>('unsupported');

  // Check PWA status
  const checkPwa = useCallback(() => {
    if ('standalone' in window.navigator && (window.navigator as Record<string, unknown>).standalone === true) {
      setPwaStatus('installed');
    } else if ('BeforeInstallPromptEvent' in window) {
      setPwaStatus('installable');
    } else {
      setPwaStatus('unsupported');
    }
  }, []);

  useState(() => { checkPwa(); });

  const buildDate = '2025-01-15';
  const appVersion = '2.0.0';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.48 }}>
      <Card>
        <CardContent className="pt-6 text-center space-y-4">
          {/* Logo placeholder */}
          <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-[#00BCD4] to-[#FFC107] flex items-center justify-center">
            <Award size={24} className="text-white" />
          </div>

          <div>
            <h3 className="text-lg font-semibold font-[Playfair_Display,Georgia,serif]">Dulces Aromas POS</h3>
            <p className="text-sm text-muted-foreground">Version {appVersion}</p>
            <p className="text-xs text-muted-foreground">Build: {buildDate}</p>
          </div>

          <p className="text-xs text-muted-foreground">Hecho con amor para tu boutique</p>

          <Separator />

          {/* PWA Status */}
          <div className="flex items-center justify-center gap-2">
            <Smartphone size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {pwaStatus === 'installed' ? 'App instalada' :
                pwaStatus === 'installable' ? 'Instalable como app' : 'Usa tu navegador para instalar'}
            </span>
            {pwaStatus === 'installable' && (
              <Button variant="outline" size="sm" className="text-xs h-7 px-2">Instalar</Button>
            )}
          </div>

          <Separator />

          <div className="space-y-1.5">
            <a href="#" className="block text-xs text-[#00BCD4] hover:underline">Terminos de uso</a>
            <a href="#" className="block text-xs text-[#00BCD4] hover:underline">Politica de privacidad</a>
            <a href="mailto:soporte@dulcesaromas.com" className="block text-xs text-[#00BCD4] hover:underline">Soporte tecnico</a>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

