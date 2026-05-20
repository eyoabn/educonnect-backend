const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignmentName: {
    type: String,
    required: true
  },
  course: {
    type: String,
    required: true
  },
  grade: Number,
  maxGrade: {
    type: Number,
    default: 100
  },
  description: String,
  submissionContent: String,
  feedback: String,
  status: {
    type: String,
    enum: ['graded', 'pending', 'submitted'],
    default: 'pending'
  },
  submittedDate: Date,
  gradedDate: Date,
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Grade', gradeSchema);
