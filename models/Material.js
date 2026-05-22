const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  course: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedDate: {
    type: Date,
    default: Date.now
  },
  description: String,
  category: String,
  version: {
    type: Number,
    default: 1
  },
  revisions: [{
    date: Date,
    uploadedBy: String,
    version: Number
  }]
}, { timestamps: true });

module.exports = mongoose.model('Material', materialSchema);
