/**
 * src/components/Sidebar.jsx
 * Collapsible desktop sidebar with navigation, staff info, and logout.
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
];

export default function Sidebar() {
  const { staff, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <aside className="sidebar w-60 min-h-screen flex-shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-brand-600/25 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-brand-400">
            <path fillRule="evenodd" d="M9.661 2.237a.531.531 0 01.678 0 11.947 11.947 0 007.078 2.749.5.5 0 01.479.425c.069.52.104 1.05.104 1.589 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 01-.332 0C5.26 16.563 2 12.162 2 7c0-.539.035-1.069.104-1.589a.5.5 0 01.48-.425 11.947 11.947 0 007.077-2.749z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">ID Admin</p>
          <p className="text-[10px] text-white/35 mt-0.5">Registrar Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
               ${isActive
                 ? 'bg-brand-600/20 text-brand-300 border border-brand-500/20'
                 : 'text-white/50 hover:text-white hover:bg-white/5'}`
            }
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Staff info + logout */}
      <div className="px-3 py-4 border-t border-white/5 space-y-3">
        {staff && (
          <div className="px-3 py-2.5 rounded-xl bg-white/[0.03]">
            <p className="text-sm font-semibold text-white truncate">{staff.name}</p>
            <p className="text-xs text-white/35 truncate">{staff.email}</p>
            <span className="mt-1 inline-block badge badge-active text-[10px] uppercase tracking-widest">
              {staff.role.replace('_', ' ')}
            </span>
          </div>
        )}
        <button
          id="sidebar-logout-btn"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                     text-sm text-white/40 hover:text-white hover:bg-white/5 transition-all"
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
