import React, { useEffect, useState, useCallback } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, LogIn, LogOut, Calendar, Filter } from 'lucide-react';
import API from '../../api/axios.js';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { format, parseISO } from 'date-fns';

const STATUS_BADGE = {
  present: 'badge-success', late: 'badge-warning', absent: 'badge-danger', 'half-day': 'badge-info', holiday: 'badge-gray'
};

export default function Attendance() {
  const { isHR } = useAuth();
  const [records, setRecords] = useState([]);
  const [today, setToday] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [departments, setDepartments] = useState([]);
  const [deptFilter, setDeptFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isHR) {
        const res = await API.get('/attendance', { params: { month, year, department: deptFilter || undefined } });
        setRecords(res.data.attendance);
        setStats(res.data.stats || {});
      } else {
        const res = await API.get('/attendance/my', { params: { month, year } });
        setRecords(res.data.attendance);
        setToday(res.data.today);
      }
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  }, [isHR, month, year, deptFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (isHR) API.get('/departments').then(r => setDepartments(r.data.departments)); }, [isHR]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try { await API.post('/attendance/checkin'); toast.success('Checked in successfully!'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Check-in failed'); }
    finally { setActionLoading(false); }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try { await API.post('/attendance/checkout'); toast.success('Checked out successfully!'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Check-out failed'); }
    finally { setActionLoading(false); }
  };

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  if (loading) return <LoadingSpinner text="Loading attendance..." />;

  return (
    <div>
      <PageHeader title={isHR ? 'Attendance Management' : 'My Attendance'} subtitle={`${months[month-1]} ${year}`} />

      {!isHR && (
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-1">
              <p className="text-sm text-slate-500 mb-1">Today, {format(new Date(), 'EEEE, MMMM d')}</p>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-slate-400">Check In</p>
                  <p className="font-bold text-slate-800 text-lg">{today?.checkIn ? format(parseISO(today.checkIn), 'hh:mm a') : '--:--'}</p>
                </div>
                <div className="w-px h-10 bg-slate-100" />
                <div>
                  <p className="text-xs text-slate-400">Check Out</p>
                  <p className="font-bold text-slate-800 text-lg">{today?.checkOut ? format(parseISO(today.checkOut), 'hh:mm a') : '--:--'}</p>
                </div>
                <div className="w-px h-10 bg-slate-100" />
                <div>
                  <p className="text-xs text-slate-400">Total Hours</p>
                  <p className="font-bold text-slate-800 text-lg">{today?.totalHours?.toFixed(1) || '0.0'}h</p>
                </div>
                {today?.status && (
                  <span className={STATUS_BADGE[today.status]}>{today.status}</span>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCheckIn} disabled={actionLoading || today?.checkIn}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${today?.checkIn ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200'}`}>
                <LogIn className="w-4 h-4" />{today?.checkIn ? 'Checked In' : 'Check In'}
              </button>
              <button onClick={handleCheckOut} disabled={actionLoading || !today?.checkIn || today?.checkOut}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${(!today?.checkIn || today?.checkOut) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-200'}`}>
                <LogOut className="w-4 h-4" />{today?.checkOut ? 'Checked Out' : 'Check Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isHR && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard icon={CheckCircle} label="Present" value={stats.present || 0} color="emerald" />
          <StatCard icon={XCircle} label="Absent" value={stats.absent || 0} color="red" />
          <StatCard icon={AlertCircle} label="Late" value={stats.late || 0} color="amber" />
          <StatCard icon={Clock} label="Half Day" value={stats.halfDay || 0} color="primary" />
        </div>
      )}

      <div className="card mb-4">
        <div className="flex flex-wrap gap-3">
          <select className="input w-auto" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
            {months.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="input w-28" value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {[2023,2024,2025,2026].map(y => <option key={y}>{y}</option>)}
          </select>
          {isHR && (
            <select className="input w-auto" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {(isHR ? ['Employee','Date','Check In','Check Out','Hours','OT Hours','Status','Late?'] : ['Date','Check In','Check Out','Hours','OT Hours','Status','Late?']).map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {records.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400">No attendance records found</td></tr>
              ) : records.map(rec => (
                <tr key={rec._id} className="hover:bg-slate-50 transition-colors">
                  {isHR && (
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">{rec.employee?.fullName?.charAt(0)}</div>
                        <div><p className="text-sm font-medium text-slate-800">{rec.employee?.fullName}</p><p className="text-xs text-slate-400">{rec.employee?.employeeId}</p></div>
                      </div>
                    </td>
                  )}
                  <td className="table-cell font-medium">{format(parseISO(rec.date), 'MMM d, yyyy')}</td>
                  <td className="table-cell">{rec.checkIn ? format(parseISO(rec.checkIn), 'hh:mm a') : <span className="text-slate-300">--</span>}</td>
                  <td className="table-cell">{rec.checkOut ? format(parseISO(rec.checkOut), 'hh:mm a') : <span className="text-slate-300">--</span>}</td>
                  <td className="table-cell font-medium">{rec.totalHours?.toFixed(1) || 0}h</td>
                  <td className="table-cell">{rec.overtimeHours > 0 ? <span className="text-emerald-600 font-medium">{rec.overtimeHours?.toFixed(1)}h</span> : <span className="text-slate-300">0h</span>}</td>
                  <td className="table-cell"><span className={STATUS_BADGE[rec.status] || 'badge-gray'}>{rec.status}</span></td>
                  <td className="table-cell">{rec.isLate ? <span className="text-amber-600 font-medium">{rec.lateMinutes}m late</span> : <span className="text-slate-300">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
