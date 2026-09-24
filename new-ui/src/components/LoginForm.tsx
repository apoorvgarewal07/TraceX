import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Shield, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function LoginForm({ onSuccess, redirectTo = '/' }: LoginFormProps) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await login({ username: username.trim(), password });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (err: any) {
      const detail =
        err.response?.data?.detail ||
        (err.response?.status === 401
          ? 'Invalid investigator credentials. Access denied.'
          : err.message || 'Authentication failed');
      setErrorMessage(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  const setPresetUser = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
  };

  return (
    <div className="w-full max-w-md rounded-xl border border-[#2E2B32] bg-[#161418] p-8 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#B8935F]/40 bg-[#1F1B22] text-[#B8935F]">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#EDE8DE] tracking-wide">Investigator Sign-In</h2>
          <p className="text-xs text-[#A8A399]">Indian Cyber Crime Coordination Centre (I4C)</p>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-[#522329] bg-[#2A1519] p-3 text-xs text-[#E24A4A]">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#A8A399] uppercase tracking-wider mb-1.5">
            Username / Officer ID
          </label>
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. investigator"
              className="w-full rounded-lg border border-[#2E2B32] bg-[#1C1A1E] px-3.5 py-2.5 pl-10 text-xs text-[#EDE8DE] placeholder-[#7E7972] focus:border-[#B8935F] focus:outline-none transition-colors"
              disabled={isSubmitting}
              autoFocus
            />
            <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#7E7972]" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#A8A399] uppercase tracking-wider mb-1.5">
            Clearance Passcode
          </label>
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-lg border border-[#2E2B32] bg-[#1C1A1E] px-3.5 py-2.5 pl-10 text-xs text-[#EDE8DE] placeholder-[#7E7972] focus:border-[#B8935F] focus:outline-none transition-colors"
              disabled={isSubmitting}
            />
            <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#7E7972]" />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-[#B8935F] px-4 py-2.5 text-xs font-semibold text-[#131114] hover:bg-[#CFAC78] disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
        >
          {isSubmitting ? (
            <span>Verifying Credentials...</span>
          ) : (
            <>
              <span>Authenticate & Enter Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Preset account quick-fill for local testing */}
      <div className="mt-6 pt-5 border-t border-[#252229]">
        <div className="text-[11px] text-[#7E7972] mb-2 font-medium">Quick Fill (Dev / Demo Roles):</div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setPresetUser('investigator', 'testpass')}
            className="px-2 py-1.5 rounded bg-[#1F1C22] hover:bg-[#2A262F] text-[11px] text-[#A8A399] hover:text-[#EDE8DE] border border-[#2E2B32] transition-colors"
          >
            Investigator
          </button>
          <button
            type="button"
            onClick={() => setPresetUser('supervisor', 'testpass')}
            className="px-2 py-1.5 rounded bg-[#1F1C22] hover:bg-[#2A262F] text-[11px] text-[#A8A399] hover:text-[#EDE8DE] border border-[#2E2B32] transition-colors"
          >
            Supervisor
          </button>
          <button
            type="button"
            onClick={() => setPresetUser('admin', 'testpass')}
            className="px-2 py-1.5 rounded bg-[#1F1C22] hover:bg-[#2A262F] text-[11px] text-[#A8A399] hover:text-[#EDE8DE] border border-[#2E2B32] transition-colors"
          >
            Admin
          </button>
        </div>
      </div>
    </div>
  );
}
