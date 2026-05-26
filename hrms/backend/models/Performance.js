const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  evaluator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  period: {
    quarter: { type: Number, min: 1, max: 4 },
    year: { type: Number, required: true },
  },
  ratings: {
    productivity: { type: Number, min: 1, max: 5, required: true },
    quality: { type: Number, min: 1, max: 5, required: true },
    teamwork: { type: Number, min: 1, max: 5, required: true },
    communication: { type: Number, min: 1, max: 5, required: true },
    punctuality: { type: Number, min: 1, max: 5, required: true },
    initiative: { type: Number, min: 1, max: 5, required: true },
  },
  overallRating: { type: Number },
  comments: { type: String },
  goals: [{ goal: String, achieved: Boolean, notes: String }],
  status: { type: String, enum: ['draft', 'submitted', 'acknowledged'], default: 'submitted' },
}, { timestamps: true });

performanceSchema.pre('save', function (next) {
  const ratings = Object.values(this.ratings);
  this.overallRating = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
  next();
});

module.exports = mongoose.model('Performance', performanceSchema);
