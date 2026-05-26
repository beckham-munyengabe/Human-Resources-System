import React, { useEffect, useState } from 'react';
import { Users, Clock, CalendarDays, DollarSign, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import API from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { format } from 'date-fns';

const COLORS = ['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

export default function Dashboard() {
  const { user, isHR } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isHR) {
      API.get('/reports/dashboard').then(res => { setStats(res.data.stats); setLoading(false); }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isHR]);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  if (!isHR) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.fullName?.split(' ')[0]}!</h1>
          <p className="text-slate-500 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <EmployeeQuickAction />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">HR Dashboard</h1>
        <p className="text-slate-500 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total Employees" value={stats?.totalEmployees || 0} color="primary" sub="Active staff" />
        <StatCard icon={Clock} label="Present Today" value={stats?.todayAttendance || 0} color="emerald" sub={`${stats?.attendanceRate || 0}% attendance rate`} />
        <StatCard icon={CalendarDays} label="Pending Leaves" value={stats?.pendingLeaves || 0} color="amber" sub="Awaiting approval" />
        <StatCard icon={DollarSign} label="Monthly Payroll" value={`$${(stats?.totalPayroll || 0).toLocaleString()}`} color="purple" sub="This month" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {stats?.deptStats?.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-slate-800 mb-4">Employees by Department</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.deptStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#2563eb" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="card">
          <h3 className="font-bold text-slate-800 mb-4">Pending Leave Requests</h3>
          {stats?.recentLeaves?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <CheckCircle className="w-10 h-10 mb-2" /><p className="text-sm">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.recentLeaves?.map(leave => (
                <div key={leave._id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {leave.employee?.fullName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{leave.employee?.fullName}</p>
                    <p className="text-xs text-slate-500">{leave.leaveType} Leave</p>
                  </div>
                  <span className="badge-warning">Pending</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0"><CheckCircle className="w-5 h-5" /></div>
          <div><p className="text-xl font-bold text-slate-900">{stats?.todayAttendance}</p><p className="text-sm text-slate-500">On Time Today</p></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0"><AlertCircle className="w-5 h-5" /></div>
          <div><p className="text-xl font-bold text-slate-900">{stats?.lateToday || 0}</p><p className="text-sm text-slate-500">Late Arrivals</p></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center flex-shrink-0"><XCircle className="w-5 h-5" /></div>
          <div><p className="text-xl font-bold text-slate-900">{(stats?.totalEmployees || 0) - (stats?.todayAttendance || 0)}</p><p className="text-sm text-slate-500">Absent Today</p></div>
        </div>
      </div>
    </div>
  );
}

function EmployeeQuickAction() {
  return (
    <div className="col-span-full">
      <div className="card text-center py-12">
        <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Welcome to HRMS</h2>
        <p className="text-slate-500 mt-2">Use the sidebar to navigate to your modules.</p>
      </div>
    </div>
  );
}
