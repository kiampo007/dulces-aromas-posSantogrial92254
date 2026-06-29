import { X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Product } from '@/types/product';

interface ProductQRModalProps {
  product: Product;
  onClose: () => void;
}

export function ProductQRModal({ product, onClose }: ProductQRModalProps) {
  // Generate a simple QR code data URL using a placeholder service
  const qrData = `https://dulcesaromas.cl/producto/${product.id}`;
  const qrImageUrl = `/qr-code-placeholder.png`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = `qr-${product.id}.png`;
    link.click();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={cn(
            'bg-white dark:bg-[#12121A] rounded-2xl shadow-xl w-full max-w-sm overflow-hidden',
            'border border-gray-200 dark:border-white/10'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10">
            <h3 className="font-sans text-lg font-semibold text-gray-800 dark:text-gray-100">
              QR del Producto
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-500 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col items-center">
            <div className="mb-3 text-center">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{product.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{product.brand}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 dark:border-gray-700 mb-4">
              <img
                src={qrImageUrl}
                alt={`QR de ${product.name}`}
                className="w-48 h-48 object-contain"
              />
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4 break-all px-2">
              {qrData}
            </p>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-5 py-4 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-gray-800/30">
            <button
              onClick={handleDownload}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-medium',
                'border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300',
                'hover:bg-gray-100 dark:hover:bg-white/5 transition-colors',
                'flex items-center justify-center gap-2'
              )}
            >
              <Download size={16} />
              Descargar
            </button>
            <button
              onClick={onClose}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-medium',
                'bg-[#00BCD4] text-white hover:bg-[#00BCD4]/90 transition-colors'
              )}
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
