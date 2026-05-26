const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Performance = require('../models/Performance');
const PDFDocument = require('pdfkit');

const drawTableRow = (doc, y, cols, widths, isHeader = false) => {
  let x = 50;
  if (isHeader) { doc.fillColor('#2563eb').rect(50, y - 5, widths.reduce((a, b) => a + b, 0), 20).fill(); doc.fillColor('white'); }
  else { doc.fillColor(y % 40 === 0 ? '#f8fafc' : 'white').rect(50, y - 5, widths.reduce((a, b) => a + b, 0), 20).fill(); doc.fillColor('#1e293b'); }
  cols.forEach((col, i) => { doc.fontSize(isHeader ? 9 : 8).font(isHeader ? 'Helvetica-Bold' : 'Helvetica').text(String(col), x + 3, y, { width: widths[i] - 6, ellipsis: true }); x += widths[i]; });
};

const setupPDF = (doc, title, subtitle) => {
  doc.fillColor('#1e293b').rect(0, 0, doc.page.width, 80).fill();
  doc.fillColor('white').fontSize(20).font('Helvetica-Bold').text('HRMS', 50, 20);
  doc.fillColor('#93c5fd').fontSize(12).font('Helvetica').text(title, 50, 45);
  doc.fillColor('white').fontSize(9).text(subtitle, 50, 62);
  doc.fillColor('#2563eb').rect(0, 80, doc.page.width, 3).fill();
  doc.fillColor('#1e293b').moveDown(3);
};

exports.generateEmployeeReport = async (req, res) => {
  try {
    const { department, status, format } = req.query;
    const query = {};
    if (department) query.department = department;
    if (status) query.status = status;
    const employees = await Employee.find(query).populate('department', 'name').sort({ fullName: 1 });
    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=employee-report.pdf');
      doc.pipe(res);
      setupPDF(doc, 'Employee Report', `Generated on ${new Date().toLocaleDateString()} | Total: ${employees.length}`);
      const headers = ['Emp ID', 'Full Name', 'Gender', 'Position', 'Department', 'Email', 'Phone', 'Status', 'Joined'];
      const widths = [55, 100, 50, 90, 80, 140, 80, 55, 70];
      let y = 110;
      drawTableRow(doc, y, headers, widths, true); y += 25;
      employees.forEach((emp, i) => {
        if (y > 530) { doc.addPage({ layout: 'landscape' }); y = 50; drawTableRow(doc, y, headers, widths, true); y += 25; }
        drawTableRow(doc, y, [emp.employeeId, emp.fullName, emp.gender, emp.position, emp.department?.name || '-', emp.email, emp.phoneNumber, emp.status, new Date(emp.joiningDate).toLocaleDateString()], widths, false);
        y += i % 2 === 0 ? 20 : 20; y += 0;
      });
      doc.end();
    } else {
      res.json({ success: true, count: employees.length, employees });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.generateAttendanceReport = async (req, res) => {
  try {
    const { month, year, format } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    const start = new Date(y, m - 1, 1); const end = new Date(y, m, 0, 23, 59, 59);
    const attendance = await Attendance.find({ date: { $gte: start, $lte: end } }).populate('employee', 'fullName employeeId department').sort({ date: 1 });
    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.pdf');
      doc.pipe(res);
      const monthName = new Date(y, m - 1).toLocaleString('default', { month: 'long' });
      setupPDF(doc, 'Attendance Report', `${monthName} ${y} | Total Records: ${attendance.length}`);
      const headers = ['Emp ID', 'Name', 'Date', 'Check In', 'Check Out', 'Hours', 'Status', 'Late?', 'Late Min', 'OT Hours'];
      const widths = [55, 110, 70, 65, 65, 45, 55, 40, 55, 55];
      let row = 110;
      drawTableRow(doc, row, headers, widths, true); row += 25;
      attendance.forEach(a => {
        if (row > 530) { doc.addPage({ layout: 'landscape' }); row = 50; drawTableRow(doc, row, headers, widths, true); row += 25; }
        drawTableRow(doc, row, [a.employee?.employeeId || '-', a.employee?.fullName || '-', new Date(a.date).toLocaleDateString(), a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : '-', a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '-', a.totalHours?.toFixed(1) || '0', a.status, a.isLate ? 'Yes' : 'No', a.lateMinutes || 0, a.overtimeHours?.toFixed(1) || '0'], widths);
        row += 20;
      });
      doc.end();
    } else {
      res.json({ success: true, count: attendance.length, attendance });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.generatePayrollReport = async (req, res) => {
  try {
    const { month, year, format } = req.query;
    const query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    const payrolls = await Payroll.find(query).populate('employee', 'fullName employeeId position department').sort({ year: -1, month: -1 });
    const totals = { gross: payrolls.reduce((s, p) => s + p.grossSalary, 0), net: payrolls.reduce((s, p) => s + p.netSalary, 0), deductions: payrolls.reduce((s, p) => s + p.totalDeductions, 0) };
    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=payroll-report.pdf');
      doc.pipe(res);
      setupPDF(doc, 'Payroll Report', `Period: ${month || 'All'}/${year || 'All'} | Employees: ${payrolls.length}`);
      const headers = ['Emp ID', 'Name', 'Position', 'Period', 'Basic', 'Allowances', 'Overtime', 'Bonus', 'Deductions', 'Net Salary', 'Status'];
      const widths = [50, 100, 80, 55, 60, 65, 50, 50, 65, 65, 50];
      let row = 110;
      drawTableRow(doc, row, headers, widths, true); row += 25;
      payrolls.forEach(p => {
        if (row > 530) { doc.addPage({ layout: 'landscape' }); row = 50; drawTableRow(doc, row, headers, widths, true); row += 25; }
        const totalAllow = Object.values(p.allowances).reduce((a, b) => a + b, 0);
        drawTableRow(doc, row, [p.employee?.employeeId || '-', p.employee?.fullName || '-', p.employee?.position || '-', `${p.month}/${p.year}`, `$${p.basicSalary.toLocaleString()}`, `$${totalAllow.toLocaleString()}`, `$${p.overtime.toLocaleString()}`, `$${p.bonus.toLocaleString()}`, `$${p.totalDeductions.toLocaleString()}`, `$${p.netSalary.toLocaleString()}`, p.paymentStatus], widths);
        row += 20;
      });
      row += 15;
      doc.fillColor('#1e40af').fontSize(10).font('Helvetica-Bold').text(`Total Gross: $${totals.gross.toLocaleString()}   |   Total Deductions: $${totals.deductions.toLocaleString()}   |   Total Net: $${totals.net.toLocaleString()}`, 50, row);
      doc.end();
    } else {
      res.json({ success: true, count: payrolls.length, totals, payrolls });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.generateLeaveReport = async (req, res) => {
  try {
    const { year, format } = req.query;
    const query = year ? { startDate: { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31) } } : {};
    const leaves = await Leave.find(query).populate('employee', 'fullName employeeId department').populate('approvedBy', 'fullName').sort({ createdAt: -1 });
    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=leave-report.pdf');
      doc.pipe(res);
      setupPDF(doc, 'Leave Report', `Year: ${year || 'All'} | Total: ${leaves.length}`);
      const headers = ['Emp ID', 'Name', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Approved By', 'Applied On'];
      const widths = [60, 110, 75, 75, 75, 40, 65, 100, 75];
      let row = 110;
      drawTableRow(doc, row, headers, widths, true); row += 25;
      leaves.forEach(l => {
        if (row > 530) { doc.addPage({ layout: 'landscape' }); row = 50; drawTableRow(doc, row, headers, widths, true); row += 25; }
        drawTableRow(doc, row, [l.employee?.employeeId || '-', l.employee?.fullName || '-', l.leaveType, new Date(l.startDate).toLocaleDateString(), new Date(l.endDate).toLocaleDateString(), l.totalDays || '-', l.status, l.approvedBy?.fullName || '-', new Date(l.createdAt).toLocaleDateString()], widths);
        row += 20;
      });
      doc.end();
    } else {
      res.json({ success: true, count: leaves.length, leaves });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments({ status: 'active' });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.countDocuments({ date: today, status: { $in: ['present', 'late'] } });
    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const payrollData = await Payroll.aggregate([
      { $match: { month: currentMonth, year: currentYear } },
      { $group: { _id: null, totalPayroll: { $sum: '$netSalary' }, count: { $sum: 1 } } },
    ]);
    const lateToday = await Attendance.countDocuments({ date: today, isLate: true });
    const recentLeaves = await Leave.find({ status: 'pending' }).populate('employee', 'fullName employeeId profilePhoto department').sort({ createdAt: -1 }).limit(5);
    const deptStats = await Employee.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $project: { name: { $arrayElemAt: ['$dept.name', 0] }, count: 1 } },
    ]);
    res.json({ success: true, stats: {
      totalEmployees, todayAttendance, pendingLeaves, lateToday,
      totalPayroll: payrollData[0]?.totalPayroll || 0,
      attendanceRate: totalEmployees > 0 ? Math.round((todayAttendance / totalEmployees) * 100) : 0,
      recentLeaves, deptStats,
    }});
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
