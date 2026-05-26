const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  totalHours: { type: Number, default: 0 },
  status: { type: String, enum: ['present', 'absent', 'late', 'half-day', 'holiday'], default: 'absent' },
  isLate: { type: Boolean, default: false },
  lateMinutes: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  notes: { type: String },
}, { timestamps: true });

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

attendanceSchema.pre('save', function (next) {
  if (this.checkIn && this.checkOut) {
    const diff = (this.checkOut - this.checkIn) / (1000 * 60 * 60);
    this.totalHours = Math.round(diff * 100) / 100;
    const workStart = new Date(this.checkIn);
    workStart.setHours(9, 0, 0, 0);
    if (this.checkIn > workStart) {
      this.isLate = true;
      this.lateMinutes = Math.floor((this.checkIn - workStart) / (1000 * 60));
    }
    if (this.totalHours > 8) {
      this.overtimeHours = Math.round((this.totalHours - 8) * 100) / 100;
    }
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
