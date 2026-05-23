const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  time: { type: String, required: true },
  day: { type: String, required: true },
  room: { type: String, required: true },
  type: { type: String, required: true },
  duration: { type: Number, default: 60 }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
