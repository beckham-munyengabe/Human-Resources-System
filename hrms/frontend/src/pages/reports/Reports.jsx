import React, { useState } from 'react';
import { Download, FileText, Users, Clock, DollarSign, CalendarDays, BarChart3, Loader } from 'lucide-react';
import API from '../../api/axios.js';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader.jsx';

const MONTHS = ['','January','February','March','April','May','June','July','August','September','October','November','December'];

const ReportCard = ({ icon: Icon, title, description, color, children, onDownload, loading }) => {
  const colors = {
    blue: 'from-blue-500 to-primary-600',
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-600',
    purple: 'from-purple-500 to-violet-600',
  };
  return (
    <div className="card hover:shadow-lg transition-all duration-200 flex flex-col">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colors[color]} flex items-center justify-center mb-4 shadow-sm`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 mb-5 flex-1">{description}</p>
      <div className="space-y-3">{children}</div>
      <button onClick={onDownload} disabled={loading}
        className="mt-4 w-full btn-primary justify-center disabled:opacity-50">
        {loading ? <><Loader className="w-4 h-4 animate-spin" />Generating PDF...</> : <><Download className="w-4 h-4" />Download PDF</>}
      </button>
    </div>
  );
};

export default function Reports() {
  const [empFilters, setEmpFilters] = useState({ department: '', status: '' });
  const [attFilters, setAttFilters] = useState({ month: new Date().getMonth()+1, year: new Date().getFullYear() });
  const [payFilters, setPayFilters] = useState({ month: new Date().getMonth()+1, year: new Date().getFullYear() });
  const [leaveFilters, setLeaveFilters] = useState({ year: new Date().getFullYear() });
  const [loading, setLoading] = useState({ employees:false, attendance:false, payroll:false, leaves:false });

  const download = async (type, params) => {
    setLoading(l => ({...l, [type]: true}));
    try {
      const res = await API.get(`/reports/${type}`, { params: { ...params, format: 'pdf' }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-report-${Date.now()}.pdf`);
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded!');
    } catch { toast.error('Failed to generate report'); }
    finally { setLoading(l => ({...l, [type]: false})); }
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle="Generate and download detailed PDF reports" />

      <div className="mb-6 p-4 bg-primary-50 border border-primary-100 rounded-xl flex items-start gap-3">
        <BarChart3 className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-primary-800">PDF Report Generation</p>
          <p className="text-xs text-primary-600 mt-0.5">Configure filters below, then click "Download PDF" to generate and save a professional report. Reports include all relevant data formatted for print.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Employee Report */}
        <ReportCard icon={Users} title="Employee Report" description="Complete list of employees with their personal info, positions, departments, and statuses." color="blue"
          loading={loading.employees} onDownload={() => download('employees', empFilters)}>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Filter by Status</label>
            <select className="input text-sm" value={empFilters.status} onChange={e => setEmpFilters(p=>({...p,status:e.target.value}))}>
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        </ReportCard>

        {/* Attendance Report */}
        <ReportCard icon={Clock} title="Attendance Report" description="Monthly attendance records showing check-in/out times, hours worked, late arrivals, and overtime." color="emerald"
          loading={loading.attendance} onDownload={() => download('attendance', attFilters)}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Month</label>
              <select className="input text-sm" value={attFilters.month} onChange={e=>setAttFilters(p=>({...p,month:e.target.value}))}>
                {MONTHS.slice(1).map((m,i)=><option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Year</label>
              <select className="input text-sm" value={attFilters.year} onChange={e=>setAttFilters(p=>({...p,year:e.target.value}))}>
                {[2023,2024,2025,2026].map(y=><option key={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </ReportCard>

        {/* Payroll Report */}
        <ReportCard icon={DollarSign} title="Payroll Report" description="Salary breakdown including basic pay, allowances, overtime, bonuses, deductions, and net salaries." color="purple"
          loading={loading.payroll} onDownload={() => download('payroll', payFilters)}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Month</label>
              <select className="input text-sm" value={payFilters.month} onChange={e=>setPayFilters(p=>({...p,month:e.target.value}))}>
                {MONTHS.slice(1).map((m,i)=><option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Year</label>
              <select className="input text-sm" value={payFilters.year} onChange={e=>setPayFilters(p=>({...p,year:e.target.value}))}>
                {[2023,2024,2025,2026].map(y=><option key={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </ReportCard>

        {/* Leave Report */}
        <ReportCard icon={CalendarDays} title="Leave Report" description="Annual leave records with leave types, durations, approval status, and leave history for all employees." color="amber"
          loading={loading.leaves} onDownload={() => download('leaves', leaveFilters)}>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Year</label>
            <select className="input text-sm" value={leaveFilters.year} onChange={e=>setLeaveFilters(p=>({...p,year:e.target.value}))}>
              {[2022,2023,2024,2025,2026].map(y=><option key={y}>{y}</option>)}
            </select>
          </div>
        </ReportCard>
      </div>
    </div>
  );
}
