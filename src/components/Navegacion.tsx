import { ShoppingCart, Package, BarChart3, Settings, Home, Bot, CreditCard } from "lucide-react";

interface NavProps {
  vista: string;
  setVista: (v: string) => void;
  totalItems: number;
}

export function Navegacion({ vista, setVista, totalItems }: NavProps) {
  const items = [
    { id: "inicio", label: "Inicio", icon: Home },
    { id: "ventas", label: "Ventas", icon: ShoppingCart, badge: totalItems },
    { id: "inventario", label: "Inventario", icon: Package },
    { id: "cuotas", label: "Cuotas", icon: CreditCard },
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "bot", label: "Bot Ventas", icon: Bot },
    { id: "config", label: "Config", icon: Settings },
  ];

  return (
    <nav className="bg-slate-900 text-white fixed bottom-0 left-0 right-0 z-50 md:static md:w-64 md:h-screen">
      <div className="md:hidden flex justify-around p-2">
        {items.slice(0, 5).map(item => (
          <button
            key={item.id}
            onClick={() => setVista(item.id)}
            className={`flex flex-col items-center p-2 rounded-lg ${vista === item.id ? "bg-teal-600" : "hover:bg-slate-800"}`}
          >
            <item.icon size={20} />
            <span className="text-xs mt-1">{item.label}</span>
            {item.badge ? <span className="bg-red-500 text-xs rounded-full px-1.5">{item.badge}</span> : null}
          </button>
        ))}
      </div>
      <div className="hidden md:flex flex-col h-full p-4 space-y-2">
        <div className="text-xl font-bold text-teal-400 mb-6 flex items-center gap-2">
          <span>🍬</span> Dulces Aromas
        </div>
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => setVista(item.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${vista === item.id ? "bg-teal-600 text-white" : "hover:bg-slate-800 text-slate-300"}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
            {item.badge ? <span className="ml-auto bg-red-500 text-xs rounded-full px-2 py-0.5">{item.badge}</span> : null}
          </button>
        ))}
      </div>
    </nav>
  );
}
