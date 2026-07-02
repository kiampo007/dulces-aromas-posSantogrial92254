import { useState } from "react";
import { Bot, MessageSquare, ShoppingCart, Sparkles } from "lucide-react";
import { useProductos } from "../hooks/useProductos";

interface Mensaje {
  tipo: "bot" | "user";
  texto: string;
  producto?: { id: string; nombre: string; precio: number };
}

export function BotVentasPage() {
  const { productos } = useProductos();
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { tipo: "bot", texto: "¡Hola! Soy tu asistente de ventas. ¿Qué perfume buscas hoy? Puedo recomendarte por categoría, marca o presupuesto." }
  ]);
  const [input, setInput] = useState("");
  const [carrito, setCarrito] = useState<string[]>([]);

  const enviarMensaje = () => {
    if (!input.trim()) return;
    
    const userMsg: Mensaje = { tipo: "user", texto: input };
    setMensajes(prev => [...prev, userMsg]);
    
    // Logica del bot
    const texto = input.toLowerCase();
    let respuesta: Mensaje = { tipo: "bot", texto: "" };
    
    if (texto.includes("hola") || texto.includes("buenos")) {
      respuesta = { tipo: "bot", texto: "¡Bienvenido! ¿Buscas perfume para dama, caballero o unisex? ¿Tienes alguna marca preferida?" };
    } else if (texto.includes("dama") || texto.includes("mujer")) {
      const dama = productos.filter(p => p.categoria === "Dama").slice(0, 3);
      respuesta = { tipo: "bot", texto: `Te recomiendo estos para dama: ${dama.map(p => p.nombre).join(", ")}. ¿Cuál te interesa?` };
    } else if (texto.includes("caballero") || texto.includes("hombre")) {
      const cab = productos.filter(p => p.categoria === "Caballero").slice(0, 3);
      respuesta = { tipo: "bot", texto: `Estos son ideales para caballero: ${cab.map(p => p.nombre).join(", ")}. ¿Te gusta alguno?` };
    } else if (texto.includes("barato") || texto.includes("economico") || texto.includes("presupuesto")) {
      const baratos = productos.filter(p => p.precio < 40000).slice(0, 3);
      respuesta = { tipo: "bot", texto: `Opciones económicas: ${baratos.map(p => `${p.nombre} ($${p.precio.toLocaleString()})`).join(", ")}` };
    } else if (texto.includes("caro") || texto.includes("lujo") || texto.includes("premium")) {
      const caros = productos.filter(p => p.precio > 70000).slice(0, 3);
      respuesta = { tipo: "bot", texto: `Nuestros perfumes premium: ${caros.map(p => `${p.nombre} ($${p.precio.toLocaleString()})`).join(", ")}` };
    } else {
      // Buscar por nombre o marca
      const encontrados = productos.filter(p => 
        p.nombre.toLowerCase().includes(texto) || 
        p.marca.toLowerCase().includes(texto)
      ).slice(0, 3);
      
      if (encontrados.length > 0) {
        respuesta = { tipo: "bot", texto: `Encontré: ${encontrados.map(p => `${p.nombre} - $${p.precio.toLocaleString()} (stock: ${p.stock})`).join(". ")}. ¿Agrego alguno al carrito?` };
      } else {
        respuesta = { tipo: "bot", texto: "No encontré exactamente eso. Prueba con: 'dama', 'caballero', 'Chanel', 'Dior', 'barato' o 'premium'. ¿Te ayudo con algo más?" };
      }
    }
    
    setTimeout(() => setMensajes(prev => [...prev, respuesta]), 500);
    setInput("");
  };

  const agregarAlCarrito = (id: string) => {
    setCarrito(prev => [...prev, id]);
    setMensajes(prev => [...prev, { tipo: "bot", texto: "¡Producto agregado! ¿Algo más o pasamos a la venta?" }]);
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-teal-600 text-white p-4 flex items-center gap-3">
        <Bot size={24} />
        <div>
          <h2 className="font-bold">Bot de Ventas</h2>
          <p className="text-sm opacity-90">Asistente inteligente</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Sparkles size={16} />
          <span className="text-sm">{carrito.length} items</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px]">
        {mensajes.map((m, i) => (
          <div key={i} className={`flex ${m.tipo === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-3 rounded-xl ${m.tipo === "user" ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-800"}`}>
              <p>{m.texto}</p>
              {m.producto && (
                <button 
                  onClick={() => agregarAlCarrito(m.producto!.id)}
                  className="mt-2 flex items-center gap-2 bg-white text-teal-600 px-3 py-1 rounded-full text-sm font-medium hover:bg-teal-50"
                >
                  <ShoppingCart size={14} /> Agregar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && enviarMensaje()}
          placeholder="Escribe: 'dama', 'caballero', 'Chanel', 'barato'..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button 
          onClick={enviarMensaje}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
        >
          <MessageSquare size={20} />
        </button>
      </div>
    </div>
  );
}
