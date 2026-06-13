import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  FolderOpen,
  ShoppingCart,
  History,
  LogOut,
  User as UserIcon,
  Store
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/products', label: 'Produk', icon: ShoppingBag },
    { to: '/admin/categories', label: 'Kategori', icon: FolderOpen },
  ];

  const cashierLinks = [
    { to: '/cashier', label: 'POS Kasir', icon: ShoppingCart },
    { to: '/cashier/history', label: 'Riwayat', icon: History },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="bg-indigo-600 p-2 rounded-lg text-white">
          <Store className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none text-indigo-400">Rayyan POS</h1>
          <span className="text-xs text-slate-500 font-medium">Real-Time System</span>
        </div>
      </div>

      {/* User Session Info */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex items-center space-x-3">
        <div className="bg-slate-800 h-9 w-9 rounded-full flex items-center justify-center text-indigo-400 border border-slate-700">
          <UserIcon className="h-5 w-5" />
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-semibold truncate leading-tight">{user?.name}</p>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 mt-1 inline-block rounded bg-indigo-900/40 text-indigo-300 border border-indigo-800/50">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {isAdmin && (
          <div>
            <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Menu Admin
            </span>
            {adminLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/admin'}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`
                  }
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}

        <div className={isAdmin ? 'mt-6' : ''}>
          <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Menu Kasir
          </span>
          {cashierLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/cashier'}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-all border border-transparent hover:border-rose-900/30"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
