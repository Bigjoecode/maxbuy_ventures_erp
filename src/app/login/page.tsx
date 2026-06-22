'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('maxbuy2024');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
        return;
      }
      setAuth(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      router.push('/dashboard');
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
        <div className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-[var(--green)] text-[26px]">
          🛒
        </div>
        <h1 className="font-display text-[22px] font-extrabold text-[#0d2b1f]">Maxbuy Ventures</h1>
        <p className="mb-7 text-[13px] text-[#6b7e74]">Business Management System — Sign in to continue</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            className="w-full rounded-[10px] border-[1.5px] border-[#e2e8e4] px-3.5 py-2.5 text-sm text-[#111] outline-none transition-colors focus:border-[var(--green)]"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="w-full rounded-[10px] border-[1.5px] border-[#e2e8e4] px-3.5 py-2.5 text-sm text-[#111] outline-none transition-colors focus:border-[var(--green)]"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[10px] bg-[var(--green)] py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--green-dark)] disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          {error && <p className="text-xs text-[var(--red)]">❌ {error}</p>}
        </form>

        <p className="mt-4 text-center text-[11px] text-gray-400">
          Demo: admin / maxbuy2024 &nbsp;|&nbsp; Staff: amara / staff123
        </p>
      </div>
    </div>
  );
}
