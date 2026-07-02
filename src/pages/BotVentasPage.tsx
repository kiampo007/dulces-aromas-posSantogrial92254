import { useState, useEffect } from "react";
import { Bot, MessageSquare, ShoppingCart, Plus, ArrowRight } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Mensaje {
  tipo: "bot" | "user" | "producto";
  texto: string;
  producto?: any;
}

export default function BotVentasPage() {
  const { products } = useProducts();
  const navigate = useNavigate();
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { tipo: "bot", texto: "Hola! Soy tu asistente de ventas. Que perfume buscas hoy? Puedo recomendarte por categoria, marca o presupuesto. Tambien puedo agregar productos directamente al carrito." }
  ]);
  const [input, setInput] = useState("");
  const [carritoBot, setCarritoBot] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("current_cart");
    if (saved) setCarritoBot(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (carritoBot.length > 0) {
      localStorage.setItem("current_cart", JSON.stringify(carritoBot));
    }
  }, [carritoBot]);

  const enviarMensaje = () => {
    if (!input.trim()) return;
    const userMsg: Mensaje = { tipo: "user", texto: input };
    setMensajes(prev => [...prev, userMsg]);
    const texto = input.toLowerCase();
    let respuesta: Mensaje = { tipo: "bot", texto: "" };
    
    if (texto.includes("hola") || texto.includes("buenos") || texto.includes("ayuda")) {
      respuesta = { tipo: "bot", texto: "Bienvenido! Puedes buscar por: dama, caballero, unisex, marca (Chanel, Dior, etc.), precio (barato, premium), o nombre de perfume. Tambien puedes decir agregar [nombre] para anadir al carrito." };
    } else if (texto.includes("carrito") || texto.includes("ver carrito")) {
      if (carritoBot.length === 0) {
        respuesta = { tipo: "bot", texto: "Tu carrito esta vacio. Busca productos y di agregar [nombre] para anadir." };
      } else {
        const items = carritoBot.map((p: any) => `${p.name} x${p.quantity}`).join(", ");
        const total = carritoBot.reduce((s: number, p: any) => s + p.price * p.quantity, 0);
        respuesta = { tipo: "bot", texto: `Carrito: ${items}. Total: ${new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP"}).format(total)}. Di ir a pagar para completar la venta.` };
      }
    } else if (texto.includes("ir a pagar") || texto.includes("pagar") || texto.includes("checkout")) {
      if (carritoBot.length === 0) {
        respuesta = { tipo: "bot", texto: "Primero agrega productos al carrito. Di dama o caballero para ver opciones." };
      } else {
        respuesta = { tipo: "bot", texto: "Redirigiendo a la pagina de ventas..." };
        setTimeout(() => navigate("/venta"), 1000);
      }
    } else if (texto.includes("agregar ")) {
      const nombreBusqueda = texto.replace("agregar ", "").trim();
      const encontrado = products.find((p: any) => 
        p.name.toLowerCase().includes(nombreBusqueda) || 
        p.id.toLowerCase().includes(nombreBusqueda)
      );
      if (encontrado) {
        setCarritoBot(prev => {
          const existente = prev.find((p: any) => p.id === encontrado.id);
          if (existente) {
            return prev.map((p: any) => p.id === encontrado.id ? { ...p, quantity: p.quantity + 1 } : p);
          }
          return [...prev, { ...encontrado, quantity: 1 }];
        });
        respuesta = { tipo: "producto", texto: `${encontrado.name} agregado al carrito. Stock: ${encontrado.stock} uds.`, producto: encontrado };
      } else {
        respuesta = { tipo: "bot", texto: `No encontre "${nombreBusqueda}". Prueba con otro nombre o busca primero.` };
      }
    } else if (texto.includes("dama") || texto.includes("mujer")) {
      const dama = products.filter((p: any) => p.category === "dama").slice(0, 3);
      respuesta = { tipo: "bot", texto: `Perfumes para dama: ${dama.map((p: any) => `${p.name} (${new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP"}).format(p.price)})`).join(" | ")}. Di agregar [nombre] para comprar.` };
    } else if (texto.includes("caballero") || texto.includes("hombre")) {
      const cab = products.filter((p: any) => p.category === "caballero").slice(0, 3);
      respuesta = { tipo: "bot", texto: `Para caballero: ${cab.map((p: any) => `${p.name} (${new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP"}).format(p.price)})`).join(" | ")}. Di agregar [nombre] para comprar.` };
    } else if (texto.includes("barato") || texto.includes("economico") || texto.includes("presupuesto")) {
      const baratos = products.filter((p: any) => p.price < 40000).slice(0, 3);
      respuesta = { tipo: "bot", texto: `Opciones economicas: ${baratos.map((p: any) => `${p.name} ${new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP"}).format(p.price)}`).join(" | ")}` };
    } else if (texto.includes("caro") || texto.includes("lujo") || texto.includes("premium")) {
      const caros = products.filter((p: any) => p.price > 70000).slice(0, 3);
      respuesta = { tipo: "bot", texto: `Premium: ${caros.map((p: any) => `${p.name} ${new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP"}).format(p.price)}`).join(" | ")}` };
    } else {
      const encontrados = products.filter((p: any) => 
        p.name.toLowerCase().includes(texto) || 
        p.brand.toLowerCase().includes(texto) ||
        p.id.toLowerCase().includes(texto)
      ).slice(0, 3);
      if (encontrados.length > 0) {
        respuesta = { tipo: "bot", texto: `Encontre: ${encontrados.map((p: any) => `${p.name} - ${new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP"}).format(p.price)} (stock: ${p.stock})`).join(" | ")}. Di agregar [nombre] para comprar.` };
      } else {
        respuesta = { tipo: "bot", texto: "No encontre exactamente eso. Prueba con: dama, caballero, Chanel, Dior, barato, premium, o el nombre del perfume. Tambien puedes decir carrito para ver lo que llevas." };
      }
    }
    setTimeout(() => setMensajes(prev => [...prev, respuesta]), 500);
    setInput("");
  };

  const agregarDirecto = (producto: any) => {
    setCarritoBot(prev => {
      const existente = prev.find((p: any) => p.id === producto.id);
      if (existente) {
        return prev.map((p: any) => p.id === producto.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { ...producto, quantity: 1 }];
    });
    toast.success(`${producto.name} agregado al carrito`);
  };

  const irAPagar = () => {
    if (carritoBot.length > 0) {
      navigate("/venta");
    } else {
      toast.error("Carrito vacio");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 h-[calc(100vh-80px)] flex flex-col">
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-4 rounded-t-xl flex items-center gap-3 shadow-lg">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <Bot size={24} />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-lg">Asistente de Ventas</h2>
          <p className="text-sm opacity-90">Bot inteligente - Dulces Aromas</p>
        </div>
        {carritoBot.length > 0 && (
          <button onClick={irAPagar} className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors">
            <ShoppingCart size={16} />
            {carritoBot.reduce((s: number, p: any) => s + p.quantity, 0)}
          </button>
        )}
      </div>
      <div className="flex-1 bg-white dark:bg-[#12121A] border-x border-gray-200 dark:border-gray-800 p-4 space-y-4 overflow-y-auto min-h-0">
        {mensajes.map((m, i) => (
          <div key={i} className={`flex ${m.tipo === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] p-3 rounded-xl ${m.tipo === "user" ? "bg-teal-600 text-white" : m.tipo === "producto" ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"}`}>
              <p className="text-sm leading-relaxed">{m.texto}</p>
              {m.producto && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => agregarDirecto(m.producto)} className="flex items-center gap-1 bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-teal-700 transition-colors">
                    <Plus size={14} /> Agregar al carrito
                  </button>
                  <button onClick={irAPagar} className="flex items-center gap-1 bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 px-3 py-1.5 rounded-lg text-xs font-medium border border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-slate-600 transition-colors">
                    <ArrowRight size={14} /> Ir a pagar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-[#12121A] border border-gray-200 dark:border-gray-800 rounded-b-xl p-3 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && enviarMensaje()} placeholder="Escribe: dama, Chanel, agregar Lancome..." className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-[#1a1a2e] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all" />
        <button onClick={enviarMensaje} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2">
          <MessageSquare size={18} />
        </button>
      </div>
      {carritoBot.length > 0 && (
        <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-center justify-between">
          <span className="text-sm text-amber-800 dark:text-amber-200">
            {carritoBot.reduce((s: number, p: any) => s + p.quantity, 0)} items en carrito
          </span>
          <button onClick={irAPagar} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <ShoppingCart size={16} /> Ir a Venta
          </button>
        </div>
      )}
    </div>
  );
}
