import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, ShoppingCart, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProducts } from '@/hooks/useProducts';
import { toast } from 'sonner';

interface BotMessage {
  id: string;
  text: string;
  isBot: boolean;
  products?: any[];
}

export default function SalesBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<BotMessage[]>([
    { id: '1', text: '¡Hola! Soy el asistente de Dulces Aromas. ¿En qué puedo ayudarte?', isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const { products } = useProducts();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg: BotMessage = { id: Date.now().toString(), text: input, isBot: false };
    setMessages(prev => [...prev, userMsg]);
    
    const lowerInput = input.toLowerCase();
    let botResponse: BotMessage = { id: (Date.now() + 1).toString(), text: '', isBot: true };
    
    if (lowerInput.includes('hombre') || lowerInput.includes('caballero') || lowerInput.includes('masculino')) {
      const hombreProducts = products.filter((p: any) => p.category === 'caballero' || p.category === 'unisex').slice(0, 3);
      botResponse.text = `¡Perfecto! Aquí tienes opciones para caballero:`;
      botResponse.products = hombreProducts;
    } else if (lowerInput.includes('mujer') || lowerInput.includes('dama') || lowerInput.includes('femenino')) {
      const mujerProducts = products.filter((p: any) => p.category === 'dama' || p.category === 'unisex').slice(0, 3);
      botResponse.text = `¡Perfecto! Aquí tienes opciones para dama:`;
      botResponse.products = mujerProducts;
    } else if (lowerInput.includes('niño') || lowerInput.includes('nino') || lowerInput.includes('infantil')) {
      const ninosProducts = products.filter((p: any) => p.category === 'ninos').slice(0, 3);
      botResponse.text = `¡Perfecto! Aquí tienes opciones para niños:`;
      botResponse.products = ninosProducts;
    } else if (lowerInput.includes('precio') || lowerInput.includes('cuanto') || lowerInput.includes('vale')) {
      botResponse.text = `Nuestros perfumes van desde $15.000 hasta $85.000. ¿Buscas algo específico?`;
    } else if (lowerInput.includes('stock') || lowerInput.includes('tienes') || lowerInput.includes('disponible')) {
      const inStock = products.filter((p: any) => p.stock > 0).length;
      botResponse.text = `Actualmente tenemos ${inStock} productos disponibles. ¿Qué fragancia buscas?`;
    } else if (lowerInput.includes('oferta') || lowerInput.includes('descuento') || lowerInput.includes('promo')) {
      botResponse.text = `¡Tenemos ofertas especiales! Compra 2 perfumes y obtén 15% de descuento. ¿Te interesa?`;
    } else if (lowerInput.includes('cuotas') || lowerInput.includes('credito') || lowerInput.includes('pagar')) {
      botResponse.text = `Aceptamos pagos en efectivo, tarjeta, transferencia, MercadoPago y hasta 12 cuotas. ¿Cómo prefieres pagar?`;
    } else {
      botResponse.text = `Entiendo. Puedo ayudarte a encontrar el perfume perfecto. ¿Buscas para hombre, mujer o niño? ¿Alguna marca en particular?`;
    }
    
    setTimeout(() => {
      setMessages(prev => [...prev, botResponse]);
      if (!open) setUnread(prev => prev + 1);
    }, 800);
    
    setInput('');
  };

  const addToCart = (product: any) => {
    toast.success(`${product.name} agregado al carrito`);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => { setOpen(true); setUnread(0); }}
        className="fixed bottom-24 right-4 z-50 w-14 h-14 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full shadow-lg shadow-cyan-500/30 flex items-center justify-center text-white"
      >
        <MessageCircle className="w-6 h-6" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-xs flex items-center justify-center font-bold">
            {unread}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-4 z-50 w-80 h-96 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden"
          >
            <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-white" />
                <span className="text-white font-semibold text-sm">Dulces Aromas Bot</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] p-2.5 rounded-xl text-sm ${
                    msg.isBot 
                      ? 'bg-slate-800 text-slate-200 rounded-tl-none' 
                      : 'bg-cyan-600 text-white rounded-tr-none'
                  }`}>
                    <p>{msg.text}</p>
                    {msg.products && (
                      <div className="mt-2 space-y-2">
                        {msg.products.map((p: any) => (
                          <div key={p.id} className="bg-slate-700/50 p-2 rounded-lg flex items-center justify-between">
                            <div>
                              <p className="font-medium text-xs">{p.name}</p>
                              <p className="text-cyan-400 text-xs">${p.price?.toLocaleString('es-CL')}</p>
                            </div>
                            <button 
                              onClick={() => addToCart(p)}
                              className="p-1.5 bg-cyan-500 rounded-lg hover:bg-cyan-400 transition-colors"
                            >
                              <ShoppingCart className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="p-3 border-t border-slate-700 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Escribe tu mensaje..."
                className="flex-1 bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border border-slate-600 focus:border-cyan-500 outline-none"
              />
              <button 
                onClick={handleSend}
                className="p-2 bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-colors"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
