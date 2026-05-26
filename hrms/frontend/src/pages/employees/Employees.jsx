import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Eye, Edit2, Trash2, Upload, Download } from 'lucide-react';
import API from '../../api/axios.js';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader.jsx';
import Modal from '../../components/common/Modal.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const INITIAL_FORM = { fullName:'', gender:'Male', dateOfBirth:'', email:'', phoneNumber:'', address:'{}', position:'', department:'', basicSalary:'', joiningDate:'', password:'Password@123' };

export default function Employees() {
  const { isHR } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchEmployees = useCallback(async () => {
    try {
      const params = { page, limit: 15, ...(search && { search }), ...(deptFilter && { department: deptFilter }) };
      const res = await API.get('/employees', { params });
      setEmployees(res.data.employees); setTotal(res.data.total);
    } catch { toast.error('Failed to load employees'); }
    finally { setLoading(false); }
  }, [page, search, deptFilter]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
  useEffect(() => { API.get('/departments').then(r => setDepartments(r.data.departments)); }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k, v));
      if (file) fd.append('profilePhoto', file);
      if (selected) { await API.put(`/employees/${selected._id}`, fd); toast.success('Employee updated'); }
      else { await API.post('/employees', fd); toast.success('Employee created'); }
      setModalOpen(false); setSelected(null); setForm(INITIAL_FORM); setFile(null);
      fetchEmployees();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleEdit = (emp) => {
    setSelected(emp);
    setForm({ fullName: emp.fullName, gender: emp.gender, dateOfBirth: emp.dateOfBirth?.split('T')[0], email: emp.email, phoneNumber: emp.phoneNumber, address: JSON.stringify(emp.address||{}), position: emp.position, department: emp.department?._id || emp.department, basicSalary: emp.basicSalary, joiningDate: emp.joiningDate?.split('T')[0], password: '' });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try { await API.delete(`/employees/${selected._id}`); toast.success('Employee deleted'); fetchEmployees(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const f = (k, v) => setForm(p => ({...p, [k]: v}));

  if (loading) return <LoadingSpinner text="Loading employees..." />;

  return (
    <div>
      <PageHeader title="Employees" subtitle={`${total} total employees`} actions={isHR && (
        <button className="btn-primary" onClick={() => { setSelected(null); setForm(INITIAL_FORM); setModalOpen(true); }}>
          <Plus className="w-4 h-4" />Add Employee
        </button>
      )} />

      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input pl-10" placeholder="Search by name, ID, email, position..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="input sm:w-48" value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Employee','Department','Position','Email','Phone','Status','Actions'].map(h => <th key={h} className="table-header">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {employees.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">No employees found</td></tr>
              ) : employees.map(emp => (
                <tr key={emp._id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      {emp.profilePhoto ? <img src={`http://localhost:5000${emp.profilePhoto}`} alt="" className="w-9 h-9 rounded-full object-cover" /> :
                        <div className="w-9 h-9 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold">{emp.fullName?.charAt(0)}</div>}
                      <div><p className="font-medium text-slate-800 text-sm">{emp.fullName}</p><p className="text-xs text-slate-400">{emp.employeeId}</p></div>
                    </div>
                  </td>
                  <td className="table-cell text-slate-600">{emp.department?.name}</td>
                  <td className="table-cell text-slate-600">{emp.position}</td>
                  <td className="table-cell text-slate-600 text-xs">{emp.email}</td>
                  <td className="table-cell text-slate-600">{emp.phoneNumber}</td>
                  <td className="table-cell">
                    <span className={emp.status === 'active' ? 'badge-success' : 'badge-danger'}>{emp.status}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setSelected(emp); setViewModal(true); }} className="w-7 h-7 flex items-center justify-center rounded hover:bg-blue-50 text-blue-500"><Eye className="w-3.5 h-3.5" /></button>
                      {isHR && <><button onClick={() => handleEdit(emp)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-amber-50 text-amber-500"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { setSelected(emp); setDeleteDialog(true); }} className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <p className="text-sm text-slate-500">Page {page} of {Math.ceil(total/15) || 1}</p>
          <div className="flex gap-2">
            <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">Previous</button>
            <button disabled={page>=Math.ceil(total/15)} onClick={() => setPage(p=>p+1)} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Employee' : 'Add New Employee'} size="xl">
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Profile Photo</label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 overflow-hidden">
                {file ? <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" /> : <Upload className="w-5 h-5" />}
              </div>
              <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} className="text-sm text-slate-600" />
            </div>
          </div>
          <div><label className="label">Full Name *</label><input className="input" required value={form.fullName} onChange={e=>f('fullName',e.target.value)} /></div>
          <div><label className="label">Gender *</label><select className="input" value={form.gender} onChange={e=>f('gender',e.target.value)}><option>Male</option><option>Female</option><option>Other</option></select></div>
          <div><label className="label">Date of Birth *</label><input type="date" className="input" required value={form.dateOfBirth} onChange={e=>f('dateOfBirth',e.target.value)} /></div>
          <div><label className="label">Email *</label><input type="email" className="input" required value={form.email} onChange={e=>f('email',e.target.value)} /></div>
          <div><label className="label">Phone *</label><input className="input" required value={form.phoneNumber} onChange={e=>f('phoneNumber',e.target.value)} /></div>
          <div><label className="label">Position *</label><input className="input" required value={form.position} onChange={e=>f('position',e.target.value)} /></div>
          <div><label className="label">Department *</label>
            <select className="input" required value={form.department} onChange={e=>f('department',e.target.value)}>
              <option value="">Select Department</option>
              {departments.map(d=><option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div><label className="label">Basic Salary ($) *</label><input type="number" className="input" required value={form.basicSalary} onChange={e=>f('basicSalary',e.target.value)} /></div>
          <div><label className="label">Joining Date *</label><input type="date" className="input" required value={form.joiningDate} onChange={e=>f('joiningDate',e.target.value)} /></div>
          {!selected && <div><label className="label">Password</label><input className="input" value={form.password} onChange={e=>f('password',e.target.value)} placeholder="Default: Password@123" /></div>}
          <div className="col-span-2 flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : selected ? 'Update Employee' : 'Add Employee'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title="Employee Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {selected.profilePhoto ? <img src={`http://localhost:5000${selected.profilePhoto}`} alt="" className="w-16 h-16 rounded-full object-cover" /> :
                <div className="w-16 h-16 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-2xl font-bold">{selected.fullName?.charAt(0)}</div>}
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selected.fullName}</h3>
                <p className="text-sm text-slate-500">{selected.employeeId} · {selected.position}</p>
                <span className={selected.status === 'active' ? 'badge-success' : 'badge-danger'}>{selected.status}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['Department', selected.department?.name], ['Email', selected.email], ['Phone', selected.phoneNumber], ['Gender', selected.gender], ['Date of Birth', selected.dateOfBirth?.split('T')[0]], ['Joining Date', selected.joiningDate?.split('T')[0]], ['Basic Salary', `$${selected.basicSalary?.toLocaleString()}`]].map(([k,v]) => (
                <div key={k} className="p-3 bg-slate-50 rounded-lg"><p className="text-xs text-slate-400 font-medium">{k}</p><p className="text-slate-800 font-medium mt-0.5">{v || '-'}</p></div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={deleteDialog} onClose={() => setDeleteDialog(false)} onConfirm={handleDelete}
        title="Delete Employee" message={`Are you sure you want to delete ${selected?.fullName}? This action cannot be undone.`}
        confirmLabel="Delete" danger />
    </div>
  );
}
