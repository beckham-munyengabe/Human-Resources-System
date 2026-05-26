const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  basicSalary: { type: Number, required: true },
  allowances: {
    housing: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    meal: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
  overtime: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  deductions: {
    tax: { type: Number, default: 0 },
    pension: { type: Number, default: 0 },
    insurance: { type: Number, default: 0 },
    loan: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
  grossSalary: { type: Number },
  totalDeductions: { type: Number },
  netSalary: { type: Number },
  paymentDate: { type: Date },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  paymentMethod: { type: String, enum: ['bank_transfer', 'cash', 'check'], default: 'bank_transfer' },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  workingDays: { type: Number, default: 22 },
  presentDays: { type: Number, default: 0 },
  absentDays: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
}, { timestamps: true });

payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

payrollSchema.pre('save', function (next) {
  const totalAllowances = Object.values(this.allowances).reduce((a, b) => a + b, 0);
  this.grossSalary = this.basicSalary + totalAllowances + this.overtime + this.bonus;
  this.totalDeductions = Object.values(this.deductions).reduce((a, b) => a + b, 0);
  this.netSalary = this.grossSalary - this.totalDeductions;
  next();
});

module.exports = mongoose.model('Payroll', payrollSchema);
