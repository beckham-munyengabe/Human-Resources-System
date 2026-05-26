const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

exports.checkIn = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee record not found' });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const existing = await Attendance.findOne({ employee: employee._id, date: today });
    if (existing && existing.checkIn) return res.status(400).json({ success: false, message: 'Already checked in today' });
    const checkInTime = new Date();
    const workStart = new Date(); workStart.setHours(9, 0, 0, 0);
    const isLate = checkInTime > workStart;
    const lateMinutes = isLate ? Math.floor((checkInTime - workStart) / 60000) : 0;
    const attendance = existing
      ? await Attendance.findByIdAndUpdate(existing._id, { checkIn: checkInTime, status: isLate ? 'late' : 'present', isLate, lateMinutes }, { new: true })
      : await Attendance.create({ employee: employee._id, date: today, checkIn: checkInTime, status: isLate ? 'late' : 'present', isLate, lateMinutes });
    res.json({ success: true, message: 'Checked in successfully', attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee record not found' });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const attendance = await Attendance.findOne({ employee: employee._id, date: today });
    if (!attendance || !attendance.checkIn) return res.status(400).json({ success: false, message: 'Please check in first' });
    if (attendance.checkOut) return res.status(400).json({ success: false, message: 'Already checked out today' });
    attendance.checkOut = new Date();
    await attendance.save();
    res.json({ success: true, message: 'Checked out successfully', attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    const { month, year } = req.query;
    const start = new Date(year || new Date().getFullYear(), (month || new Date().getMonth() + 1) - 1, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
    const attendance = await Attendance.find({ employee: employee._id, date: { $gte: start, $lte: end } }).sort({ date: -1 });
    const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
    const todayRecord = await Attendance.findOne({ employee: employee._id, date: todayDate });
    res.json({ success: true, attendance, today: todayRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllAttendance = async (req, res) => {
  try {
    const { month, year, department, employeeId } = req.query;
    const startMonth = parseInt(month) || new Date().getMonth() + 1;
    const startYear = parseInt(year) || new Date().getFullYear();
    const start = new Date(startYear, startMonth - 1, 1);
    const end = new Date(startYear, startMonth, 0, 23, 59, 59);
    let employeeQuery = {};
    if (department) employeeQuery.department = department;
    if (employeeId) employeeQuery._id = employeeId;
    const employees = await Employee.find(employeeQuery).select('_id fullName employeeId department');
    const employeeIds = employees.map(e => e._id);
    const attendance = await Attendance.find({ employee: { $in: employeeIds }, date: { $gte: start, $lte: end } })
      .populate('employee', 'fullName employeeId department')
      .sort({ date: -1 });
    const stats = {
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      halfDay: attendance.filter(a => a.status === 'half-day').length,
    };
    res.json({ success: true, count: attendance.length, stats, attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAttendanceById = async (req, res) => {
  try {
    const { month, year } = req.query;
    const startMonth = parseInt(month) || new Date().getMonth() + 1;
    const startYear = parseInt(year) || new Date().getFullYear();
    const start = new Date(startYear, startMonth - 1, 1);
    const end = new Date(startYear, startMonth, 0, 23, 59, 59);
    const attendance = await Attendance.find({ employee: req.params.employeeId, date: { $gte: start, $lte: end } }).sort({ date: 1 });
    const summary = {
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      totalHours: attendance.reduce((sum, a) => sum + (a.totalHours || 0), 0),
      overtimeHours: attendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0),
    };
    res.json({ success: true, attendance, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
