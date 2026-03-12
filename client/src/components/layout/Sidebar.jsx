import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  HiOutlineChartPie,
  HiOutlineCube,
  HiOutlineBookOpen,
  HiOutlineCurrencyDollar,
  HiOutlineCalculator,
  HiOutlineScale,
  HiOutlineDocumentReport,
  HiOutlineTrash,
  HiOutlineStar,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineTruck,
  HiOutlineUserGroup,
  HiOutlineQuestionMarkCircle,
  HiOutlineSun,
  HiOutlineMoon,
} from 'react-icons/hi';

const navItems = [
  { to: '/', icon: HiOutlineChartPie, label: 'Dashboard' },
  { to: '/inventory', icon: HiOutlineCube, label: 'Inventory' },
  { to: '/recipes', icon: HiOutlineBookOpen, label: 'Recipes' },
  { to: '/sales', icon: HiOutlineCurrencyDollar, label: 'Sales' },
  { to: '/food-cost', icon: HiOutlineCalculator, label: 'Food Cost' },
  { to: '/variance', icon: HiOutlineScale, label: 'Variance' },
  { to: '/reports', icon: HiOutlineDocumentReport, label: 'Reports' },
  { to: '/waste', icon: HiOutlineTrash, label: 'Waste Tracking' },
  { to: '/menu-engineering', icon: HiOutlineStar, label: 'Menu Engineering' },
  { to: '/suppliers', icon: HiOutlineTruck, label: 'Suppliers' },
  { to: '/users', icon: HiOutlineUserGroup, label: 'Users' },
  { to: '/help', icon: HiOutlineQuestionMarkCircle, label: 'Help & SOP' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  const SidebarContent = () => (
    <>
      <div className="px-4 py-6 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white tracking-tight">
          🍽️ FoodControl<span className="text-blue-400">Pro</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">Food Cost Management</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={linkClass} onClick={() => setMobileOpen(false)}>
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-700">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.full_name || user?.username}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors w-full"
        >
          {dark ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
          {dark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors w-full mt-2"
        >
          <HiOutlineLogout className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-gray-800 text-white p-2 rounded-lg shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-800 flex flex-col transform transition-transform lg:transform-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
