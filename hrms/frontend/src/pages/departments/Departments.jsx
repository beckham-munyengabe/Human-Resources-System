import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Building2, Users } from 'lucide-react';
import API from '../../api/axios.js';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader.jsx';
import Modal from '../../components/common/Modal.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';

export default function Departments() {
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const fetch = async () => { try { const r = await API.get('/departments'); setDepts(r.data.departments); } catch {} finally { setLoading(false); } };
  useEffect(() => { fetch(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selected) { await API.put(`/departments/${selected._id}`, form); toast.success('Updated'); }
      else { await API.post('/departments', form); toast.success('Created'); }
      setModalOpen(false); setSelected(null); setForm({ name:'', description:'' }); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async () => {
    try { await API.delete(`/departments/${selected._id}`); toast.success('Deleted'); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const colors = ['bg-primary-500','bg-emerald-500','bg-amber-500','bg-purple-500','bg-pink-500','bg-cyan-500'];

  if (loading) return <LoadingSpinner text="Loading departments..." />;

  return (
    <div>
      <PageHeader title="Departments" subtitle={`${depts.length} departments`} actions={
        <button className="btn-primary" onClick={() => { setSelected(null); setForm({name:'',description:''}); setModalOpen(true); }}>
          <Plus className="w-4 h-4" />Add Department
        </button>
      } />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {depts.map((dept, i) => (
          <div key={dept._id} className="card group hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 ${colors[i % colors.length]} rounded-xl flex items-center justify-center shadow-sm`}>
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setSelected(dept); setForm({name:dept.name, description:dept.description||''}); setModalOpen(true); }} className="w-7 h-7 flex items-center justify-center rounded hover:bg-amber-50 text-amber-500"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => { setSelected(dept); setDeleteDialog(true); }} className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <h3 className="font-bold text-slate-800 text-lg">{dept.name}</h3>
            <p className="text-sm text-slate-400 mt-1 line-clamp-2">{dept.description || 'No description'}</p>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">{dept.employeeCount || 0} employees</span>
            </div>
          </div>
        ))}
        {depts.length === 0 && (
          <div className="col-span-3 card text-center py-12 text-slate-400">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-50" /><p>No departments yet</p>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Department Name *</label><input className="input" required value={form.name} onChange={e => setForm(p=>({...p, name:e.target.value}))} /></div>
          <div><label className="label">Description</label><textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm(p=>({...p, description:e.target.value}))} /></div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{selected ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={deleteDialog} onClose={() => setDeleteDialog(false)} onConfirm={handleDelete}
        title="Delete Department" message={`Delete "${selected?.name}"? Employees must be reassigned first.`} confirmLabel="Delete" danger />
    </div>
  );
}
