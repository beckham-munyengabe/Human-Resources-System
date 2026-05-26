const Department = require('../models/Department');
const Employee = require('../models/Employee');

exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().populate('manager', 'fullName position');
    res.json({ success: true, count: departments.length, departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { name, description, manager } = req.body;
    const existing = await Department.findOne({ name });
    if (existing) return res.status(400).json({ success: false, message: 'Department already exists' });
    const department = await Department.create({ name, description, manager });
    res.status(201).json({ success: true, message: 'Department created', department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, message: 'Department updated', department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const employees = await Employee.countDocuments({ department: req.params.id });
    if (employees > 0) return res.status(400).json({ success: false, message: `Cannot delete: ${employees} employees assigned to this department` });
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, message: 'Department deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDepartmentEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ department: req.params.id, status: 'active' }).select('fullName position email profilePhoto employeeId');
    res.json({ success: true, count: employees.length, employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
