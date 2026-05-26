const Employee = require('../models/Employee');
const User = require('../models/User');
const Department = require('../models/Department');
const path = require('path');

exports.getEmployees = async (req, res) => {
  try {
    const { department, status, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (department) query.department = department;
    if (status) query.status = status;
    if (search) query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
      { position: { $regex: search, $options: 'i' } },
    ];
    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, count: employees.length, total, pages: Math.ceil(total / limit), employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('department', 'name description').populate('user', 'email role isActive lastLogin');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const { fullName, gender, dateOfBirth, email, phoneNumber, address, position, department, basicSalary, joiningDate, emergencyContact, password } = req.body;
    const existing = await Employee.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Employee with this email already exists' });
    const employee = await Employee.create({ fullName, gender, dateOfBirth, email, phoneNumber, address: address ? JSON.parse(address) : {}, position, department, basicSalary, joiningDate, emergencyContact: emergencyContact ? JSON.parse(emergencyContact) : {} });
    const user = await User.create({ fullName, email, password: password || 'Password@123', role: 'employee', employee: employee._id });
    employee.user = user._id;
    if (req.file) employee.profilePhoto = `/uploads/${req.file.filename}`;
    await employee.save();
    await Department.findByIdAndUpdate(department, { $inc: { employeeCount: 1 } });
    res.status(201).json({ success: true, message: 'Employee created successfully', employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.body.address && typeof req.body.address === 'string') updates.address = JSON.parse(req.body.address);
    if (req.body.emergencyContact && typeof req.body.emergencyContact === 'string') updates.emergencyContact = JSON.parse(req.body.emergencyContact);
    if (req.file) updates.profilePhoto = `/uploads/${req.file.filename}`;
    const employee = await Employee.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate('department', 'name');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, message: 'Employee updated successfully', employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    await Department.findByIdAndUpdate(employee.department, { $inc: { employeeCount: -1 } });
    if (employee.user) await User.findByIdAndDelete(employee.user);
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEmployeeStats = async (req, res) => {
  try {
    const total = await Employee.countDocuments();
    const active = await Employee.countDocuments({ status: 'active' });
    const byDepartment = await Employee.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $project: { name: { $arrayElemAt: ['$dept.name', 0] }, count: 1 } },
    ]);
    const byGender = await Employee.aggregate([{ $group: { _id: '$gender', count: { $sum: 1 } } }]);
    res.json({ success: true, stats: { total, active, inactive: total - active, byDepartment, byGender } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
