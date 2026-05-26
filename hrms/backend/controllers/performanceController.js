const Performance = require('../models/Performance');
const Employee = require('../models/Employee');

exports.createEvaluation = async (req, res) => {
  try {
    const { employeeId, period, ratings, comments, goals } = req.body;
    const performance = await Performance.create({
      employee: employeeId,
      evaluator: req.user._id,
      period,
      ratings,
      comments,
      goals: goals ? JSON.parse(goals) : [],
    });
    await performance.populate('employee', 'fullName employeeId');
    await performance.populate('evaluator', 'fullName');
    res.status(201).json({ success: true, message: 'Performance evaluation created', performance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllEvaluations = async (req, res) => {
  try {
    const { year, department } = req.query;
    const query = {};
    if (year) query['period.year'] = parseInt(year);
    if (department) {
      const emps = await Employee.find({ department }).select('_id');
      query.employee = { $in: emps.map(e => e._id) };
    }
    const evaluations = await Performance.find(query)
      .populate('employee', 'fullName employeeId department position profilePhoto')
      .populate('evaluator', 'fullName')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: evaluations.length, evaluations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyEvaluations = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    const evaluations = await Performance.find({ employee: employee._id }).populate('evaluator', 'fullName').sort({ createdAt: -1 });
    res.json({ success: true, evaluations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEmployeeEvaluations = async (req, res) => {
  try {
    const evaluations = await Performance.find({ employee: req.params.employeeId }).populate('evaluator', 'fullName').sort({ createdAt: -1 });
    const avgRating = evaluations.length > 0 ? evaluations.reduce((sum, e) => sum + e.overallRating, 0) / evaluations.length : 0;
    res.json({ success: true, count: evaluations.length, avgRating: Math.round(avgRating * 10) / 10, evaluations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateEvaluation = async (req, res) => {
  try {
    const evaluation = await Performance.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('employee', 'fullName').populate('evaluator', 'fullName');
    if (!evaluation) return res.status(404).json({ success: false, message: 'Evaluation not found' });
    res.json({ success: true, message: 'Evaluation updated', evaluation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
