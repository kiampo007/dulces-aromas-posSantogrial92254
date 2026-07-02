import { useState, useEffect } from "react";
import { CreditCard, Calendar, AlertCircle, CheckCircle, DollarSign } from "lucide-react";

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
  estado: "activa" | "atrasada" | "completada";
}

export function CuotasPage() {
  const [cuotas, setCuotas] = useState<Cuota[]>(() => {
    const guardado = localStorage.getItem("dulces_aromas_cuotas");
    return guardado ? JSON.parse(guardado) : [];
  });
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
      id: Date.now().toString(),
      cliente: form.cliente,
      telefono: form.telefono,
      producto: form.producto,
      montoTotal: monto,
      cuotas: numCuotas,
      cuotaMensual,
      pagadas: 0,
      proximoPago: proximo.toISOString().split("T")[0],
      estado: "activa"
    };

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
      return {
        ...c,
        pagadas: nuevasPagadas,
        estado: nuevasPagadas >= c.cuotas ? "completada" : "activa",
        proximoPago: nuevasPagadas >= c.cuotas ? "" : proximo.toISOString().split("T")[0]
      };
    }));
  };

  const eliminarCuota = (id: string) => {
    setCuotas(prev => prev.filter(c => c.id !== id));
  };

  const totalPendiente = cuotas.filter(c => c.estado !== "completada").reduce((sum, c) => sum + (c.montoTotal - (c.cuotaMensual * c.pagadas)), 0);
  const totalActivas = cuotas.filter(c => c.estado === "activa").length;
  const totalAtrasadas = cuotas.filter(c => c.estado === "atrasada").length;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <CreditCard className="text-teal-600" /> Sistema de Cuotas
        </h1>
        <button 
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
        >
          {mostrarForm ? "Cancelar" : "Nueva Cuota"}
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-slate-500">Total Pendiente</p>
          <p className="text-2xl font-bold text-teal-600">${totalPendiente.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-slate-500">Cuotas Activas</p>
          <p className="text-2xl font-bold text-blue-600">{totalActivas}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-slate-500">Atrasadas</p>
          <p className="text-2xl font-bold text-red-600">{totalAtrasadas}</p>
        </div>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="bg-white p-6 rounded-xl shadow mb-6 space-y-4">
          <h3 className="font-bold text-lg">Nueva Cuota</h3>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Nombre cliente" value={form.cliente} onChange={e => setForm({...form, cliente: e.target.value})} className="border p-2 rounded" />
            <input placeholder="Teléfono (+569...)" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} className="border p-2 rounded" />
            <input placeholder="Producto" value={form.producto} onChange={e => setForm({...form, producto: e.target.value})} className="border p-2 rounded" />
            <input placeholder="Monto total" type="number" value={form.montoTotal} onChange={e => setForm({...form, montoTotal: e.target.value})} className="border p-2 rounded" />
            <select value={form.cuotas} onChange={e => setForm({...form, cuotas: e.target.value})} className="border p-2 rounded">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n} cuotas</option>)}
            </select>
            <button onClick={crearCuota} className="bg-teal-600 text-white rounded hover:bg-teal-700">Crear Cuota</button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-3">
        {cuotas.length === 0 && <p className="text-center text-slate-400 py-8">No hay cuotas registradas</p>}
        {cuotas.map(c => (
          <div key={c.id} className={`bg-white p-4 rounded-xl shadow border-l-4 ${c.estado === "completada" ? "border-green-500" : c.estado === "atrasada" ? "border-red-500" : "border-blue-500"}`}>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-lg">{c.cliente}</h4>
                <p className="text-sm text-slate-500">{c.producto} • {c.telefono}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1"><DollarSign size={14} /> ${c.montoTotal.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><Calendar size={14} /> {c.pagadas}/{c.cuotas} pagadas</span>
                  <span className="flex items-center gap-1"><CreditCard size={14} /> ${c.cuotaMensual.toLocaleString()}/mes</span>
                </div>
                {c.proximoPago && (
                  <p className="text-sm mt-1 flex items-center gap-1 text-orange-600">
                    <AlertCircle size={14} /> Próximo pago: {c.proximoPago}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {c.estado !== "completada" && (
                  <button onClick={() => registrarPago(c.id)} className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                    <CheckCircle size={14} /> Pagar
                  </button>
                )}
                <button onClick={() => eliminarCuota(c.id)} className="text-red-500 hover:text-red-700 text-sm">Eliminar</button>
              </div>
            </div>
            <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
              <div className="bg-teal-600 h-2 rounded-full transition-all" style={{width: `${(c.pagadas / c.cuotas) * 100}%`}} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
