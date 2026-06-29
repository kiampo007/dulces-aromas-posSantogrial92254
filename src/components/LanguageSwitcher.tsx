import { useState } from 'react';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
] as const;

export default function LanguageSwitcher() {
  const [lang, setLang] = useState<'es' | 'en' | 'pt'>('es');
  const [open, setOpen] = useState(false);

  const current = LANGUAGES.find((l) => l.code === lang);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-sans transition-colors w-full',
          'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
        )}
        title="Cambiar idioma"
      >
        <Globe size={20} />
        <span>{current?.flag}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">{current?.code.toUpperCase()}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div
            className={cn(
              'absolute bottom-full left-0 mb-1 w-40 rounded-lg shadow-lg border z-[70] overflow-hidden',
              'bg-white dark:bg-[#1a1a2e] border-gray-200 dark:border-white/10'
            )}
          >
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                  lang === l.code
                    ? 'bg-[#00BCD4]/10 text-[#00BCD4] font-medium'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                )}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
