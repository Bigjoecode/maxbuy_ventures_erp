'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

const inputCls =
  'w-full rounded-[10px] border-[1.5px] border-[#e2e8e4] px-3.5 py-2.5 text-sm text-[#111] outline-none transition-colors focus:border-[var(--green)]';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Request failed');
        return;
      }
      toast.success('If the account exists, a code was sent.');
      setStep('reset');
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Reset failed');
        return;
      }
      toast.success('Password reset. Please log in.');
      router.push('/login');
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0d2b1f 0%, #071410 100%)' }}
    >
      <div className="w-[90%] max-w-sm rounded-[20px] bg-white p-10 shadow-2xl">
        <h1 className="font-display text-[22px] font-extrabold text-[#0d2b1f]">Reset password</h1>
        <p className="mb-7 text-[13px] text-[#6b7e74]">
          {step === 'request'
            ? 'Enter your username — we will send a reset code to your registered phone.'
            : `Enter the 6-digit code sent to your phone and choose a new password.`}
        </p>

        {step === 'request' ? (
          <form onSubmit={requestCode} className="flex flex-col gap-3">
            <input
              className={inputCls}
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
            <button
              type="submit"
              disabled={loading || !username}
              className="w-full rounded-[10px] bg-[var(--green)] py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--green-dark)] disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send reset code'}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="flex flex-col gap-3">
            <input
              className={inputCls}
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
            <input
              className={inputCls}
              type="password"
              placeholder="New password (min 8 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            <button
              type="submit"
              disabled={loading || code.length !== 6 || newPassword.length < 8}
              className="w-full rounded-[10px] bg-[var(--green)] py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--green-dark)] disabled:opacity-60"
            >
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        )}

        {error && <p className="mt-3 text-xs text-[var(--red)]">❌ {error}</p>}

        <p className="mt-4 text-center text-[12px] text-gray-400">
          <Link href="/login" className="text-[var(--green)] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
