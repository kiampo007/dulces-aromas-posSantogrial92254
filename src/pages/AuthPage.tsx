import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Delete } from 'lucide-react';
import { usePinAuth } from '@/hooks/usePinAuth';
import Footer from '@/components/Footer';

/* ─── Mist Particles (memo'd) ─── */
interface ParticleData {
  id: number;
  size: number;
  left: string;
  opacity: number;
  drift: string;
  duration: string;
  delay: string;
}

const particles: ParticleData[] = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: 2 + Math.random() * 4,
  left: `${Math.random() * 100}%`,
  opacity: 0.08 + Math.random() * 0.12,
  drift: `${(Math.random() - 0.5) * 60}px`,
  duration: `${8 + Math.random() * 7}s`,
  delay: `${Math.random() * 12}s`,
}));

const MistParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    {particles.map((p) => (
      <div
        key={p.id}
        className="absolute rounded-full bg-white animate-mist-float"
        style={{
          width: p.size,
          height: p.size,
          left: p.left,
          opacity: 0,
          '--particle-opacity': p.opacity,
          '--drift': p.drift,
          '--float-duration': p.duration,
          animationDelay: p.delay,
        } as React.CSSProperties}
      />
    ))}
  </div>
);

/* ─── Time-based greeting ─── */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'Buenos días';
  if (hour >= 12 && hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

/* ─── Animated loading dots ─── */
const LoadingDots = () => (
  <div className="flex items-center justify-center gap-1">
    <span className="inline-block w-1 h-1 rounded-full bg-white/50 animate-loading-dot" />
    <span
      className="inline-block w-1 h-1 rounded-full bg-white/50 animate-loading-dot"
      style={{ animationDelay: '0.3s' }}
    />
    <span
      className="inline-block w-1 h-1 rounded-full bg-white/50 animate-loading-dot"
      style={{ animationDelay: '0.6s' }}
    />
  </div>
);

/* ─── Splash Screen ─── */
interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [progress, setProgress] = useState(0);
  const greeting = useMemo(() => getGreeting(), []);

  useEffect(() => {
    const start = Date.now();
    const duration = 2500;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);
      if (elapsed >= duration) {
        clearInterval(interval);
        setTimeout(onComplete, 100);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[100dvh] w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Logo */}
      <motion.div
        className="relative mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="w-[120px] h-[120px] rounded-full border-2 border-gold-accent/40 animate-spin-slow shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center">
          <img
            src="/logo-dulces-aromas.svg"
            alt="Dulces Aromas"
            className="w-[90px] h-[90px] animate-float"
          />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1
        className="font-sans text-[28px] font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
      >
        Dulces Aromas
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="text-[13px] font-sans font-normal text-white/70 uppercase tracking-[0.15em] mt-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
      >
        Perfumería &amp; Fragancias
      </motion.p>

      {/* Greeting */}
      <motion.p
        className="text-base font-sans font-light text-white/60 mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
      >
        {greeting}
      </motion.p>

      {/* Loading text + dots */}
      <motion.div
        className="mt-8 flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }}
      >
        <p className="text-sm font-sans font-normal text-white/50">
          Preparando tu boutique
        </p>
        <LoadingDots />
      </motion.div>

      {/* Progress bar */}
      <motion.div
        className="fixed bottom-[80px] left-1/2 -translate-x-1/2 w-[200px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <div className="h-[3px] rounded-sm bg-white/15 overflow-hidden">
          <motion.div
            className="h-full bg-white rounded-sm"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: 'linear' }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── PIN Dot ─── */
interface PinDotProps {
  filled: boolean;
  isActive: boolean;
  hasError: boolean;
}

const PinDot = ({ filled, isActive, hasError }: PinDotProps) => (
  <motion.div
    className={`w-4 h-4 rounded-full border-2 transition-colors duration-150 ${
      hasError
        ? 'bg-danger-rose border-danger-rose'
        : filled
          ? 'bg-white border-white scale-110'
          : isActive
            ? 'border-gold-accent shadow-glow-gold'
            : 'border-white/30 bg-transparent'
    }`}
    initial={filled ? { scale: 0.5 } : false}
    animate={{ scale: filled ? 1.1 : 1 }}
    transition={{ type: 'spring', stiffness: 120, damping: 14, duration: 0.3 }}
  />
);

/* ─── Keypad Button ─── */
interface KeypadButtonProps {
  label: string | React.ReactNode;
  onClick: () => void;
  isAction?: boolean;
}

const KeypadButton = ({ label, onClick, isAction }: KeypadButtonProps) => (
  <motion.button
    onClick={onClick}
    className={`flex items-center justify-center h-14 rounded-md select-none tap-highlight-transparent ${
      isAction
        ? 'bg-white/5 border border-white/8'
        : 'bg-white/[0.08] border border-white/10 hover:bg-white/[0.15] active:bg-white/[0.2]'
    } text-white text-[22px] font-sans font-medium transition-colors duration-150`}
    whileTap={{ scale: 0.92 }}
    transition={{ duration: 0.1 }}
  >
    {label}
  </motion.button>
);

/* ─── PIN Recovery Modal ─── */
interface RecoveryModalProps {
  onClose: () => void;
}

const RecoveryModal = ({ onClose }: RecoveryModalProps) => (
  <motion.div
    className="fixed inset-0 z-50 flex items-center justify-center px-4"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
  >
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
    <motion.div
      className="relative w-full max-w-[360px] glass-panel rounded-2xl p-6 shadow-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, type: 'spring', damping: 25 }}
    >
      <h3 className="font-sans text-lg font-semibold text-white mb-3">
        Recuperar Acceso
      </h3>
      <p className="text-sm font-sans text-white/70 leading-relaxed mb-5">
        El PIN por defecto es <span className="text-white font-semibold">2525</span>. Si lo cambiaste y no lo recuerdas, contacta al administrador.
      </p>
      <button
        onClick={onClose}
        className="w-full py-2.5 px-4 rounded-md font-sans font-medium text-sm transition-all duration-200 gradient-gold text-dark-slate hover:shadow-glow-gold active:scale-[0.98]"
      >
        Entendido
      </button>
    </motion.div>
  </motion.div>
);

/* ─── PIN Entry ─── */
const PinEntry = () => {
  const navigate = useNavigate();
  const {
    pin,
    error,
    success,
    isLocked,
    lockoutTime,
    attemptsLeft,
    totalLockouts,
    addDigit,
    removeDigit,
    clearPin,
  } = usePinAuth();

  const [showRecovery, setShowRecovery] = useState(false);

  /* Navigate on success */
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  /* Keyboard support */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isLocked) return;
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        addDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        removeDigit();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pin.length === 4) {
          // auto-submit handled by hook
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        clearPin();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [addDigit, removeDigit, clearPin, isLocked, pin.length]);

  /* Shake animation key */
  const cardKey = error ? 'error' : 'normal';

  const formatLockoutTime = useCallback((ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  }, []);

  return (
    <>
      <motion.div
        key={cardKey}
        className={`flex flex-col items-center w-full min-h-[100dvh] justify-center px-4 ${error ? 'animate-shake' : ''}`}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
      >
        {/* PIN Card */}
        <div className="w-full max-w-[380px] glass-panel rounded-3xl p-8 sm:p-10 shadow-[0_16px_48px_rgba(0,0,0,0.25)]">
          {/* Card Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-8 h-8 rounded-full bg-[#FFC107]/15 flex items-center justify-center mb-3">
              <Lock size={16} className="text-white" />
            </div>
            <h2 className="font-sans text-xl font-semibold text-white">
              Acceso Protegido
            </h2>
            <p className="text-[13px] font-sans text-white/60 mt-1">
              Ingrese su PIN de 4 dígitos
            </p>
            <p className="text-xs font-sans text-white/40 mt-0.5">
              (Por defecto: 2525)
            </p>
          </div>

          {/* PIN Dots */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <PinDot
                key={i}
                filled={i < pin.length}
                isActive={i === pin.length && !error && !success}
                hasError={error && i < pin.length}
              />
            ))}
          </div>

          {/* Success glow overlay */}
          <AnimatePresence>
            {success && (
              <motion.div
                className="absolute inset-0 rounded-3xl bg-[#FFC107]/20 shadow-glow-gold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </AnimatePresence>

          {/* Lockout message */}
          {isLocked && (
            <div className="mb-6 text-center">
              <p className="text-sm font-sans text-danger-rose mb-1">
                Demasiados intentos. Espere {formatLockoutTime(lockoutTime)}
              </p>
              {totalLockouts >= 3 && (
                <p className="text-xs font-sans text-danger-rose/70">
                  Reinicie la aplicación para continuar.
                </p>
              )}
            </div>
          )}

          {/* Attempts warning */}
          {!isLocked && attemptsLeft <= 2 && attemptsLeft > 0 && (
            <p className="text-xs font-sans text-warning-amber text-center mb-4">
              {attemptsLeft} intento{attemptsLeft > 1 ? 's' : ''} restante
            </p>
          )}

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <KeypadButton
                key={num}
                label={num}
                onClick={() => addDigit(num)}
              />
            ))}
            <KeypadButton
              label={<Delete size={20} />}
              onClick={removeDigit}
              isAction
            />
            <KeypadButton label="0" onClick={() => addDigit('0')} />
            <KeypadButton label="C" onClick={clearPin} isAction />
          </div>

          {/* Recovery link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowRecovery(true)}
              className="text-[13px] font-sans text-white/50 hover:text-white/80 underline-offset-2 hover:underline transition-colors duration-200"
            >
              Olvidé mi PIN
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8">
          <Footer />
        </div>
      </motion.div>

      {/* Recovery Modal */}
      <AnimatePresence>
        {showRecovery && (
          <RecoveryModal onClose={() => setShowRecovery(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

/* ─── Main Auth Page ─── */
export default function AuthPage() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <div
      className="relative min-h-[100dvh] w-full overflow-hidden gradient-splash"
      style={{
        backgroundImage: `
          radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%),
          linear-gradient(135deg, #0F4C4B 0%, #14919B 40%, #0D7377 100%)
        `,
      }}
    >
      {/* Mist particles */}
      <MistParticles />

      {/* Content */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {showSplash ? (
            <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />
          ) : (
            <PinEntry key="pin" />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
