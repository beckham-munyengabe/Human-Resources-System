import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Eye, Star, TrendingUp, Award, Edit2 } from 'lucide-react';
import API from '../../api/axios.js';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { format, parseISO } from 'date-fns';

const RATING_LABELS = { 1:'Poor', 2:'Below Average', 3:'Average', 4:'Good', 5:'Excellent' };
const RATING_METRICS = ['productivity','quality','teamwork','communication','punctuality','initiative'];

const StarRating = ({ value, onChange, readonly }) => (
  <div className="flex gap-1">
    {[1,2,3,4,5].map(s => (
      <button key={s} type={readonly ? 'button' : 'button'}
        onClick={() => !readonly && onChange && onChange(s)}
        className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}>
        <Star className={`w-4 h-4 ${s <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
      </button>
    ))}
  </div>
);

const RatingBadge = ({ rating }) => {
  const colors = ['','bg-red-100 text-red-700','bg-orange-100 text-orange-700','bg-amber-100 text-amber-700','bg-blue-100 text-blue-700','bg-emerald-100 text-emerald-700'];
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[Math.round(rating)] || colors[3]}`}>{rating?.toFixed(1)} – {RATING_LABELS[Math.round(rating)]}</span>;
};

const INIT_RATINGS = { productivity:3, quality:3, teamwork:3, communication:3, punctuality:3, initiative:3 };

export default function Performance() {
  const { isHR } = useAuth();
  const [evals, setEvals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [form, setForm] = useState({
    employeeId:'', period: { quarter:1, year: new Date().getFullYear() },
    ratings: { ...INIT_RATINGS }, comments:'', goals:'[]'
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const url = isHR ? '/performance' : '/performance/my';
      const res = await API.get(url, { params: isHR ? { year: yearFilter } : {} });
      setEvals(res.data.evaluations);
    } catch { toast.error('Failed to load performance data'); }
    finally { setLoading(false); }
  }, [isHR, yearFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (isHR) API.get('/employees', { params:{ limit:300 } }).then(r => setEmployees(r.data.employees)); }, [isHR]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await API.post('/performance', { ...form, employeeId: form.employeeId, ratings: form.ratings, period: form.period, goals: form.goals });
      toast.success('Evaluation submitted!');
      setAddModal(false);
      setForm({ employeeId:'', period:{quarter:1,year:new Date().getFullYear()}, ratings:{...INIT_RATINGS}, comments:'', goals:'[]' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const setRating = (metric, val) => setForm(p => ({ ...p, ratings: { ...p.ratings, [metric]: val } }));
  const avgRating = Object.values(form.ratings).reduce((a,b)=>a+b,0) / 6;

  if (loading) return <LoadingSpinner text="Loading performance data..." />;

  return (
    <div>
      <PageHeader title={isHR ? 'Performance Management' : 'My Performance'} subtitle="Employee evaluations and ratings"
        actions={isHR && <button className="btn-primary" onClick={() => { setAddModal(true); }}><Plus className="w-4 h-4" />New Evaluation</button>}
      />

      {isHR && (
        <div className="card mb-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-600">Year:</label>
            <select className="input w-28" value={yearFilter} onChange={e=>setYearFilter(parseInt(e.target.value))}>
              {[2022,2023,2024,2025,2026].map(y=><option key={y}>{y}</option>)}
            </select>
          </div>
        </div>
      )}

      {evals.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-50" /><p>No evaluations found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {evals.map(ev => (
            <div key={ev._id} className="card hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {isHR && (
                    <div className="w-9 h-9 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {ev.employee?.fullName?.charAt(0)}
                    </div>
                  )}
                  <div>
                    {isHR && <p className="font-semibold text-slate-800 text-sm">{ev.employee?.fullName}</p>}
                    <p className="text-xs text-slate-400">Q{ev.period?.quarter} · {ev.period?.year}</p>
                  </div>
                </div>
                <button onClick={() => { setSelected(ev); setViewModal(true); }}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-blue-50 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between mb-3">
                <RatingBadge rating={ev.overallRating} />
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(ev.overallRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />)}
                </div>
              </div>

              <div className="space-y-1.5">
                {RATING_METRICS.map(m => (
                  <div key={m} className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 capitalize">{m}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${(ev.ratings[m]/5)*100}%` }} />
                      </div>
                      <span className="text-xs font-medium text-slate-600 w-3">{ev.ratings[m]}</span>
                    </div>
                  </div>
                ))}
              </div>

              {ev.comments && <p className="text-xs text-slate-400 mt-3 line-clamp-2 border-t border-slate-50 pt-2">{ev.comments}</p>}
              <p className="text-xs text-slate-300 mt-2">By {ev.evaluator?.fullName} · {ev.createdAt ? format(parseISO(ev.createdAt), 'MMM d, yyyy') : ''}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Evaluation Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="New Performance Evaluation" size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="label">Employee *</label>
              <select className="input" required value={form.employeeId} onChange={e=>setForm(p=>({...p,employeeId:e.target.value}))}>
                <option value="">Select Employee</option>
                {employees.map(e=><option key={e._id} value={e._id}>{e.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Quarter</label>
              <select className="input" value={form.period.quarter} onChange={e=>setForm(p=>({...p,period:{...p.period,quarter:parseInt(e.target.value)}}))}>
                {[1,2,3,4].map(q=><option key={q} value={q}>Q{q}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <select className="input" value={form.period.year} onChange={e=>setForm(p=>({...p,period:{...p.period,year:parseInt(e.target.value)}}))}>
                {[2022,2023,2024,2025,2026].map(y=><option key={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="label mb-0">Performance Ratings</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Overall:</span>
                <RatingBadge rating={avgRating} />
              </div>
            </div>
            <div className="space-y-3">
              {RATING_METRICS.map(m => (
                <div key={m} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700 capitalize w-32">{m}</span>
                  <StarRating value={form.ratings[m]} onChange={v => setRating(m, v)} />
                  <span className="text-xs text-slate-500 w-20 text-right">{RATING_LABELS[form.ratings[m]]}</span>
                </div>
              ))}
            </div>
          </div>

          <div><label className="label">Comments</label><textarea className="input resize-none" rows={3} value={form.comments} onChange={e=>setForm(p=>({...p,comments:e.target.value}))} placeholder="Performance comments and feedback..." /></div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setAddModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Submit Evaluation'}</button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title="Evaluation Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border border-primary-100">
              <div>
                {isHR && <p className="font-bold text-slate-800">{selected.employee?.fullName}</p>}
                <p className="text-sm text-slate-500">Q{selected.period?.quarter} · {selected.period?.year} · Evaluated by {selected.evaluator?.fullName}</p>
              </div>
              <RatingBadge rating={selected.overallRating} />
            </div>
            <div className="space-y-2">
              {RATING_METRICS.map(m => (
                <div key={m} className="flex items-center gap-4 p-2.5 rounded-lg hover:bg-slate-50">
                  <span className="text-sm text-slate-600 capitalize w-32">{m}</span>
                  <StarRating value={selected.ratings?.[m]} readonly />
                  <span className="text-xs text-slate-400">{RATING_LABELS[selected.ratings?.[m]]}</span>
                </div>
              ))}
            </div>
            {selected.comments && (
              <div><p className="label">Comments</p><p className="text-sm text-slate-700 p-3 bg-slate-50 rounded-lg">{selected.comments}</p></div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
