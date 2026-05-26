import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { LayoutDashboard, Users, Building2, Clock, CalendarDays, DollarSign, TrendingUp, BarChart3, LogOut, Settings, Menu, X } from 'lucide-react';

const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink to={to} className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}>
    <Icon className="w-4 h-4 flex-shrink-0" />
    <span>{label}</span>
  </NavLink>
);

export default function Sidebar({ open, onClose }) {
  const { user, logout, isHR } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  const hrLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/employees', icon: Users, label: 'Employees' },
    { to: '/departments', icon: Building2, label: 'Departments' },
    { to: '/attendance', icon: Clock, label: 'Attendance' },
    { to: '/leave', icon: CalendarDays, label: 'Leave Management' },
    { to: '/payroll', icon: DollarSign, label: 'Payroll' },
    { to: '/performance', icon: TrendingUp, label: 'Performance' },
    { to: '/reports', icon: BarChart3, label: 'Reports' },
  ];

  const employeeLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/attendance', icon: Clock, label: 'My Attendance' },
    { to: '/leave', icon: CalendarDays, label: 'My Leaves' },
    { to: '/payroll', icon: DollarSign, label: 'My Payslips' },
    { to: '/performance', icon: TrendingUp, label: 'My Performance' },
  ];

  const links = isHR ? hrLinks : employeeLinks;

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-slate-900 flex flex-col z-30 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/30">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div><p className="text-white font-bold text-sm leading-none">HRMS</p><p className="text-slate-400 text-xs mt-0.5">HR Management</p></div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">Navigation</p>
          {links.map(l => <NavItem key={l.to} {...l} />)}
        </div>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-3">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user?.fullName?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut className="w-4 h-4" /><span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
