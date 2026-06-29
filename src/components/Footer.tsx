import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function Footer() {
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  return (
    <footer className="py-3 px-4 text-center">
      <p className="text-[11px] text-white/30 font-sans">
        Dulces Aromas POS v2.0
      </p>
      {showInstall && (
        <button
          onClick={() => setShowInstall(false)}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white/60 text-xs transition-colors"
        >
          <Download size={12} />
          Instalar app
        </button>
      )}
    </footer>
  );
}
