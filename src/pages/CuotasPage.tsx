import { useState, useEffect } from "react";
import { CreditCard, Calendar, AlertCircle, CheckCircle, DollarSign, TrendingUp, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Cuota {
  id: string;
  cliente: string;
  telefono: string;
  producto: string;
  montoTotal: number;
  cuotas: number;
  cuotaMensual: number;
  pagadas: number;
  proximoPago: string;
  estado: "activa" | "completada";
  saleId?: string;
  createdAt: string;
}

export default function CuotasPage() {
  const navigate = useNavigate();
  const [cuotas, setCuotas] = useState<Cuota[]>(() => {
    const guardado = localStorage.getItem("dulces_aromas_cuotas");
    return guardado ? JSON.parse(guardado) : [];
  });
  
  useEffect(() => {
    const debtsRaw = localStorage.getItem("dulces_aromas_debts");
    if (debtsRaw) {
      const debts = JSON.parse(debtsRaw);
      const debtsAsCuotas = debts
        .filter((d: any) => d.status === "active" || d.status === "paid")
        .map((d: any) => ({
          id: d.id,
          cliente: d.clientName,
          telefono: d.clientPhone || "",
          producto: d.saleId ? `Venta #${d.saleId.slice(-4)}` : "Deuda manual",
          montoTotal: d.totalAmount,
          cuotas: 3,
          cuotaMensual: Math.round(d.totalAmount / 3),
          pagadas: d.payments ? d.payments.length : 0,
          proximoPago: d.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          estado: d.status === "paid" ? "completada" : "activa",
          saleId: d.saleId,
          createdAt: d.createdAt || new Date().toISOString(),
        }));
      
      setCuotas(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const nuevas = debtsAsCuotas.filter((c: Cuota) => !existingIds.has(c.id));
        return [...prev, ...nuevas];
      });
    }
  }, []);
  
  const [form, setForm] = useState({
    cliente: "", telefono: "", producto: "", montoTotal: "", cuotas: "3"
  });
  const [mostrarForm, setMostrarForm] = useState(false);

  useEffect(() => {
    localStorage.setItem("dulces_aromas_cuotas", JSON.stringify(cuotas));
  }, [cuotas]);

  const crearCuota = () => {
    const monto = parseInt(form.montoTotal);
    const numCuotas = parseInt(form.cuotas);
    if (!form.cliente || !monto || !numCuotas) return;
    const cuotaMensual = Math.round(monto / numCuotas);
    const hoy = new Date();
    const proximo = new Date(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate());
    
    const nueva: Cuota = {
      id: crypto.randomUUID(),
      cliente: form.cliente,
      telefono: form.telefono,
      producto: form.producto || "Cuota manual",
      montoTotal: monto,
      cuotas: numCuotas,
      cuotaMensual,
      pagadas: 0,
      proximoPago: proximo.toISOString().split("T")[0],
      estado: "activa",
      createdAt: new Date().toISOString(),
    };

    const debts = JSON.parse(localStorage.getItem("dulces_aromas_debts") || "[]");
    debts.push({
      id: nueva.id,
      clientName: nueva.cliente,
      clientPhone: nueva.telefono || undefined,
      totalAmount: monto,
      paidAmount: 0,
      remaining: monto,
      status: "active",
      createdAt: nueva.createdAt,
      dueDate: nueva.proximoPago,
      payments: [],
    });
    localStorage.setItem("dulces_aromas_debts", JSON.stringify(debts));

    setCuotas(prev => [...prev, nueva]);
    setForm({ cliente: "", telefono: "", producto: "", montoTotal: "", cuotas: "3" });
    setMostrarForm(false);
  };

  const registrarPago = (id: string) => {
    setCuotas(prev => prev.map(c => {
      if (c.id !== id) return c;
      const nuevasPagadas = c.pagadas + 1;
      const hoy = new Date();
      const proximo = new Date(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate());
      
      const debts = JSON.parse(localStorage.getItem("dulces_aromas_debts") || "[]");
      const debtIdx = debts.findIndex((d: any) => d.id === id);
      if (debtIdx >= 0) {
        debts[debtIdx].paidAmount += c.cuotaMensual;
        debts[debtIdx].remaining = Math.max(0, debts[debtIdx].remaining - c.cuotaMensual);
        debts[debtIdx].payments.push({
          amount: c.cuotaMensual,
          date: new Date().toISOString(),
          method: "efectivo",
        });
        if (debts[debtIdx].remaining <= 0) debts[debtIdx].status = "paid";
        localStorage.setItem("dulces_aromas_debts", JSON.stringify(debts));
      }
      
      return {
        ...c,
        pagadas: nuevasPagadas,
        estado: nuevasPagadas >= c.cuotas ? "completada" : "activa",
        proximoPago: nuevasPagadas >= c.cuotas ? "" : proximo.toISOString().split("T")[0]
      };
    }));
  };

  const eliminarCuota = (id: string) => {
    const debts = JSON.parse(localStorage.getItem("dulces_aromas_debts") || "[]");
    const filteredDebts = debts.filter((d: any) => d.id !== id);
    localStorage.setItem("dulces_aromas_debts", JSON.stringify(filteredDebts));
    setCuotas(prev => prev.filter(c => c.id !== id));
  };

  const totalPendiente = cuotas.filter(c => c.estado !== "completada").reduce((sum, c) => sum + (c.montoTotal - (c.cuotaMensual * c.pagadas)), 0);
  const totalActivas = cuotas.filter(c => c.estado === "activa").length;
  const totalCompletadas = cuotas.filter(c => c.estado === "completada").length;

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <CreditCard className="text-teal-600" /> Sistema de Cuotas
        </h1>
        <div className="flex gap-2">
          <button onClick={() => navigate("/deudas")} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm">
            <ArrowRight size={16} /> Ver Deudas
          </button>
          <button onClick={() => setMostrarForm(!mostrarForm)} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium">
            {mostrarForm ? "Cancelar" : "Nueva Cuota"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-[#12121A] p-4 rounded-xl shadow border border-gray-100 dark:border-gray-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Pendiente</p>
          <p className="text-2xl font-bold text-teal-600">{new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP"}).format(totalPendiente)}</p>
        </div>
        <div className="bg-white dark:bg-[#12121A] p-4 rounded-xl shadow border border-gray-100 dark:border-gray-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Cuotas Activas</p>
          <p className="text-2xl font-bold text-blue-600">{totalActivas}</p>
        </div>
        <div className="bg-white dark:bg-[#12121A] p-4 rounded-xl shadow border border-gray-100 dark:border-gray-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Completadas</p>
          <p className="text-2xl font-bold text-green-600">{totalCompletadas}</p>
        </div>
        <div className="bg-white dark:bg-[#12121A] p-4 rounded-xl shadow border border-gray-100 dark:border-gray-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Clientes</p>
          <p className="text-2xl font-bold text-purple-600 flex items-center gap-1"><Users size={20} /> {new Set(cuotas.map(c => c.cliente)).size}</p>
        </div>
      </div>

      {mostrarForm && (
        <div className="bg-white dark:bg-[#12121A] p-6 rounded-xl shadow mb-6 border border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-lg mb-4 dark:text-white">Nueva Cuota</h3>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Nombre cliente *" value={form.cliente} onChange={e => setForm({...form, cliente: e.target.value})} className="border border-gray-200 dark:border-gray-700 p-2 rounded-lg bg-gray-50 dark:bg-[#1a1a2e] text-gray-800 dark:text-gray-100" />
            <input placeholder="Telefono (+569...)" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} className="border border-gray-200 dark:border-gray-700 p-2 rounded-lg bg-gray-50 dark:bg-[#1a1a2e] text-gray-800 dark:text-gray-100" />
            <input placeholder="Producto / Concepto" value={form.producto} onChange={e => setForm({...form, producto: e.target.value})} className="border border-gray-200 dark:border-gray-700 p-2 rounded-lg bg-gray-50 dark:bg-[#1a1a2e] text-gray-800 dark:text-gray-100" />
            <input placeholder="Monto total *" type="number" value={form.montoTotal} onChange={e => setForm({...form, montoTotal: e.target.value})} className="border border-gray-200 dark:border-gray-700 p-2 rounded-lg bg-gray-50 dark:bg-[#1a1a2e] text-gray-800 dark:text-gray-100" />
            <select value={form.cuotas} onChange={e => setForm({...form, cuotas: e.target.value})} className="border border-gray-200 dark:border-gray-700 p-2 rounded-lg bg-gray-50 dark:bg-[#1a1a2e] text-gray-800 dark:text-gray-100">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n} cuotas</option>)}
            </select>
            <button onClick={crearCuota} className="bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium">Crear Cuota</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {cuotas.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-[#12121A] rounded-xl border border-gray-100 dark:border-gray-800">
            <CreditCard size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-slate-400 dark:text-slate-500">No hay cuotas registradas</p>
            <p className="text-sm text-slate-300 dark:text-slate-600 mt-1">Crea una cuota o registra una venta a credito</p>
          </div>
        )}
        {cuotas.map(c => (
          <div key={c.id} className={`bg-white dark:bg-[#12121A] p-4 rounded-xl shadow border-l-4 ${c.estado === "completada" ? "border-green-500" : "border-blue-500"} border border-gray-100 dark:border-gray-800`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-lg dark:text-white">{c.cliente}</h4>
                  {c.estado === "completada" && <CheckCircle size={18} className="text-green-500" />}
                  {c.estado === "activa" && <TrendingUp size={18} className="text-blue-500" />}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{c.producto} {c.telefono && `• ${c.telefono}`}</p>
                <div className="flex gap-4 mt-2 text-sm flex-wrap">
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300"><DollarSign size={14} /> {new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP"}).format(c.montoTotal)}</span>
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300"><Calendar size={14} /> {c.pagadas}/{c.cuotas} pagadas</span>
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300"><CreditCard size={14} /> {new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP"}).format(c.cuotaMensual)}/mes</span>
                </div>
                {c.proximoPago && c.estado !== "completada" && (
                  <p className="text-sm mt-1 flex items-center gap-1 text-orange-600 dark:text-orange-400">
                    <AlertCircle size={14} /> Proximo pago: {c.proximoPago}
                  </p>
                )}
                {c.estado === "completada" && (
                  <p className="text-sm mt-1 text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle size={14} /> Cuota completada
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {c.estado !== "completada" && (
                  <button onClick={() => registrarPago(c.id)} className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
                    <CheckCircle size={14} /> Pagar
                  </button>
                )}
                <button onClick={() => eliminarCuota(c.id)} className="text-red-500 hover:text-red-700 text-sm px-2 py-1.5 transition-colors">Eliminar</button>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mb-1">
                <span>Progreso</span>
                <span>{Math.round((c.pagadas / c.cuotas) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-teal-600 h-2 rounded-full transition-all duration-500" style={{width: `${(c.pagadas / c.cuotas) * 100}%`}} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
