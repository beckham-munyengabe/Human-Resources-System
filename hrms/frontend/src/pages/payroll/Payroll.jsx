import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Eye, DollarSign, TrendingUp, Users, CreditCard, Check, Printer } from 'lucide-react';
import API from '../../api/axios.js';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { format } from 'date-fns';

const MONTHS = ['','January','February','March','April','May','June','July','August','September','October','November','December'];

const INIT_FORM = {
  employeeId: '', month: new Date().getMonth()+1, year: new Date().getFullYear(),
  allowances: { housing:0, transport:0, meal:0, medical:0, other:0 },
  deductions: { tax:0, pension:0, insurance:0, loan:0, other:0 },
  bonus: 0, overtimeRate: 1.5
};

export default function Payroll() {
  const { isHR } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genModal, setGenModal] = useState(false);
  const [slipModal, setSlipModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(INIT_FORM);
  const [saving, setSaving] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth()+1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [totals, setTotals] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const url = isHR ? '/payroll' : '/payroll/my';
      const res = await API.get(url, { params: isHR ? { month, year } : {} });
      setPayrolls(res.data.payrolls);
      if (isHR) setTotals({ gross: res.data.totalGross, net: res.data.totalNetSalary });
    } catch { toast.error('Failed to load payroll'); }
    finally { setLoading(false); }
  }, [isHR, month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (isHR) API.get('/employees', { params: { limit: 300 } }).then(r => setEmployees(r.data.employees)); }, [isHR]);

  const handleGenerate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, allowances: JSON.stringify(form.allowances), deductions: JSON.stringify(form.deductions) };
      await API.post('/payroll', payload);
      toast.success('Payroll generated!');
      setGenModal(false); setForm(INIT_FORM); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleMarkPaid = async (id) => {
    try {
      await API.put(`/payroll/${id}/payment`, { paymentStatus: 'paid', paymentDate: new Date() });
      toast.success('Marked as paid'); fetchData();
    } catch { toast.error('Failed'); }
  };

  const viewSlip = async (payroll) => {
    try {
      const res = await API.get(`/payroll/${payroll._id}`);
      setSelected(res.data.payroll); setSlipModal(true);
    } catch { toast.error('Failed to load payslip'); }
  };

  const setAllow = (k, v) => setForm(p => ({ ...p, allowances: { ...p.allowances, [k]: parseFloat(v)||0 } }));
  const setDeduct = (k, v) => setForm(p => ({ ...p, deductions: { ...p.deductions, [k]: parseFloat(v)||0 } }));

  if (loading) return <LoadingSpinner text="Loading payroll..." />;

  return (
    <div>
      <PageHeader title={isHR ? 'Payroll Management' : 'My Payslips'} subtitle="Manage salaries and compensation"
        actions={isHR && <button className="btn-primary" onClick={() => { setForm(INIT_FORM); setGenModal(true); }}><Plus className="w-4 h-4" />Generate Payroll</button>}
      />

      {isHR && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard icon={DollarSign} label="Total Gross" value={`$${(totals.gross||0).toLocaleString()}`} color="primary" />
          <StatCard icon={TrendingUp} label="Total Net Pay" value={`$${(totals.net||0).toLocaleString()}`} color="emerald" />
          <StatCard icon={Users} label="Employees Paid" value={payrolls.filter(p=>p.paymentStatus==='paid').length} color="purple" />
          <StatCard icon={CreditCard} label="Pending Payment" value={payrolls.filter(p=>p.paymentStatus==='pending').length} color="amber" />
        </div>
      )}

      {isHR && (
        <div className="card mb-4">
          <div className="flex flex-wrap gap-3">
            <select className="input w-auto" value={month} onChange={e=>setMonth(parseInt(e.target.value))}>
              {MONTHS.slice(1).map((m,i)=><option key={i} value={i+1}>{m}</option>)}
            </select>
            <select className="input w-28" value={year} onChange={e=>setYear(parseInt(e.target.value))}>
              {[2023,2024,2025,2026].map(y=><option key={y}>{y}</option>)}
            </select>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {(isHR ? ['Employee','Period','Basic','Allowances','Overtime','Bonus','Deductions','Net Salary','Status','Actions']
                       : ['Period','Basic','Allowances','Deductions','Net Salary','Status','Actions']).map(h=>(
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payrolls.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-slate-400">No payroll records found</td></tr>
              ) : payrolls.map(p => {
                const totalAllow = p.allowances ? Object.values(p.allowances).reduce((a,b)=>a+b,0) : 0;
                return (
                  <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                    {isHR && (
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">{p.employee?.fullName?.charAt(0)}</div>
                          <div><p className="text-sm font-medium">{p.employee?.fullName}</p><p className="text-xs text-slate-400">{p.employee?.employeeId}</p></div>
                        </div>
                      </td>
                    )}
                    <td className="table-cell font-medium">{MONTHS[p.month]} {p.year}</td>
                    <td className="table-cell">${p.basicSalary?.toLocaleString()}</td>
                    <td className="table-cell text-emerald-600">${totalAllow.toLocaleString()}</td>
                    {isHR && <td className="table-cell">${p.overtime?.toLocaleString()}</td>}
                    {isHR && <td className="table-cell">${p.bonus?.toLocaleString()}</td>}
                    <td className="table-cell text-red-500">-${p.totalDeductions?.toLocaleString()}</td>
                    <td className="table-cell font-bold text-slate-900">${p.netSalary?.toLocaleString()}</td>
                    <td className="table-cell">
                      <span className={p.paymentStatus==='paid' ? 'badge-success' : p.paymentStatus==='failed' ? 'badge-danger' : 'badge-warning'}>
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => viewSlip(p)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-blue-50 text-blue-500"><Eye className="w-3.5 h-3.5" /></button>
                        {isHR && p.paymentStatus === 'pending' && (
                          <button onClick={() => handleMarkPaid(p._id)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-emerald-50 text-emerald-500"><Check className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Payroll Modal */}
      <Modal isOpen={genModal} onClose={() => setGenModal(false)} title="Generate Payroll" size="lg">
        <form onSubmit={handleGenerate} className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="label">Employee *</label>
              <select className="input" required value={form.employeeId} onChange={e=>setForm(p=>({...p,employeeId:e.target.value}))}>
                <option value="">Select Employee</option>
                {employees.map(e=><option key={e._id} value={e._id}>{e.fullName} ({e.employeeId})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Month *</label>
              <select className="input" value={form.month} onChange={e=>setForm(p=>({...p,month:parseInt(e.target.value)}))}>
                {MONTHS.slice(1).map((m,i)=><option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Year *</label>
              <select className="input" value={form.year} onChange={e=>setForm(p=>({...p,year:parseInt(e.target.value)}))}>
                {[2023,2024,2025,2026].map(y=><option key={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div>
            <p className="label mb-2">Allowances ($)</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.keys(form.allowances).map(k => (
                <div key={k}><label className="text-xs text-slate-500 capitalize">{k}</label>
                  <input type="number" className="input mt-1" min="0" value={form.allowances[k]} onChange={e=>setAllow(k,e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="label mb-2">Deductions ($) <span className="text-xs text-slate-400 font-normal">(tax & pension auto-calculated if 0)</span></p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.keys(form.deductions).map(k => (
                <div key={k}><label className="text-xs text-slate-500 capitalize">{k}</label>
                  <input type="number" className="input mt-1" min="0" value={form.deductions[k]} onChange={e=>setDeduct(k,e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Bonus ($)</label><input type="number" className="input" min="0" value={form.bonus} onChange={e=>setForm(p=>({...p,bonus:parseFloat(e.target.value)||0}))} /></div>
            <div><label className="label">Overtime Rate (x)</label><input type="number" className="input" min="1" step="0.1" value={form.overtimeRate} onChange={e=>setForm(p=>({...p,overtimeRate:parseFloat(e.target.value)||1.5}))} /></div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setGenModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Generating...' : 'Generate Payroll'}</button>
          </div>
        </form>
      </Modal>

      {/* Payslip Modal */}
      <Modal isOpen={slipModal} onClose={() => setSlipModal(false)} title="Payslip" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-primary-600 rounded-xl text-white">
              <div>
                <p className="text-xs text-primary-200">Employee</p>
                <p className="font-bold text-lg">{selected.employee?.fullName}</p>
                <p className="text-sm text-primary-200">{selected.employee?.employeeId} · {selected.employee?.position}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-primary-200">Pay Period</p>
                <p className="font-bold text-lg">{MONTHS[selected.month]} {selected.year}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selected.paymentStatus==='paid' ? 'bg-emerald-400 text-white' : 'bg-amber-300 text-amber-900'}`}>{selected.paymentStatus}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Earnings</p>
                <div className="space-y-1.5">
                  <Row label="Basic Salary" val={selected.basicSalary} />
                  {selected.allowances && Object.entries(selected.allowances).filter(([,v])=>v>0).map(([k,v])=>(
                    <Row key={k} label={`${k.charAt(0).toUpperCase()+k.slice(1)} Allowance`} val={v} />
                  ))}
                  {selected.overtime > 0 && <Row label="Overtime" val={selected.overtime} />}
                  {selected.bonus > 0 && <Row label="Bonus" val={selected.bonus} />}
                  <div className="border-t border-slate-100 pt-1.5 mt-1.5"><Row label="Gross Salary" val={selected.grossSalary} bold /></div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Deductions</p>
                <div className="space-y-1.5">
                  {selected.deductions && Object.entries(selected.deductions).filter(([,v])=>v>0).map(([k,v])=>(
                    <Row key={k} label={k.charAt(0).toUpperCase()+k.slice(1)} val={v} neg />
                  ))}
                  <div className="border-t border-slate-100 pt-1.5 mt-1.5"><Row label="Total Deductions" val={selected.totalDeductions} bold neg /></div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
              <p className="font-bold text-emerald-800 text-lg">Net Salary</p>
              <p className="font-bold text-emerald-600 text-2xl">${selected.netSalary?.toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              {[['Working Days',selected.workingDays],['Present Days',selected.presentDays],['Overtime Hrs',selected.overtimeHours?.toFixed(1)]].map(([k,v])=>(
                <div key={k} className="p-3 bg-slate-50 rounded-lg text-center"><p className="text-xs text-slate-400">{k}</p><p className="font-bold text-slate-800 text-lg">{v}</p></div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, val, bold, neg }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
      <span>{label}</span>
      <span className={neg ? 'text-red-500' : ''}>{neg ? '-' : ''}${(val||0).toLocaleString()}</span>
    </div>
  );
}
