/**
 * src/routes/ProtectedRoute.jsx
 * Guards routes that require registrar_admin role.
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, staff } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (staff && staff.role !== 'registrar_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="panel max-w-sm w-full p-8 flex flex-col items-center gap-5 text-center animate-slide-up">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-14 h-14 text-red-400"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
              clipRule="evenodd"
            />
          </svg>

          <div>
            <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-sm text-white/60 leading-relaxed">
              Your account role (<span className="font-mono text-white/80">{staff.role}</span>) is
              not authorised to access the admin portal.
            </p>
          </div>

          <p className="text-xs text-white/30">
            Logged in as <span className="text-white/50">{staff.email}</span>
          </p>
        </div>
      </div>
    );
  }

  return children;
}
