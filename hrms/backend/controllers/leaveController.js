const Leave = require('../models/Leave');
const Employee = require('../models/Employee');

exports.applyLeave = async (req, res) => {
  try {
    const employee = req.user.role === 'employee' ? await Employee.findOne({ user: req.user._id }) : await Employee.findById(req.body.employee);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    const { leaveType, startDate, endDate, reason } = req.body;
    const leave = await Leave.create({ employee: employee._id, leaveType, startDate, endDate, reason });
    res.status(201).json({ success: true, message: 'Leave application submitted', leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    const leaves = await Leave.find({ employee: employee._id }).populate('approvedBy', 'fullName').sort({ createdAt: -1 });
    res.json({ success: true, count: leaves.length, leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllLeaves = async (req, res) => {
  try {
    const { status, leaveType, month, year } = req.query;
    const query = {};
    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;
    if (month && year) {
      query.startDate = { $gte: new Date(year, month - 1, 1), $lte: new Date(year, month, 0) };
    }
    const leaves = await Leave.find(query).populate('employee', 'fullName employeeId department profilePhoto').populate('approvedBy', 'fullName').sort({ createdAt: -1 });
    res.json({ success: true, count: leaves.length, leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
    leave.status = status;
    leave.approvedBy = req.user._id;
    leave.approvedAt = new Date();
    if (status === 'rejected' && rejectionReason) leave.rejectionReason = rejectionReason;
    await leave.save();
    res.json({ success: true, message: `Leave ${status}`, leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLeaveStats = async (req, res) => {
  try {
    const stats = await Leave.aggregate([
      { $group: { _id: { status: '$status', type: '$leaveType' }, count: { $sum: 1 }, totalDays: { $sum: '$totalDays' } } },
    ]);
    const pending = await Leave.countDocuments({ status: 'pending' });
    res.json({ success: true, pending, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
