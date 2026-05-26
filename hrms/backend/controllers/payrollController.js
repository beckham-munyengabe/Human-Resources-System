const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');

exports.generatePayroll = async (req, res) => {
  try {
    const { employeeId, month, year, allowances, deductions, bonus, overtimeRate } = req.body;
    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    const existing = await Payroll.findOne({ employee: employeeId, month, year });
    if (existing) return res.status(400).json({ success: false, message: 'Payroll already generated for this period' });
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    const attendanceRecords = await Attendance.find({ employee: employeeId, date: { $gte: start, $lte: end } });
    const presentDays = attendanceRecords.filter(a => ['present', 'late'].includes(a.status)).length;
    const absentDays = attendanceRecords.filter(a => a.status === 'absent').length;
    const overtimeHours = attendanceRecords.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);
    const overtimePay = overtimeHours * ((employee.basicSalary / 22 / 8) * (overtimeRate || 1.5));
    const parsedAllowances = allowances ? JSON.parse(allowances) : { housing: 0, transport: 0, meal: 0, medical: 0, other: 0 };
    const parsedDeductions = deductions ? JSON.parse(deductions) : {};
    const taxableIncome = employee.basicSalary + Object.values(parsedAllowances).reduce((a, b) => a + b, 0);
    if (!parsedDeductions.tax) parsedDeductions.tax = Math.round(taxableIncome * 0.3 * 100) / 100;
    if (!parsedDeductions.pension) parsedDeductions.pension = Math.round(employee.basicSalary * 0.05 * 100) / 100;
    const payroll = await Payroll.create({
      employee: employeeId, month: parseInt(month), year: parseInt(year),
      basicSalary: employee.basicSalary,
      allowances: parsedAllowances,
      deductions: parsedDeductions,
      overtime: Math.round(overtimePay * 100) / 100,
      bonus: bonus || 0,
      workingDays: 22, presentDays, absentDays, overtimeHours,
      generatedBy: req.user._id,
    });
    res.status(201).json({ success: true, message: 'Payroll generated', payroll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPayrolls = async (req, res) => {
  try {
    const { month, year, department } = req.query;
    const query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    let employeeIds;
    if (department) {
      const emps = await Employee.find({ department }).select('_id');
      employeeIds = emps.map(e => e._id);
      query.employee = { $in: employeeIds };
    }
    const payrolls = await Payroll.find(query).populate('employee', 'fullName employeeId position department profilePhoto').populate('generatedBy', 'fullName').sort({ year: -1, month: -1 });
    const totalNetSalary = payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    const totalGross = payrolls.reduce((sum, p) => sum + (p.grossSalary || 0), 0);
    res.json({ success: true, count: payrolls.length, totalNetSalary, totalGross, payrolls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyPayroll = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    const payrolls = await Payroll.find({ employee: employee._id }).sort({ year: -1, month: -1 });
    res.json({ success: true, payrolls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentDate, paymentMethod } = req.body;
    const payroll = await Payroll.findByIdAndUpdate(req.params.id, { paymentStatus, paymentDate: paymentDate || new Date(), paymentMethod }, { new: true });
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found' });
    res.json({ success: true, message: 'Payment status updated', payroll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate('employee', 'fullName employeeId position department email phoneNumber address joiningDate basicSalary').populate('generatedBy', 'fullName');
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found' });
    res.json({ success: true, payroll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
