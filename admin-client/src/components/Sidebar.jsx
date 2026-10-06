/**
 * src/components/Sidebar.jsx
 * Sidebar with navigation, staff info, and logout. Docked at `lg:` and up;
 * below that it is an off-canvas drawer controlled by `open` / `onClose`.
 */
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    to: '/students',
    label: 'Students',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
      </svg>
    ),
  },
  {
    to: '/logs',
    label: 'Audit Logs',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    to: '/locations',
    label: 'Locations',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
      </svg>
    ),
  },
];

export default function Sidebar({ open = false, onClose }) {
  const { staff, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <aside
      id="admin-sidebar"
      className={`sidebar fixed inset-y-0 left-0 z-40 w-64 max-w-[85vw] overflow-y-auto
                  transition-transform duration-200 ease-out
                  ${open ? 'translate-x-0' : '-translate-x-full'}
                  lg:static lg:z-auto lg:translate-x-0 lg:w-60 lg:max-w-none lg:min-h-screen lg:flex-shrink-0 lg:overflow-visible`}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-900/5 dark:border-white/5">
        <img
          src="/logo.png"
          alt="University Logo"
          className="w-9 h-9 object-contain flex-shrink-0 drop-shadow"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-black dark:text-white leading-none">ID Admin</p>
          <p className="text-[10px] text-black dark:text-white/35 mt-0.5">Registrar Portal</p>
        </div>
        <button
          id="sidebar-close-btn"
          type="button"
          onClick={onClose}
          aria-label="Close navigation menu"
          className="lg:hidden -mr-2 inline-flex items-center justify-center w-11 h-11 rounded-xl text-black dark:text-white hover:bg-slate-900/5 dark:hover:bg-white/10 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-xl text-sm font-medium transition-all duration-150
               ${isActive
                 ? 'bg-brand-600/20 text-black dark:text-brand-300 border border-brand-500/20'
                 : 'text-black dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5'}`
            }
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Staff info + logout */}
      <div className="px-3 py-4 border-t border-slate-900/5 dark:border-white/5 space-y-3">
        {staff && (
          <div className="px-3 py-2.5 rounded-xl bg-slate-900/[0.03] dark:bg-white/[0.03]">
            <p className="text-sm font-semibold text-black dark:text-white truncate">{staff.name}</p>
            <p className="text-xs text-black dark:text-white/35 truncate">{staff.email}</p>
            <span className="mt-1 inline-block badge badge-active text-[10px] uppercase tracking-widest">
              {staff.role.replace('_', ' ')}
            </span>
          </div>
        )}
        <button
          id="sidebar-logout-btn"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-3 min-h-[44px] rounded-xl
                     text-sm text-black dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-1.08a.75.75 0 10-1.004-1.114l-2.5 2.571.002.002a.75.75 0 000 1.11l-.001.001 2.5 2.572a.75.75 0 101.004-1.114l-1.048-1.08H18.25A.75.75 0 0019 10z" clipRule="evenodd" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
