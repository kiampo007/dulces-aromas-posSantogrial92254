import { useState } from "react";
import { Bot, MessageSquare } from "lucide-react";
import { useProductos } from "@/hooks/useProductos";

interface Mensaje {
  tipo: "bot" | "user";
  texto: string;
}

export default function BotVentasPage() {
  const { productos, cargando } = useProductos();
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { tipo: "bot", texto: "¡Hola! Soy tu asistente de ventas. ¿Qué perfume buscas hoy? Puedo recomendarte por categoría, marca o presupuesto." }
  ]);
  const [input, setInput] = useState("");

  const enviarMensaje = () => {
    if (!input.trim()) return;
    const userMsg: Mensaje = { tipo: "user", texto: input };
    setMensajes(prev => [...prev, userMsg]);
    
    const texto = input.toLowerCase();
    let respuesta: Mensaje = { tipo: "bot", texto: "" };
    
    if (texto.includes("hola") || texto.includes("buenos")) {
      respuesta = { tipo: "bot", texto: "¡Bienvenido! ¿Buscas perfume para dama, caballero o unisex? ¿Tienes alguna marca preferida?" };
    } else if (texto.includes("dama") || texto.includes("mujer")) {
      const dama = productos.filter((p: any) => p.categoria === "Dama").slice(0, 3);
      respuesta = { tipo: "bot", texto: `Te recomiendo: ${dama.map((p: any) => p.nombre).join(", ")}` };
    } else if (texto.includes("caballero") || texto.includes("hombre")) {
      const cab = productos.filter((p: any) => p.categoria === "Caballero").slice(0, 3);
      respuesta = { tipo: "bot", texto: `Para caballero: ${cab.map((p: any) => p.nombre).join(", ")}` };
    } else if (texto.includes("barato") || texto.includes("economico")) {
      const baratos = productos.filter((p: any) => p.precio < 40000).slice(0, 3);
      respuesta = { tipo: "bot", texto: `Económicos: ${baratos.map((p: any) => `${p.nombre} ($${p.precio.toLocaleString()})`).join(", ")}` };
    } else if (texto.includes("caro") || texto.includes("premium")) {
      const caros = productos.filter((p: any) => p.precio > 70000).slice(0, 3);
      respuesta = { tipo: "bot", texto: `Premium: ${caros.map((p: any) => `${p.nombre} ($${p.precio.toLocaleString()})`).join(", ")}` };
    } else {
      const encontrados = productos.filter((p: any) => 
        p.nombre.toLowerCase().includes(texto) || p.marca.toLowerCase().includes(texto)
      ).slice(0, 3);
      if (encontrados.length > 0) {
        respuesta = { tipo: "bot", texto: `Encontré: ${encontrados.map((p: any) => `${p.nombre} - $${p.precio.toLocaleString()}`).join(". ")}` };
      } else {
        respuesta = { tipo: "bot", texto: "Prueba con: 'dama', 'caballero', 'Chanel', 'barato' o 'premium'" };
      }
    }
    
    setTimeout(() => setMensajes(prev => [...prev, respuesta]), 500);
    setInput("");
  };

  if (cargando) return <div className="p-8 text-center">Cargando productos...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-teal-600 text-white p-4 rounded-t-xl flex items-center gap-3">
        <Bot size={24} />
        <div>
          <h2 className="font-bold">Bot de Ventas</h2>
          <p className="text-sm opacity-90">Asistente inteligente</p>
        </div>
      </div>
      <div className="bg-white border-x border-b rounded-b-xl p-4 space-y-4 min-h-[400px] max-h-[500px] overflow-y-auto">
        {mensajes.map((m, i) => (
          <div key={i} className={`flex ${m.tipo === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-3 rounded-xl ${m.tipo === "user" ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-800"}`}>
              <p>{m.texto}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && enviarMensaje()}
          placeholder="Escribe: 'dama', 'caballero', 'Chanel', 'barato'..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button onClick={enviarMensaje} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">
          <MessageSquare size={20} />
        </button>
      </div>
    </div>
  );
}
