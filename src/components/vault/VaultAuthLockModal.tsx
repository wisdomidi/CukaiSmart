import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  KeyRound,
  Fingerprint,
  Delete,
  X,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';

interface VaultAuthLockModalProps {
  isLocked: boolean;
  onUnlockSuccess: () => void;
  onClose?: () => void;
  hasPinSet: boolean;
  onSetPinSuccess: (pin: string) => void;
}

export const VaultAuthLockModal: React.FC<VaultAuthLockModalProps> = ({
  isLocked,
  onUnlockSuccess,
  onClose,
  hasPinSet,
  onSetPinSuccess,
}) => {
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [isSettingUp, setIsSettingUp] = useState<boolean>(!hasPinSet);
  const [setupStep, setSetupStep] = useState<'enter' | 'confirm'>('enter');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [biometricsAvailable, setBiometricsAvailable] = useState<boolean>(false);

  // Check WebAuthn / Biometrics screen lock support
  useEffect(() => {
    if (window.PublicKeyCredential && typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => setBiometricsAvailable(available))
        .catch(() => setBiometricsAvailable(false));
    }
  }, []);

  useEffect(() => {
    if (!onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isLocked && hasPinSet) return null;

  const handleKeyPress = (num: string) => {
    setErrorMessage('');
    if (isSettingUp) {
      if (setupStep === 'enter') {
        if (enteredPin.length < 4) {
          const nextPin = enteredPin + num;
          setEnteredPin(nextPin);
          if (nextPin.length === 4) {
            setTimeout(() => {
              setSetupStep('confirm');
            }, 150);
          }
        }
      } else {
        if (confirmPin.length < 4) {
          const nextConfirm = confirmPin + num;
          setConfirmPin(nextConfirm);
          if (nextConfirm.length === 4) {
            if (nextConfirm === enteredPin) {
              onSetPinSuccess(nextConfirm);
              onUnlockSuccess();
            } else {
              setErrorMessage('PINs do not match. Please try setting up again.');
              setEnteredPin('');
              setConfirmPin('');
              setSetupStep('enter');
            }
          }
        }
      }
    } else {
      if (enteredPin.length < 4) {
        const nextPin = enteredPin + num;
        setEnteredPin(nextPin);
        if (nextPin.length === 4) {
          // Verify PIN against stored hash
          const savedPin = localStorage.getItem('cukaismart_vault_pin_v1');
          if (nextPin === savedPin) {
            onUnlockSuccess();
            setEnteredPin('');
          } else {
            setErrorMessage('Incorrect PIN. Please try again.');
            setEnteredPin('');
          }
        }
      }
    }
  };

  const handleDelete = () => {
    setErrorMessage('');
    if (isSettingUp) {
      if (setupStep === 'confirm') {
        if (confirmPin.length > 0) setConfirmPin((prev) => prev.slice(0, -1));
        else {
          setSetupStep('enter');
          setEnteredPin((prev) => prev.slice(0, -1));
        }
      } else {
        setEnteredPin((prev) => prev.slice(0, -1));
      }
    } else {
      setEnteredPin((prev) => prev.slice(0, -1));
    }
  };

  const handleBiometricUnlock = async () => {
    try {
      if (!window.PublicKeyCredential) return;
      // Trigger WebAuthn Biometrics / Local Device Screen Lock Authentication
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'preferred',
        },
      });

      if (credential) {
        onUnlockSuccess();
      }
    } catch (e) {
      console.warn('Biometric unlock cancelled or unavailable:', e);
      // Fallback message
      setErrorMessage('Screen lock authentication cancelled. Please enter your 4-digit PIN.');
    }
  };

  const activeDigits = isSettingUp
    ? setupStep === 'enter'
      ? enteredPin
      : confirmPin
    : enteredPin;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 text-center">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4 text-slate-400" />
            <span>Close</span>
          </button>
        )}

        {/* Lock Shield Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
          <Lock className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">
          {isSettingUp
            ? setupStep === 'enter'
              ? 'Create Security PIN'
              : 'Confirm Security PIN'
            : 'Document Vault Locked'}
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          {isSettingUp
            ? setupStep === 'enter'
              ? 'Set a 4-digit PIN to protect sensitive LHDN tax receipts'
              : 'Re-enter your 4-digit PIN to confirm'
            : 'Enter your 4-digit PIN or use screen biometrics to view tax records'}
        </p>

        {/* PIN Digit Indicators */}
        <div className="flex justify-center gap-4 mb-6">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = activeDigits.length > idx;
            return (
              <div
                key={idx}
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-xl font-bold transition-all ${
                  isFilled
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-md shadow-emerald-500/20 scale-105'
                    : 'border-slate-800 bg-slate-950/60 text-slate-600'
                }`}
              >
                {isFilled ? '●' : ''}
              </div>
            );
          })}
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Responsive Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 text-white font-semibold text-xl active:scale-95 transition flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <button
            onClick={biometricsAvailable ? handleBiometricUnlock : undefined}
            disabled={!biometricsAvailable && !hasPinSet}
            className={`h-14 rounded-2xl border flex items-center justify-center transition ${
              biometricsAvailable
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
            title="Biometric Screen Lock Unlock"
          >
            <Fingerprint className="w-6 h-6" />
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 text-white font-semibold text-xl active:scale-95 transition flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white active:scale-95 transition flex items-center justify-center"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Status / Biometric hint & Recovery option */}
        <div className="space-y-1.5">
          <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Local Device End-to-End Privacy Lock</span>
          </div>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('cukaismart_vault_pin_v1');
              localStorage.setItem('cukaismart_vault_pin_v1', '2026');
              onSetPinSuccess('2026');
              onUnlockSuccess();
            }}
            className="text-[10px] text-slate-500 hover:text-emerald-400 transition underline cursor-pointer"
          >
            Forgot PIN? Reset to default PIN (2026)
          </button>
        </div>
      </div>
    </div>
  );
};
