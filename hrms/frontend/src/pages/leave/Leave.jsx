import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Check, X, Eye, CalendarDays, Clock, CheckCircle, XCircle } from 'lucide-react';
import API from '../../api/axios.js';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';

const LEAVE_TYPES = ['Annual','Sick','Maternity','Emergency','Unpaid'];
const STATUS_BADGE = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger' };
const STATUS_ICON = { pending: Clock, approved: CheckCircle, rejected: XCircle };

export default function Leave() {
  const { isHR } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyModal, setApplyModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ leaveType: 'Annual', startDate: '', endDate: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ pending: 0 });

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const url = isHR ? '/leave' : '/leave/my';
      const res = await API.get(url, { params: { status: statusFilter || undefined } });
      setLeaves(res.data.leaves);
      if (isHR) {
        const s = await API.get('/leave/stats');
        setStats(s.data);
      }
    } catch { toast.error('Failed to load leaves'); }
    finally { setLoading(false); }
  }, [isHR, statusFilter]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const handleApply = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await API.post('/leave', form);
      toast.success('Leave application submitted!');
      setApplyModal(false); setForm({ leaveType:'Annual', startDate:'', endDate:'', reason:'' });
      fetchLeaves();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to apply'); }
    finally { setSaving(false); }
  };

  const handleStatus = async (id, status, reason = '') => {
    try {
      await API.put(`/leave/${id}/status`, { status, rejectionReason: reason });
      toast.success(`Leave ${status}`);
      setViewModal(false); setRejectModal(false); setRejectionReason('');
      fetchLeaves();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const daysDiff = (s, e) => s && e ? differenceInCalendarDays(parseISO(e), parseISO(s)) + 1 : 0;

  if (loading) return <LoadingSpinner text="Loading leaves..." />;

  return (
    <div>
      <PageHeader title={isHR ? 'Leave Management' : 'My Leaves'} subtitle="Manage leave requests and approvals"
        actions={
          <button className="btn-primary" onClick={() => setApplyModal(true)}>
            <Plus className="w-4 h-4" />Apply for Leave
          </button>
        }
      />

      {isHR && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Clock} label="Pending" value={stats.pending || 0} color="amber" />
          {LEAVE_TYPES.slice(0,3).map((t, i) => {
            const colors = ['primary','emerald','purple'];
            const count = leaves.filter(l => l.leaveType === t).length;
            return <StatCard key={t} icon={CalendarDays} label={`${t} Leave`} value={count} color={colors[i]} />;
          })}
        </div>
      )}

      <div className="card mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-sm font-medium text-slate-600">Filter:</span>
          {['', 'pending', 'approved', 'rejected'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {leaves.length === 0 ? (
          <div className="card text-center py-12 text-slate-400">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-50" /><p>No leave records found</p>
          </div>
        ) : leaves.map(leave => {
          const StatusIcon = STATUS_ICON[leave.status] || Clock;
          return (
            <div key={leave._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {isHR && (
                    <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {leave.employee?.fullName?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    {isHR && <p className="font-semibold text-slate-800">{leave.employee?.fullName} <span className="text-slate-400 font-normal text-sm">· {leave.employee?.employeeId}</span></p>}
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className="badge-info">{leave.leaveType} Leave</span>
                      <span className="text-sm text-slate-600">
                        {format(parseISO(leave.startDate), 'MMM d')} – {format(parseISO(leave.endDate), 'MMM d, yyyy')}
                      </span>
                      <span className="text-sm font-medium text-slate-700">{leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-2 line-clamp-1">{leave.reason}</p>
                    {leave.status === 'rejected' && leave.rejectionReason && (
                      <p className="text-xs text-red-500 mt-1">Reason: {leave.rejectionReason}</p>
                    )}
                    {leave.approvedBy && (
                      <p className="text-xs text-slate-400 mt-1">
                        {leave.status === 'approved' ? 'Approved' : 'Processed'} by {leave.approvedBy?.fullName} · {format(parseISO(leave.approvedAt || leave.updatedAt), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={STATUS_BADGE[leave.status]}><StatusIcon className="w-3 h-3 mr-1 inline" />{leave.status}</span>
                  <button onClick={() => { setSelected(leave); setViewModal(true); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"><Eye className="w-4 h-4" /></button>
                  {isHR && leave.status === 'pending' && (
                    <>
                      <button onClick={() => handleStatus(leave._id, 'approved')}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-emerald-50 text-emerald-600"><Check className="w-4 h-4" /></button>
                      <button onClick={() => { setSelected(leave); setRejectModal(true); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-500"><X className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Apply Modal */}
      <Modal isOpen={applyModal} onClose={() => setApplyModal(false)} title="Apply for Leave">
        <form onSubmit={handleApply} className="space-y-4">
          <div>
            <label className="label">Leave Type *</label>
            <select className="input" value={form.leaveType} onChange={e => setForm(p=>({...p,leaveType:e.target.value}))}>
              {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start Date *</label><input type="date" className="input" required value={form.startDate} onChange={e=>setForm(p=>({...p,startDate:e.target.value}))} /></div>
            <div><label className="label">End Date *</label><input type="date" className="input" required value={form.endDate} onChange={e=>setForm(p=>({...p,endDate:e.target.value}))} /></div>
          </div>
          {form.startDate && form.endDate && (
            <div className="p-3 bg-primary-50 rounded-lg border border-primary-100 text-sm text-primary-700 font-medium">
              Duration: {daysDiff(form.startDate, form.endDate)} day{daysDiff(form.startDate, form.endDate) !== 1 ? 's' : ''}
            </div>
          )}
          <div><label className="label">Reason *</label><textarea className="input resize-none" rows={3} required value={form.reason} onChange={e=>setForm(p=>({...p,reason:e.target.value}))} placeholder="Brief reason for leave..." /></div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setApplyModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Submitting...' : 'Submit Application'}</button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title="Leave Details">
        {selected && (
          <div className="space-y-4">
            {isHR && <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">{selected.employee?.fullName?.charAt(0)}</div>
              <div><p className="font-semibold">{selected.employee?.fullName}</p><p className="text-sm text-slate-500">{selected.employee?.employeeId}</p></div>
            </div>}
            <div className="grid grid-cols-2 gap-3">
              {[['Type',selected.leaveType+' Leave'],['Status',selected.status],['Start',selected.startDate ? format(parseISO(selected.startDate),'MMM d, yyyy') : '-'],['End',selected.endDate ? format(parseISO(selected.endDate),'MMM d, yyyy') : '-'],['Days',selected.totalDays],['Applied',format(parseISO(selected.createdAt),'MMM d, yyyy')]].map(([k,v])=>(
                <div key={k} className="p-3 bg-slate-50 rounded-lg"><p className="text-xs text-slate-400">{k}</p><p className="font-medium text-slate-800 mt-0.5">{v}</p></div>
              ))}
            </div>
            <div><p className="label">Reason</p><p className="text-sm text-slate-700 p-3 bg-slate-50 rounded-lg">{selected.reason}</p></div>
            {isHR && selected.status === 'pending' && (
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button onClick={() => handleStatus(selected._id,'approved')} className="btn-success flex-1 justify-center"><Check className="w-4 h-4" />Approve</button>
                <button onClick={() => { setViewModal(false); setRejectModal(true); }} className="btn-danger flex-1 justify-center"><X className="w-4 h-4" />Reject</button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={rejectModal} onClose={() => setRejectModal(false)} title="Reject Leave Request" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Provide a reason for rejecting <strong>{selected?.employee?.fullName || 'this'}</strong>'s {selected?.leaveType} leave request.</p>
          <div><label className="label">Rejection Reason</label><textarea className="input resize-none" rows={3} value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Enter reason..." /></div>
          <div className="flex gap-3">
            <button onClick={() => setRejectModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={() => handleStatus(selected._id,'rejected',rejectionReason)} className="btn-danger flex-1 justify-center"><X className="w-4 h-4" />Reject Leave</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
