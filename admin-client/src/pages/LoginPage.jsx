/**
 * src/pages/LoginPage.jsx
 * Admin login — checks role === 'registrar_admin' after successful auth.
 */
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const staff = await login(email.trim(), password);
      if (staff.role !== 'registrar_admin') {
        setError('This portal is for registrar admins only. Your account does not have admin access.');
        setLoading(false);
        return;
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Brand */}
      <div className="flex flex-col items-center gap-3 mb-10 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
            className="w-9 h-9 text-brand-400">
            <path fillRule="evenodd" d="M9.661 2.237a.531.531 0 01.678 0 11.947 11.947 0 007.078 2.749.5.5 0 01.479.425A12.94 12.94 0 0118 7c0 5.163-3.26 9.563-7.834 11.256a.48.48 0 01-.332 0C5.26 16.563 2 12.163 2 7c0-.539.035-1.069.104-1.589a.5.5 0 01.48-.425 11.947 11.947 0 007.077-2.749z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-white">Admin Portal</h1>
          <p className="text-sm text-white/40 mt-1">Student ID Validation System</p>
        </div>
      </div>

      {/* Card */}
      <div className="panel w-full max-w-sm p-8 animate-slide-down">
        <h2 className="text-lg font-bold text-white mb-1">Registrar Sign In</h2>
        <p className="text-xs text-white/35 mb-6">Restricted to registrar_admin accounts</p>

        {error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl bg-red-500/15 border border-red-500/25
                   text-red-300 text-sm px-4 py-3 mb-5 animate-fade-in leading-relaxed">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mt-0.5 flex-shrink-0">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form id="admin-login-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-1.5">Email</label>
            <input id="email" type="email" autoComplete="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} disabled={loading}
              placeholder="registrar@university.edu" className="input-field" />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-1.5">Password</label>
            <div className="relative">
              <input id="password" type={showPwd ? 'text' : 'password'} autoComplete="current-password"
                required value={password} onChange={(e) => setPassword(e.target.value)}
                disabled={loading} placeholder="••••••••" className="input-field pr-12" />
              <button type="button" id="toggle-pwd" tabIndex={-1}
                onClick={() => setShowPwd((v) => !v)}
                className="absolute inset-y-0 right-0 px-4 text-white/30 hover:text-white/60 transition-colors">
                {showPwd
                  ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd" /><path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" /></svg>
                  : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" /></svg>
                }
              </button>
            </div>
          </div>
          <button id="login-submit" type="submit" disabled={loading || !email || !password} className="btn-primary w-full mt-2">
            {loading
              ? <svg className="animate-spin-slow w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
              : 'Sign In to Admin Portal'
            }
          </button>
        </form>
      </div>
    </div>
  );
}
