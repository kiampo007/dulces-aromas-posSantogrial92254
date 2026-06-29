import { useState, useCallback, useEffect, useRef } from 'react';

const DEFAULT_PIN = '2525';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30000;
const STORAGE_KEY_PIN = 'dulces-aromas-pin-hash';
const STORAGE_KEY_ATTEMPTS = 'dulces-aromas-pin-attempts';
const STORAGE_KEY_LOCKOUT = 'dulces-aromas-pin-lockout';
const STORAGE_KEY_LOCKOUT_COUNT = 'dulces-aromas-pin-lockout-count';

function hashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(16);
}

function getStoredPinHash(): string {
  const stored = localStorage.getItem(STORAGE_KEY_PIN);
  if (stored) return stored;
  const defaultHash = hashPin(DEFAULT_PIN);
  localStorage.setItem(STORAGE_KEY_PIN, defaultHash);
  return defaultHash;
}

interface PinAuthState {
  pin: string;
  error: boolean;
  success: boolean;
  isLocked: boolean;
  lockoutTime: number;
  attemptsLeft: number;
  totalLockouts: number;
}

export function usePinAuth() {
  const [state, setState] = useState<PinAuthState>({
    pin: '',
    error: false,
    success: false,
    isLocked: false,
    lockoutTime: 0,
    attemptsLeft: MAX_ATTEMPTS,
    totalLockouts: 0,
  });

  const lockoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearLockoutTimer = useCallback(() => {
    if (lockoutTimerRef.current) {
      clearInterval(lockoutTimerRef.current);
      lockoutTimerRef.current = null;
    }
  }, []);

  const startLockoutTimer = useCallback((endTime: number) => {
    clearLockoutTimer();
    lockoutTimerRef.current = setInterval(() => {
      const remaining = endTime - Date.now();
      if (remaining <= 0) {
        clearLockoutTimer();
        setState(prev => ({
          ...prev,
          isLocked: false,
          lockoutTime: 0,
          attemptsLeft: MAX_ATTEMPTS,
          pin: '',
        }));
        localStorage.removeItem(STORAGE_KEY_LOCKOUT);
      } else {
        setState(prev => ({
          ...prev,
          lockoutTime: remaining,
        }));
      }
    }, 100);
  }, [clearLockoutTimer]);

  useEffect(() => {
    const lockoutEnd = localStorage.getItem(STORAGE_KEY_LOCKOUT);
    const attemptsStored = localStorage.getItem(STORAGE_KEY_ATTEMPTS);
    const lockoutCount = localStorage.getItem(STORAGE_KEY_LOCKOUT_COUNT);

    const totalLockouts = parseInt(lockoutCount || '0', 10);

    if (totalLockouts >= 3) {
      setState(prev => ({
        ...prev,
        isLocked: true,
        totalLockouts,
      }));
      return;
    }

    if (lockoutEnd) {
      const endTime = parseInt(lockoutEnd, 10);
      if (Date.now() < endTime) {
        setState(prev => ({
          ...prev,
          isLocked: true,
          lockoutTime: endTime - Date.now(),
          attemptsLeft: 0,
          totalLockouts,
        }));
        startLockoutTimer(endTime);
      } else {
        localStorage.removeItem(STORAGE_KEY_LOCKOUT);
        setState(prev => ({
          ...prev,
          attemptsLeft: MAX_ATTEMPTS,
          totalLockouts,
        }));
      }
    } else if (attemptsStored) {
      const attempts = parseInt(attemptsStored, 10);
      setState(prev => ({
        ...prev,
        attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempts),
        totalLockouts,
      }));
    }

    return () => clearLockoutTimer();
  }, [startLockoutTimer, clearLockoutTimer]);

  const addDigit = useCallback((digit: string) => {
    setState(prev => {
      if (prev.isLocked || prev.success || prev.pin.length >= 4) return prev;
      const newPin = prev.pin + digit;
      return { ...prev, pin: newPin, error: false };
    });
  }, []);

  const removeDigit = useCallback(() => {
    setState(prev => {
      if (prev.isLocked || prev.success) return prev;
      return { ...prev, pin: prev.pin.slice(0, -1), error: false };
    });
  }, []);

  const clearPin = useCallback(() => {
    setState(prev => {
      if (prev.isLocked || prev.success) return prev;
      return { ...prev, pin: '', error: false };
    });
  }, []);

  const submitPin = useCallback(() => {
    setState(prev => {
      if (prev.isLocked || prev.success || prev.pin.length !== 4) return prev;

      const storedHash = getStoredPinHash();
      const inputHash = hashPin(prev.pin);

      if (inputHash === storedHash) {
        localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
        return { ...prev, success: true, error: false };
      }

      const newAttemptsMade = MAX_ATTEMPTS - prev.attemptsLeft + 1;
      localStorage.setItem(STORAGE_KEY_ATTEMPTS, newAttemptsMade.toString());

      if (newAttemptsMade >= MAX_ATTEMPTS) {
        const lockoutEnd = Date.now() + LOCKOUT_DURATION;
        localStorage.setItem(STORAGE_KEY_LOCKOUT, lockoutEnd.toString());
        const newLockoutCount = prev.totalLockouts + 1;
        localStorage.setItem(STORAGE_KEY_LOCKOUT_COUNT, newLockoutCount.toString());

        return {
          ...prev,
          error: true,
          isLocked: true,
          lockoutTime: LOCKOUT_DURATION,
          attemptsLeft: 0,
          totalLockouts: newLockoutCount,
        };
      }

      return {
        ...prev,
        error: true,
        pin: '',
        attemptsLeft: MAX_ATTEMPTS - newAttemptsMade,
      };
    });
  }, []);

  const resetAttempts = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
    localStorage.removeItem(STORAGE_KEY_LOCKOUT);
    localStorage.removeItem(STORAGE_KEY_LOCKOUT_COUNT);
    clearLockoutTimer();
    setState({
      pin: '',
      error: false,
      success: false,
      isLocked: false,
      lockoutTime: 0,
      attemptsLeft: MAX_ATTEMPTS,
      totalLockouts: 0,
    });
  }, [clearLockoutTimer]);

  useEffect(() => {
    if (state.pin.length === 4 && !state.success && !state.isLocked) {
      const timer = setTimeout(() => {
        submitPin();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [state.pin, state.success, state.isLocked, submitPin]);

  return {
    ...state,
    addDigit,
    removeDigit,
    clearPin,
    submitPin,
    resetAttempts,
  };
}
